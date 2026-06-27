from fastapi import APIRouter, Request, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/api/homepage", tags=["homepage"])

class HeroSlide(BaseModel):
    image: str
    alt: str = ""

class HomepageSettings(BaseModel):
    hero_slides: List[HeroSlide] = []
    featured_product_ids: List[str] = []

class UpdateHeroSlidesRequest(BaseModel):
    slides: List[HeroSlide]

class UpdateFeaturedProductsRequest(BaseModel):
    product_ids: List[str]


@router.get("/settings")
async def get_homepage_settings(request: Request):
    """Get homepage settings (hero slides and featured products)"""
    db = request.app.state.db
    
    settings = await db.settings.find_one({"type": "homepage"})
    
    if not settings:
        # Return defaults
        return {
            "hero_slides": [
                {"image": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=80", "alt": "Luxury Perfume Collection"},
                {"image": "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1920&q=80", "alt": "Bleu de Chanel"},
                {"image": "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1920&q=80", "alt": "Exclusive Perfumes"}
            ],
            "featured_product_ids": []
        }
    
    return {
        "hero_slides": settings.get("hero_slides", []),
        "featured_product_ids": settings.get("featured_product_ids", [])
    }


@router.put("/hero-slides")
async def update_hero_slides(request: Request, data: UpdateHeroSlidesRequest):
    """Update hero carousel slides (admin only)"""
    try:
        db = request.app.state.db
        
        # Verify admin using get_current_user
        from utils.auth import get_current_user
        try:
            user = await get_current_user(request, db)
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Convert slides to dict format
        slides_data = []
        for s in data.slides:
            if hasattr(s, 'model_dump'):
                slides_data.append(s.model_dump())
            elif hasattr(s, 'dict'):
                slides_data.append(s.dict())
            else:
                slides_data.append({"image": s.image, "alt": s.alt})
        
        # Update or create settings
        await db.settings.update_one(
            {"type": "homepage"},
            {"$set": {"hero_slides": slides_data}},
            upsert=True
        )
        
        return {"message": "Hero slides updated", "slides": slides_data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating hero slides: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/featured-products")
async def update_featured_products(request: Request, data: UpdateFeaturedProductsRequest):
    """Update featured products on homepage (admin only)"""
    try:
        db = request.app.state.db
        
        # Verify admin using get_current_user
        from utils.auth import get_current_user
        try:
            user = await get_current_user(request, db)
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Update or create settings
        await db.settings.update_one(
            {"type": "homepage"},
            {"$set": {"featured_product_ids": data.product_ids}},
            upsert=True
        )
        
        return {"message": "Featured products updated", "product_ids": data.product_ids}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating featured products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/featured-products")
async def get_featured_products(request: Request):
    """Get featured products for homepage"""
    db = request.app.state.db
    
    settings = await db.settings.find_one({"type": "homepage"})
    featured_ids = settings.get("featured_product_ids", []) if settings else []
    
    if not featured_ids:
        # Return newest products as fallback
        products = await db.products.find(
            {"is_active": True, "is_visible": True}
        ).sort("created_at", -1).limit(8).to_list(8)
    else:
        # Get products in the specified order
        products = []
        for pid in featured_ids:
            try:
                product = await db.products.find_one({"_id": ObjectId(pid), "is_active": True, "is_visible": True})
                if product:
                    products.append(product)
            except Exception:
                continue
    
    # Convert to response format
    from routes.products import product_doc_to_response
    return [product_doc_to_response(p) for p in products]



@router.get("/best-sellers")
async def get_best_sellers(request: Request, limit: int = 8):
    """Get best selling products based on actual order data"""
    db = request.app.state.db
    
    # Aggregate orders to find most sold products
    pipeline = [
        {"$match": {"status": {"$in": ["completed", "shipped", "delivered", "paid"]}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "total_sold": {"$sum": "$items.quantity"}
        }},
        {"$sort": {"total_sold": -1}},
        {"$limit": limit * 2}  # Get more to filter visible ones
    ]
    
    try:
        sales_data = await db.orders.aggregate(pipeline).to_list(limit * 2)
    except Exception:
        sales_data = []
    
    if not sales_data:
        # Fallback to newest products if no orders
        products = await db.products.find(
            {"is_active": True, "is_visible": True}
        ).sort("created_at", -1).limit(limit).to_list(limit)
    else:
        # Get products in order of sales
        products = []
        for item in sales_data:
            if len(products) >= limit:
                break
            try:
                product = await db.products.find_one({
                    "_id": ObjectId(item["_id"]),
                    "is_active": True,
                    "is_visible": True
                })
                if product:
                    product["total_sold"] = item["total_sold"]
                    products.append(product)
            except Exception:
                continue
        
        # If not enough products from orders, fill with newest
        if len(products) < limit:
            existing_ids = [p["_id"] for p in products]
            fill_products = await db.products.find({
                "_id": {"$nin": existing_ids},
                "is_active": True,
                "is_visible": True
            }).sort("created_at", -1).limit(limit - len(products)).to_list(limit - len(products))
            products.extend(fill_products)
    
    from routes.products import product_doc_to_response
    return [product_doc_to_response(p) for p in products]



# ============ Navigation Collections ============

class NavCollectionCreate(BaseModel):
    slug: str
    name: str
    name_bg: Optional[str] = None
    path: str  # e.g., "/dubai-perfumes" or "/collection/summer-sale"
    is_active: bool = True
    order: int = 0


@router.get("/nav-collections")
async def get_nav_collections(request: Request):
    """Get navigation collections for header and footer"""
    db = request.app.state.db
    
    collections = await db.nav_collections.find(
        {"is_active": True}
    ).sort("order", 1).to_list(20)
    
    return {
        "collections": [
            {
                "id": str(c["_id"]),
                "slug": c.get("slug"),
                "name": c.get("name"),
                "name_bg": c.get("name_bg"),
                "path": c.get("path"),
                "is_active": c.get("is_active", True),
                "order": c.get("order", 0)
            }
            for c in collections
        ]
    }


@router.post("/nav-collections")
async def create_nav_collection(request: Request, data: NavCollectionCreate):
    """Create a new navigation collection (admin only)"""
    db = request.app.state.db
    
    from utils.auth import get_current_user
    try:
        user = await get_current_user(request, db)
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if slug already exists
    existing = await db.nav_collections.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail=f"Collection with slug '{data.slug}' already exists")
    
    collection_doc = {
        "slug": data.slug,
        "name": data.name,
        "name_bg": data.name_bg,
        "path": data.path,
        "is_active": data.is_active,
        "order": data.order
    }
    
    result = await db.nav_collections.insert_one(collection_doc)
    collection_doc["_id"] = result.inserted_id
    
    return {
        "success": True,
        "collection": {
            "id": str(collection_doc["_id"]),
            **{k: v for k, v in collection_doc.items() if k != "_id"}
        }
    }


@router.put("/nav-collections/{collection_id}")
async def update_nav_collection(request: Request, collection_id: str):
    """Update a navigation collection (admin only)"""
    db = request.app.state.db
    
    from utils.auth import get_current_user
    try:
        user = await get_current_user(request, db)
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    
    try:
        oid = ObjectId(collection_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid collection ID")
    
    update_data = {k: v for k, v in body.items() if k in ["name", "name_bg", "path", "is_active", "order"]}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.nav_collections.update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    return {"success": True, "message": "Collection updated"}


@router.delete("/nav-collections/{collection_id}")
async def delete_nav_collection(request: Request, collection_id: str):
    """Delete a navigation collection (admin only)"""
    db = request.app.state.db
    
    from utils.auth import get_current_user
    try:
        user = await get_current_user(request, db)
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        oid = ObjectId(collection_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid collection ID")
    
    result = await db.nav_collections.delete_one({"_id": oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    return {"success": True, "message": "Collection deleted"}
