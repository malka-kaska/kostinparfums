from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Query
from bson import ObjectId
from typing import Optional
from utils.auth import get_current_user, get_current_user_optional
from models.schemas import CODOrderRequest
import logging
import secrets

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/orders", tags=["orders"])


def order_doc_to_response(doc: dict) -> dict:
    order = {
        "id": str(doc["_id"]) if "_id" in doc else doc.get("id", ""),
        "order_number": doc.get("order_number", ""),
        "user_id": doc.get("user_id", ""),
        "user_email": doc.get("user_email", ""),
        "user_name": doc.get("user_name", ""),
        "items": doc.get("items", []),
        "total": doc.get("total", 0),
        "shipping_cost": doc.get("shipping_cost", 0),
        "status": doc.get("status", "pending"),
        "payment_method": doc.get("payment_method", "card"),
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


def generate_order_number() -> str:
    """Generate a unique order number like KOS-240623-XXXX"""
    date_part = datetime.now(timezone.utc).strftime("%y%m%d")
    random_part = secrets.token_hex(2).upper()
    return f"KOS-{date_part}-{random_part}"


@router.post("/cod")
async def create_cod_order(request: Request, order_data: CODOrderRequest):
    """Create a Cash on Delivery order"""
    db = request.app.state.db
    
    # Calculate total
    total_amount = 0.0
    items_for_db = []
    
    for item in order_data.items:
        item_price = float(item.get('price', 0))
        item_qty = int(item.get('quantity', 1))
        item_total = item_price * item_qty
        total_amount += item_total
        
        items_for_db.append({
            "product_id": item.get('id', ''),
            "name": item.get('name', ''),
            "price": item_price,
            "quantity": item_qty,
            "image": item.get('image', ''),
        })
    
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid order total")
    
    # Try to get user info if authenticated
    user_id = ""
    user_email = order_data.email or ""
    user_name = order_data.shipping_address.full_name
    
    try:
        user = await get_current_user_optional(request, db)
        if user:
            user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])
            user_email = user.get("email", user_email)
            user_name = user.get("name", user_name)
    except Exception:
        pass
    
    # Generate order number
    order_number = generate_order_number()
    
    # Get shipping cost from request or default
    shipping_cost = order_data.shipping_cost if order_data.shipping_cost else 0.0
    shipping_method = order_data.shipping_method if order_data.shipping_method else "speedy_office"
    
    # Final total includes shipping
    final_total = total_amount + shipping_cost
    
    # Create order document
    order_doc = {
        "order_number": order_number,
        "user_id": user_id,
        "user_email": user_email,
        "user_name": user_name,
        "items": items_for_db,
        "subtotal": total_amount,
        "shipping_cost": shipping_cost,
        "shipping_method": shipping_method,
        "total": final_total,
        "payment_method": "cod",
        "payment_status": "pending",
        "status": "pending",
        "shipping_address": {
            "full_name": order_data.shipping_address.full_name,
            "phone": order_data.shipping_address.phone,
            "address": order_data.shipping_address.address,
            "city": order_data.shipping_address.city or "",
            "postal_code": order_data.shipping_address.postal_code or "",
            "notes": order_data.shipping_address.notes or "",
            "office_id": order_data.shipping_address.office_id,
            "office_name": order_data.shipping_address.office_name,
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Add Speedy data if provided
    if order_data.speedy_data:
        order_doc["speedy_data"] = {
            "city_id": order_data.speedy_data.city_id,
            "city_name": order_data.speedy_data.city_name,
            "office_id": order_data.speedy_data.office_id,
            "office_name": order_data.speedy_data.office_name,
            "delivery_type": order_data.speedy_data.delivery_type,
            "address": order_data.speedy_data.address,
        }
    
    result = await db.orders.insert_one(order_doc)
    order_doc["_id"] = result.inserted_id
    
    logger.info(f"COD Order created: {order_number} for {user_email or 'guest'}")
    
    # Update product popularity scores
    for item in items_for_db:
        try:
            await db.products.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"popularity_score": item["quantity"]}}
            )
        except Exception:
            pass
    
    # Auto-create Speedy shipment if speedy_data is available
    tracking_number = None
    tracking_url = None
    if order_data.speedy_data and order_data.speedy_data.city_id:
        try:
            from routes.speedy import create_shipment_for_order
            shipment_result = await create_shipment_for_order(order_doc)
            
            if shipment_result and shipment_result.get("success"):
                tracking_number = shipment_result.get("tracking_number")
                tracking_url = shipment_result.get("tracking_url")
                
                # Update order with tracking info
                await db.orders.update_one(
                    {"_id": order_doc["_id"]},
                    {
                        "$set": {
                            "tracking_number": tracking_number,
                            "tracking_url": tracking_url,
                            "shipment_id": shipment_result.get("shipment_id"),
                            "shipment_created_at": datetime.now(timezone.utc).isoformat(),
                            "status": "processing"  # Update status to processing
                        }
                    }
                )
                logger.info(f"Auto-created Speedy shipment for COD order {order_number}: {tracking_number}")
        except Exception as e:
            logger.error(f"Failed to auto-create Speedy shipment for order {order_number}: {e}")
    
    # Send confirmation email
    if user_email:
        try:
            from utils.email_service import send_cod_order_confirmation
            await send_cod_order_confirmation(
                to_email=user_email,
                order_number=order_number,
                items=items_for_db,
                total=final_total,
                shipping_address=order_doc["shipping_address"],
                tracking_number=tracking_number,
                tracking_url=tracking_url
            )
            logger.info(f"COD order confirmation email sent to {user_email}")
        except Exception as e:
            logger.error(f"Failed to send COD confirmation email: {e}")
    
    response = {
        "success": True,
        "order_id": str(order_doc["_id"]),
        "order_number": order_number,
        "subtotal": total_amount,
        "shipping_cost": shipping_cost,
        "total": final_total,
        "message": "Поръчката е приета успешно! Ще получите потвърждение по имейл."
    }
    
    if tracking_number:
        response["tracking_number"] = tracking_number
        response["tracking_url"] = tracking_url
    
    return response

