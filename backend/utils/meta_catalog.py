"""
Meta (Facebook) Catalog API Integration for KOSTIN
Syncs products to Meta Ads Manager Product Catalog for Dynamic Ads
"""

import os
import json
import hmac
import hashlib
import httpx
import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Meta API Configuration
API_VERSION = os.environ.get("META_GRAPH_API_VERSION", "v21.0")
CATALOG_ID = os.environ.get("META_CATALOG_ID", "")
TOKEN = os.environ.get("META_SYSTEM_USER_TOKEN", "")
APP_SECRET = os.environ.get("META_APP_SECRET", "")
BASE_URL = f"https://graph.facebook.com/{API_VERSION}"

# Frontend URL for product links
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://kostinparfums.com")
PDP_BASE_URL = "https://kostinparfums.com"
FREE_SHIPPING_THRESHOLD_EUR = 90.0

MIN_IMAGE_SIZE_PX = 100
RECOMMENDED_IMAGE_SIZE_PX = 500
BACKGROUND_HINTS = ("white", "clean", "isolated", "transparent", "studio", "no-bg", "nobg")


def get_appsecret_proof(token: str) -> str:
    """Generate appsecret_proof for secure API calls"""
    if not APP_SECRET:
        return ""
    return hmac.new(
        APP_SECRET.encode('utf-8'),
        token.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def transform_product_for_meta(product: dict) -> dict:
    """
    Transform KOSTIN product to Meta Catalog format
    
    Meta required fields:
    - retailer_id: Unique product identifier (we use MongoDB _id)
    - name: Product name
    - description: Product description
    - availability: in stock / out of stock
    - condition: new / refurbished / used
    - price: Price in cents (integer)
    - currency: ISO currency code
    - image_link: Main product image URL
    - link: Product page URL
    - brand: Product brand
    """
    product_id = str(product.get("_id", product.get("id", "")))
    
    # Get price (Meta requires price in lowest currency unit for API, e.g., cents)
    price_eur = float(product.get("price", 0))
    price_cents = int(price_eur * 100)
    
    # Handle sale price
    original_price = product.get("original_price")
    sale_price_cents = None
    if original_price and float(original_price) > price_eur:
        sale_price_cents = price_cents
        price_cents = int(float(original_price) * 100)
    
    # Get main image
    images = product.get("images", [])
    main_image = images[0] if images else product.get("image", "")
    additional_images = images[1:10] if len(images) > 1 else []  # Meta allows up to 10 additional images
    
    # Determine availability
    is_active = product.get("is_active", True)
    is_visible = product.get("is_visible", True)
    stock = product.get("stock", 100)
    availability = "in stock" if (is_active and is_visible and stock > 0) else "out of stock"
    
    # Build product URL (exact PDP domain for catalog feed)
    product_url = f"{PDP_BASE_URL}/product/{product_id}"
    
    # Get gender - handle both list and string formats
    # Schema stores gender as list: ["women"], ["men"], ["unisex"] or []
    gender_raw = product.get("gender", [])
    if isinstance(gender_raw, list):
        gender = gender_raw[0] if gender_raw else "unisex"
    else:
        gender = gender_raw if gender_raw else "unisex"
    
    gender_map = {
        "men": "male",
        "women": "female", 
        "unisex": "unisex"
    }
    
    meta_product = {
        "retailer_id": product_id,
        "name": product.get("name", "")[:150],  # Max 150 chars for name
        "description": product.get("description_bg", product.get("description", product.get("name", "")))[:5000],  # Max 5000 chars
        "availability": availability,
        "condition": "new",
        "price": price_cents,  # Price in cents (integer)
        "currency": "EUR",
        "url": product_url,
        "brand": product.get("brand", "KOSTIN"),
    }
    
    # Image URL is required - use placeholder if missing
    if main_image:
        meta_product["image_url"] = main_image
    else:
        # Use a placeholder image for products without images
        meta_product["image_url"] = f"{FRONTEND_URL}/placeholder-perfume.jpg"
    
    # Optional fields
    if sale_price_cents:
        meta_product["sale_price"] = sale_price_cents
    
    if additional_images:
        meta_product["additional_image_urls"] = additional_images
    
    # Product category - Perfumes
    meta_product["google_product_category"] = "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne"
    
    # Gender targeting - use extracted string gender
    if gender in gender_map:
        meta_product["gender"] = gender_map[gender]
    
    # Size (volume)
    volume = product.get("volume")
    if volume:
        meta_product["size"] = f"{volume}ml"
    
    # Custom labels for filtering in Ads Manager
    meta_product["custom_label_0"] = product.get("category", "")  # Category
    meta_product["custom_label_1"] = str(product.get("bestseller_rank", "unranked"))  # Bestseller rank
    meta_product["custom_label_2"] = "yes" if price_eur >= FREE_SHIPPING_THRESHOLD_EUR else "no"  # Eligible for free shipping
    
    # Scent profiles as custom label (NOTE: field is "scent_profiles" plural!)
    scent_profiles = product.get("scent_profiles", [])
    if scent_profiles and isinstance(scent_profiles, list):
        meta_product["custom_label_3"] = ",".join(scent_profiles[:3])  # Top 3 scents

    # Optional product identifiers (when available)
    if product.get("gtin"):
        meta_product["gtin"] = str(product.get("gtin"))
    if product.get("mpn"):
        meta_product["mpn"] = str(product.get("mpn"))
    
    return meta_product


def to_batch_feed_item(meta_product: dict) -> dict:
    """
    Convert the interactive-Products-API shape (from transform_product_for_meta,
    used by POST /{catalog_id}/products) into the field schema required by the
    /items_batch feed endpoint.

    Meta validates /items_batch payloads against the *feed* field names, which
    differ from the interactive endpoint:
      - id            (NOT retailer_id)
      - title         (NOT name)
      - link          (NOT url)
      - image_link    (NOT image_url)
      - additional_image_link: comma-separated string (NOT additional_image_urls list)
      - price / sale_price: "12.34 EUR" string (NOT integer minor units + separate currency)

    Sending the interactive shape directly to /items_batch causes Meta to reject
    the whole batch with "Can not find required field id" (no hard error surfaced
    by status code, since Meta still returns HTTP 200), which silently drops
    every product from Dynamic Ads sync.
    """
    currency = meta_product.get("currency", "EUR")

    def money(cents: int) -> str:
        return f"{cents / 100:.2f} {currency}"

    feed_item = {
        "id": meta_product["retailer_id"],
        "title": meta_product.get("name", ""),
        "description": meta_product.get("description", ""),
        "availability": meta_product.get("availability", "in stock"),
        "condition": meta_product.get("condition", "new"),
        "price": money(meta_product.get("price", 0)),
        "link": meta_product.get("url", ""),
        "image_link": meta_product.get("image_url", ""),
        "brand": meta_product.get("brand", "KOSTIN"),
    }

    if meta_product.get("sale_price") is not None:
        feed_item["sale_price"] = money(meta_product["sale_price"])

    if meta_product.get("additional_image_urls"):
        feed_item["additional_image_link"] = ",".join(meta_product["additional_image_urls"])

    # Fields that use the same name/shape in both APIs - pass through as-is
    for key in (
        "google_product_category", "gender", "size",
        "custom_label_0", "custom_label_1", "custom_label_2", "custom_label_3",
        "gtin", "mpn",
    ):
        if key in meta_product:
            feed_item[key] = meta_product[key]

    return feed_item


def _parse_image_dimensions(image_bytes: bytes) -> Optional[Tuple[int, int]]:
    """Parse common image headers and return (width, height)."""
    if len(image_bytes) < 24:
        return None

    # PNG
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n") and image_bytes[12:16] == b"IHDR":
        width = int.from_bytes(image_bytes[16:20], "big")
        height = int.from_bytes(image_bytes[20:24], "big")
        return width, height

    # GIF
    if image_bytes[:6] in (b"GIF87a", b"GIF89a"):
        width = int.from_bytes(image_bytes[6:8], "little")
        height = int.from_bytes(image_bytes[8:10], "little")
        return width, height

    # JPEG
    if image_bytes[:2] == b"\xff\xd8":
        i = 2
        length = len(image_bytes)
        while i < length - 9:
            if image_bytes[i] != 0xFF:
                i += 1
                continue
            marker = image_bytes[i + 1]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                if i + 9 >= length:
                    return None
                height = int.from_bytes(image_bytes[i + 5:i + 7], "big")
                width = int.from_bytes(image_bytes[i + 7:i + 9], "big")
                return width, height
            if i + 4 >= length:
                return None
            seg_len = int.from_bytes(image_bytes[i + 2:i + 4], "big")
            if seg_len < 2:
                return None
            i += 2 + seg_len

    return None


def _has_clean_background_hint(image_url: str) -> bool:
    """Lightweight heuristic: check filename/URL hints for clean background images."""
    lowered = (image_url or "").lower()
    return any(hint in lowered for hint in BACKGROUND_HINTS)


async def validate_image_for_meta(image_url: str, timeout_seconds: float = 15.0) -> Dict[str, Any]:
    """
    Validate image requirements for Meta feed:
    - hard minimum 100x100
    - recommended minimum 500x500
    - basic clean background heuristic
    """
    report = {
        "image_url": image_url,
        "is_valid": True,
        "width": None,
        "height": None,
        "violations": [],
        "warnings": [],
    }

    if not image_url:
        report["is_valid"] = False
        report["violations"].append("Липсва основна снимка.")
        return report

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds, follow_redirects=True) as client:
            response = await client.get(image_url)
            if response.status_code != 200:
                report["is_valid"] = False
                report["violations"].append(f"Снимката не е достъпна (HTTP {response.status_code}).")
                return report

            dimensions = _parse_image_dimensions(response.content)
            if not dimensions:
                report["warnings"].append("Неуспешно автоматично разпознаване на размерите на снимката.")
            else:
                width, height = dimensions
                report["width"] = width
                report["height"] = height
                if width < MIN_IMAGE_SIZE_PX or height < MIN_IMAGE_SIZE_PX:
                    report["is_valid"] = False
                    report["violations"].append(
                        f"Снимката е под абсолютния минимум {MIN_IMAGE_SIZE_PX}x{MIN_IMAGE_SIZE_PX} px."
                    )
                elif width < RECOMMENDED_IMAGE_SIZE_PX or height < RECOMMENDED_IMAGE_SIZE_PX:
                    report["warnings"].append(
                        f"Препоръчителният минимум е {RECOMMENDED_IMAGE_SIZE_PX}x{RECOMMENDED_IMAGE_SIZE_PX} px."
                    )

            if not _has_clean_background_hint(image_url):
                report["warnings"].append(
                    "Липсва автоматичен индикатор за чист фон в URL; нужна е визуална проверка."
                )

            return report
    except Exception as e:
        report["is_valid"] = False
        report["violations"].append(f"Грешка при проверка на снимка: {str(e)}")
        return report


class MetaCatalogClient:
    """Client for Meta Catalog API operations"""
    
    def __init__(self):
        self.catalog_id = CATALOG_ID
        self.token = TOKEN
        self.proof = get_appsecret_proof(TOKEN)
        self.base_url = BASE_URL
        
    def _get_auth_params(self) -> dict:
        """Get authentication parameters for API calls"""
        params = {"access_token": self.token}
        if self.proof:
            params["appsecret_proof"] = self.proof
        return params
    
    async def test_connection(self) -> dict:
        """Test API connection and get catalog info"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                params = self._get_auth_params()
                params["fields"] = "id,name,product_count,vertical"
                
                response = await client.get(
                    f"{self.base_url}/{self.catalog_id}",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Meta Catalog connection successful: {data.get('name')}")
                    return {"success": True, "catalog": data}
                else:
                    error = response.json()
                    logger.error(f"Meta Catalog connection failed: {error}")
                    return {"success": False, "error": error}
                    
        except Exception as e:
            logger.error(f"Meta Catalog connection error: {e}")
            return {"success": False, "error": str(e)}
    
    async def upsert_product(self, product: dict) -> dict:
        """Create or update a single product in Meta Catalog"""
        try:
            meta_product = transform_product_for_meta(product)
            
            async with httpx.AsyncClient(timeout=30) as client:
                data = {
                    **meta_product,
                    **self._get_auth_params()
                }
                
                # Handle additional images as JSON
                if "additional_image_urls" in data:
                    data["additional_image_urls"] = json.dumps(data["additional_image_urls"])
                
                response = await client.post(
                    f"{self.base_url}/{self.catalog_id}/products",
                    data=data
                )
                
                result = response.json()
                
                if response.status_code in [200, 201]:
                    logger.info(f"Product synced to Meta: {meta_product['retailer_id']}")
                    return {"success": True, "result": result, "retailer_id": meta_product['retailer_id']}
                else:
                    logger.error(f"Failed to sync product {meta_product['retailer_id']}: {result}")
                    return {"success": False, "error": result, "retailer_id": meta_product['retailer_id']}
                    
        except Exception as e:
            logger.error(f"Error syncing product to Meta: {e}")
            return {"success": False, "error": str(e)}
    
    async def delete_product(self, retailer_id: str) -> dict:
        """Delete a product from Meta Catalog by retailer_id"""
        try:
            # Use batch API with DELETE method
            # NOTE: /items_batch validates the nested `data` object against feed
            # field names, so the id must be under "id", not "retailer_id".
            requests = [{
                "retailer_id": retailer_id,
                "method": "DELETE",
                "data": {"id": retailer_id}
            }]
            
            return await self.batch_sync(requests)
            
        except Exception as e:
            logger.error(f"Error deleting product from Meta: {e}")
            return {"success": False, "error": str(e)}
    
    async def batch_sync(self, requests: List[dict]) -> dict:
        """
        Batch sync multiple products
        
        requests format:
        [
            {"retailer_id": "123", "method": "UPDATE", "data": {...}},
            {"retailer_id": "456", "method": "DELETE", "data": {"retailer_id": "456"}}
        ]
        """
        try:
            if not requests:
                return {"success": True, "message": "No products to sync"}
            
            async with httpx.AsyncClient(timeout=120) as client:
                data = {
                    "item_type": "PRODUCT_ITEM",
                    "allow_upsert": "true",
                    "requests": json.dumps(requests, default=str),
                    **self._get_auth_params()
                }
                
                response = await client.post(
                    f"{self.base_url}/{self.catalog_id}/items_batch",
                    data=data
                )
                
                result = response.json()
                
                # IMPORTANT: Meta's /items_batch returns HTTP 200 even when the
                # whole batch is rejected (e.g. "Can not find required field id").
                # A 200 with no "handles" and/or hard errors in validation_status
                # means nothing was actually queued - treat that as a failure
                # instead of silently reporting success.
                validation_status = result.get("validation_status", []) if isinstance(result, dict) else []
                hard_errors = [e for v in validation_status for e in v.get("errors", [])]
                handle = result.get("handles", [None])[0] if isinstance(result, dict) else None
                
                if response.status_code == 200 and handle and not hard_errors:
                    logger.info(f"Batch sync initiated, handle: {handle}")
                    return {"success": True, "handle": handle, "result": result}
                else:
                    logger.error(f"Batch sync rejected by Meta (status={response.status_code}, handle={handle}): {result}")
                    return {"success": False, "error": result, "handle": handle}
                    
        except Exception as e:
            logger.error(f"Error in batch sync: {e}")
            return {"success": False, "error": str(e)}
    
    async def check_batch_status(self, handle: str) -> dict:
        """Check status of a batch sync operation"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                params = {
                    "handle": handle,
                    **self._get_auth_params()
                }
                
                response = await client.get(
                    f"{self.base_url}/{self.catalog_id}/check_batch_request_status",
                    params=params
                )
                
                result = response.json()
                
                if response.status_code == 200:
                    return {"success": True, "status": result}
                else:
                    return {"success": False, "error": result}
                    
        except Exception as e:
            logger.error(f"Error checking batch status: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_catalog_products(self, limit: int = 25) -> dict:
        """Get products currently in Meta Catalog"""
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                params = {
                    "fields": "id,retailer_id,name,price,currency,availability,image_url,url",
                    "limit": limit,
                    **self._get_auth_params()
                }
                
                response = await client.get(
                    f"{self.base_url}/{self.catalog_id}/products",
                    params=params
                )
                
                result = response.json()
                
                if response.status_code == 200:
                    return {"success": True, "products": result.get("data", []), "paging": result.get("paging")}
                else:
                    return {"success": False, "error": result}
                    
        except Exception as e:
            logger.error(f"Error getting catalog products: {e}")
            return {"success": False, "error": str(e)}
    
    async def full_catalog_sync(self, products: List[dict], batch_size: int = 1000) -> dict:
        """
        Sync all products to Meta Catalog in batches
        
        Args:
            products: List of KOSTIN products from database
            batch_size: Number of products per batch (max 5000, recommended 1000)
        """
        try:
            total_products = len(products)
            if total_products == 0:
                return {"success": True, "message": "No products to sync", "synced": 0}
            
            logger.info(f"Starting full catalog sync: {total_products} products")
            
            handles = []
            errors = []
            
            # Process in batches
            for i in range(0, total_products, batch_size):
                batch = products[i:i + batch_size]
                
                requests = []
                for product in batch:
                    try:
                        meta_product = transform_product_for_meta(product)
                        feed_item = to_batch_feed_item(meta_product)
                        requests.append({
                            "retailer_id": meta_product["retailer_id"],
                            "method": "UPDATE",
                            "data": feed_item
                        })
                    except Exception as transform_err:
                        logger.warning(f"Failed to transform product {product.get('_id', 'unknown')}: {transform_err}")
                        continue
                
                if not requests:
                    continue
                    
                result = await self.batch_sync(requests)
                
                if result.get("success"):
                    if result.get("handle"):
                        handles.append(result["handle"])
                    logger.info(f"Batch {i//batch_size + 1} synced: {len(batch)} products")
                else:
                    errors.append({"batch": i//batch_size + 1, "error": result.get("error")})
                    logger.error(f"Batch {i//batch_size + 1} failed: {result.get('error')}")
            
            return {
                "success": len(errors) == 0,
                "total_products": total_products,
                "batches_sent": len(handles) + len(errors),
                "handles": handles,
                "errors": errors if errors else None
            }
            
        except Exception as e:
            import traceback
            logger.error(f"Error in full catalog sync: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"success": False, "error": str(e)}


# Singleton instance
meta_catalog = MetaCatalogClient()
