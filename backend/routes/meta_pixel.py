"""
Meta Pixel / CAPI helper routes for KOSTIN Parfums.
Exposes event ingestion and a health-check endpoint for
purchase/conversion tracking setup verification.
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/meta-pixel", tags=["meta-pixel"])


class PurchaseEvent(BaseModel):
    event_name: str = "Purchase"
    event_time: Optional[int] = None
    event_id: Optional[str] = None
    value: Optional[float] = None
    currency: Optional[str] = None
    user_data: Optional[Dict[str, Any]] = None
    custom_data: Optional[Dict[str, Any]] = None


@router.post("/event")
async def receive_pixel_event(request: Request, event: PurchaseEvent):
    """
    Receive and forward a purchase/conversion event to Meta.
    This is a minimal ingestion shim; real forwarding should use
    the Conversions API with a server-side access token.
    """
    db = request.app.state.db
    user = await __import__("utils.auth", fromlist=["get_current_user"]).get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    payload = event.dict()
    payload["account_id"] = os.environ.get("META_AD_ACCOUNT_ID")
    payload["pixel_id"] = os.environ.get("META_PIXEL_ID")
    logger.info("Received Meta event: %s", payload)

    # TODO: forward to Meta Conversions API using META_ACCESS_TOKEN / META_APP_SECRET
    return {"success": True, "received": payload}


@router.get("/health")
async def pixel_health(request: Request):
    """
    Quick signal health check for Meta Pixel / CAPI setup.
    """
    return {
        "success": True,
        "pixel_id": os.environ.get("META_PIXEL_ID"),
        "ad_account_id": os.environ.get("META_AD_ACCOUNT_ID"),
        "app_id": os.environ.get("META_APP_ID"),
        "status": "configured" if os.environ.get("META_PIXEL_ID") else "missing_pixel_id",
    }
