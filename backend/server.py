from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import logging
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest,
)

# Add backend dir to path for module imports
sys.path.insert(0, str(ROOT_DIR))

from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.cart import router as cart_router
from routes.orders import router as orders_router
from routes.upload import router as upload_router
from routes.homepage import router as homepage_router
from routes.search import router as search_router
from utils.auth import seed_admin
from utils.email_service import send_order_confirmation_email, send_order_verification_email
from migrations import run_migrations

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
stripe_api_key = os.environ['STRIPE_API_KEY']
stripe_publishable_key = os.environ['STRIPE_PUBLISHABLE_KEY']

# Create the main app
app = FastAPI()

# Store db in app state for route access
app.state.db = db

# Create a router for payment endpoints
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Basic health check
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class CheckoutRequest(BaseModel):
    origin_url: str
    items: List[Dict]


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PaymentStatusResponse(BaseModel):
    status: str
    payment_status: str
    amount_total: float
    currency: str


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


# Stripe payment endpoints
@api_router.get("/payments/config")
async def get_payment_config():
    return {"publishable_key": stripe_publishable_key}


@api_router.post("/payments/checkout", response_model=CheckoutResponse)
async def create_checkout(request: Request, checkout_data: CheckoutRequest):
    try:
        total_amount = 0.0
        item_descriptions = []

        for item in checkout_data.items:
            item_total = float(item.get('price', 0)) * int(item.get('quantity', 1))
            total_amount += item_total
            item_descriptions.append(f"{item.get('name', 'Product')} x{item.get('quantity', 1)}")

        if total_amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid cart total")

        origin_url = checkout_data.origin_url.rstrip('/')
        success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/cart"

        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "source": "kostin_web",
                "items": ", ".join(item_descriptions[:5]),
                "item_count": str(len(checkout_data.items))
            }
        )

        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)

        # Try to get user info if authenticated
        user_id = ""
        user_email = ""
        user_name = ""
        try:
            from utils.auth import get_current_user
            user = await get_current_user(request, db)
            user_id = user["_id"] if isinstance(user["_id"], str) else str(user["_id"])
            user_email = user.get("email", "")
            user_name = user.get("name", "")
        except Exception:
            pass

        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "amount": total_amount,
            "currency": "eur",
            "status": "pending",
            "payment_status": "initiated",
            "items": checkout_data.items,
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)

        logger.info(f"Created checkout session: {session.session_id} for amount: EUR{total_amount}")

        return CheckoutResponse(
            checkout_url=session.url,
            session_id=session.session_id
        )

    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")


@api_router.get("/payments/status/{session_id}", response_model=PaymentStatusResponse)
async def get_payment_status(request: Request, session_id: str):
    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

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
            amount_total=status.amount_total / 100,
            currency=status.currency
        )

    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get payment status: {str(e)}")


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")

        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

        webhook_response = await stripe_checkout.handle_webhook(body, signature)

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

            # Create order on successful payment - pending user verification
            if webhook_response.payment_status == "paid":
                transaction = await db.payment_transactions.find_one(
                    {"session_id": webhook_response.session_id}
                )
                if transaction:
                    existing_order = await db.orders.find_one(
                        {"session_id": webhook_response.session_id}
                    )
                    if not existing_order:
                        order_items = []
                        for item in transaction.get("items", []):
                            order_items.append({
                                "product_id": str(item.get("id", "")),
                                "name": item.get("name", ""),
                                "brand": item.get("brand", ""),
                                "price": float(item.get("price", 0)),
                                "quantity": int(item.get("quantity", 1)),
                            })
                        total = transaction.get("amount", 0)
                        shipping = 0 if total >= 100 else 9.95
                        
                        # Generate order verification token
                        import secrets
                        verification_token = secrets.token_urlsafe(32)
                        
                        # Create order with pending_verification status
                        order_result = await db.orders.insert_one({
                            "user_id": transaction.get("user_id", ""),
                            "user_email": transaction.get("user_email", ""),
                            "user_name": transaction.get("user_name", ""),
                            "items": order_items,
                            "total": round(total + shipping, 2),
                            "shipping_cost": shipping,
                            "status": "pending_verification",  # Requires email confirmation
                            "payment_status": "paid",
                            "session_id": webhook_response.session_id,
                            "verification_token": verification_token,
                            "verification_expires": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        })
                        
                        order_id = str(order_result.inserted_id)
                        logger.info(f"Order created (pending verification) for session {webhook_response.session_id}")
                        
                        # Send order verification email (non-blocking)
                        user_email = transaction.get("user_email", "")
                        user_name = transaction.get("user_name", "Customer")
                        if user_email:
                            asyncio.create_task(
                                send_order_verification_email(
                                    to_email=user_email,
                                    user_name=user_name,
                                    order_id=order_id,
                                    verification_token=verification_token,
                                    items=order_items,
                                    total=round(total + shipping, 2),
                                    shipping_cost=shipping,
                                    lang="bg"
                                )
                            )
                            logger.info(f"Order verification email queued for {user_email}")

            logger.info(f"Webhook received: {webhook_response.event_type} for session {webhook_response.session_id}")

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/orders/verify")
async def verify_order(token: str):
    """Verify order via email token"""
    order = await db.orders.find_one({"verification_token": token})
    if not order:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    # Check if token expired
    expires = order.get("verification_expires", "")
    if expires and datetime.now(timezone.utc).isoformat() > expires:
        raise HTTPException(status_code=400, detail="Verification token has expired. Please contact support.")
    
    # Update order status to confirmed
    await db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "status": "confirmed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {"verification_token": "", "verification_expires": ""}
        }
    )
    
    order_id = str(order["_id"])
    
    # Send final confirmation email
    user_email = order.get("user_email", "")
    user_name = order.get("user_name", "Customer")
    if user_email:
        asyncio.create_task(
            send_order_confirmation_email(
                to_email=user_email,
                user_name=user_name,
                order_id=order_id,
                items=order.get("items", []),
                total=order.get("total", 0),
                shipping_cost=order.get("shipping_cost", 0),
                lang="bg"
            )
        )
    
    logger.info(f"Order {order_id} verified by user")
    return {"message": "Order confirmed successfully!", "order_id": order_id, "verified": True}


# Include routers
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(upload_router)
app.include_router(homepage_router)
app.include_router(search_router)

# CORS — must use explicit origin for credentials
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    # Run database migrations first
    await run_migrations(db)
    logger.info("Migrations check complete")
    
    # Seed admin user
    await seed_admin(db)
    logger.info("Admin user seeded successfully")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
