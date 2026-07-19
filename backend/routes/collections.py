from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Depends
from bson import ObjectId
from typing import List
import logging
import re

from models.schemas import CollectionCreate, CollectionUpdate, CollectionResponse
from utils.auth import get_current_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/collections", tags=["collections"])


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '_', text)
    return text


def collection_to_response(doc: dict, product_count: int = 0) -> dict:
    """Convert MongoDB document to response format"""
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "name_en": doc.get("name_en"),
        "name_bg": doc.get("name_bg") or doc.get("name", ""),
        "slug": doc.get("slug", ""),
        "description": doc.get("description"),
        "description_en": doc.get("description_en"),
        "banner_image": doc.get("banner_image"),
        "is_system": doc.get("is_system", False),
        "is_active": doc.get("is_active", True),
        "show_in_nav": doc.get("show_in_nav", False),
        "product_count": product_count,
        "created_at": doc.get("created_at", ""),
    }


@router.get("")
async def get_collections(request: Request, include_counts: bool = True):
    """Get all collections with optional product counts"""
    db = request.app.state.db
    
    collections = await db.collections.find({"is_active": True}).sort("created_at", 1).to_list(100)
    
    result = []
    for col in collections:
        count = 0
        if include_counts:
            count = await db.products.count_documents({
                "collections": col["slug"],
                "is_active": True,
                "is_visible": True
            })
        result.append(collection_to_response(col, count))
    
    return result


@router.get("/all")
async def get_all_collections(request: Request, admin: dict = Depends(get_current_admin)):
    """Get all collections including inactive (admin only)"""
    db = request.app.state.db
    
    collections = await db.collections.find().sort("created_at", 1).to_list(100)
    
    result = []
    for col in collections:
        count = await db.products.count_documents({"collections": col["slug"]})
        result.append(collection_to_response(col, count))
    
    return result


@router.get("/{collection_id}")
async def get_collection(request: Request, collection_id: str):
    """Get a single collection by ID"""
    db = request.app.state.db
    
    try:
        collection = await db.collections.find_one({"_id": ObjectId(collection_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid collection ID")
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    count = await db.products.count_documents({
        "collections": collection["slug"],
        "is_active": True,
        "is_visible": True
    })
    
    return collection_to_response(collection, count)


@router.post("")
async def create_collection(
    request: Request,
    data: CollectionCreate,
    admin: dict = Depends(get_current_admin)
):
    """Create a new collection (admin only)"""
    db = request.app.state.db
    
    # Check if slug already exists
    existing = await db.collections.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this slug already exists")
    
    doc = {
        "name": data.name,
        "name_en": data.name_en,
        "name_bg": data.name_bg or data.name,
        "slug": data.slug,
        "description": data.description,
        "description_en": data.description_en,
        "banner_image": data.banner_image,
        "is_system": data.is_system,
        "is_active": data.is_active,
        "show_in_nav": data.show_in_nav,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    result = await db.collections.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    # If show_in_nav is True, also add to nav_collections
    if data.show_in_nav:
        await db.nav_collections.insert_one({
            "slug": data.slug,
            "name": data.name_en or data.name,
            "name_bg": data.name_bg or data.name,
            "path": f"/products?collection={data.slug}",
            "is_active": True,
            "order": 10
        })
    
    logger.info(f"Created collection: {data.name} ({data.slug})")
    return collection_to_response(doc)


@router.put("/{collection_id}")
async def update_collection(
    request: Request,
    collection_id: str,
    data: CollectionUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update a collection (admin only)"""
    db = request.app.state.db
    
    try:
        collection = await db.collections.find_one({"_id": ObjectId(collection_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid collection ID")
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if update_data:
        await db.collections.update_one(
            {"_id": ObjectId(collection_id)},
            {"$set": update_data}
        )
    
    updated = await db.collections.find_one({"_id": ObjectId(collection_id)})
    return collection_to_response(updated)


@router.delete("/{collection_id}")
async def delete_collection(
    request: Request,
    collection_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Delete a collection (admin only, non-system collections only)"""
    db = request.app.state.db
    
    try:
        collection = await db.collections.find_one({"_id": ObjectId(collection_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid collection ID")
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection.get("is_system", False):
        raise HTTPException(status_code=400, detail="Cannot delete system collections")
    
    # Remove this collection from all products
    slug = collection["slug"]
    await db.products.update_many(
        {"collections": slug},
        {"$pull": {"collections": slug}}
    )
    
    # Ensure products without any collection get "all_products"
    await db.products.update_many(
        {"collections": {"$size": 0}},
        {"$set": {"collections": ["all_products"]}}
    )
    
    await db.collections.delete_one({"_id": ObjectId(collection_id)})
    
    logger.info(f"Deleted collection: {collection['name']} ({slug})")
    return {"message": "Collection deleted successfully"}


@router.post("/{collection_id}/toggle")
async def toggle_collection(
    request: Request,
    collection_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Toggle collection active status (admin only)"""
    db = request.app.state.db
    
    try:
        collection = await db.collections.find_one({"_id": ObjectId(collection_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid collection ID")
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    new_status = not collection.get("is_active", True)
    
    await db.collections.update_one(
        {"_id": ObjectId(collection_id)},
        {"$set": {"is_active": new_status}}
    )
    
    return {"is_active": new_status}


@router.post("/{collection_id}/toggle-nav")
async def toggle_collection_nav(
    request: Request,
    collection_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Toggle collection show_in_nav status (admin only)"""
    db = request.app.state.db
    
    try:
        collection = await db.collections.find_one({"_id": ObjectId(collection_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid collection ID")
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    new_status = not collection.get("show_in_nav", False)
    
    await db.collections.update_one(
        {"_id": ObjectId(collection_id)},
        {"$set": {"show_in_nav": new_status}}
    )
    
    # If enabling, also add to nav_collections
    if new_status:
        existing_nav = await db.nav_collections.find_one({"slug": collection["slug"]})
        if not existing_nav:
            await db.nav_collections.insert_one({
                "slug": collection["slug"],
                "name": collection.get("name_en") or collection.get("name"),
                "name_bg": collection.get("name_bg") or collection.get("name"),
                "path": f"/products?collection={collection['slug']}",
                "is_active": True,
                "order": 10
            })
    else:
        # If disabling, remove from nav_collections
        await db.nav_collections.delete_one({"slug": collection["slug"]})
    
    return {"show_in_nav": new_status}
