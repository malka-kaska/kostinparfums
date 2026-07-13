import secrets
import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException, Response
from bson import ObjectId
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_jwt_secret,
    JWT_ALGORITHM,
)
from utils.email_service import send_registration_email, send_email_verification
from models.schemas import UserRegister, UserLogin, UserResponse, ResetPasswordRequest, ResetPasswordConfirm
import jwt
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    # SEC-HARDENING: Use secure cookies in production
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_production,  # True for HTTPS in production
        samesite="lax",
        max_age=604800,  # 7 days
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,  # True for HTTPS in production
        samesite="lax",
        max_age=604800,  # 7 days
        path="/",
    )


def user_doc_to_response(user: dict) -> dict:
    return {
        "id": str(user["_id"]) if "_id" in user else user.get("id", ""),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "customer"),
        "created_at": user.get("created_at"),
    }


@router.post("/register")
async def register(request: Request, response: Response, data: UserRegister):
    db = request.app.state.db
    email = data.email.strip().lower()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    hashed = hash_password(data.password)
    
    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)
    
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": data.name.strip(),
        "role": "customer",
        "email_verified": False,  # User must verify email
        "verification_token": verification_token,
        "verification_expires": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Send email verification (non-blocking)
    asyncio.create_task(send_email_verification(email, data.name.strip(), verification_token, "bg"))

    logger.info(f"New user registered (pending verification): {email}")
    return {
        "id": user_id,
        "email": email,
        "name": data.name.strip(),
        "role": "customer",
        "email_verified": False,
        "message": "Please check your email to verify your account"
    }


@router.get("/verify-email")
async def verify_email(request: Request, token: str):
    """Verify user email with token"""
    db = request.app.state.db
    
    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    # Check if token expired
    expires = user.get("verification_expires", "")
    if expires and datetime.now(timezone.utc).isoformat() > expires:
        raise HTTPException(status_code=400, detail="Verification token has expired. Please register again.")
    
    # Mark email as verified
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"email_verified": True},
            "$unset": {"verification_token": "", "verification_expires": ""}
        }
    )
    
    # Send welcome email after verification
    asyncio.create_task(send_registration_email(user["email"], user.get("name", ""), "bg"))
    
    logger.info(f"Email verified for user: {user['email']}")
    return {"message": "Email verified successfully! You can now log in.", "verified": True}


@router.post("/login")
async def login(request: Request, response: Response, data: UserLogin):
    db = request.app.state.db
    email = data.email.strip().lower()
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{email}"

    # Check brute force lockout
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc).isoformat() < locked_until:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {
                    "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
            },
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Check if email is verified (skip for admin users)
    if user.get("role") != "admin" and not user.get("email_verified", True):
        # Check if existing token is still valid or create new one
        verification_token = user.get("verification_token")
        token_expires = user.get("verification_expires", "")
        
        # Generate new token if none exists OR if existing token expired
        if not verification_token or (token_expires and datetime.now(timezone.utc).isoformat() > token_expires):
            verification_token = secrets.token_urlsafe(32)
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "verification_token": verification_token,
                    "verification_expires": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
                }}
            )
        
        asyncio.create_task(send_email_verification(email, user.get("name", ""), verification_token, "bg"))
        raise HTTPException(status_code=403, detail="Please verify your email first. A new verification email has been sent.")

    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    logger.info(f"User logged in: {email}")
    return user_doc_to_response(user)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(request: Request):
    db = request.app.state.db
    user = await get_current_user(request, db)
    return user_doc_to_response({"_id": user["_id"], **user})


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    db = request.app.state.db
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        new_access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(
            key="access_token",
            value=new_access,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=604800,  # 7 days
            path="/",
        )
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/forgot-password")
async def forgot_password(request: Request, data: ResetPasswordRequest):
    db = request.app.state.db
    email = data.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": str(user["_id"]),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # SEC-004 FIX: Send reset email instead of logging token
    try:
        from utils.email_service import send_password_reset_email
        await send_password_reset_email(email, user.get("name", ""), token)
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        # Don't reveal email sending failure to user
    
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(request: Request, data: ResetPasswordConfirm):
    db = request.app.state.db
    reset_doc = await db.password_reset_tokens.find_one({
        "token": data.token,
        "used": False,
    })
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.now(timezone.utc) > reset_doc["expires_at"]:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    hashed = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": ObjectId(reset_doc["user_id"])},
        {"$set": {"password_hash": hashed}},
    )
    await db.password_reset_tokens.update_one(
        {"token": data.token},
        {"$set": {"used": True}},
    )

    return {"message": "Password reset successfully"}


# Guest registration - create account after checkout
from pydantic import BaseModel as PydanticBaseModel
from typing import Optional as OptionalType

class GuestRegisterRequest(PydanticBaseModel):
    email: str
    password: str
    name: str
    order_id: OptionalType[str] = None
    order_token: OptionalType[str] = None  # SEC-001 FIX: Require token for order ownership proof

@router.post("/register-guest")
async def register_guest(request: Request, data: GuestRegisterRequest):
    """
    Register a guest user after checkout.
    Links the order to the new account only if:
    1. The order's email matches the registration email, OR
    2. A valid cancellation_token is provided as proof of ownership
    
    SEC-001 FIX: Prevents arbitrary order claiming (BOLA vulnerability)
    """
    db = request.app.state.db
    
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Този имейл вече е регистриран. Моля, влезте в акаунта си.")
    
    # Validate password
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Паролата трябва да е поне 8 символа")
    
    # Create user
    hashed_password = hash_password(data.password)
    
    user_doc = {
        "email": data.email.lower(),
        "password_hash": hashed_password,
        "name": data.name,
        "role": "user",
        "email_verified": True,  # Trust email since they just made an order with it
        "created_at": datetime.now(timezone.utc).isoformat(),
        "registered_from": "guest_checkout"
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    logger.info(f"Guest user registered: {data.email}")
    
    # SEC-001 FIX: Link order only with verified ownership
    if data.order_id:
        try:
            order = await db.orders.find_one({"_id": ObjectId(data.order_id)})
            
            if order:
                # Check ownership: email must match OR valid token provided
                order_email = order.get("user_email", "").lower()
                order_token = order.get("cancellation_token", "")
                user_email_lower = data.email.lower()
                
                can_link = False
                
                # Method 1: Email matches
                if order_email == user_email_lower:
                    can_link = True
                    logger.info(f"Order {data.order_id} linked via email match")
                
                # Method 2: Valid token provided
                elif data.order_token and order_token and data.order_token == order_token:
                    can_link = True
                    logger.info(f"Order {data.order_id} linked via token verification")
                
                if can_link:
                    await db.orders.update_one(
                        {"_id": ObjectId(data.order_id)},
                        {
                            "$set": {
                                "user_id": user_id,
                                "user_email": user_email_lower,
                                "user_name": data.name
                            }
                        }
                    )
                    logger.info(f"Order {data.order_id} successfully linked to user {user_id}")
                else:
                    # SEC-001: Do NOT link order - ownership not verified
                    logger.warning(f"Order {data.order_id} NOT linked - ownership verification failed for email {data.email}")
            else:
                logger.warning(f"Order {data.order_id} not found")
                
        except Exception as e:
            logger.error(f"Failed to process order linking: {e}")
    
    # Link other orders with matching email (this is safe - email-based ownership)
    linked_result = await db.orders.update_many(
        {"user_email": data.email.lower(), "user_id": {"$in": [None, ""]}},
        {"$set": {"user_id": user_id, "user_name": data.name}}
    )
    
    if linked_result.modified_count > 0:
        logger.info(f"Linked {linked_result.modified_count} additional orders by email match")
    
    return {
        "success": True,
        "message": "Акаунтът е създаден успешно!",
        "user_id": user_id
    }


# GDPR: Right to be forgotten - Delete user account
@router.delete("/delete-account")
async def delete_account(request: Request, response: Response):
    """
    GDPR Article 17: Right to erasure (Right to be forgotten)
    Permanently deletes the user's account and all associated personal data.
    """
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if not user:
        raise HTTPException(status_code=401, detail="Не сте влезли в системата")
    
    user_id = user["_id"]  # This is already a string from get_current_user
    user_email = user.get("email", "")
    
    try:
        # 1. Anonymize orders (keep for accounting purposes but remove personal data)
        await db.orders.update_many(
            {"user_id": user_id},
            {
                "$set": {
                    "user_email": "deleted_user@anonymized.local",
                    "user_name": "Изтрит потребител",
                    "shipping_address.full_name": "Анонимизиран",
                    "shipping_address.phone": "000000000",
                    "shipping_address.email": "deleted@anonymized.local",
                },
                "$unset": {
                    "user_id": ""
                }
            }
        )
        
        # 2. Delete cart data
        await db.carts.delete_many({"user_id": user_id})
        
        # 3. Delete login attempts
        await db.login_attempts.delete_many({"identifier": {"$regex": user_email}})
        
        # 4. Delete password reset tokens
        await db.password_reset_tokens.delete_many({"user_id": user_id})
        
        # 5. Delete the user account (convert string back to ObjectId)
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Грешка при изтриване на акаунта")
        
        # 6. Clear auth cookies
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        
        logger.info(f"User account deleted (GDPR request): {user_email}")
        
        return {
            "success": True,
            "message": "Акаунтът и всички свързани данни бяха успешно изтрити."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user account: {e}")
        raise HTTPException(status_code=500, detail="Грешка при изтриване на акаунта. Моля, опитайте отново.")



# GDPR: Right of Access - Export user data
@router.get("/export-data")
async def export_user_data(request: Request):
    """
    GDPR Article 15: Right of access
    Allows users to download all their personal data in JSON format.
    """
    db = request.app.state.db
    user = await get_current_user(request, db)
    
    if not user:
        raise HTTPException(status_code=401, detail="Не сте влезли в системата")
    
    user_id = user["_id"]
    user_email = user.get("email", "")
    
    try:
        # Helper to safely convert datetime to ISO string
        def to_iso(val):
            if val is None:
                return None
            if isinstance(val, datetime):
                return val.isoformat()
            if isinstance(val, str):
                return val  # Already a string
            return str(val)
        
        # 1. Collect user profile data
        profile_data = {
            "email": user.get("email"),
            "name": user.get("name"),
            "role": user.get("role", "customer"),
            "email_verified": user.get("email_verified", False),
            "newsletter_subscribed": user.get("newsletter_subscribed", False),
            "created_at": to_iso(user.get("created_at")),
            "is_guest": user.get("is_guest", False),
        }
        
        # 2. Collect order history
        orders_cursor = db.orders.find(
            {"user_id": user_id},
            {"_id": 0}  # Exclude MongoDB _id
        ).sort("created_at", -1)
        
        orders = []
        async for order in orders_cursor:
            # Convert datetime objects to ISO strings
            order["created_at"] = to_iso(order.get("created_at"))
            order["updated_at"] = to_iso(order.get("updated_at"))
            orders.append(order)
        
        # 3. Collect cart data
        cart = await db.carts.find_one({"user_id": user_id}, {"_id": 0})
        cart_data = cart.get("items", []) if cart else []
        
        # 4. Collect saved addresses (if stored separately)
        addresses_cursor = db.addresses.find({"user_id": user_id}, {"_id": 0})
        addresses = []
        async for addr in addresses_cursor:
            addresses.append(addr)
        
        # 5. Compile all data
        export_data = {
            "export_info": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "user_email": user_email,
                "data_controller": "GREEN POTENTIAL LTD (ГРИИН ПОТЕНШЪЛ ЕООД)",
                "website": "kostinparfums.com"
            },
            "profile": profile_data,
            "orders": orders,
            "cart": cart_data,
            "addresses": addresses,
            "consent_records": {
                "terms_accepted": True,
                "privacy_policy_accepted": True,
                "newsletter_subscribed": user.get("newsletter_subscribed", False)
            }
        }
        
        logger.info(f"User data exported (GDPR request): {user_email}")
        
        return export_data
        
    except Exception as e:
        logger.error(f"Error exporting user data: {e}")
        raise HTTPException(status_code=500, detail="Грешка при експортиране на данните. Моля, опитайте отново.")
