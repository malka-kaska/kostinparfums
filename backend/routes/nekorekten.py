"""
Routes for НЕкоректен.КОМ integration
Customer risk check and reporting endpoints
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import logging
import time
from collections import defaultdict

from utils.nekorekten import check_customer, report_customer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/nekorekten", tags=["nekorekten"])

# SEC-HARDENING: Simple rate limiting for /check endpoint
# Limit: 10 requests per minute per IP
_rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 10


def check_rate_limit(ip: str) -> bool:
    """Returns True if rate limit exceeded"""
    current_time = time.time()
    # Clean old entries
    _rate_limit_store[ip] = [t for t in _rate_limit_store[ip] if current_time - t < RATE_LIMIT_WINDOW]
    
    if len(_rate_limit_store[ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return True
    
    _rate_limit_store[ip].append(current_time)
    return False


class CustomerCheckRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


class ReportCustomerRequest(BaseModel):
    phone: str
    text: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


@router.post("/check")
async def check_customer_risk(request: CustomerCheckRequest, req: Request):
    """
    Check if a customer has reports in nekorekten.com database.
    Used during checkout to identify risky COD customers.
    Rate limited: 10 requests per minute per IP.
    """
    # SEC-HARDENING: Rate limiting
    client_ip = req.client.host if req.client else "unknown"
    if check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute.")
    
    if not any([request.phone, request.email, request.name]):
        raise HTTPException(status_code=400, detail="At least one parameter required (phone, email, or name)")
    
    result = await check_customer(
        phone=request.phone,
        email=request.email,
        name=request.name
    )
    
    return result


@router.post("/report")
async def report_bad_customer(request: ReportCustomerRequest, req: Request):
    """
    Report a customer to nekorekten.com database.
    Admin only - used when customer doesn't pay COD or causes issues.
    """
    # SEC-HARDENING: Use proper JWT authentication (consistent with rest of app)
    from utils.auth import get_current_user
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    
    MONGO_URL = os.environ.get("MONGO_URL")
    DB_NAME = os.environ.get("DB_NAME", "kostin_cosmetics")
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Verify admin access using JWT auth
    user = await get_current_user(req, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Submit report
    result = await report_customer(
        phone=request.phone,
        text=request.text,
        email=request.email,
        first_name=request.first_name,
        last_name=request.last_name
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to submit report"))
    
    return result
