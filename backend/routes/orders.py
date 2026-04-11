from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Query
from bson import ObjectId
from typing import Optional
from utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orders", tags=["orders"])


def order_doc_to_response(doc: dict) -> dict:
    order = {
        "id": str(doc["_id"]) if "_id" in doc else doc.get("id", ""),
        "user_id": doc.get("user_id", ""),
        "user_email": doc.get("user_email", ""),
        "user_name": doc.get("user_name", ""),
        "items": doc.get("items", []),
        "total": doc.get("total", 0),
        "shipping_cost": doc.get("shipping_cost", 0),
        "status": doc.get("status", "pending"),
        "payment_status": doc.get("payment_status", "pending"),
        "session_id": doc.get("session_id", ""),
        "shipping_address": doc.get("shipping_address"),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }
    return order


@router.get("")
async def get_orders(
    request: Request,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    db = request.app.state.db
    user = await get_current_user(request, db)

    query = {}
    if user.get("role") != "admin":
        # Regular users only see their own orders
        user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])
        query["user_id"] = user_id
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = await db.orders.count_documents(query)
    cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    orders = await cursor.to_list(limit)

    return {
        "orders": [order_doc_to_response(o) for o in orders],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if limit > 0 else 0,
    }


@router.get("/{order_id}")
async def get_order(request: Request, order_id: str):
    db = request.app.state.db
    user = await get_current_user(request, db)

    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Regular users can only see their own orders
    if user.get("role") != "admin":
        user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])
        if order.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

    return order_doc_to_response(order)


@router.put("/{order_id}/status")
async def update_order_status(request: Request, order_id: str):
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    body = await request.json()
    new_status = body.get("status")
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

    try:
        result = await db.orders.find_one_and_update(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
            return_document=True,
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Order not found")
    if not result:
        raise HTTPException(status_code=404, detail="Order not found")

    logger.info(f"Order {order_id} status updated to {new_status}")
    return order_doc_to_response(result)
