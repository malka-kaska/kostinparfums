from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Query
from bson import ObjectId
from typing import Optional
from utils.auth import get_current_user, get_current_user_optional
from models.schemas import CODOrderRequest
from utils.invbg_integration import create_official_invoice
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
    
    # SEC-001 FIX: Validate prices from database, not client
    total_amount = 0.0
    items_for_db = []
    
    for item in order_data.items:
        product_id = item.get('id', '')
        item_qty = int(item.get('quantity', 1))
        
        if not product_id:
            raise HTTPException(status_code=400, detail="Product ID is required")
        
        # Fetch actual price from database
        try:
            product = await db.products.find_one({"_id": ObjectId(product_id)})
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid product ID: {product_id}")
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {product_id}")
        
        if not product.get("is_active", True) or not product.get("is_visible", True):
            raise HTTPException(status_code=400, detail=f"Product not available: {product.get('name', product_id)}")
        
        # Use database price, not client-supplied price
        db_price = float(product.get("price", 0))
        item_total = db_price * item_qty
        total_amount += item_total
        
        items_for_db.append({
            "product_id": product_id,
            "name": product.get('name', ''),
            "price": db_price,  # Use DB price
            "quantity": item_qty,
            "image": product.get('images', [item.get('image', '')])[0] if product.get('images') else item.get('image', ''),
        })
    
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid order total")
    
    # Validate discount code if provided
    discount_code = order_data.discount_code
    discount_amount = 0.0
    
    if discount_code:
        # Verify discount code is valid and calculate actual discount
        discount_doc = await db.discount_codes.find_one({
            "code": discount_code.upper().strip(),
            "is_active": True
        })
        
        if discount_doc:
            # Check usage limits
            if discount_doc.get("max_uses") and discount_doc.get("current_uses", 0) >= discount_doc.get("max_uses"):
                discount_code = None  # Code exhausted
            elif discount_doc.get("expires_at") and datetime.now(timezone.utc) > discount_doc.get("expires_at"):
                discount_code = None  # Code expired
            else:
                # Calculate discount from server-side
                if discount_doc.get("discount_type") == "percentage":
                    discount_amount = total_amount * (discount_doc.get("discount_value", 0) / 100)
                    max_discount = discount_doc.get("max_discount_amount")
                    if max_discount and discount_amount > max_discount:
                        discount_amount = max_discount
                else:
                    discount_amount = min(discount_doc.get("discount_value", 0), total_amount)
        else:
            discount_code = None  # Invalid code
    
    # Validate shipping cost from Speedy API (simplified - trust for now but could re-validate)
    shipping_cost = order_data.shipping_cost if order_data.shipping_cost and order_data.shipping_cost >= 0 else 0.0
    shipping_method = order_data.shipping_method if order_data.shipping_method else "speedy_office"
    
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
    
    # Final total includes shipping minus discount
    final_total = total_amount + shipping_cost - discount_amount
    if final_total < 0:
        final_total = 0
    
    logger.info(f"COD Order calculation: subtotal={total_amount}, shipping={shipping_cost}, discount={discount_amount}, final_total={final_total}")
    
    # Generate cancellation token for guest orders
    cancellation_token = secrets.token_urlsafe(32)
    
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
        "discount_code": discount_code,
        "discount_amount": discount_amount,
        "total": final_total,
        "payment_method": "cod",
        "payment_status": "pending",
        "status": "pending",
        "cancellation_token": cancellation_token,  # For guest cancellation
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
        logger.info(f"Attempting to create Speedy shipment for order {order_number}")
        try:
            from routes.speedy import create_shipment_for_order
            shipment_result = await create_shipment_for_order(order_doc)
            
            logger.info(f"Speedy shipment result for {order_number}: {shipment_result}")
            
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
            else:
                logger.error(f"Speedy shipment creation failed for {order_number}: {shipment_result}")
        except Exception as e:
            import traceback
            logger.error(f"Failed to auto-create Speedy shipment for order {order_number}: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
    else:
        logger.warning(f"No Speedy data for order {order_number}, skipping shipment creation")
    
    # Create official invoice in inv.bg for COD orders
    try:
        invoice_order = {
            **order_doc,
            "order_number": order_number,
            "tracking_number": tracking_number,
            "tracking_url": tracking_url
        }
        # Remove MongoDB _id
        invoice_order.pop("_id", None)
        
        invbg_result = await create_official_invoice(invoice_order, payment_method="cod")
        
        if invbg_result.get("success"):
            invbg_invoice_id = invbg_result.get("invoice_id")
            invbg_invoice_number = invbg_result.get("invoice_number")
            
            # Update order with inv.bg invoice info
            await db.orders.update_one(
                {"_id": order_doc["_id"]},
                {
                    "$set": {
                        "invbg_invoice_id": invbg_invoice_id,
                        "invbg_invoice_number": invbg_invoice_number,
                        "official_invoice_created": True
                    }
                }
            )
            logger.info(f"Official invoice #{invbg_invoice_number} created in inv.bg for COD order {order_number}")
        else:
            logger.warning(f"Inv.bg invoice creation failed for COD order {order_number}: {invbg_result.get('error')}")
    except Exception as e:
        logger.error(f"Failed to create inv.bg invoice for COD order {order_number}: {e}")
    
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
                tracking_url=tracking_url,
                discount_code=discount_code,
                discount_amount=discount_amount,
                subtotal=total_amount,
                shipping_cost=shipping_cost,
                order_id=str(order_doc["_id"]),
                cancellation_token=cancellation_token
            )
            logger.info(f"COD order confirmation email sent to {user_email}")
        except Exception as e:
            logger.error(f"Failed to send COD confirmation email: {e}")
    
    # Send admin notification email
    try:
        from utils.email_service import send_admin_new_order_notification
        await send_admin_new_order_notification(
            order_number=order_number,
            customer_name=user_name or order_doc["shipping_address"].get("full_name", ""),
            customer_email=user_email or "Гост",
            customer_phone=order_doc["shipping_address"].get("phone", ""),
            payment_method="cod",
            total=final_total,
            shipping_cost=shipping_cost,
            items=items_for_db,
            shipping_address=order_doc["shipping_address"],
            tracking_number=tracking_number
        )
    except Exception as e:
        logger.error(f"Failed to send admin new order notification: {e}")
    
    response = {
        "success": True,
        "order_id": str(order_doc["_id"]),
        "order_number": order_number,
        "subtotal": total_amount,
        "shipping_cost": shipping_cost,
        "discount_code": discount_code,
        "discount_amount": discount_amount,
        "total": final_total,
        "message": "Поръчката е приета успешно! Ще получите потвърждение по имейл."
    }
    
    # Apply discount code usage
    if discount_code:
        try:
            await db.discount_codes.update_one(
                {"code": discount_code.upper()},
                {
                    "$inc": {"times_used": 1},
                    "$push": {"used_by": user_id} if user_id else {},
                    "$set": {"last_used_at": datetime.now(timezone.utc)}
                }
            )
            logger.info(f"Discount code {discount_code} applied to order {order_number}")
        except Exception as e:
            logger.error(f"Failed to update discount code usage: {e}")
    
    if tracking_number:
        response["tracking_number"] = tracking_number
        response["tracking_url"] = tracking_url
    
    return response



# ============= Order Cancellation =============

class CancelOrderRequest:
    pass

from pydantic import BaseModel

class CancelOrderRequestModel(BaseModel):
    reason: str


@router.post("/{order_id}/cancel")
async def cancel_order_by_user(order_id: str, request: Request, cancel_request: CancelOrderRequestModel):
    """Cancel an order - for logged in users via dashboard"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    # Find order
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        order = await db.orders.find_one({"order_number": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify ownership
    if str(order.get("user_id")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    # Check if order can be cancelled (only pending or confirmed orders)
    status = order.get("status", "")
    if status in ["shipped", "delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status: {status}")
    
    # Update order status
    await db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "status": "cancellation_requested",
                "cancellation_reason": cancel_request.reason,
                "cancellation_requested_at": datetime.now(timezone.utc).isoformat(),
                "cancellation_requested_by": "customer"
            }
        }
    )
    
    # Send email to admin
    from utils.email_service import send_admin_cancellation_notification
    import asyncio
    
    asyncio.create_task(
        send_admin_cancellation_notification(
            order_number=order.get("order_number", str(order["_id"])),
            customer_name=order.get("user_name", "Unknown"),
            customer_email=order.get("user_email", ""),
            customer_phone=order.get("shipping_address", {}).get("phone", ""),
            reason=cancel_request.reason,
            total=order.get("total", 0),
            items=order.get("items", [])
        )
    )
    
    logger.info(f"Cancellation requested for order {order.get('order_number')} by user {user['email']}")
    
    return {
        "success": True,
        "message": "Cancellation request submitted. We will contact you shortly.",
        "message_bg": "Заявката за отказ е изпратена. Ще се свържем с Вас до минути."
    }


@router.post("/guest/{order_id}/cancel")
async def cancel_order_by_guest(order_id: str, request: Request, cancel_request: CancelOrderRequestModel):
    """Cancel an order - for guest users via email link with token"""
    db = request.app.state.db
    
    # Get token from query params
    from fastapi import Query
    token = request.query_params.get("token")
    
    if not token:
        raise HTTPException(status_code=400, detail="Cancellation token required")
    
    # Find order by cancellation token
    order = await db.orders.find_one({
        "$or": [
            {"_id": ObjectId(order_id) if len(order_id) == 24 else None},
            {"order_number": order_id}
        ],
        "cancellation_token": token
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or invalid token")
    
    # Check if order can be cancelled
    status = order.get("status", "")
    if status in ["shipped", "delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order with status: {status}")
    
    # Update order status
    await db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "status": "cancellation_requested",
                "cancellation_reason": cancel_request.reason,
                "cancellation_requested_at": datetime.now(timezone.utc).isoformat(),
                "cancellation_requested_by": "guest"
            }
        }
    )
    
    # Send email to admin
    from utils.email_service import send_admin_cancellation_notification
    import asyncio
    
    asyncio.create_task(
        send_admin_cancellation_notification(
            order_number=order.get("order_number", str(order["_id"])),
            customer_name=order.get("user_name", order.get("shipping_address", {}).get("full_name", "Guest")),
            customer_email=order.get("user_email", ""),
            customer_phone=order.get("shipping_address", {}).get("phone", ""),
            reason=cancel_request.reason,
            total=order.get("total", 0),
            items=order.get("items", [])
        )
    )
    
    logger.info(f"Guest cancellation requested for order {order.get('order_number')}")
    
    return {
        "success": True,
        "message": "Cancellation request submitted. We will contact you shortly.",
        "message_bg": "Заявката за отказ е изпратена. Ще се свържем с Вас до минути."
    }


@router.post("/admin/{order_id}/cancel")
async def admin_cancel_order(order_id: str, request: Request, cancel_request: CancelOrderRequestModel):
    """Cancel an order - admin only"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    # Verify admin
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find order
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        order = await db.orders.find_one({"order_number": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    await db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "status": "cancelled",
                "cancellation_reason": cancel_request.reason,
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
                "cancelled_by": "admin"
            }
        }
    )
    
    # Send cancellation email to customer
    from utils.email_service import send_order_cancelled_email
    import asyncio
    
    customer_email = order.get("user_email")
    if customer_email:
        asyncio.create_task(
            send_order_cancelled_email(
                to_email=customer_email,
                user_name=order.get("user_name", "Customer"),
                order_number=order.get("order_number", str(order["_id"])),
                reason=cancel_request.reason
            )
        )
    
    logger.info(f"Order {order.get('order_number')} cancelled by admin {user['email']}")
    
    return {
        "success": True,
        "message": "Order cancelled successfully"
    }



@router.post("/admin/{order_id}/create-shipment")
async def admin_create_shipment(order_id: str, request: Request):
    """Manually create Speedy shipment for an order - admin only"""
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    # Verify admin
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find order
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        order = await db.orders.find_one({"order_number": order_id})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if shipment already exists
    if order.get("tracking_number"):
        return {
            "success": True,
            "message": "Shipment already exists",
            "tracking_number": order.get("tracking_number"),
            "tracking_url": order.get("tracking_url")
        }
    
    # Check if speedy_data exists
    if not order.get("speedy_data") or not order.get("speedy_data", {}).get("city_id"):
        raise HTTPException(status_code=400, detail="Order doesn't have Speedy delivery data")
    
    # Create shipment
    try:
        from routes.speedy import create_shipment_for_order
        shipment_result = await create_shipment_for_order(order)
        
        if shipment_result and shipment_result.get("success"):
            tracking_number = shipment_result.get("tracking_number")
            tracking_url = shipment_result.get("tracking_url")
            
            # Update order with tracking info
            await db.orders.update_one(
                {"_id": order["_id"]},
                {
                    "$set": {
                        "tracking_number": tracking_number,
                        "tracking_url": tracking_url,
                        "shipment_id": shipment_result.get("shipment_id"),
                        "shipment_created_at": datetime.now(timezone.utc).isoformat(),
                        "status": "processing"
                    }
                }
            )
            
            logger.info(f"Admin manually created Speedy shipment for order {order.get('order_number')}: {tracking_number}")
            
            return {
                "success": True,
                "message": "Shipment created successfully",
                "tracking_number": tracking_number,
                "tracking_url": tracking_url
            }
        else:
            error_msg = shipment_result.get("error", "Unknown error") if shipment_result else "No response from Speedy"
            logger.error(f"Failed to create shipment for order {order.get('order_number')}: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to create shipment: {error_msg}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating shipment for order {order.get('order_number')}: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating shipment: {str(e)}")
