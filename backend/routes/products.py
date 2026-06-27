from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Query
from bson import ObjectId
from typing import Optional
from models.schemas import ProductCreate, ProductUpdate, ProductResponse, ProductVisibilityUpdate
from utils.auth import get_current_user, get_current_user_optional
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/products", tags=["products"])

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
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
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


import re

def extract_base_name(product_name: str) -> str:
    """Extract base product name without size (e.g., '100 ml', '150ml', '50 M')"""
    # Remove size patterns like "100 ml", "150ml", "50 M", "100 W", etc.
    # Pattern matches: number + optional space + (ml/M/W/U) at end or before other text
    cleaned = re.sub(r'\s*\d+\s*(ml|ML|M|W|U)\b', '', product_name)
    # Also remove TR (Tester) designation for variant matching
    cleaned = re.sub(r'\s+TR\b', '', cleaned)
    # Remove trailing whitespace
    cleaned = cleaned.strip()
    return cleaned


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
    
    # Extract base name (without size)
    base_name = extract_base_name(product.get("name", ""))
    brand = product.get("brand", "")
    
    if not base_name or not brand:
        return {"variants": [product_doc_to_response(product)], "base_name": base_name}
    
    # Find other products with same brand and similar base name
    # Use regex to match products that start with the base name
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


@router.get("/{product_id}/related")
async def get_related_products(request: Request, product_id: str, limit: int = 5):
    """Get related products based on scent profile, gender, and Dubai/non-Dubai separation"""
    db = request.app.state.db
    
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    scent_profiles = product.get("scent_profiles", [])
    collections = product.get("collections", [])
    category = product.get("category", "perfumes")
    is_dubai = "dubai" in collections
    product_gender = extract_gender_from_name(product.get("name", ""))
    
    query = {
        "is_active": True,
        "is_visible": True,
        "_id": {"$ne": product["_id"]},  # Exclude current product
        "category": category
    }
    
    # Dubai rule: if Dubai product, show only Dubai. If not Dubai, exclude Dubai
    if is_dubai:
        query["collections"] = "dubai"
    else:
        query["collections"] = {"$ne": "dubai"}
    
    # Gender rule: Match product gender using regex on name
    # M products -> show only M products, W products -> show only W products
    if product_gender == "men":
        query["name"] = {"$regex": r"\d+\s*M\b", "$options": "i"}
    elif product_gender == "women":
        query["name"] = {"$regex": r"\d+\s*W\b", "$options": "i"}
    
    # If product has scent profiles, prefer products with matching profiles
    if scent_profiles:
        # First try to find products with matching scent profiles
        query["scent_profiles"] = {"$in": scent_profiles}
        cursor = db.products.find(query).limit(limit * 2)
        related = await cursor.to_list(limit * 2)
        
        # Sort by number of matching profiles (more matches = more relevant)
        def count_matches(p):
            p_profiles = p.get("scent_profiles", [])
            return len(set(p_profiles) & set(scent_profiles))
        
        related.sort(key=count_matches, reverse=True)
        related = related[:limit]
        
        # If not enough results, fill with category products
        if len(related) < limit:
            del query["scent_profiles"]
            existing_ids = [p["_id"] for p in related]
            query["_id"] = {"$nin": existing_ids + [product["_id"]]}
            cursor = db.products.find(query).limit(limit - len(related))
            more = await cursor.to_list(limit - len(related))
            related.extend(more)
    else:
        # No scent profiles, just get products from same category
        cursor = db.products.find(query).limit(limit)
        related = await cursor.to_list(limit)
    
    return {"products": [product_doc_to_response(p) for p in related]}


# Admin-only endpoints
@router.post("")
async def create_product(request: Request, data: ProductCreate):
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
    return product_doc_to_response(product_doc)


@router.put("/{product_id}")
async def update_product(request: Request, product_id: str, data: ProductUpdate):
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

    return product_doc_to_response(result)


@router.delete("/{product_id}")
async def delete_product(request: Request, product_id: str):
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

    return {"message": "Product deleted"}


@router.patch("/{product_id}/visibility")
async def toggle_product_visibility(request: Request, product_id: str, data: ProductVisibilityUpdate):
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
