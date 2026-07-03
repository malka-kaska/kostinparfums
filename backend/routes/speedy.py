"""
Speedy Bulgaria API Integration
- Office lookup
- Price calculation
- Shipment creation (waybill)
"""
import os
import httpx
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional, List
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speedy", tags=["speedy"])


# Helper function to verify admin access
async def verify_admin_speedy(request: Request, db):
    """Verify the user is authenticated and has admin role"""
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# Speedy API configuration
SPEEDY_API_URL = os.environ.get("SPEEDY_API_URL", "https://api.speedy.bg/v1")
SPEEDY_USERNAME = os.environ.get("SPEEDY_USERNAME", "")
SPEEDY_PASSWORD = os.environ.get("SPEEDY_PASSWORD", "")
SPEEDY_SENDER_CITY = os.environ.get("SPEEDY_SENDER_CITY", "Варна")
SPEEDY_SENDER_ADDRESS = os.environ.get("SPEEDY_SENDER_ADDRESS", "")
SPEEDY_SENDER_PHONE = os.environ.get("SPEEDY_SENDER_PHONE", "+359889567870")
SPEEDY_CLIENT_ID = 208341137000  # Our Speedy client ID

# Default service IDs
SERVICE_TO_OFFICE = 505  # Standard delivery to office
SERVICE_TO_ADDRESS = 505  # Standard delivery to address


def get_auth_payload():
    """Get base authentication payload for Speedy API"""
    return {
        "userName": SPEEDY_USERNAME,
        "password": SPEEDY_PASSWORD,
        "language": "BG"
    }


async def speedy_request(endpoint: str, payload: dict) -> dict:
    """Make a request to Speedy API"""
    url = f"{SPEEDY_API_URL}/{endpoint}"
    full_payload = {**get_auth_payload(), **payload}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, json=full_payload)
            data = response.json()
            
            if "error" in data:
                logger.error(f"Speedy API error: {data['error']}")
                raise HTTPException(status_code=400, detail=data["error"].get("message", "Speedy API error"))
            
            return data
        except httpx.RequestError as e:
            logger.error(f"Speedy API request failed: {e}")
            raise HTTPException(status_code=503, detail="Speedy API unavailable")


# ============= City/Site Lookup =============

@router.get("/cities")
async def search_cities(name: str = Query(..., min_length=2)):
    """Search for cities by name"""
    try:
        data = await speedy_request("location/site", {
            "name": name,
            "countryId": 100  # Bulgaria
        })
        
        sites = data.get("sites", [])
        return {
            "cities": [
                {
                    "id": site["id"],
                    "name": site["name"],
                    "postCode": site.get("postCode", ""),
                    "type": site.get("type", ""),
                    "municipality": site.get("municipality", ""),
                    "region": site.get("region", "")
                }
                for site in sites[:20]  # Limit to 20 results
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching cities: {e}")
        raise HTTPException(status_code=500, detail="Failed to search cities")


# ============= Office Lookup =============

@router.get("/offices")
async def get_offices(city_id: int = Query(..., alias="cityId")):
    """Get list of Speedy offices in a city"""
    try:
        data = await speedy_request("location/office", {
            "siteId": city_id
        })
        
        offices = data.get("offices", [])
        return {
            "offices": [
                {
                    "id": office["id"],
                    "name": office["name"],
                    "address": office.get("address", {}).get("fullAddressString", ""),
                    "workingTimeFrom": office.get("workingTimeFrom", ""),
                    "workingTimeTo": office.get("workingTimeTo", ""),
                    "type": office.get("type", "OFFICE"),  # OFFICE or APT (automat)
                }
                for office in offices
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting offices: {e}")
        raise HTTPException(status_code=500, detail="Failed to get offices")


# ============= Price Calculation =============

class CalculatePriceRequest(BaseModel):
    recipient_city_id: int
    recipient_office_id: Optional[int] = None  # For office delivery
    recipient_address: Optional[str] = None  # For address delivery
    recipient_post_code: Optional[str] = None
    weight: float = 0.5  # Default weight in kg
    delivery_type: str = "OFFICE"  # OFFICE or ADDRESS
    payment_method: str = "cod"  # cod or card - affects COD premium fee
    order_subtotal: float = 0  # For COD calculation (product cost, not including shipping)


@router.post("/calculate")
async def calculate_price(request: CalculatePriceRequest):
    """Calculate shipping price"""
    try:
        # Build recipient based on delivery type
        recipient = {
            "privatePerson": True,  # Customer is always private person
        }
        
        if request.delivery_type == "OFFICE" and request.recipient_office_id:
            recipient["siteId"] = request.recipient_city_id
            recipient["pickupOfficeId"] = request.recipient_office_id
        elif request.delivery_type == "ADDRESS":
            # For address delivery, we need addressLocation structure
            recipient["addressLocation"] = {
                "siteId": request.recipient_city_id,
                "addressNote": request.recipient_address or ""
            }
        
        # Build calculation payload
        # IMPORTANT: Use clientId for sender to match actual shipment creation
        # This ensures calculate price matches the real shipment price
        service_config = {
            "serviceIds": [SERVICE_TO_OFFICE if request.delivery_type == "OFFICE" else SERVICE_TO_ADDRESS],
            "autoAdjustPickupDate": True
        }
        
        # If payment method is COD, add COD service to calculate the codPremium fee
        # This fee is charged when Speedy collects cash on delivery
        if request.payment_method == "cod" and request.order_subtotal > 0:
            service_config["additionalServices"] = {
                "cod": {
                    "amount": request.order_subtotal,  # The amount Speedy will collect (product cost only)
                    "processingType": "CASH"
                }
            }
        
        calc_payload = {
            "sender": {
                "clientId": SPEEDY_CLIENT_ID,  # Use clientId to match actual shipment
                "phone1": {"number": SPEEDY_SENDER_PHONE}
            },
            "recipient": recipient,
            "service": service_config,
            "content": {
                "parcelsCount": 1,
                "totalWeight": request.weight,
                "contents": "Парфюми",
                "package": "BOX"
            },
            "payment": {
                "courierServicePayer": "RECIPIENT"  # Customer pays Speedy directly
            }
        }
        
        data = await speedy_request("calculate", calc_payload)
        
        # Extract price information from calculations array
        calculations = data.get("calculations", [])
        if not calculations:
            raise HTTPException(status_code=500, detail="No price calculation returned")
        
        calc = calculations[0]
        price = calc.get("price", {})
        total = price.get("total", 0)
        currency = price.get("currency", "EUR")
        
        # Convert to BGN if needed (1 EUR ≈ 1.95583 BGN)
        total_bgn = round(total * 1.95583, 2) if currency == "EUR" else total
        total_eur = total if currency == "EUR" else round(total / 1.95583, 2)
        
        return {
            "price_bgn": total_bgn,
            "price_eur": total_eur,
            "currency": currency,
            "delivery_type": request.delivery_type,
            "pickup_date": calc.get("pickupDate"),
            "delivery_deadline": calc.get("deliveryDeadline"),
            "details": {
                "base": price.get("amount", 0),
                "vat": price.get("vat", 0)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating price: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate price: {str(e)}")


# ============= Create Shipment (Waybill) =============

class RecipientInfo(BaseModel):
    name: str
    phone: str
    city_id: int
    city_name: str
    office_id: Optional[int] = None
    address: Optional[str] = None
    post_code: Optional[str] = None
    email: Optional[str] = None  # Email on recipient for waybill


class FiscalReceiptItem(BaseModel):
    """Item for fiscal receipt (касов бон)"""
    name: str
    quantity: int = 1
    unit_price: float
    vat_percent: float = 20.0  # 20% VAT in Bulgaria


class CreateShipmentRequest(BaseModel):
    order_number: str
    recipient: RecipientInfo
    delivery_type: str = "OFFICE"  # OFFICE or ADDRESS
    weight: float = 0.5
    cod_amount: Optional[float] = None  # Cash on delivery amount (if COD payment)
    order_total: Optional[float] = None  # Total order amount in EUR (for determining who pays shipping)
    shipping_cost: Optional[float] = None  # Shipping cost to include in fiscal receipt
    contents: str = "Парфюми"
    include_return_voucher: bool = True  # Include 14-day return voucher
    fiscal_receipt_items: Optional[List[FiscalReceiptItem]] = None  # Items for касов бон

# Free shipping threshold in EUR
FREE_SHIPPING_THRESHOLD = 90.0


async def _create_shipment_internal(shipment_data: CreateShipmentRequest) -> dict:
    """
    Internal function to create a shipment (waybill) in Speedy system.
    Used for automatic shipment creation from orders - no auth required.
    """
    try:
        # Build recipient based on delivery type
        recipient = {
            "phone1": {"number": shipment_data.recipient.phone},
            "clientName": shipment_data.recipient.name,
            "privatePerson": True,
        }
        
        # Add email if provided
        if shipment_data.recipient.email:
            recipient["email"] = shipment_data.recipient.email
        
        if shipment_data.delivery_type == "OFFICE" and shipment_data.recipient.office_id:
            recipient["siteId"] = shipment_data.recipient.city_id
            recipient["pickupOfficeId"] = shipment_data.recipient.office_id
        elif shipment_data.delivery_type == "ADDRESS":
            # For address delivery use addressLocation structure
            recipient["addressLocation"] = {
                "siteId": shipment_data.recipient.city_id,
                "addressNote": shipment_data.recipient.address or ""
            }
        else:
            recipient["siteId"] = shipment_data.recipient.city_id
        
        # Determine who pays for courier service:
        # - Orders >= 90 EUR: Free shipping (SENDER pays Speedy)
        # - Orders < 90 EUR: Customer pays (RECIPIENT pays Speedy directly)
        # 
        # IMPORTANT: COD amount contains ONLY product cost, NOT shipping!
        # Speedy collects shipping fee directly from customer when courierServicePayer = RECIPIENT
        order_total = shipment_data.order_total or 0
        shipping_payer = "SENDER" if order_total >= FREE_SHIPPING_THRESHOLD else "RECIPIENT"
        
        shipment_payload = {
            "sender": {
                "clientId": SPEEDY_CLIENT_ID,
                "phone1": {"number": SPEEDY_SENDER_PHONE}
            },
            "recipient": recipient,
            "service": {
                "serviceId": SERVICE_TO_OFFICE if shipment_data.delivery_type == "OFFICE" else SERVICE_TO_ADDRESS,
                "autoAdjustPickupDate": True
            },
            "content": {
                "parcelsCount": 1,
                "totalWeight": shipment_data.weight,
                "contents": shipment_data.contents,
                "package": "BOX"
            },
            "payment": {
                "courierServicePayer": shipping_payer
            },
            "ref1": shipment_data.order_number  # Link to our order
        }
        
        logger.info(f"Shipment for order {shipment_data.order_number}: order_total={order_total} EUR, courier payer={shipping_payer}")
        
        # Add COD with fiscal receipt (касов бон) if applicable
        # ВАЖНО: При наложен платеж ВИНАГИ трябва да има касов бон!
        # КРИТИЧНО: sum(amountWithVat) ТРЯБВА да е ТОЧНО равна на cod_amount!
        if shipment_data.cod_amount and shipment_data.cod_amount > 0:
            cod_amount = round(shipment_data.cod_amount, 2)
            cod_service = {
                "amount": cod_amount,
                "processingType": "CASH"
            }
            
            # Add fiscal receipt items for касов бон - ЗАДЪЛЖИТЕЛНО при COD
            # Speedy изисква: description, vatGroup (кирилица "Б"), amount (без ДДС), amountWithVat (с ДДС)
            # COD amount ТРЯБВА да съвпада точно със сбора на amountWithVat от всички елементи
            fiscal_items = []
            fiscal_total = 0.0  # Track total to ensure it matches COD amount
            
            if shipment_data.fiscal_receipt_items:
                # Build fiscal items from the pre-calculated (already discounted) prices
                for item in shipment_data.fiscal_receipt_items:
                    # Price is already with VAT (20%) and already discounted proportionally
                    amount_with_vat = round(item.unit_price * item.quantity, 2)
                    amount_without_vat = round(amount_with_vat / 1.20, 2)
                    fiscal_total += amount_with_vat
                    
                    fiscal_items.append({
                        "description": item.name[:50],  # Max 50 chars
                        "vatGroup": "Б",  # Кирилица Б = 20% ДДС
                        "amount": amount_without_vat,
                        "amountWithVat": amount_with_vat
                    })
                
                # NOTE: We do NOT add shipping as a fiscal item anymore!
                # COD amount = products only (without shipping)
                # Speedy collects shipping fee directly from customer (courierServicePayer = RECIPIENT)
                
                # CRITICAL: Adjust for rounding errors to ensure fiscal_total == cod_amount exactly
                # This handles cases where proportional distribution + rounding causes small mismatches
                rounding_diff = round(cod_amount - fiscal_total, 2)
                if abs(rounding_diff) > 0 and abs(rounding_diff) <= 0.10 and fiscal_items:
                    # Apply the rounding adjustment to the last item (usually shipping, or last product)
                    last_item = fiscal_items[-1]
                    adjusted_with_vat = round(last_item["amountWithVat"] + rounding_diff, 2)
                    adjusted_without_vat = round(adjusted_with_vat / 1.20, 2)
                    last_item["amountWithVat"] = adjusted_with_vat
                    last_item["amount"] = adjusted_without_vat
                    fiscal_total = cod_amount  # Now matches exactly
                    logger.info(f"Applied rounding adjustment of {rounding_diff} EUR to last fiscal item")
            
            # Fallback: if no items provided, create a single generic item for the full COD amount
            if not fiscal_items:
                amount_with_vat = cod_amount
                amount_without_vat = round(amount_with_vat / 1.20, 2)
                fiscal_items.append({
                    "description": "Парфюм / Perfume",
                    "vatGroup": "Б",
                    "amount": amount_without_vat,
                    "amountWithVat": amount_with_vat
                })
                fiscal_total = amount_with_vat
            
            # ASSERTION: Verify fiscal_total matches cod_amount within 0.01 EUR tolerance
            fiscal_mismatch = abs(fiscal_total - cod_amount)
            if fiscal_mismatch > 0.01:
                error_msg = (
                    f"FISCAL RECEIPT MISMATCH for order {shipment_data.order_number}: "
                    f"cod_amount={cod_amount} EUR, fiscal_total={fiscal_total} EUR, "
                    f"difference={rounding_diff} EUR. "
                    f"Speedy API will reject this shipment. Check discount calculation logic."
                )
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
            
            cod_service["fiscalReceiptItems"] = fiscal_items
            logger.info(f"Adding {len(fiscal_items)} fiscal receipt items for касов бон (COD: {cod_amount}, fiscal_total: {fiscal_total}, match: {fiscal_mismatch <= 0.01})")
            
            # COD goes in service.additionalServices
            shipment_payload["service"]["additionalServices"] = {
                "cod": cod_service
            }
            
            # Also set declaredValueAmount for insurance purposes
            shipment_payload["payment"]["declaredValueAmount"] = shipment_data.cod_amount
        
        # Add return voucher for 14-day free returns (неразопакован продукт)
        if shipment_data.include_return_voucher:
            shipment_payload["service"]["returnVoucher"] = {
                "serviceId": SERVICE_TO_OFFICE,  # Return to office
                "payer": "SENDER",  # KOSTIN pays for return shipping
                "validityPeriod": 14  # 14 days validity
            }
            logger.info(f"Including 14-day return voucher for order {shipment_data.order_number}")
        
        logger.info(f"Creating Speedy shipment for order {shipment_data.order_number}, COD: {shipment_data.cod_amount}")
        
        data = await speedy_request("shipment", shipment_payload)
        
        # Extract shipment info
        shipment_id = data.get("id")
        parcels = data.get("parcels", [])
        price = data.get("price", {})
        
        tracking_number = parcels[0].get("id") if parcels else shipment_id
        
        logger.info(f"Speedy shipment created: {tracking_number} for order {shipment_data.order_number}")
        
        return {
            "success": True,
            "shipment_id": shipment_id,
            "tracking_number": str(tracking_number),
            "tracking_url": f"https://www.speedy.bg/bg/track-shipment?shipmentNumber={tracking_number}",
            "price_bgn": price.get("total", 0),
            "pickup_date": data.get("pickupDate"),
            "delivery_deadline": data.get("deliveryDeadline")
        }
    except Exception as e:
        logger.error(f"Error creating shipment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create shipment: {str(e)}")


@router.post("/shipment")
async def create_shipment(request: Request, shipment_data: CreateShipmentRequest):
    """Create a shipment (waybill) in Speedy system with COD, receipt, and return voucher support"""
    # SEC-003 FIX: Require admin auth for shipment creation
    db = request.app.state.db
    await verify_admin_speedy(request, db)
    
    # Use internal function for actual shipment creation
    return await _create_shipment_internal(shipment_data)


# ============= Helper function to validate and fix office ID =============

async def validate_and_fix_office_id(city_id: int, office_id: int, office_name: str) -> int:
    """
    Validate that the office ID exists for the given city.
    If not, try to find a matching office by name.
    Returns the valid office ID or None if not found.
    """
    try:
        # Get offices for the city
        data = await speedy_request("location/office", {"siteId": city_id})
        offices = data.get("offices", [])
        
        if not offices:
            logger.warning(f"No offices found for city_id {city_id}")
            return None
        
        # Check if the office_id exists
        office = next((o for o in offices if o["id"] == office_id), None)
        if office:
            logger.info(f"Office ID {office_id} is valid for city {city_id}")
            return office_id
        
        # Office ID not found - try to find by name
        logger.warning(f"Office ID {office_id} not found for city {city_id}, searching by name: '{office_name}'")
        
        if office_name:
            # Normalize names for comparison
            office_name_lower = office_name.lower().strip()
            
            # Try exact match first
            for o in offices:
                if o.get("name", "").lower().strip() == office_name_lower:
                    logger.info(f"Found exact match: {o['name']} (ID: {o['id']})")
                    return o["id"]
            
            # Try partial match (contains)
            for o in offices:
                o_name = o.get("name", "").lower()
                # Check if key words match
                if any(word in o_name for word in office_name_lower.split() if len(word) > 3):
                    logger.info(f"Found partial match: {o['name']} (ID: {o['id']})")
                    return o["id"]
        
        # No match found - use the first office as fallback
        fallback_office = offices[0]
        logger.warning(f"No match found, using fallback office: {fallback_office['name']} (ID: {fallback_office['id']})")
        return fallback_office["id"]
        
    except Exception as e:
        logger.error(f"Error validating office ID: {e}")
        return None


# ============= Helper function for auto-shipment creation =============

async def create_shipment_for_order(order: dict) -> dict:
    """
    Create a Speedy shipment for an order.
    Called automatically after COD order or Stripe payment success.
    Returns shipment data or None if failed.
    
    IMPORTANT: Speedy API requires that sum(amountWithVat) across all fiscalReceiptItems
    equals cod_amount EXACTLY. On discounted orders, we must proportionally distribute
    the discount across all items using a discount_factor.
    
    IMPORTANT: COD amount should be ONLY for products (subtotal - discount), NOT including shipping.
    Speedy will collect the shipping fee directly from the customer (courierServicePayer = RECIPIENT).
    For free shipping orders (>= €90), we pay Speedy (courierServicePayer = SENDER).
    """
    try:
        speedy_data = order.get("speedy_data", {})
        shipping_address = order.get("shipping_address", {})
        order_number = order.get("order_number", "UNKNOWN")
        
        if not speedy_data or not speedy_data.get("city_id"):
            logger.warning(f"Order {order_number} has no speedy_data, skipping shipment creation")
            return None
        
        # Determine COD amount (only for COD orders)
        # COD = product cost only (subtotal - discount), WITHOUT shipping
        # Speedy will collect shipping directly from customer
        cod_amount = None
        fiscal_items = None
        order_total_for_shipping = 0.0  # Used to determine free shipping threshold
        
        if order.get("payment_method") == "cod":
            subtotal = float(order.get("subtotal", 0))
            shipping_cost = float(order.get("shipping_cost", 0))
            discount_amount = float(order.get("discount_amount") or 0)
            
            # Calculate subtotal from items if not available
            order_items = order.get("items", [])
            if subtotal <= 0 and order_items:
                subtotal = sum(
                    float(item.get("price", 0)) * int(item.get("quantity", 1))
                    for item in order_items
                )
            
            # COD amount = products only (subtotal - discount), NO shipping
            # Shipping is collected by Speedy directly from customer
            cod_amount = subtotal - discount_amount
            if cod_amount < 0:
                cod_amount = 0
            
            # order_total determines free shipping (includes shipping for threshold check)
            order_total_for_shipping = subtotal + shipping_cost - discount_amount
            
            logger.info(f"Order {order_number}: subtotal={subtotal}, discount={discount_amount}, shipping={shipping_cost}, cod_amount={cod_amount} (products only), order_total={order_total_for_shipping}")
            
            # Build fiscal receipt items from order items
            # Prices from items are WITH VAT (20%)
            # Fiscal items = only products (no shipping, since Speedy collects it separately)
            if order_items:
                # Calculate discount factor to distribute discount proportionally across items
                if subtotal > 0:
                    discount_factor = cod_amount / subtotal
                else:
                    discount_factor = 1.0
                
                fiscal_items = []
                
                for item in order_items:
                    item_name = f"{item.get('brand', '')} {item.get('name', 'Парфюм')}"[:50]
                    original_price = float(item.get("price", 0))
                    quantity = int(item.get("quantity", 1))
                    
                    # Apply discount factor to get the proportionally reduced price
                    discounted_unit_price = round(original_price * discount_factor, 2)
                    
                    fiscal_items.append(FiscalReceiptItem(
                        name=item_name,
                        quantity=quantity,
                        unit_price=discounted_unit_price  # Discounted price with VAT
                    ))
                
                logger.info(f"Prepared {len(fiscal_items)} fiscal receipt items for order {order_number}, discount_factor={discount_factor:.4f}")
        
        # Validate and fix office ID if needed (for OFFICE delivery type)
        delivery_type = speedy_data.get("delivery_type", "OFFICE")
        office_id = speedy_data.get("office_id")
        city_id = speedy_data.get("city_id")
        
        if delivery_type == "OFFICE" and office_id and city_id:
            validated_office_id = await validate_and_fix_office_id(
                city_id=city_id,
                office_id=office_id,
                office_name=speedy_data.get("office_name", "")
            )
            if validated_office_id and validated_office_id != office_id:
                logger.info(f"Order {order_number}: Corrected office ID from {office_id} to {validated_office_id}")
                office_id = validated_office_id
            elif not validated_office_id:
                logger.error(f"Order {order_number}: Could not validate office ID {office_id}, shipment will likely fail")
        
        # Build recipient info - include email from order
        recipient_email = order.get("user_email") or shipping_address.get("email", "")
        recipient = RecipientInfo(
            name=shipping_address.get("full_name", ""),
            phone=shipping_address.get("phone", ""),
            city_id=city_id,
            city_name=speedy_data.get("city_name", ""),
            office_id=office_id,  # Use validated office_id
            address=speedy_data.get("address") or shipping_address.get("address", ""),
            email=recipient_email
        )
        
        # Create shipment request with fiscal items for касов бон
        # Include order_total to determine who pays for shipping (>= 90 EUR = SENDER, < 90 EUR = RECIPIENT)
        order_total = float(order.get("total", 0))
        
        # Build detailed contents string with product names and quantities
        order_items = order.get("items", [])
        if order_items:
            contents_parts = []
            for item in order_items:
                brand = item.get("brand", "")
                name = item.get("name", "Парфюм")
                quantity = item.get("quantity", 1)
                # Format: "Brand Name x2" or just "Brand Name" if qty is 1
                item_desc = f"{brand} {name}".strip()
                if quantity > 1:
                    item_desc += f" x{quantity}"
                contents_parts.append(item_desc)
            # Join with semicolon, limit to ~100 chars for Speedy
            contents_str = "; ".join(contents_parts)
            if len(contents_str) > 100:
                contents_str = contents_str[:97] + "..."
        else:
            contents_str = "Парфюми / Perfumes"
        
        shipment_request = CreateShipmentRequest(
            order_number=order.get("order_number", ""),
            recipient=recipient,
            delivery_type=speedy_data.get("delivery_type", "OFFICE"),
            weight=0.5,  # Default weight for perfumes
            cod_amount=cod_amount,
            order_total=order_total,
            shipping_cost=shipping_cost,  # For fiscal receipt
            contents=contents_str,
            fiscal_receipt_items=fiscal_items
        )
        
        # Call the internal shipment creation function (no auth required)
        result = await _create_shipment_internal(shipment_request)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to create shipment for order {order.get('order_number')}: {e}")
        return None


# ============= Admin endpoint to manually create shipment =============

@router.post("/shipment/order/{order_id}")
async def create_shipment_for_order_id(request: Request, order_id: str):
    """
    Admin endpoint to manually create a Speedy shipment for an existing order.
    """
    from bson import ObjectId
    
    # SEC-003 FIX: Require admin auth
    db = request.app.state.db
    await verify_admin_speedy(request, db)
    
    try:
        # Get order from database
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check if shipment already exists
        if order.get("tracking_number"):
            return {
                "success": False,
                "message": "Shipment already exists",
                "tracking_number": order.get("tracking_number"),
                "tracking_url": order.get("tracking_url")
            }
        
        # Create shipment
        result = await create_shipment_for_order(order)
        
        if not result or not result.get("success"):
            raise HTTPException(status_code=500, detail="Failed to create shipment")
        
        # Update order with tracking info
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "tracking_number": result.get("tracking_number"),
                    "tracking_url": result.get("tracking_url"),
                    "shipment_id": result.get("shipment_id"),
                    "shipment_created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "shipped"
                }
            }
        )
        
        logger.info(f"Shipment created for order {order.get('order_number')}: {result.get('tracking_number')}")
        
        return {
            "success": True,
            "order_number": order.get("order_number"),
            "tracking_number": result.get("tracking_number"),
            "tracking_url": result.get("tracking_url"),
            "message": "Товарителницата е създадена успешно!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating shipment for order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============= Tracking Status Sync =============

async def get_speedy_tracking_status(tracking_number: str) -> dict:
    """
    Get tracking status from Speedy API for a parcel.
    Returns the latest operation/status.
    """
    try:
        data = await speedy_request("track", {
            "parcels": [{"id": tracking_number}]
        })
        
        parcels = data.get("parcels", [])
        if not parcels:
            return {"status": "unknown", "operations": []}
        
        parcel = parcels[0]
        operations = parcel.get("operations", [])
        
        # Determine status based on operations
        # Common Speedy operation codes:
        # - "Приета" (Accepted) = waybill created, waiting for pickup
        # - "Изпратена от подател" = picked up from sender
        # - "В движение" = in transit
        # - "Пристигнала" = arrived at destination office
        # - "Доставена" = delivered
        # - "Върната" = returned
        
        status = "processing"  # Default
        last_operation = None
        
        if operations:
            last_operation = operations[-1]
            op_desc = last_operation.get("operationDescription", "").lower()
            
            # Check for delivery
            if "доставен" in op_desc or "delivered" in op_desc:
                status = "delivered"
            # Check for in transit / picked up
            elif any(keyword in op_desc for keyword in ["изпратен", "движение", "транзит", "пристигнал", "приет в офис", "picked", "transit"]):
                status = "shipped"
            # Check for returned/cancelled
            elif "върнат" in op_desc or "отказ" in op_desc or "return" in op_desc:
                status = "cancelled"
        
        return {
            "status": status,
            "last_operation": last_operation,
            "operations_count": len(operations)
        }
        
    except Exception as e:
        logger.error(f"Error getting tracking status for {tracking_number}: {e}")
        return {"status": "unknown", "error": str(e)}


@router.post("/sync-statuses")
async def sync_order_statuses(request: Request):
    """
    Sync order statuses from Speedy tracking API.
    Updates orders that have tracking numbers but status is still 'processing'.
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    MONGO_URL = os.environ.get("MONGO_URL")
    DB_NAME = os.environ.get("DB_NAME", "kostin_cosmetics")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Verify admin access
    await verify_admin_speedy(request, db)
    
    # Find orders with tracking but still processing
    orders = await db.orders.find({
        "tracking_number": {"$exists": True, "$nin": [None, ""]},
        "status": {"$in": ["processing", "confirmed", "pending"]}
    }).to_list(100)
    
    updated_count = 0
    results = []
    
    for order in orders:
        tracking_number = order.get("tracking_number")
        order_number = order.get("order_number")
        
        if not tracking_number:
            continue
        
        # Get status from Speedy
        tracking_result = await get_speedy_tracking_status(tracking_number)
        new_status = tracking_result.get("status")
        
        if new_status and new_status != order.get("status") and new_status != "unknown":
            # Update order status
            await db.orders.update_one(
                {"_id": order["_id"]},
                {
                    "$set": {
                        "status": new_status,
                        "status_updated_at": datetime.now(timezone.utc).isoformat(),
                        "last_tracking_check": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            updated_count += 1
            results.append({
                "order_number": order_number,
                "tracking_number": tracking_number,
                "old_status": order.get("status"),
                "new_status": new_status
            })
            logger.info(f"Updated order {order_number} status: {order.get('status')} -> {new_status}")
    
    return {
        "success": True,
        "checked": len(orders),
        "updated": updated_count,
        "results": results
    }


@router.get("/track/{tracking_number}")
async def track_shipment(tracking_number: str):
    """Get tracking info for a shipment"""
    try:
        data = await speedy_request("track", {
            "parcels": [{"id": tracking_number}]
        })
        
        parcels = data.get("parcels", [])
        if not parcels:
            return {"tracking_number": tracking_number, "status": "not_found", "operations": []}
        
        parcel = parcels[0]
        operations = parcel.get("operations", [])
        
        # Format operations for display
        formatted_ops = []
        for op in operations:
            formatted_ops.append({
                "date": op.get("dateTime"),
                "description": op.get("operationDescription"),
                "place": op.get("siteName") or op.get("officeName")
            })
        
        # Determine current status
        tracking_result = await get_speedy_tracking_status(tracking_number)
        
        return {
            "tracking_number": tracking_number,
            "status": tracking_result.get("status"),
            "operations": formatted_ops,
            "tracking_url": f"https://www.speedy.bg/bg/track-shipment?shipmentNumber={tracking_number}"
        }
        
    except Exception as e:
        logger.error(f"Error tracking shipment {tracking_number}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
