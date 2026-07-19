from fastapi import APIRouter, Request, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter(prefix="/api/homepage", tags=["homepage"])

class HeroSlide(BaseModel):
    image: str
    alt: str = ""
    show_button: bool = True
    button_text: Optional[str] = None
    button_text_en: Optional[str] = None
    button_link_type: Optional[str] = None
    button_link: Optional[str] = None
    button_product_id: Optional[str] = None
    button_collection_slug: Optional[str] = None

class GenderImages(BaseModel):
    men: Optional[str] = None
    women: Optional[str] = None

class CampaignBanner(BaseModel):
    enabled: bool = False
    image: Optional[str] = None
    title: Optional[str] = None
    title_en: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    button_text: Optional[str] = None
    button_text_en: Optional[str] = None
    button_link: Optional[str] = None

class HomepageSettings(BaseModel):
    hero_slides: List[HeroSlide] = []
    featured_product_ids: List[str] = []
    campaign_banner: Optional[CampaignBanner] = None

class UpdateHeroSlidesRequest(BaseModel):
    slides: List[HeroSlide]

class UpdateFeaturedProductsRequest(BaseModel):
    product_ids: List[str]

class UpdateCampaignBannerRequest(BaseModel):
    banner: CampaignBanner

class UpdateGenderImagesRequest(BaseModel):
    images: GenderImages


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
            "featured_product_ids": [],
            "gender_images": {
                "men": "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
                "women": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80"
            },
            "campaign_banner": {
                "enabled": False,
                "image": None,
                "title": None,
                "title_en": None,
                "description": None,
                "description_en": None,
                "button_text": None,
                "button_text_en": None,
                "button_link": None,
            }
        }
    
    gender_images = settings.get("gender_images") or {}
    return {
        "hero_slides": settings.get("hero_slides", []),
        "featured_product_ids": settings.get("featured_product_ids", []),
        "gender_images": {
            "men": gender_images.get("men") or "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
            "women": gender_images.get("women") or "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80"
        },
        "campaign_banner": settings.get("campaign_banner") or {
            "enabled": False,
            "image": None,
            "title": None,
            "title_en": None,
            "description": None,
            "description_en": None,
            "button_text": None,
            "button_text_en": None,
            "button_link": None,
        }
    }


@router.put("/campaign-banner")
async def update_campaign_banner(request: Request, data: UpdateCampaignBannerRequest):
    """Update homepage campaign banner (admin only)"""
    try:
        db = request.app.state.db

        from utils.auth import get_current_user
        try:
            user = await get_current_user(request, db)
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")

        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

        banner = data.banner
        if hasattr(banner, 'model_dump'):
            banner_data = banner.model_dump()
        elif hasattr(banner, 'dict'):
            banner_data = banner.dict()
        else:
            banner_data = dict(banner)

        await db.settings.update_one(
            {"type": "homepage"},
            {"$set": {"campaign_banner": banner_data}},
            upsert=True
        )

        return {"message": "Campaign banner updated", "campaign_banner": banner_data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating campaign banner: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/gender-images")
async def update_gender_images(request: Request, data: UpdateGenderImagesRequest):
    """Update the Men/Women category images shown on homepage (admin only)"""
    try:
        db = request.app.state.db

        from utils.auth import get_current_user
        try:
            user = await get_current_user(request, db)
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")

        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")

        images = data.images
        if hasattr(images, 'model_dump'):
            images_data = images.model_dump()
        elif hasattr(images, 'dict'):
            images_data = images.dict()
        else:
            images_data = dict(images)

        await db.settings.update_one(
            {"type": "homepage"},
            {"$set": {"gender_images": images_data}},
            upsert=True
        )

        return {"message": "Gender images updated", "gender_images": images_data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating gender images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
