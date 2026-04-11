from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from bson import ObjectId
from utils.auth import get_current_user
from models.schemas import CartItemAdd, CartItemUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cart", tags=["cart"])


async def get_cart_with_products(db, user_id: str) -> dict:
    """Get user's cart and enrich items with current product data."""
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart or not cart.get("items"):
        return {"items": [], "total": 0, "item_count": 0}

    enriched_items = []
    total = 0
    for item in cart["items"]:
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        except Exception:
            continue
        if not product or not product.get("is_active", True):
            continue
        price = product.get("price", 0)
        qty = item["quantity"]
        enriched_items.append({
            "product_id": str(product["_id"]),
            "name": product.get("name", ""),
            "brand": product.get("brand", ""),
            "image": product.get("image", ""),
            "price": price,
            "stock": product.get("stock", 0),
            "quantity": qty,
            "subtotal": round(price * qty, 2),
        })
        total += price * qty

    return {
        "items": enriched_items,
        "total": round(total, 2),
        "item_count": sum(i["quantity"] for i in enriched_items),
    }


@router.get("")
async def get_cart(request: Request):
    db = request.app.state.db
    user = await get_current_user(request, db)
    user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])
    return await get_cart_with_products(db, user_id)


@router.post("/add")
async def add_to_cart(request: Request, data: CartItemAdd):
    db = request.app.state.db
    user = await get_current_user(request, db)
    user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])

    # Validate product exists
    try:
        product = await db.products.find_one({"_id": ObjectId(data.product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.get("stock", 0) < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        await db.carts.insert_one({
            "user_id": user_id,
            "items": [{"product_id": data.product_id, "quantity": data.quantity}],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        existing_item = next(
            (i for i in cart.get("items", []) if i["product_id"] == data.product_id), None
        )
        if existing_item:
            new_qty = existing_item["quantity"] + data.quantity
            if new_qty > product.get("stock", 0):
                raise HTTPException(status_code=400, detail="Insufficient stock")
            await db.carts.update_one(
                {"user_id": user_id, "items.product_id": data.product_id},
                {"$set": {
                    "items.$.quantity": new_qty,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
        else:
            await db.carts.update_one(
                {"user_id": user_id},
                {"$push": {"items": {"product_id": data.product_id, "quantity": data.quantity}},
                 "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
            )

    return await get_cart_with_products(db, user_id)


@router.put("/update/{product_id}")
async def update_cart_item(request: Request, product_id: str, data: CartItemUpdate):
    db = request.app.state.db
    user = await get_current_user(request, db)
    user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])

    if data.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Product not found")
    if product and data.quantity > product.get("stock", 0):
        raise HTTPException(status_code=400, detail="Insufficient stock")

    result = await db.carts.update_one(
        {"user_id": user_id, "items.product_id": product_id},
        {"$set": {
            "items.$.quantity": data.quantity,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not in cart")

    return await get_cart_with_products(db, user_id)


@router.delete("/remove/{product_id}")
async def remove_from_cart(request: Request, product_id: str):
    db = request.app.state.db
    user = await get_current_user(request, db)
    user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])

    await db.carts.update_one(
        {"user_id": user_id},
        {"$pull": {"items": {"product_id": product_id}},
         "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return await get_cart_with_products(db, user_id)


@router.delete("/clear")
async def clear_cart(request: Request):
    db = request.app.state.db
    user = await get_current_user(request, db)
    user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])

    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"items": [], "total": 0, "item_count": 0}
