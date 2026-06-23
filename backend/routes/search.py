from datetime import datetime, timezone
from fastapi import APIRouter, Request, Query
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])

# Brand aliases for common abbreviations
BRAND_ALIASES = {
    "ysl": "Yves Saint Laurent",
    "paco": "Paco Rabanne",
    "rabanne": "Paco Rabanne",
    "jpg": "Jean Paul Gaultier",
    "jpgaultier": "Jean Paul Gaultier",
    "gaultier": "Jean Paul Gaultier",
    "cdior": "Christian Dior",
    "c.dior": "Christian Dior",
    "d&g": "Dolce & Gabbana",
    "dng": "Dolce & Gabbana",
    "dolce": "Dolce & Gabbana",
    "gabbana": "Dolce & Gabbana",
    "bvl": "Bvlgari",
    "bulgari": "Bvlgari",
    "ch": "Carolina Herrera",
    "herrera": "Carolina Herrera",
    "edp": "",  # Not a brand
    "edt": "",  # Not a brand
    "parfum": "",  # Not a brand
    "eau": "",  # Not a brand
}

# Brand popularity scores for sorting
BRAND_POPULARITY = {
    "chanel": 100,
    "christian dior": 98,
    "dior": 98,
    "tom ford": 95,
    "creed": 94,
    "yves saint laurent": 92,
    "giorgio armani": 90,
    "armani": 90,
    "versace": 88,
    "paco rabanne": 87,
    "gucci": 86,
    "prada": 85,
    "dolce & gabbana": 84,
    "lancome": 83,
    "burberry": 82,
    "bvlgari": 81,
    "valentino": 80,
    "givenchy": 79,
    "hugo boss": 78,
    "jean paul gaultier": 77,
    "narciso rodriguez": 76,
    "carolina herrera": 75,
    "roberto cavalli": 74,
    "viktor & rolf": 73,
    "acqua di parma": 72,
    "hermes": 90,
    "guerlain": 85,
    "xerjoff": 70,
    "parfums de marly": 69,
    "initio": 68,
    "mancera": 65,
    "montale": 64,
    "lattafa": 60,
    "afnan": 58,
    "armaf": 57,
    "al haramain": 55,
    "rasasi": 54,
    "ajmal": 53,
    "ahmed al maghribi": 52,
}

# Product name keywords popularity
PRODUCT_POPULARITY = {
    "sauvage": 100,
    "bleu de chanel": 98,
    "aventus": 97,
    "eros": 95,
    "la vie est belle": 94,
    "acqua di gio": 93,
    "libre": 92,
    "black opium": 91,
    "jadore": 90,
    "j'adore": 90,
    "1 million": 89,
    "one million": 89,
    "invictus": 88,
    "coco mademoiselle": 88,
    "code": 87,
    "stronger with you": 86,
    "my way": 85,
    "si": 84,
    "the one": 83,
    "good girl": 82,
    "phantom": 81,
    "born in roma": 80,
    "luna rossa": 79,
    "le male": 78,
    "scandal": 77,
    "bright crystal": 76,
    "dylan blue": 75,
    "club de nuit": 74,
    "khamrah": 73,
    "erba pura": 72,
}


def get_brand_popularity(brand: str) -> int:
    """Get popularity score for a brand"""
    brand_lower = brand.lower()
    for key, score in BRAND_POPULARITY.items():
        if key in brand_lower or brand_lower in key:
            return score
    return 30  # Default for unknown brands


def get_product_relevance_score(product: dict, search_term: str) -> tuple:
    """
    Calculate relevance score for a product.
    Returns tuple for sorting: (exact_match, name_starts_with, popularity, name)
    Lower tuple = higher priority
    """
    name = product.get("name", "").lower()
    brand = product.get("brand", "").lower()
    search_lower = search_term.lower()
    
    # Check for exact match in name
    exact_match = 0 if search_lower in name else 1
    
    # Check if name starts with search term (after brand)
    name_parts = name.split()
    name_starts = 1
    for part in name_parts:
        if part.startswith(search_lower):
            name_starts = 0
            break
    
    # Get popularity score (higher = more popular)
    popularity = 100  # Start with low priority
    for keyword, score in PRODUCT_POPULARITY.items():
        if keyword in name:
            popularity = 100 - score  # Invert so lower = better
            break
    
    # Brand bonus
    brand_pop = get_brand_popularity(brand)
    popularity -= brand_pop // 10
    
    return (exact_match, name_starts, popularity, name)


def resolve_brand_alias(query: str) -> str:
    """Resolve brand abbreviations to full names"""
    query_lower = query.lower().strip()
    if query_lower in BRAND_ALIASES:
        return BRAND_ALIASES[query_lower]
    return None


@router.get("/brands")
async def search_brands(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(5, ge=1, le=10),
):
    """
    Search for brands matching the query.
    Returns brands sorted by relevance and popularity.
    """
    db = request.app.state.db
    query_lower = q.lower().strip()
    
    # Check if query matches a known alias
    alias_brand = resolve_brand_alias(query_lower)
    
    # Get all brands with product counts
    pipeline = [
        {"$match": {"is_active": True, "is_visible": True}},
        {"$group": {"_id": "$brand", "count": {"$sum": 1}}},
    ]
    all_brands = await db.products.aggregate(pipeline).to_list(500)
    
    # Score and filter brands
    scored_brands = []
    for brand_doc in all_brands:
        brand_name = brand_doc["_id"]
        brand_lower = brand_name.lower()
        count = brand_doc["count"]
        
        # Calculate match score
        match_score = 100  # Default: no match
        
        # Exact alias match
        if alias_brand and brand_lower == alias_brand.lower():
            match_score = 0
        # Query is in brand name
        elif query_lower in brand_lower:
            # Prefer matches at the start
            if brand_lower.startswith(query_lower):
                match_score = 1
            else:
                match_score = 2
        # Brand name starts with any word matching query
        elif any(word.startswith(query_lower) for word in brand_lower.split()):
            match_score = 3
        else:
            continue  # No match, skip
        
        # Get popularity
        popularity = get_brand_popularity(brand_name)
        
        scored_brands.append({
            "name": brand_name,
            "product_count": count,
            "match_score": match_score,
            "popularity": popularity,
        })
    
    # Sort by: match_score ASC, popularity DESC
    scored_brands.sort(key=lambda x: (x["match_score"], -x["popularity"]))
    
    # Return top results
    results = []
    for brand in scored_brands[:limit]:
        results.append({
            "name": brand["name"],
            "product_count": brand["product_count"],
        })
    
    return {"brands": results, "query": q}


@router.get("/products")
async def search_products(
    request: Request,
    q: str = Query("", description="Search query"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    limit: int = Query(5, ge=1, le=10),
):
    """
    Search for products, optionally filtered by brand.
    Returns products sorted by relevance and popularity.
    """
    db = request.app.state.db
    query_lower = q.lower().strip() if q else ""
    
    # Build MongoDB query
    mongo_query = {"is_active": True, "is_visible": True}
    
    # Brand filter
    if brand:
        mongo_query["brand"] = {"$regex": f"^{brand}$", "$options": "i"}
    
    # Text search
    if query_lower:
        # Check for brand alias in query
        alias_brand = resolve_brand_alias(query_lower)
        
        if alias_brand and not brand:
            # Query is a brand alias, search for that brand
            mongo_query["brand"] = {"$regex": alias_brand, "$options": "i"}
        else:
            # Regular search in name
            mongo_query["$or"] = [
                {"name": {"$regex": query_lower, "$options": "i"}},
            ]
            # If no brand filter, also search in brand
            if not brand:
                mongo_query["$or"].append({"brand": {"$regex": query_lower, "$options": "i"}})
    
    # Fetch products
    cursor = db.products.find(mongo_query).limit(50)  # Get more for sorting
    products = await cursor.to_list(50)
    
    # Score and sort products
    scored_products = []
    for product in products:
        score = get_product_relevance_score(product, query_lower if query_lower else brand or "")
        scored_products.append((score, product))
    
    scored_products.sort(key=lambda x: x[0])
    
    # Build response
    results = []
    for _, product in scored_products[:limit]:
        images = product.get("images", [])
        legacy_image = product.get("image", "")
        main_image = images[0] if images else legacy_image
        
        results.append({
            "id": str(product["_id"]),
            "name": product.get("name", ""),
            "brand": product.get("brand", ""),
            "price": product.get("price", 0),
            "image": main_image,
            "stock": product.get("stock", 0),
        })
    
    return {
        "products": results,
        "query": q,
        "brand": brand,
    }


@router.get("/suggestions")
async def get_search_suggestions(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(5, ge=1, le=10),
):
    """
    Combined search: returns both brand suggestions and product suggestions.
    Used for smart autocomplete.
    """
    query_lower = q.lower().strip()
    
    # Get brand suggestions
    brands_result = await search_brands(request, q=q, limit=limit)
    brands = brands_result["brands"]
    
    # Get product suggestions (without brand filter)
    products_result = await search_products(request, q=q, brand=None, limit=limit)
    products = products_result["products"]
    
    # Determine if query matches a brand exactly or nearly
    matched_brand = None
    if brands and len(brands) > 0:
        # Check if first brand is a strong match
        first_brand = brands[0]["name"].lower()
        if query_lower in first_brand or first_brand.startswith(query_lower):
            if len(query_lower) >= 3:  # At least 3 chars for brand detection
                matched_brand = brands[0]["name"]
    
    return {
        "query": q,
        "brands": brands,
        "products": products,
        "matched_brand": matched_brand,
    }
