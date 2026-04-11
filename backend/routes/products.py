from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Query
from bson import ObjectId
from typing import Optional
from models.schemas import ProductCreate, ProductUpdate, ProductResponse
from utils.auth import get_current_user
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/products", tags=["products"])


def product_doc_to_response(doc: dict) -> dict:
    resp = {
        "id": str(doc["_id"]) if "_id" in doc else doc.get("id", ""),
        "name": doc.get("name", ""),
        "brand": doc.get("brand", ""),
        "category": doc.get("category", ""),
        "price": doc.get("price", 0),
        "description": doc.get("description", ""),
        "image": doc.get("image", ""),
        "stock": doc.get("stock", 0),
        "is_active": doc.get("is_active", True),
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
    search: Optional[str] = None,
    sort: Optional[str] = "name",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=200),
):
    db = request.app.state.db
    query = {"is_active": True}

    if category:
        query["category"] = category
    if brand:
        query["brand"] = brand
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

    # Sort
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

    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    cursor = db.products.find(query).sort(sort_field, sort_dir).skip(skip).limit(limit)
    products = await cursor.to_list(limit)

    return {
        "products": [product_doc_to_response(p) for p in products],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if limit > 0 else 0,
    }


@router.get("/categories")
async def get_categories(request: Request):
    db = request.app.state.db
    pipeline = [
        {"$match": {"is_active": True}},
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
async def get_brands(request: Request, category: Optional[str] = None):
    db = request.app.state.db
    match = {"is_active": True}
    if category:
        match["category"] = category
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

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
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
