from fastapi import APIRouter, Request, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from utils.auth import get_current_user
import secrets
import string
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/discounts", tags=["discounts"])


# Helper function to verify admin access
async def verify_admin(request: Request, db):
    """Verify the user is authenticated and has admin role"""
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ============ SCHEMAS ============

class DiscountCodeCreate(BaseModel):
    code: Optional[str] = None  # If not provided, will be auto-generated
    discount_type: str = "percentage"  # "percentage" or "fixed"
    discount_value: float  # Percentage (0-100) or fixed amount in EUR
    
    # What does the discount apply to
    applies_to: str = "all"  # "all", "product", "category", "collection", "brand"
    target_id: Optional[str] = None  # product_id, category name, collection slug, or brand name
    
    # Sale items exclusion
    exclude_sale_items: bool = False  # If True, code won't apply to products with original_price (already on sale)
    
    # Usage rules
    usage_type: str = "multi_use"  # "single_use" or "multi_use"
    usage_limit: Optional[int] = None  # Max uses for multi_use codes
    per_user_limit: int = 1  # How many times each user can use it
    
    # Order requirements
    min_order_amount: Optional[float] = None  # Minimum cart total
    max_discount_amount: Optional[float] = None  # Cap for percentage discounts
    
    # Validity period
    valid_from: Optional[str] = None  # ISO datetime string
    valid_until: Optional[str] = None  # ISO datetime string
    
    # Metadata
    description: Optional[str] = None
    is_active: bool = True


class DiscountCodeUpdate(BaseModel):
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    applies_to: Optional[str] = None
    target_id: Optional[str] = None
    exclude_sale_items: Optional[bool] = None  # New field
    usage_type: Optional[str] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    min_order_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ApplyDiscountRequest(BaseModel):
    code: str
    cart_total: float
    items: List[dict]  # [{product_id, category, brand, collections, price, quantity, original_price (optional)}]
    user_id: Optional[str] = None


# ============ HELPER FUNCTIONS ============

def generate_discount_code(length: int = 8) -> str:
    """Generate a random discount code like 'SAVE20XK'"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def serialize_discount(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict"""
    return {
        "id": str(doc["_id"]),
        "code": doc["code"],
        "discount_type": doc["discount_type"],
        "discount_value": doc["discount_value"],
        "applies_to": doc["applies_to"],
        "target_id": doc.get("target_id"),
        "target_name": doc.get("target_name"),
        "exclude_sale_items": doc.get("exclude_sale_items", False),
        "usage_type": doc["usage_type"],
        "usage_limit": doc.get("usage_limit"),
        "per_user_limit": doc.get("per_user_limit", 1),
        "times_used": doc.get("times_used", 0),
        "min_order_amount": doc.get("min_order_amount"),
        "max_discount_amount": doc.get("max_discount_amount"),
        "valid_from": doc.get("valid_from").isoformat() if doc.get("valid_from") else None,
        "valid_until": doc.get("valid_until").isoformat() if doc.get("valid_until") else None,
        "description": doc.get("description"),
        "is_active": doc.get("is_active", True),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
    }


# ============ ADMIN ENDPOINTS ============

@router.get("/admin/all")
async def get_all_discount_codes(request: Request):
    """Get all discount codes (admin only)"""
    db = request.app.state.db
    await verify_admin(request, db)  # SEC-002 FIX: Require admin auth
    
    codes = []
    cursor = db.discount_codes.find().sort("created_at", -1)
    async for doc in cursor:
        codes.append(serialize_discount(doc))
    
    return {"discount_codes": codes, "total": len(codes)}


@router.post("/admin/create")
async def create_discount_code(request: Request, data: DiscountCodeCreate):
    """Create a new discount code (admin only)"""
    db = request.app.state.db
    await verify_admin(request, db)  # SEC-002 FIX: Require admin auth
    
    # Generate code if not provided
    code = data.code.upper().strip() if data.code else generate_discount_code()
    
    # Check if code already exists
    existing = await db.discount_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail=f"Код '{code}' вече съществува")
    
    # Validate discount type and value
    if data.discount_type not in ["percentage", "fixed"]:
        raise HTTPException(status_code=400, detail="Невалиден тип отстъпка")
    
    if data.discount_type == "percentage" and (data.discount_value < 0 or data.discount_value > 100):
        raise HTTPException(status_code=400, detail="Процентът трябва да е между 0 и 100")
    
    if data.discount_value <= 0:
        raise HTTPException(status_code=400, detail="Стойността на отстъпката трябва да е положителна")
    
    # Validate applies_to
    valid_applies_to = ["all", "product", "category", "collection", "brand"]
    if data.applies_to not in valid_applies_to:
        raise HTTPException(status_code=400, detail="Невалиден обхват на отстъпката")
    
    # If applies to specific target, target_id is required
    if data.applies_to != "all" and not data.target_id:
        raise HTTPException(status_code=400, detail="Трябва да изберете конкретен продукт/категория/колекция/марка")
    
    # Get target name for display
    target_name = None
    if data.applies_to == "product" and data.target_id:
        product = await db.products.find_one({"_id": ObjectId(data.target_id)})
        if product:
            target_name = product.get("name")
    elif data.applies_to in ["category", "collection", "brand"] and data.target_id:
        target_name = data.target_id
    
    # Parse dates
    valid_from = None
    valid_until = None
    if data.valid_from:
        try:
            valid_from = datetime.fromisoformat(data.valid_from.replace('Z', '+00:00'))
        except ValueError:
            pass
    if data.valid_until:
        try:
            valid_until = datetime.fromisoformat(data.valid_until.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    # Create discount code document
    discount_doc = {
        "code": code,
        "discount_type": data.discount_type,
        "discount_value": data.discount_value,
        "applies_to": data.applies_to,
        "target_id": data.target_id,
        "target_name": target_name,
        "exclude_sale_items": data.exclude_sale_items,  # New field
        "usage_type": data.usage_type,
        "usage_limit": data.usage_limit,
        "per_user_limit": data.per_user_limit,
        "times_used": 0,
        "used_by": [],  # List of user_ids who used this code
        "min_order_amount": data.min_order_amount,
        "max_discount_amount": data.max_discount_amount,
        "valid_from": valid_from,
        "valid_until": valid_until,
        "description": data.description,
        "is_active": data.is_active,
        "created_at": datetime.now(timezone.utc),
    }
    
    result = await db.discount_codes.insert_one(discount_doc)
    discount_doc["_id"] = result.inserted_id
    
    logger.info(f"Discount code created: {code}")
    
    return {
        "success": True,
        "message": f"Код за отстъпка '{code}' е създаден успешно",
        "discount_code": serialize_discount(discount_doc)
    }


@router.put("/admin/{code_id}")
async def update_discount_code(request: Request, code_id: str, data: DiscountCodeUpdate):
    """Update a discount code (admin only)"""
    db = request.app.state.db
    await verify_admin(request, db)  # SEC-002 FIX: Require admin auth
    
    try:
        oid = ObjectId(code_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Невалиден ID")
    
    existing = await db.discount_codes.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Кодът не е намерен")
    
    update_data = {}
    
    if data.discount_type is not None:
        update_data["discount_type"] = data.discount_type
    if data.discount_value is not None:
        update_data["discount_value"] = data.discount_value
    if data.applies_to is not None:
        update_data["applies_to"] = data.applies_to
    if data.target_id is not None:
        update_data["target_id"] = data.target_id
    if data.exclude_sale_items is not None:
        update_data["exclude_sale_items"] = data.exclude_sale_items
    if data.usage_type is not None:
        update_data["usage_type"] = data.usage_type
    if data.usage_limit is not None:
        update_data["usage_limit"] = data.usage_limit
    if data.per_user_limit is not None:
        update_data["per_user_limit"] = data.per_user_limit
    if data.min_order_amount is not None:
        update_data["min_order_amount"] = data.min_order_amount
    if data.max_discount_amount is not None:
        update_data["max_discount_amount"] = data.max_discount_amount
    if data.description is not None:
        update_data["description"] = data.description
    if data.is_active is not None:
        update_data["is_active"] = data.is_active
    
    if data.valid_from is not None:
        try:
            update_data["valid_from"] = datetime.fromisoformat(data.valid_from.replace('Z', '+00:00'))
        except ValueError:
            update_data["valid_from"] = None
    
    if data.valid_until is not None:
        try:
            update_data["valid_until"] = datetime.fromisoformat(data.valid_until.replace('Z', '+00:00'))
        except ValueError:
            update_data["valid_until"] = None
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.discount_codes.update_one({"_id": oid}, {"$set": update_data})
    
    updated = await db.discount_codes.find_one({"_id": oid})
    
    return {
        "success": True,
        "message": "Кодът е обновен успешно",
        "discount_code": serialize_discount(updated)
    }


@router.delete("/admin/{code_id}")
async def delete_discount_code(request: Request, code_id: str):
    """Delete a discount code (admin only)"""
    db = request.app.state.db
    await verify_admin(request, db)  # SEC-002 FIX: Require admin auth
    
    try:
        oid = ObjectId(code_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Невалиден ID")
    
    result = await db.discount_codes.delete_one({"_id": oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Кодът не е намерен")
    
    return {"success": True, "message": "Кодът е изтрит успешно"}


@router.post("/admin/{code_id}/toggle")
async def toggle_discount_code(request: Request, code_id: str):
    """Toggle discount code active status (admin only)"""
    db = request.app.state.db
    await verify_admin(request, db)  # SEC-002 FIX: Require admin auth
    
    try:
        oid = ObjectId(code_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Невалиден ID")
    
    existing = await db.discount_codes.find_one({"_id": oid})
    if not existing:
        raise HTTPException(status_code=404, detail="Кодът не е намерен")
    
    new_status = not existing.get("is_active", True)
    await db.discount_codes.update_one(
        {"_id": oid},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"success": True, "is_active": new_status}


# ============ PUBLIC ENDPOINTS (for checkout) ============

@router.post("/validate")
async def validate_discount_code(request: Request, data: ApplyDiscountRequest):
    """Validate and calculate discount for a code"""
    db = request.app.state.db
    
    code = data.code.upper().strip()
    
    # Find the discount code
    discount = await db.discount_codes.find_one({"code": code})
    
    if not discount:
        raise HTTPException(status_code=404, detail="Невалиден код за отстъпка")
    
    # Check if active
    if not discount.get("is_active", True):
        raise HTTPException(status_code=400, detail="Този код вече не е активен")
    
    # Check validity period
    now = datetime.now(timezone.utc)
    
    if discount.get("valid_from") and now < discount["valid_from"]:
        raise HTTPException(status_code=400, detail="Този код все още не е валиден")
    
    if discount.get("valid_until") and now > discount["valid_until"]:
        raise HTTPException(status_code=400, detail="Този код е изтекъл")
    
    # Check usage limits
    if discount.get("usage_type") == "single_use" and discount.get("times_used", 0) > 0:
        raise HTTPException(status_code=400, detail="Този код вече е използван")
    
    if discount.get("usage_limit") and discount.get("times_used", 0) >= discount["usage_limit"]:
        raise HTTPException(status_code=400, detail="Този код е достигнал лимита за използване")
    
    # Check per-user limit
    if data.user_id and discount.get("per_user_limit"):
        user_uses = discount.get("used_by", []).count(data.user_id)
        if user_uses >= discount["per_user_limit"]:
            raise HTTPException(status_code=400, detail="Вече сте използвали този код максималния брой пъти")
    
    # Check minimum order amount
    if discount.get("min_order_amount") and data.cart_total < discount["min_order_amount"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Минималната сума за поръчка е €{discount['min_order_amount']:.2f}"
        )
    
    # Check if discount excludes sale items
    exclude_sale = discount.get("exclude_sale_items", False)
    
    # Calculate discount based on applies_to
    applicable_amount = 0
    applicable_items = []
    excluded_sale_items_count = 0
    
    def is_item_applicable(item):
        """Check if item matches the discount criteria"""
        nonlocal excluded_sale_items_count
        
        # First check if this is a sale item (has original_price > price)
        if exclude_sale:
            original_price = item.get("original_price")
            current_price = item.get("price", 0)
            if original_price and original_price > current_price:
                excluded_sale_items_count += 1
                return False
        
        return True
    
    if discount["applies_to"] == "all":
        for item in data.items:
            if is_item_applicable(item):
                applicable_amount += item["price"] * item["quantity"]
                applicable_items.append(item)
    elif discount["applies_to"] == "product":
        for item in data.items:
            if item.get("product_id") == discount["target_id"] and is_item_applicable(item):
                applicable_amount += item["price"] * item["quantity"]
                applicable_items.append(item)
    elif discount["applies_to"] == "category":
        for item in data.items:
            if item.get("category") == discount["target_id"] and is_item_applicable(item):
                applicable_amount += item["price"] * item["quantity"]
                applicable_items.append(item)
    elif discount["applies_to"] == "collection":
        for item in data.items:
            if discount["target_id"] in (item.get("collections") or []) and is_item_applicable(item):
                applicable_amount += item["price"] * item["quantity"]
                applicable_items.append(item)
    elif discount["applies_to"] == "brand":
        for item in data.items:
            if item.get("brand") == discount["target_id"] and is_item_applicable(item):
                applicable_amount += item["price"] * item["quantity"]
                applicable_items.append(item)
    
    if applicable_amount == 0:
        if excluded_sale_items_count > 0:
            raise HTTPException(
                status_code=400, 
                detail="Този код не важи за продукти с намаление. Добавете продукт на редовна цена."
            )
        raise HTTPException(status_code=400, detail="Кодът не се прилага за нито един продукт в кошницата")
    
    # Calculate discount amount
    if discount["discount_type"] == "percentage":
        discount_amount = applicable_amount * (discount["discount_value"] / 100)
        # Apply max discount cap if set
        if discount.get("max_discount_amount") and discount_amount > discount["max_discount_amount"]:
            discount_amount = discount["max_discount_amount"]
    else:  # fixed
        discount_amount = min(discount["discount_value"], applicable_amount)
    
    discount_amount = round(discount_amount, 2)
    
    response = {
        "valid": True,
        "code": code,
        "discount_type": discount["discount_type"],
        "discount_value": discount["discount_value"],
        "discount_amount": discount_amount,
        "applicable_items_count": len(applicable_items),
        "description": discount.get("description"),
        "message": f"Отстъпка от €{discount_amount:.2f} е приложена успешно!",
        "exclude_sale_items": exclude_sale,
    }
    
    # Add warning if some items were excluded
    if excluded_sale_items_count > 0:
        response["warning"] = f"Кодът не важи за {excluded_sale_items_count} продукт(а) с намаление."
    
    return response


@router.post("/apply")
async def apply_discount_code(request: Request, data: ApplyDiscountRequest):
    """Apply discount code (increment usage counter)"""
    db = request.app.state.db
    
    code = data.code.upper().strip()
    
    # Validate first
    discount = await db.discount_codes.find_one({"code": code})
    if not discount:
        raise HTTPException(status_code=404, detail="Невалиден код")
    
    # Increment usage
    update_ops = {
        "$inc": {"times_used": 1},
        "$set": {"last_used_at": datetime.now(timezone.utc)}
    }
    
    if data.user_id:
        update_ops["$push"] = {"used_by": data.user_id}
    
    await db.discount_codes.update_one({"code": code}, update_ops)
    
    return {"success": True, "message": "Кодът е приложен успешно"}
