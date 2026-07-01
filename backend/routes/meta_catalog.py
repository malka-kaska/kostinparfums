"""
Meta Catalog API Routes for KOSTIN
Endpoints for syncing products with Meta Ads Manager
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from typing import Optional
from bson import ObjectId
import logging

from utils.auth import get_current_user
from utils.meta_catalog import meta_catalog, transform_product_for_meta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/meta-catalog", tags=["meta-catalog"])


@router.get("/test")
async def test_meta_connection(request: Request):
    """Test Meta Catalog API connection"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await meta_catalog.test_connection()
    return result


@router.get("/status")
async def get_catalog_status(request: Request):
    """Get Meta Catalog status and product count"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get catalog info
    catalog_info = await meta_catalog.test_connection()
    
    # Get local product count
    local_count = await db.products.count_documents({"is_visible": True, "is_active": True})
    
    return {
        "meta_catalog": catalog_info.get("catalog") if catalog_info.get("success") else None,
        "local_product_count": local_count,
        "connection_status": "connected" if catalog_info.get("success") else "error",
        "error": catalog_info.get("error") if not catalog_info.get("success") else None
    }


@router.get("/products")
async def get_meta_catalog_products(request: Request, limit: int = 25):
    """Get products currently in Meta Catalog"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await meta_catalog.get_catalog_products(limit=limit)
    return result


@router.post("/sync/product/{product_id}")
async def sync_single_product(request: Request, product_id: str):
    """Sync a single product to Meta Catalog"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get product from database
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Convert ObjectId to string
    product["_id"] = str(product["_id"])
    
    # Sync to Meta
    result = await meta_catalog.upsert_product(product)
    
    if result.get("success"):
        # Update product with sync timestamp
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"meta_synced_at": result.get("result", {}).get("id"), "meta_last_sync": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()}}
        )
    
    return result


@router.post("/sync/all")
async def sync_all_products(request: Request, background_tasks: BackgroundTasks):
    """Sync all visible products to Meta Catalog (background task)"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get count of products to sync
    count = await db.products.count_documents({"is_visible": True, "is_active": True})
    
    if count == 0:
        return {"success": True, "message": "No products to sync", "total": 0}
    
    # Start background sync
    async def do_sync():
        cursor = db.products.find({"is_visible": True, "is_active": True})
        products = []
        async for p in cursor:
            p["_id"] = str(p["_id"])
            products.append(p)
        
        result = await meta_catalog.full_catalog_sync(products)
        logger.info(f"Full catalog sync completed: {result}")
    
    background_tasks.add_task(do_sync)
    
    return {
        "success": True,
        "message": f"Sync started for {count} products",
        "total_products": count,
        "status": "processing"
    }


@router.post("/sync/batch")
async def sync_batch_products(request: Request):
    """Sync a batch of products (for immediate sync after bulk edits)"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    body = await request.json()
    product_ids = body.get("product_ids", [])
    
    if not product_ids:
        raise HTTPException(status_code=400, detail="No product IDs provided")
    
    if len(product_ids) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 products per batch")
    
    # Get products
    object_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]
    cursor = db.products.find({"_id": {"$in": object_ids}})
    
    products = []
    async for p in cursor:
        p["_id"] = str(p["_id"])
        products.append(p)
    
    if not products:
        return {"success": True, "message": "No valid products found", "synced": 0}
    
    # Build batch requests
    requests = []
    for product in products:
        meta_product = transform_product_for_meta(product)
        requests.append({
            "retailer_id": meta_product["retailer_id"],
            "method": "UPDATE",
            "data": meta_product
        })
    
    result = await meta_catalog.batch_sync(requests)
    
    return {
        "success": result.get("success"),
        "products_synced": len(products),
        "handle": result.get("handle"),
        "error": result.get("error")
    }


@router.delete("/product/{product_id}")
async def delete_product_from_catalog(request: Request, product_id: str):
    """Delete a product from Meta Catalog"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await meta_catalog.delete_product(product_id)
    return result


@router.get("/batch-status/{handle}")
async def check_batch_status(request: Request, handle: str):
    """Check status of a batch sync operation"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await meta_catalog.check_batch_status(handle)
    return result


# === Auto-sync hooks for product changes ===

async def on_product_created(db, product: dict):
    """Called when a new product is created - sync to Meta"""
    try:
        if product.get("is_visible") and product.get("is_active", True):
            product["_id"] = str(product["_id"]) if "_id" in product else product.get("id", "")
            result = await meta_catalog.upsert_product(product)
            logger.info(f"New product synced to Meta: {product.get('name')} - {result.get('success')}")
    except Exception as e:
        logger.error(f"Failed to sync new product to Meta: {e}")


async def on_product_updated(db, product_id: str, updates: dict):
    """Called when a product is updated - sync changes to Meta"""
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if product:
            product["_id"] = str(product["_id"])
            
            # Only sync if visible and active
            if product.get("is_visible") and product.get("is_active", True):
                result = await meta_catalog.upsert_product(product)
                logger.info(f"Updated product synced to Meta: {product.get('name')} - {result.get('success')}")
            else:
                # Product is now hidden - delete from Meta
                result = await meta_catalog.delete_product(str(product_id))
                logger.info(f"Hidden product removed from Meta: {product.get('name')}")
    except Exception as e:
        logger.error(f"Failed to sync updated product to Meta: {e}")


async def on_product_deleted(db, product_id: str):
    """Called when a product is deleted - remove from Meta"""
    try:
        result = await meta_catalog.delete_product(product_id)
        logger.info(f"Deleted product removed from Meta: {product_id} - {result.get('success')}")
    except Exception as e:
        logger.error(f"Failed to remove deleted product from Meta: {e}")
