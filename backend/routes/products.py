from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Query, BackgroundTasks
from bson import ObjectId
from typing import Optional, List
from pydantic import BaseModel
from models.schemas import ProductCreate, ProductUpdate, ProductResponse, ProductVisibilityUpdate
from utils.auth import get_current_user, get_current_user_optional
import logging
import uuid
import re  # SEC-002 FIX: Import re for escaping user input

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/products", tags=["products"])

# Meta Catalog sync helper
async def sync_product_to_meta(db, product_id: str):
    """Background task to sync product to Meta Catalog"""
    try:
        from routes.meta_catalog import on_product_updated
        await on_product_updated(db, product_id, {})
    except Exception as e:
        logger.error(f"Failed to sync product {product_id} to Meta: {e}")

# Global popularity scores based on market research
# Higher score = more popular (scale 1-100)
POPULARITY_SCORES = {
    # TOP TIER - Globally best-selling fragrances (90-100)
    "dior sauvage": 100,
    "sauvage": 100,
    "bleu de chanel": 98,
    "chanel bleu": 98,
    "creed aventus": 97,
    "aventus": 97,
    "versace eros": 95,
    "eros": 93,
    "la vie est belle": 94,
    "acqua di gio": 93,
    "acqua di gioia": 85,
    "ysl libre": 92,
    "libre": 92,
    "black opium": 91,
    "miss dior": 90,
    "jadore": 90,
    "j'adore": 90,
    
    # HIGH TIER - Very popular fragrances (80-89)
    "1 million": 89,
    "one million": 89,
    "invictus": 88,
    "armani code": 87,
    "tom ford": 86,
    "tobacco vanille": 86,
    "oud wood": 85,
    "black orchid": 85,
    "chance": 85,
    "chanel chance": 85,
    "coco mademoiselle": 88,
    "good girl": 84,
    "phantom": 83,
    "stronger with you": 82,
    "my way": 82,
    "si": 81,
    "armani si": 81,
    "dolce gabbana the one": 80,
    "the one": 80,
    "lancome idole": 80,
    "idole": 80,
    
    # MID-HIGH TIER - Popular fragrances (70-79)
    "valentino": 79,
    "born in roma": 79,
    "uomo": 78,
    "prada luna rossa": 78,
    "luna rossa": 78,
    "prada paradoxe": 77,
    "paradoxe": 77,
    "gucci bloom": 76,
    "gucci guilty": 75,
    "bamboo": 74,
    "burberry": 73,
    "hugo boss": 72,
    "boss bottled": 72,
    "jean paul gaultier": 75,
    "le male": 76,
    "scandal": 74,
    "divine": 73,
    "hypnose": 72,
    "narciso rodriguez": 71,
    "for her": 71,
    "bvlgari man": 70,
    "omnia": 70,
    "bright crystal": 74,
    "dylan blue": 73,
    "fahrenheit": 72,
    "terre d hermes": 75,
    "hermes": 74,
    "guerlain": 73,
    "shalimar": 72,
    "l'homme ideal": 71,
    "givenchy gentleman": 70,
    
    # MID TIER - Known fragrances (60-69)
    "carolina herrera": 68,
    "212": 67,
    "bad boy": 66,
    "spicebomb": 69,
    "viktor rolf": 68,
    "xerjoff": 67,
    "erba pura": 67,
    "naxos": 66,
    "initio": 65,
    "parfums de marly": 68,
    "delina": 68,
    "kilian": 67,
    "angels share": 67,
    "montale": 64,
    "intense cafe": 65,
    "mancera": 63,
    
    # NICHE/ARABIAN - Growing popularity (50-59)
    "lattafa": 58,
    "khamrah": 59,
    "asad": 57,
    "yara": 56,
    "armaf": 55,
    "club de nuit": 60,  # Very popular clone
    "afnan": 52,
    "9 pm": 54,
    "supremacy": 51,
    "al haramain": 50,
    "rasasi": 49,
    "ajmal": 48,
    "ahmed al maghribi": 47,
}

def get_popularity_score(product_name: str, brand: str) -> int:
    """Calculate popularity score for a product based on name and brand"""
    name_lower = product_name.lower()
    brand_lower = brand.lower()
    
    best_score = 30  # Default score for unknown products
    
    # Check product name against known popular fragrances
    for keyword, score in POPULARITY_SCORES.items():
        if keyword in name_lower or keyword in brand_lower:
            if score > best_score:
                best_score = score
    
    # Brand bonuses for luxury houses
    luxury_brands = {
        "chanel": 10,
        "christian dior": 10,
        "dior": 10,
        "tom ford": 8,
        "creed": 8,
        "hermes": 7,
        "guerlain": 6,
        "yves saint laurent": 6,
        "armani": 5,
        "prada": 5,
        "gucci": 5,
        "versace": 4,
        "dolce & gabbana": 4,
        "paco rabanne": 4,
        "lancome": 4,
        "bvlgari": 4,
    }
    
    for luxury_brand, bonus in luxury_brands.items():
        if luxury_brand in brand_lower:
            best_score = min(100, best_score + bonus)
            break
    
    return best_score


def product_doc_to_response(doc: dict, include_visibility: bool = False) -> dict:
    # Handle images - support both legacy 'image' field and new 'images' array
    images = doc.get("images", [])
    legacy_image = doc.get("image", "")
    
    # If no images array but has legacy image, use that
    if not images and legacy_image:
        # Legacy image might contain multiple URLs separated by |
        if isinstance(legacy_image, str) and "|" in legacy_image:
            images = [url.strip() for url in legacy_image.split("|") if url.strip()]
        else:
            images = [legacy_image] if legacy_image else []
    
    # Main image is the first in the array
    main_image = images[0] if images else ""
    
    resp = {
        "id": str(doc["_id"]) if "_id" in doc else doc.get("id", ""),
        "sku": doc.get("sku", ""),
        "name": doc.get("name", ""),
        "brand": doc.get("brand", ""),
        "category": doc.get("category", ""),
        "price": doc.get("price", 0),
        "original_price": doc.get("original_price"),  # Original price if on sale
        "description": doc.get("description", ""),
        "image": main_image,  # Legacy field - first image
        "images": images,  # New field - all images in order
        "stock": doc.get("stock", 0),
        "is_active": doc.get("is_active", True),
        "is_visible": doc.get("is_visible", True),
        "gender": doc.get("gender", []),  # New field - ["men"], ["women"], or both
        "collections": doc.get("collections", ["all_products"]),  # Collection slugs
        "scent_profiles": doc.get("scent_profiles", []),  # Scent profile tags
        "variant_group_id": doc.get("variant_group_id"),  # Manual variant linking
        "variant_order": doc.get("variant_order", 0),  # Order within variant group
        "related_product_ids": doc.get("related_product_ids", []),  # Manual admin-picked related products
        "created_at": doc.get("created_at"),
    }
    if doc.get("description_bg"):
        resp["description_bg"] = doc["description_bg"]
    return resp


@router.get("")
async def get_products(
    request: Request,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    brands: Optional[str] = None,  # Comma-separated list of brands for multi-select
    gender: Optional[str] = None,  # "men" or "women" - filters products that include this gender
    collection: Optional[str] = None,  # Filter by collection slug
    scent_profiles: Optional[str] = None,  # Comma-separated list of scent profiles
    search: Optional[str] = None,
    sort: Optional[str] = "popular",  # Default to popular/best sellers
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
):
    """Get products - only visible products for regular users"""
    db = request.app.state.db
    query = {"is_active": True, "is_visible": True}

    if category:
        query["category"] = category
    
    # Support both single brand and multiple brands
    if brands:
        brand_list = [b.strip() for b in brands.split(",") if b.strip()]
        if brand_list:
            query["brand"] = {"$in": brand_list}
    elif brand:
        query["brand"] = brand
    
    # Gender filter - show products that include this gender in their gender array
    if gender:
        query["gender"] = {"$in": [gender]}
    
    # Collection filter - filter by collection slug
    if collection:
        query["collections"] = collection
    
    # Scent profiles filter - show products that have ANY of the selected profiles
    if scent_profiles:
        profile_list = [p.strip() for p in scent_profiles.split(",") if p.strip()]
        if profile_list:
            query["scent_profiles"] = {"$in": profile_list}
    
    if search:
        # SEC-002 FIX: Escape regex special characters to prevent ReDoS attacks
        safe_search = re.escape(search)
        query["$or"] = [
            {"name": {"$regex": safe_search, "$options": "i"}},
            {"brand": {"$regex": safe_search, "$options": "i"}},
            {"description": {"$regex": safe_search, "$options": "i"}},
        ]
    if min_price is not None:
        query["price"] = query.get("price", {})
        query["price"]["$gte"] = min_price
    if max_price is not None:
        query["price"] = query.get("price", {})
        query["price"]["$lte"] = max_price

    skip = (page - 1) * limit
    total = await db.products.count_documents(query)

    # Handle "popular" sort - first try sales data, then use market popularity scores
    if sort == "popular":
        # Get best-selling product IDs from orders
        sales_pipeline = [
            {"$match": {"status": {"$in": ["completed", "shipped", "delivered", "paid", "pending"]}}},
            {"$unwind": "$items"},
            {"$group": {
                "_id": "$items.product_id",
                "total_sold": {"$sum": "$items.quantity"}
            }},
            {"$sort": {"total_sold": -1}}
        ]
        
        try:
            sales_data = await db.orders.aggregate(sales_pipeline).to_list(10000)
            # Create a map of product_id -> rank
            sales_rank = {item["_id"]: idx for idx, item in enumerate(sales_data)}
        except Exception:
            sales_rank = {}
        
        # Fetch all matching products (need more for proper sorting)
        cursor = db.products.find(query)
        all_products = await cursor.to_list(5000)
        
        # Sort by: 1) sales rank (if has sales), 2) market popularity score
        def get_sort_key(p):
            pid = str(p["_id"])
            if sales_rank and pid in sales_rank:
                # Has actual sales - prioritize by sales rank
                return (0, sales_rank[pid], 0)
            else:
                # No sales data - use market popularity score
                name = p.get("name", "")
                brand = p.get("brand", "")
                popularity = get_popularity_score(name, brand)
                # Return tuple: (1 = no sales, negative popularity for desc sort, name for tie-breaker)
                return (1, -popularity, name.lower())
        
        all_products.sort(key=get_sort_key)
        
        # Apply pagination
        products = all_products[skip:skip + limit]
    else:
        # Standard sorting
        sort_field = "name"
        sort_dir = 1
        if sort == "price-low":
            sort_field = "price"
            sort_dir = 1
        elif sort == "price-high":
            sort_field = "price"
            sort_dir = -1
        elif sort == "newest":
            sort_field = "created_at"
            sort_dir = -1
        elif sort == "name":
            sort_field = "name"
            sort_dir = 1

        cursor = db.products.find(query).sort(sort_field, sort_dir).skip(skip).limit(limit)
        products = await cursor.to_list(limit)

    return {
        "products": [product_doc_to_response(p) for p in products],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if limit > 0 else 0,
    }


@router.get("/admin/all")
async def get_all_products_admin(
    request: Request,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "name",
    visibility: Optional[str] = None,  # all, visible, hidden
    scent_profile_filter: Optional[str] = None,  # all, with, without
    page: int = Query(1, ge=1),
    limit: int = Query(200, ge=1, le=10000),
):
    """Get ALL products including hidden ones - Admin only"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}

    # Visibility filter
    if visibility == "visible":
        query["is_visible"] = True
    elif visibility == "hidden":
        query["is_visible"] = False
    # 'all' or None = no visibility filter

    # Scent profile filter
    if scent_profile_filter == "with":
        query["scent_profiles"] = {"$exists": True, "$not": {"$in": [[], None]}, "$ne": []}
    elif scent_profile_filter == "without":
        query["$or"] = [
            {"scent_profiles": {"$exists": False}},
            {"scent_profiles": []},
            {"scent_profiles": None}
        ]

    if category:
        query["category"] = category
    if brand:
        query["brand"] = brand
    if search:
        # Need to handle $or carefully if already set by scent_profile_filter
        search_conditions = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
        ]
        if "$or" in query:
            # Combine with $and
            existing_or = query.pop("$or")
            query["$and"] = [
                {"$or": existing_or},
                {"$or": search_conditions}
            ]
        else:
            query["$or"] = search_conditions

    # Sort
    sort_field = "name"
    sort_dir = 1
    if sort == "name-desc":
        sort_field = "name"
        sort_dir = -1
    elif sort == "price-low":
        sort_field = "price"
        sort_dir = 1
    elif sort == "price-high":
        sort_field = "price"
        sort_dir = -1
    elif sort == "newest":
        sort_field = "created_at"
        sort_dir = -1
    elif sort == "best-sellers":
        sort_field = "sold_count"
        sort_dir = -1

    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    cursor = db.products.find(query).sort(sort_field, sort_dir).skip(skip).limit(limit)
    products = await cursor.to_list(limit)

    return {
        "products": [product_doc_to_response(p, include_visibility=True) for p in products],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if limit > 0 else 0,
    }


@router.get("/categories")
async def get_categories(request: Request):
    db = request.app.state.db
    pipeline = [
        {"$match": {"is_active": True, "is_visible": True}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    results = await db.products.aggregate(pipeline).to_list(100)
    cat_display = {
        "perfumes": "Perfumes", "makeup": "Makeup", "skincare": "Skincare",
        "haircare": "Haircare", "bodycare": "Body Care", "menscare": "Men's Care",
    }
    categories = [{"id": r["_id"], "name": cat_display.get(r["_id"], r["_id"].title()), "product_count": r["count"]} for r in results]
    return categories


@router.get("/brands")
async def get_brands(request: Request, category: Optional[str] = None, gender: Optional[str] = None):
    db = request.app.state.db
    match = {"is_active": True, "is_visible": True}
    if category:
        match["category"] = category
    if gender:
        match["gender"] = {"$in": [gender]}
    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$brand", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    results = await db.products.aggregate(pipeline).to_list(500)
    return [{"name": r["_id"], "product_count": r["count"]} for r in results]


@router.get("/{product_id}")
async def get_product(request: Request, product_id: str):
    db = request.app.state.db
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_doc_to_response(product)


def extract_base_name(product_name: str) -> str:
    """Extract base product name without size (e.g., '100 ml', '150ml', '50 M')"""
    # Remove size patterns - case insensitive
    # Matches: "50 ml", "50ml", "50 ML", "100 M", "100 W", "50 U", etc.
    cleaned = re.sub(r'\s*\d+\s*(ml|m|w|u)\b', '', product_name, flags=re.IGNORECASE)
    # Also remove TR (Tester) designation for variant matching
    cleaned = re.sub(r'\s+TR\b', '', cleaned, flags=re.IGNORECASE)
    # Remove trailing whitespace and extra spaces
    cleaned = ' '.join(cleaned.split())
    return cleaned.strip()


@router.get("/{product_id}/variants")
async def get_product_variants(request: Request, product_id: str):
    """Get other size variants of the same product"""
    db = request.app.state.db
    
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # First, check if product has a variant_group_id (manual linking)
    variant_group_id = product.get("variant_group_id")
    
    if variant_group_id:
        # Use manual variant grouping
        query = {
            "is_active": True,
            "is_visible": True,
            "variant_group_id": variant_group_id
        }
        cursor = db.products.find(query).sort("variant_order", 1)  # Sort by manual order
        variants = await cursor.to_list(20)
        
        if variants:
            return {
                "variants": [product_doc_to_response(v) for v in variants],
                "base_name": variant_group_id,
                "is_manual_group": True
            }
    
    # Fallback to automatic name-based matching
    base_name = extract_base_name(product.get("name", ""))
    brand = product.get("brand", "")
    
    if not base_name or not brand:
        return {"variants": [product_doc_to_response(product)], "base_name": base_name}
    
    # Find other products with same brand and similar base name
    escaped_base = re.escape(base_name)
    
    query = {
        "is_active": True,
        "is_visible": True,
        "brand": brand,
        "name": {"$regex": f"^{escaped_base}", "$options": "i"}
    }
    
    cursor = db.products.find(query).sort("price", 1)  # Sort by price ascending
    variants = await cursor.to_list(20)
    
    # Filter to only include true variants (same base name after extraction)
    filtered_variants = []
    for v in variants:
        v_base = extract_base_name(v.get("name", ""))
        if v_base.lower() == base_name.lower():
            filtered_variants.append(product_doc_to_response(v))
    
    # If no variants found, return just the current product
    if not filtered_variants:
        filtered_variants = [product_doc_to_response(product)]
    
    return {"variants": filtered_variants, "base_name": base_name}


# ============= Variant Group Management =============

class VariantGroupCreate(BaseModel):
    product_ids: List[str]
    group_name: Optional[str] = None


@router.post("/variants/link")
async def link_product_variants(request: Request, data: VariantGroupCreate):
    """Link multiple products as variants of each other (Admin only)"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if len(data.product_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 products required to link as variants")
    
    # Generate a unique variant group ID or use provided name
    variant_group_id = data.group_name or str(uuid.uuid4())[:8]
    
    # Update all products with the variant group ID
    updated_count = 0
    for idx, pid in enumerate(data.product_ids):
        try:
            result = await db.products.update_one(
                {"_id": ObjectId(pid)},
                {"$set": {
                    "variant_group_id": variant_group_id,
                    "variant_order": idx  # Preserve order
                }}
            )
            if result.modified_count > 0:
                updated_count += 1
        except Exception as e:
            logger.error(f"Failed to update product {pid}: {e}")
    
    return {
        "success": True,
        "variant_group_id": variant_group_id,
        "linked_count": updated_count,
        "message": f"Linked {updated_count} products as variants"
    }


@router.post("/variants/unlink/{product_id}")
async def unlink_product_variant(request: Request, product_id: str):
    """Remove a product from its variant group (Admin only)"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$unset": {"variant_group_id": "", "variant_order": ""}}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": "Product unlinked from variant group"}
        else:
            return {"success": False, "message": "Product not found or not in a variant group"}
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")


@router.get("/variants/group/{variant_group_id}")
async def get_variant_group(request: Request, variant_group_id: str):
    """Get all products in a variant group"""
    db = request.app.state.db
    
    cursor = db.products.find(
        {"variant_group_id": variant_group_id},
        {"_id": 1, "name": 1, "price": 1, "image": 1, "variant_order": 1}
    ).sort("variant_order", 1)
    
    products = await cursor.to_list(50)
    
    return {
        "variant_group_id": variant_group_id,
        "products": [
            {
                "id": str(p["_id"]),
                "name": p.get("name"),
                "price": p.get("price"),
                "image": p.get("image"),
                "order": p.get("variant_order", 0)
            }
            for p in products
        ]
    }


@router.get("/variants/all-groups")
async def get_all_variant_groups(request: Request):
    """Get ALL variant groups - both manual (variant_group_id) and automatic (by base name).
    Admin only endpoint for VariantsManager UI."""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all visible products
    cursor = db.products.find(
        {"is_active": True},
        {"_id": 1, "name": 1, "brand": 1, "price": 1, "image": 1, "images": 1, "variant_group_id": 1, "variant_order": 1}
    )
    all_products = await cursor.to_list(5000)
    
    manual_groups = {}  # variant_group_id -> [products]
    auto_groups = {}     # base_name|brand -> [products]
    products_in_manual_groups = set()  # Track products already in manual groups
    
    # First pass: collect manual groups
    for p in all_products:
        if p.get("variant_group_id"):
            group_id = p["variant_group_id"]
            if group_id not in manual_groups:
                manual_groups[group_id] = []
            manual_groups[group_id].append(p)
            products_in_manual_groups.add(str(p["_id"]))
    
    # Second pass: build automatic groups from products NOT in manual groups
    for p in all_products:
        pid = str(p["_id"])
        if pid in products_in_manual_groups:
            continue  # Skip products already in manual groups
        
        name = p.get("name", "")
        brand = p.get("brand", "")
        
        if not name or not brand:
            continue
        
        base_name = extract_base_name(name)
        if not base_name:
            continue
        
        # Create unique key for auto-group: base_name + brand
        group_key = f"{base_name.lower()}|{brand.lower()}"
        
        if group_key not in auto_groups:
            auto_groups[group_key] = {"base_name": base_name, "brand": brand, "products": []}
        auto_groups[group_key]["products"].append(p)
    
    # Format response
    result_manual = []
    for group_id, products in manual_groups.items():
        # Sort by variant_order
        products.sort(key=lambda x: x.get("variant_order", 0))
        result_manual.append({
            "id": group_id,
            "type": "manual",
            "products": [
                {
                    "id": str(p["_id"]),
                    "name": p.get("name"),
                    "price": p.get("price"),
                    "image": p.get("images", [p.get("image")])[0] if p.get("images") or p.get("image") else "",
                    "order": p.get("variant_order", 0)
                }
                for p in products
            ]
        })
    
    result_auto = []
    for group_key, group_data in auto_groups.items():
        products = group_data["products"]
        # Only include groups with 2+ products (actual variants)
        if len(products) >= 2:
            # Sort by price
            products.sort(key=lambda x: x.get("price", 0))
            result_auto.append({
                "id": f"auto_{group_key}",
                "type": "auto",
                "base_name": group_data["base_name"],
                "brand": group_data["brand"],
                "products": [
                    {
                        "id": str(p["_id"]),
                        "name": p.get("name"),
                        "price": p.get("price"),
                        "image": p.get("images", [p.get("image")])[0] if p.get("images") or p.get("image") else "",
                    }
                    for p in products
                ]
            })
    
    # Sort: manual groups first, then auto groups by product count descending
    result_manual.sort(key=lambda x: len(x["products"]), reverse=True)
    result_auto.sort(key=lambda x: len(x["products"]), reverse=True)
    
    return {
        "manual_groups": result_manual,
        "auto_groups": result_auto,
        "manual_count": len(result_manual),
        "auto_count": len(result_auto)
    }


def extract_gender_from_name(product_name: str) -> str:
    """Extract gender from product name suffix (M=Men, W=Women, U/Uni=Unisex)"""
    if not product_name:
        return "unisex"
    
    # Check the end of the name for gender indicators
    name_upper = product_name.upper().strip()
    
    # Check for explicit patterns at the end
    if name_upper.endswith(' M') or name_upper.endswith(' M.'):
        return "men"
    if name_upper.endswith(' W') or name_upper.endswith(' W.'):
        return "women"
    if name_upper.endswith(' U') or name_upper.endswith(' UNI') or name_upper.endswith(' UNISEX'):
        return "unisex"
    
    # Check for patterns like "100 M", "50 W", "75 U"
    import re
    match = re.search(r'\d+\s*(M|W|U|UNI)\b', name_upper)
    if match:
        gender_code = match.group(1)
        if gender_code == 'M':
            return "men"
        elif gender_code == 'W':
            return "women"
        else:
            return "unisex"
    
    return "unisex"  # Default to unisex if can't determine


def get_product_gender(product: dict) -> str:
    """
    Get product gender from gender field or extract from name.
    - If gender field has both ["men", "women"] -> unisex
    - If gender field has ["men"] -> men
    - If gender field has ["women"] -> women
    - If gender field is empty -> extract from name
    """
    gender_list = product.get("gender", [])
    
    if gender_list:
        # Gender field is set - use it
        if "men" in gender_list and "women" in gender_list:
            return "unisex"
        elif "men" in gender_list:
            return "men"
        elif "women" in gender_list:
            return "women"
        else:
            return "unisex"
    
    # Gender field is empty - extract from name
    return extract_gender_from_name(product.get("name", ""))


@router.get("/{product_id}/related")
async def get_related_products(request: Request, product_id: str, limit: int = 6):
    """Get related products using combined algorithm:
    1. Manual admin-picked related_product_ids (highest priority)
    2. Frequently bought together (from real orders)
    3. Same brand
    4. Same category / same gender
    Deduplicated, filtered to visible/active, capped at `limit`.
    """
    db = request.app.state.db

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    exclude_id = product["_id"]
    product_brand = product.get("brand", "")
    product_category = product.get("category", "perfumes")
    product_gender = get_product_gender(product)
    collections = product.get("collections", [])
    is_dubai = "dubai" in collections

    collected = []  # ordered list of docs
    seen_ids = {exclude_id}

    def add_docs(docs):
        for d in docs:
            if d["_id"] in seen_ids:
                continue
            if not d.get("is_active", True) or not d.get("is_visible", True):
                continue
            seen_ids.add(d["_id"])
            collected.append(d)
            if len(collected) >= limit:
                return True
        return False

    # 1. Manual admin picks
    manual_ids = product.get("related_product_ids", []) or []
    if manual_ids:
        object_ids = []
        for mid in manual_ids:
            try:
                object_ids.append(ObjectId(mid))
            except Exception:
                continue
        if object_ids:
            # Preserve admin ordering
            manual_docs_map = {}
            async for d in db.products.find({"_id": {"$in": object_ids}}):
                manual_docs_map[str(d["_id"])] = d
            ordered_manual = [manual_docs_map[m] for m in manual_ids if m in manual_docs_map]
            if add_docs(ordered_manual):
                return {"products": [product_doc_to_response(p) for p in collected]}

    # 2. Frequently bought together (co-occurrence in completed orders)
    if len(collected) < limit:
        try:
            pipeline = [
                {"$match": {
                    "status": {"$in": ["completed", "shipped", "delivered", "paid"]},
                    "items.product_id": str(exclude_id)
                }},
                {"$unwind": "$items"},
                {"$match": {"items.product_id": {"$ne": str(exclude_id)}}},
                {"$group": {"_id": "$items.product_id", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": limit * 3}
            ]
            co_data = await db.orders.aggregate(pipeline).to_list(limit * 3)
            co_ids = []
            for row in co_data:
                try:
                    co_ids.append(ObjectId(row["_id"]))
                except Exception:
                    continue
            if co_ids:
                co_docs_map = {}
                async for d in db.products.find({"_id": {"$in": co_ids}}):
                    co_docs_map[d["_id"]] = d
                ordered_co = [co_docs_map[oid] for oid in co_ids if oid in co_docs_map]
                if add_docs(ordered_co):
                    return {"products": [product_doc_to_response(p) for p in collected]}
        except Exception as e:
            logger.warning(f"FBT aggregation failed for {product_id}: {e}")

    # Base query for brand / category fallbacks
    base_query = {
        "is_active": True,
        "is_visible": True,
        "category": product_category,
    }
    if is_dubai:
        base_query["collections"] = "dubai"
    else:
        base_query["collections"] = {"$ne": "dubai"}
    if product_gender == "men":
        base_query["$or"] = [
            {"gender": "men"},
            {"name": {"$regex": r"\d+\s*M\b", "$options": "i"}}
        ]
    elif product_gender == "women":
        base_query["$or"] = [
            {"gender": "women"},
            {"name": {"$regex": r"\d+\s*W\b", "$options": "i"}}
        ]

    # 3. Same brand
    if len(collected) < limit and product_brand:
        brand_query = dict(base_query)
        brand_query["brand"] = product_brand
        brand_query["_id"] = {"$nin": list(seen_ids)}
        cursor = db.products.find(brand_query).limit(limit * 2)
        brand_docs = await cursor.to_list(limit * 2)
        if add_docs(brand_docs):
            return {"products": [product_doc_to_response(p) for p in collected]}

    # 4. Same category/gender (fallback)
    if len(collected) < limit:
        fallback_query = dict(base_query)
        fallback_query["_id"] = {"$nin": list(seen_ids)}
        cursor = db.products.find(fallback_query).limit(limit * 2)
        fallback_docs = await cursor.to_list(limit * 2)
        add_docs(fallback_docs)

    return {"products": [product_doc_to_response(p) for p in collected]}


class RelatedBulkRequest(BaseModel):
    product_ids: List[str]
    limit: int = 6


@router.post("/related-bulk")
async def get_related_bulk(request: Request, data: RelatedBulkRequest):
    """Get related products for a set of products (used on Cart page).
    Combines FBT co-occurrence + same-brand recommendations across all input products.
    Excludes any product already in the input list.
    """
    db = request.app.state.db
    limit = max(1, min(24, data.limit))

    input_ids_str = [pid for pid in data.product_ids if pid]
    exclude_oids = set()
    for pid in input_ids_str:
        try:
            exclude_oids.add(ObjectId(pid))
        except Exception:
            continue

    if not exclude_oids:
        return {"products": []}

    # Get input products to know their brands
    input_products = await db.products.find({"_id": {"$in": list(exclude_oids)}}).to_list(len(exclude_oids))
    brands = list({p.get("brand", "") for p in input_products if p.get("brand")})
    categories = list({p.get("category", "perfumes") for p in input_products})

    collected = []
    seen_ids = set(exclude_oids)

    def add_docs(docs):
        for d in docs:
            if d["_id"] in seen_ids:
                continue
            if not d.get("is_active", True) or not d.get("is_visible", True):
                continue
            seen_ids.add(d["_id"])
            collected.append(d)
            if len(collected) >= limit:
                return True
        return False

    # 1. Frequently bought together across all input products
    try:
        pipeline = [
            {"$match": {
                "status": {"$in": ["completed", "shipped", "delivered", "paid"]},
                "items.product_id": {"$in": input_ids_str}
            }},
            {"$unwind": "$items"},
            {"$match": {"items.product_id": {"$nin": input_ids_str}}},
            {"$group": {"_id": "$items.product_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit * 3}
        ]
        co_data = await db.orders.aggregate(pipeline).to_list(limit * 3)
        co_ids = []
        for row in co_data:
            try:
                co_ids.append(ObjectId(row["_id"]))
            except Exception:
                continue
        if co_ids:
            co_docs_map = {}
            async for d in db.products.find({"_id": {"$in": co_ids}}):
                co_docs_map[d["_id"]] = d
            ordered_co = [co_docs_map[oid] for oid in co_ids if oid in co_docs_map]
            if add_docs(ordered_co):
                return {"products": [product_doc_to_response(p) for p in collected]}
    except Exception as e:
        logger.warning(f"Cart FBT aggregation failed: {e}")

    # 2. Same brand fallback
    if len(collected) < limit and brands:
        brand_query = {
            "is_active": True,
            "is_visible": True,
            "brand": {"$in": brands},
            "_id": {"$nin": list(seen_ids)},
        }
        cursor = db.products.find(brand_query).limit(limit * 2)
        brand_docs = await cursor.to_list(limit * 2)
        if add_docs(brand_docs):
            return {"products": [product_doc_to_response(p) for p in collected]}

    # 3. Same category fallback
    if len(collected) < limit and categories:
        cat_query = {
            "is_active": True,
            "is_visible": True,
            "category": {"$in": categories},
            "_id": {"$nin": list(seen_ids)},
        }
        cursor = db.products.find(cat_query).limit(limit * 2)
        cat_docs = await cursor.to_list(limit * 2)
        add_docs(cat_docs)

    return {"products": [product_doc_to_response(p) for p in collected]}


# Admin-only endpoints
@router.post("")
async def create_product(request: Request, data: ProductCreate, background_tasks: BackgroundTasks):
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    product_doc = {
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.products.insert_one(product_doc)
    product_doc["_id"] = result.inserted_id
    logger.info(f"Product created: {data.name}")
    
    # Sync to Meta Catalog in background
    background_tasks.add_task(sync_product_to_meta, db, str(result.inserted_id))
    
    return product_doc_to_response(product_doc)


@router.put("/{product_id}")
async def update_product(request: Request, product_id: str, data: ProductUpdate, background_tasks: BackgroundTasks):
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Build update data - include all non-None values
    update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = await db.products.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {"$set": update_data},
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")

    if not result:
        raise HTTPException(status_code=404, detail="Product not found")

    # Sync to Meta Catalog in background
    background_tasks.add_task(sync_product_to_meta, db, product_id)
    
    return product_doc_to_response(result)


@router.delete("/{product_id}")
async def delete_product(request: Request, product_id: str, background_tasks: BackgroundTasks):
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete from Meta Catalog in background
    async def delete_from_meta():
        try:
            from routes.meta_catalog import on_product_deleted
            await on_product_deleted(db, product_id)
        except Exception as e:
            logger.error(f"Failed to delete product {product_id} from Meta: {e}")
    
    background_tasks.add_task(delete_from_meta)
    
    return {"message": "Product deleted"}


@router.patch("/{product_id}/visibility")
async def toggle_product_visibility(request: Request, product_id: str, data: ProductVisibilityUpdate, background_tasks: BackgroundTasks):
    """Toggle product visibility - Admin only"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        result = await db.products.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {
                "$set": {
                    "is_visible": data.is_visible,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")

    if not result:
        raise HTTPException(status_code=404, detail="Product not found")

    logger.info(f"Product {product_id} visibility set to {data.is_visible}")
    
    # Sync visibility change to Meta Catalog
    background_tasks.add_task(sync_product_to_meta, db, product_id)
    
    return product_doc_to_response(result)


@router.patch("/{product_id}/collections")
async def update_product_collections(request: Request, product_id: str):
    """Update product collections - Admin only"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    collections = body.get("collections", [])
    
    # Validate: if no other collection, must have "all_products"
    if not collections or len(collections) == 0:
        collections = ["all_products"]
    
    # If only "all_products" is being removed and there's no other collection, keep it
    if "all_products" not in collections and len(collections) == 0:
        collections = ["all_products"]

    try:
        result = await db.products.find_one_and_update(
            {"_id": ObjectId(product_id)},
            {
                "$set": {
                    "collections": collections,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")

    if not result:
        raise HTTPException(status_code=404, detail="Product not found")

    logger.info(f"Product {product_id} collections updated to {collections}")
    return product_doc_to_response(result)



@router.get("/recommendations/order/{order_id}")
async def get_order_recommendations(request: Request, order_id: str, limit: int = 4):
    """
    Get smart product recommendations based on ordered items.
    Rules:
    1. Match by scent profiles from ordered products
    2. If ordered Dubai perfume -> recommend Dubai
    3. If ordered non-Dubai -> recommend non-Dubai only
    """
    db = request.app.state.db
    
    # Find order by ID or order number
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        order = await db.orders.find_one({"order_number": order_id})
    
    if not order:
        # Fallback to popular products
        cursor = db.products.find({"is_visible": True}).limit(limit)
        products = []
        async for p in cursor:
            products.append(product_doc_to_response(p))
        return {"products": products, "source": "fallback"}
    
    # Extract ordered product IDs
    ordered_items = order.get("items", [])
    ordered_product_ids = []
    for item in ordered_items:
        pid = item.get("product_id") or item.get("id")
        if pid:
            try:
                ordered_product_ids.append(ObjectId(pid))
            except Exception:
                pass
    
    # Get ordered products details
    ordered_products = []
    if ordered_product_ids:
        cursor = db.products.find({"_id": {"$in": ordered_product_ids}})
        async for p in cursor:
            ordered_products.append(p)
    
    # Extract scent profiles, gender, and check if any product is Dubai
    all_scent_profiles = set()
    all_genders = set()
    has_dubai_product = False
    ordered_brands = set()
    
    for product in ordered_products:
        # Collect scent profiles
        profiles = product.get("scent_profiles", [])
        if profiles:
            all_scent_profiles.update(profiles)
        
        # Collect gender - handle list format ["men"] or ["women"]
        gender_raw = product.get("gender", [])
        if isinstance(gender_raw, list):
            all_genders.update(gender_raw)
        elif gender_raw:
            all_genders.add(gender_raw)
        
        # Check if Dubai product
        collections = product.get("collections", [])
        if isinstance(collections, list):
            for col in collections:
                col_name = col.get("name", "") if isinstance(col, dict) else str(col)
                if "dubai" in col_name.lower() or "дубай" in col_name.lower():
                    has_dubai_product = True
                    break
        
        # Also check brand for Dubai indicators
        brand = product.get("brand", "").lower()
        dubai_brands = ["lattafa", "maison alhambra", "fragrance world", "pendora", "armaf", "al haramain"]
        if any(db in brand for db in dubai_brands):
            has_dubai_product = True
        
        ordered_brands.add(product.get("brand", ""))
    
    logger.info(f"Order {order_id}: scent_profiles={list(all_scent_profiles)}, genders={list(all_genders)}, has_dubai={has_dubai_product}")
    
    # Build query for recommendations
    query = {
        "is_visible": True,
        "_id": {"$nin": ordered_product_ids}  # Exclude ordered products
    }
    
    # Filter by gender if available (exact match)
    if all_genders:
        # Handle both list format ["men"] and potential string format
        gender_list = list(all_genders)
        query["gender"] = {"$in": gender_list}
    
    # Filter by scent profiles if available
    if all_scent_profiles:
        query["scent_profiles"] = {"$in": list(all_scent_profiles)}
    
    # Dubai/non-Dubai filter
    dubai_brands = ["lattafa", "maison alhambra", "fragrance world", "pendora", "armaf", "al haramain", "ajmal", "rasasi"]
    
    if has_dubai_product:
        # Recommend only Dubai products
        query["$or"] = [
            {"brand": {"$regex": "|".join(dubai_brands), "$options": "i"}},
            {"collections.name": {"$regex": "dubai|дубай", "$options": "i"}}
        ]
    else:
        # Exclude Dubai products
        query["brand"] = {"$not": {"$regex": "|".join(dubai_brands), "$options": "i"}}
    
    # First try with all filters, sorted by purchase count
    cursor = db.products.find(query).sort("purchase_count", -1).limit(limit * 3)
    products = []
    async for p in cursor:
        products.append(product_doc_to_response(p))
    
    # If not enough products, relax the scent profile constraint but keep gender + dubai filter
    if len(products) < limit:
        relaxed_query = {
            "is_visible": True,
            "_id": {"$nin": ordered_product_ids}
        }
        
        # Keep gender filter
        if all_genders:
            relaxed_query["gender"] = {"$in": list(all_genders)}
        
        if has_dubai_product:
            relaxed_query["$or"] = [
                {"brand": {"$regex": "|".join(dubai_brands), "$options": "i"}},
                {"collections.name": {"$regex": "dubai|дубай", "$options": "i"}}
            ]
        else:
            relaxed_query["brand"] = {"$not": {"$regex": "|".join(dubai_brands), "$options": "i"}}
        
        existing_ids = [ObjectId(p["id"]) for p in products]
        relaxed_query["_id"]["$nin"].extend(existing_ids)
        
        cursor = db.products.find(relaxed_query).sort("purchase_count", -1).limit(limit - len(products))
        async for p in cursor:
            products.append(product_doc_to_response(p))
    
    # Don't shuffle - keep sorted by purchase count
    
    return {
        "products": products[:limit],
        "source": "smart",
        "scent_profiles_matched": list(all_scent_profiles),
        "genders_matched": list(all_genders),
        "is_dubai_context": has_dubai_product
    }
