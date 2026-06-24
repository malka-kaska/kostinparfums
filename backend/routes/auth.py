import secrets
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
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,  # 7 days
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
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
        # Resend verification email
        verification_token = user.get("verification_token")
        if not verification_token:
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

    logger.info(f"Password reset token for {email}: {token}")
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

@router.post("/register-guest")
async def register_guest(request: Request, data: GuestRegisterRequest):
    """
    Register a guest user after checkout.
    Links the order to the new account.
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
    
    # Link order to new user if order_id provided
    if data.order_id:
        try:
            await db.orders.update_one(
                {"_id": ObjectId(data.order_id)},
                {
                    "$set": {
                        "user_id": user_id,
                        "user_email": data.email.lower(),
                        "user_name": data.name
                    }
                }
            )
            logger.info(f"Order {data.order_id} linked to new user {user_id}")
        except Exception as e:
            logger.error(f"Failed to link order to user: {e}")
    
    # Also link any other orders with this email
    await db.orders.update_many(
        {"user_email": data.email.lower(), "user_id": None},
        {"$set": {"user_id": user_id, "user_name": data.name}}
    )
    
    return {
        "success": True,
        "message": "Акаунтът е създаден успешно!",
        "user_id": user_id
    }

