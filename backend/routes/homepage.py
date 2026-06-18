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
    db = request.app.state.db
    
    # Verify admin (check cookie)
    from utils.auth import verify_token
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update or create settings
    await db.settings.update_one(
        {"type": "homepage"},
        {"$set": {"hero_slides": [s.dict() for s in data.slides]}},
        upsert=True
    )
    
    return {"message": "Hero slides updated", "slides": [s.dict() for s in data.slides]}


@router.put("/featured-products")
async def update_featured_products(request: Request, data: UpdateFeaturedProductsRequest):
    """Update featured products on homepage (admin only)"""
    db = request.app.state.db
    
    # Verify admin
    from utils.auth import verify_token
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update or create settings
    await db.settings.update_one(
        {"type": "homepage"},
        {"$set": {"featured_product_ids": data.product_ids}},
        upsert=True
    )
    
    return {"message": "Featured products updated", "product_ids": data.product_ids}


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
            except:
                continue
    
    # Convert to response format
    from routes.products import product_doc_to_response
    return [product_doc_to_response(p) for p in products]
