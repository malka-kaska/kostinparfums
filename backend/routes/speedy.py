"""
Speedy Bulgaria API Integration
- Office lookup
- Price calculation
- Shipment creation (waybill)
"""
import os
import httpx
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speedy", tags=["speedy"])

# Speedy API configuration
SPEEDY_API_URL = os.environ.get("SPEEDY_API_URL", "https://api.speedy.bg/v1")
SPEEDY_USERNAME = os.environ.get("SPEEDY_USERNAME", "")
SPEEDY_PASSWORD = os.environ.get("SPEEDY_PASSWORD", "")
SPEEDY_SENDER_CITY = os.environ.get("SPEEDY_SENDER_CITY", "Варна")
SPEEDY_SENDER_ADDRESS = os.environ.get("SPEEDY_SENDER_ADDRESS", "")

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


@router.post("/calculate")
async def calculate_price(request: CalculatePriceRequest):
    """Calculate shipping price"""
    try:
        # First, get sender city ID
        sender_city_data = await speedy_request("location/site", {
            "name": SPEEDY_SENDER_CITY,
            "countryId": 100
        })
        
        sender_sites = sender_city_data.get("sites", [])
        if not sender_sites:
            raise HTTPException(status_code=500, detail="Sender city not found")
        
        sender_city_id = sender_sites[0]["id"]
        
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
        calc_payload = {
            "sender": {
                "siteId": sender_city_id,
                "addressNote": SPEEDY_SENDER_ADDRESS
            },
            "recipient": recipient,
            "service": {
                "serviceIds": [SERVICE_TO_OFFICE if request.delivery_type == "OFFICE" else SERVICE_TO_ADDRESS],
                "autoAdjustPickupDate": True
            },
            "content": {
                "parcelsCount": 1,
                "totalWeight": request.weight,
                "contents": "Парфюми",
                "package": "BOX"
            },
            "payment": {
                "courierServicePayer": "SENDER"  # Sender pays shipping
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


class CreateShipmentRequest(BaseModel):
    order_number: str
    recipient: RecipientInfo
    delivery_type: str = "OFFICE"  # OFFICE or ADDRESS
    weight: float = 0.5
    cod_amount: Optional[float] = None  # Cash on delivery amount (if COD payment)
    contents: str = "Парфюми"


@router.post("/shipment")
async def create_shipment(request: CreateShipmentRequest):
    """Create a shipment (waybill) in Speedy system"""
    try:
        # Get sender city ID
        sender_city_data = await speedy_request("location/site", {
            "name": SPEEDY_SENDER_CITY,
            "countryId": 100
        })
        
        sender_sites = sender_city_data.get("sites", [])
        if not sender_sites:
            raise HTTPException(status_code=500, detail="Sender city not found")
        
        sender_city_id = sender_sites[0]["id"]
        
        # Build recipient
        recipient = {
            "phone1": {"number": request.recipient.phone},
            "clientName": request.recipient.name,
            "privatePerson": True,
            "siteId": request.recipient.city_id
        }
        
        if request.delivery_type == "OFFICE" and request.recipient.office_id:
            recipient["pickupOfficeId"] = request.recipient.office_id
        elif request.delivery_type == "ADDRESS" and request.recipient.address:
            recipient["addressNote"] = request.recipient.address
            if request.recipient.post_code:
                recipient["postCode"] = request.recipient.post_code
        
        # Build shipment payload
        shipment_payload = {
            "sender": {
                "phone1": {"number": "+359888000000"},  # Replace with your phone
                "clientName": "KOSTIN PARFUMS",
                "siteId": sender_city_id,
                "addressNote": SPEEDY_SENDER_ADDRESS
            },
            "recipient": recipient,
            "service": {
                "serviceId": SERVICE_TO_OFFICE if request.delivery_type == "OFFICE" else SERVICE_TO_ADDRESS,
                "autoAdjustPickupDate": True
            },
            "content": {
                "parcelsCount": 1,
                "totalWeight": request.weight,
                "contents": request.contents,
                "package": "BOX"
            },
            "payment": {
                "courierServicePayer": "SENDER"
            },
            "ref1": request.order_number  # Link to our order
        }
        
        # Add COD if applicable
        if request.cod_amount and request.cod_amount > 0:
            shipment_payload["payment"]["codPayment"] = {
                "amount": request.cod_amount,
                "processingType": "CASH"
            }
        
        data = await speedy_request("shipment", shipment_payload)
        
        # Extract shipment info
        shipment_id = data.get("id")
        parcels = data.get("parcels", [])
        price = data.get("price", {})
        
        tracking_number = parcels[0].get("id") if parcels else shipment_id
        
        return {
            "success": True,
            "shipment_id": shipment_id,
            "tracking_number": str(tracking_number),
            "tracking_url": f"https://www.speedy.bg/bg/track-shipment?shipmentNumber={tracking_number}",
            "price_bgn": price.get("total", 0),
            "pickup_date": data.get("pickupDate"),
            "delivery_deadline": data.get("deliveryDeadline")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating shipment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create shipment: {str(e)}")


# ============= Track Shipment =============

@router.get("/track/{tracking_number}")
async def track_shipment(tracking_number: str):
    """Get shipment tracking information"""
    try:
        data = await speedy_request("track", {
            "parcels": [tracking_number]
        })
        
        parcels = data.get("parcels", [])
        if not parcels:
            return {"status": "NOT_FOUND", "events": []}
        
        parcel = parcels[0]
        operations = parcel.get("operations", [])
        
        return {
            "tracking_number": tracking_number,
            "status": operations[-1].get("operationType") if operations else "UNKNOWN",
            "events": [
                {
                    "date": op.get("dateTime"),
                    "type": op.get("operationType"),
                    "description": op.get("operationDescription"),
                    "location": op.get("siteName", "")
                }
                for op in operations
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking shipment: {e}")
        raise HTTPException(status_code=500, detail="Failed to track shipment")
