"""
Brand Background Management Routes
Allows admin to set custom header backgrounds per brand
"""

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone
import logging
import os
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/brand-backgrounds", tags=["brand-backgrounds"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "kostin_cosmetics")


def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


class BrandBackgroundCreate(BaseModel):
    brand: str
    image_url: str
    text_color: str = "white"  # "white" or "black"
    image_position_x: int = 50  # 0-100, percentage from left
    image_position_y: int = 50  # 0-100, percentage from top
    overlay_opacity: float = 0.3  # 0-1, darkness of overlay


class BrandBackgroundUpdate(BaseModel):
    image_url: Optional[str] = None
    text_color: Optional[str] = None
    image_position_x: Optional[int] = None
    image_position_y: Optional[int] = None
    overlay_opacity: Optional[float] = None


async def verify_admin(request: Request, db):
    """Verify the user is authenticated and has admin role"""
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("")
async def get_all_brand_backgrounds():
    """Get all brand backgrounds (public endpoint for frontend)"""
    db = get_db()
    
    backgrounds = await db.brand_backgrounds.find().to_list(1000)
    
    # Convert ObjectId to string
    result = []
    for bg in backgrounds:
        result.append({
            "id": str(bg["_id"]),
            "brand": bg.get("brand"),
            "image_url": bg.get("image_url"),
            "text_color": bg.get("text_color", "white"),
            "image_position_x": bg.get("image_position_x", 50),
            "image_position_y": bg.get("image_position_y", 50),
            "overlay_opacity": bg.get("overlay_opacity", 0.3)
        })
    
    return {"backgrounds": result}


@router.get("/brands")
async def get_available_brands():
    """Get list of all unique brands from products"""
    db = get_db()
    
    # Get unique brands from products collection
    brands = await db.products.distinct("brand")
    
    # Filter out None/empty values and sort
    brands = sorted([b for b in brands if b])
    
    return {"brands": brands}


@router.get("/{brand}")
async def get_brand_background(brand: str):
    """Get background for a specific brand"""
    db = get_db()
    
    background = await db.brand_backgrounds.find_one({"brand": brand})
    
    if not background:
        return {"background": None}
    
    return {
        "background": {
            "id": str(background["_id"]),
            "brand": background.get("brand"),
            "image_url": background.get("image_url"),
            "text_color": background.get("text_color", "white"),
            "image_position_x": background.get("image_position_x", 50),
            "image_position_y": background.get("image_position_y", 50),
            "overlay_opacity": background.get("overlay_opacity", 0.3)
        }
    }


@router.post("")
async def create_brand_background(data: BrandBackgroundCreate, request: Request):
    """Create or update a brand background (admin only)"""
    db = get_db()
    await verify_admin(request, db)
    
    # Check if brand already has a background
    existing = await db.brand_backgrounds.find_one({"brand": data.brand})
    
    if existing:
        # Update existing
        await db.brand_backgrounds.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "image_url": data.image_url,
                    "text_color": data.text_color,
                    "image_position_x": data.image_position_x,
                    "image_position_y": data.image_position_y,
                    "overlay_opacity": data.overlay_opacity,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return {"success": True, "message": f"Background updated for {data.brand}", "id": str(existing["_id"])}
    
    # Create new
    doc = {
        "brand": data.brand,
        "image_url": data.image_url,
        "text_color": data.text_color,
        "image_position_x": data.image_position_x,
        "image_position_y": data.image_position_y,
        "overlay_opacity": data.overlay_opacity,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.brand_backgrounds.insert_one(doc)
    
    logger.info(f"Created brand background for {data.brand}")
    
    return {"success": True, "message": f"Background created for {data.brand}", "id": str(result.inserted_id)}


@router.put("/{brand}")
async def update_brand_background(brand: str, data: BrandBackgroundUpdate, request: Request):
    """Update a brand background (admin only)"""
    db = get_db()
    await verify_admin(request, db)
    
    existing = await db.brand_backgrounds.find_one({"brand": brand})
    if not existing:
        raise HTTPException(status_code=404, detail=f"No background found for brand {brand}")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.image_url is not None:
        update_data["image_url"] = data.image_url
    if data.text_color is not None:
        update_data["text_color"] = data.text_color
    if data.image_position_x is not None:
        update_data["image_position_x"] = data.image_position_x
    if data.image_position_y is not None:
        update_data["image_position_y"] = data.image_position_y
    if data.overlay_opacity is not None:
        update_data["overlay_opacity"] = data.overlay_opacity
    
    await db.brand_backgrounds.update_one(
        {"_id": existing["_id"]},
        {"$set": update_data}
    )
    
    return {"success": True, "message": f"Background updated for {brand}"}


@router.delete("/{brand}")
async def delete_brand_background(brand: str, request: Request):
    """Delete a brand background (admin only)"""
    db = get_db()
    await verify_admin(request, db)
    
    result = await db.brand_backgrounds.delete_one({"brand": brand})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"No background found for brand {brand}")
    
    logger.info(f"Deleted brand background for {brand}")
    
    return {"success": True, "message": f"Background deleted for {brand}"}
