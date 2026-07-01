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
from typing import Optional, List, Dict, Any
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
    
    # Build product URL
    product_url = f"{FRONTEND_URL}/product/{product_id}"
    
    # Get gender for Google product category
    gender = product.get("gender", "unisex")
    gender_map = {
        "men": "male",
        "women": "female", 
        "unisex": "unisex"
    }
    
    meta_product = {
        "retailer_id": product_id,
        "name": product.get("name", "")[:150],  # Max 150 chars for name
        "description": product.get("description", product.get("name", ""))[:5000],  # Max 5000 chars
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
    
    # Gender targeting
    if gender in gender_map:
        meta_product["gender"] = gender_map[gender]
    
    # Size (volume)
    volume = product.get("volume")
    if volume:
        meta_product["size"] = f"{volume}ml"
    
    # Custom labels for filtering in Ads Manager
    meta_product["custom_label_0"] = product.get("brand", "")  # Brand
    meta_product["custom_label_1"] = gender  # Gender
    meta_product["custom_label_2"] = "perfume"  # Category
    
    # Scent profile as custom label
    scent_profile = product.get("scent_profile", [])
    if scent_profile:
        meta_product["custom_label_3"] = ",".join(scent_profile[:3])  # Top 3 scents
    
    return meta_product


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
            requests = [{
                "retailer_id": retailer_id,
                "method": "DELETE",
                "data": {"retailer_id": retailer_id}
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
                
                if response.status_code == 200:
                    handle = result.get("handles", [None])[0]
                    logger.info(f"Batch sync initiated, handle: {handle}")
                    return {"success": True, "handle": handle, "result": result}
                else:
                    logger.error(f"Batch sync failed: {result}")
                    return {"success": False, "error": result}
                    
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
                        # Convert lists to JSON strings for batch API
                        if "additional_image_urls" in meta_product and isinstance(meta_product["additional_image_urls"], list):
                            meta_product["additional_image_urls"] = json.dumps(meta_product["additional_image_urls"])
                        requests.append({
                            "retailer_id": meta_product["retailer_id"],
                            "method": "UPDATE",
                            "data": meta_product
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
