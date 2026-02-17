from fastapi import FastAPI, APIRouter, Request, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration - hardcoded for deployment
stripe_api_key = 'sk_test_51SwiQ5FpRa6Npqhog97ndRUUmW56qywwKgFpYGgCEDJakO1hN6mXN7iLGi82kP8mvV9KXMHboqTWiWMm35tpEF5E00nOEpWd9C'
stripe_publishable_key = 'pk_test_51SwiQ5FpRa6Npqhocxb7nTePg0W4l57JpmUQDRG9K2o4WNm29bmPqrk2C5ZwWfwoi9mzHjG1L9PPTzP1BK9IprVb00IGjfQ8pB'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Checkout Models
class CheckoutRequest(BaseModel):
    origin_url: str
    items: List[Dict]  # List of cart items with id, name, price, quantity

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class PaymentStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount_total: float
    currency: str

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "KOSTIN API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Get Stripe publishable key
@api_router.get("/payments/config")
async def get_payment_config():
    return {"publishable_key": stripe_publishable_key}

# Create checkout session
@api_router.post("/payments/checkout", response_model=CheckoutResponse)
async def create_checkout(request: Request, checkout_data: CheckoutRequest):
    try:
        # Calculate total from items (server-side calculation for security)
        total_amount = 0.0
        item_descriptions = []
        
        for item in checkout_data.items:
            item_total = float(item.get('price', 0)) * int(item.get('quantity', 1))
            total_amount += item_total
            item_descriptions.append(f"{item.get('name', 'Product')} x{item.get('quantity', 1)}")
        
        if total_amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid cart total")
        
        # Build URLs from provided origin
        origin_url = checkout_data.origin_url.rstrip('/')
        success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/cart"
        
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "source": "kostin_web",
                "items": ", ".join(item_descriptions[:5]),  # First 5 items
                "item_count": str(len(checkout_data.items))
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction in database
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "amount": total_amount,
            "currency": "eur",
            "status": "pending",
            "payment_status": "initiated",
            "items": checkout_data.items,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Created checkout session: {session.session_id} for amount: €{total_amount}")
        
        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.session_id
        )
        
    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")

# Get payment status
@api_router.get("/payments/status/{session_id}", response_model=PaymentStatusResponse)
async def get_payment_status(request: Request, session_id: str):
    try:
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Get checkout status
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": status.status,
                    "payment_status": status.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Payment status for {session_id}: {status.payment_status}")
        
        return PaymentStatusResponse(
            status=status.status,
            payment_status=status.payment_status,
            amount_total=status.amount_total / 100,  # Convert cents to euros
            currency=status.currency
        )
        
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get payment status: {str(e)}")

# Stripe webhook handler
@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {
                    "$set": {
                        "status": webhook_response.event_type,
                        "payment_status": webhook_response.payment_status,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            logger.info(f"Webhook received: {webhook_response.event_type} for session {webhook_response.session_id}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
