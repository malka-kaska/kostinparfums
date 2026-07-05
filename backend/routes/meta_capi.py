"""
Meta Conversions API (CAPI) backend endpoints.

Receives server-side event data from the React frontend and forwards it to
Meta's Graph API Conversions endpoint.  The Pixel fires a matching browser-side
event at the same time; both share the same event_id so Meta can deduplicate
them in Events Manager.

Environment variables required:
  META_CAPI_TOKEN   – Meta access token for CAPI (System User token)
  META_PIXEL_ID     – Pixel numeric ID (same value as REACT_APP_META_PIXEL_ID in frontend)

Supported events (mirrors the 10 browser-side events in metaPixel.js):
  ViewContent, Search, AddToWishlist, AddToCart, InitiateCheckout,
  Purchase, Lead, CompleteRegistration, ViewCategory, DiscountApplied
"""

import os
import logging
import hashlib
import time
from typing import Optional, List, Any, Dict
from fastapi import APIRouter, Request
from pydantic import BaseModel
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/meta-capi", tags=["meta-capi"])

CAPI_ENDPOINT = "https://graph.facebook.com/v19.0/{pixel_id}/events"
META_CAPI_TOKEN = os.environ.get("META_CAPI_TOKEN", "")
META_PIXEL_ID = os.environ.get("META_PIXEL_ID", "")


# ─── schemas ──────────────────────────────────────────────────────────────────

class CapiEventRequest(BaseModel):
    """Generic CAPI event payload sent from the browser."""
    event_name: str
    event_id: str

    # Optional common fields
    product_id: Optional[str] = None
    quantity: Optional[int] = None
    value: Optional[float] = None
    currency: str = "EUR"
    num_items: Optional[int] = None
    order_id: Optional[str] = None
    category: Optional[str] = None
    content_name: Optional[str] = None
    search_string: Optional[str] = None
    discount_code: Optional[str] = None
    discount_amount: Optional[float] = None
    cart_total: Optional[float] = None


# ─── helpers ──────────────────────────────────────────────────────────────────

def _sha256(value: str) -> str:
    """Return lowercase hex SHA-256 of a string (used for PII hashing)."""
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


def _get_user_data(request: Request) -> dict:
    """
    Extract anonymised user data from the request for CAPI matching.
    Only IP address and user-agent are sent — no email/phone without explicit
    consent data being available server-side.
    """
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.client.host if request.client else ""
    return {
        "client_ip_address": client_ip,
        "client_user_agent": request.headers.get("user-agent", ""),
    }


def _build_custom_data(payload: CapiEventRequest) -> dict:
    """Map the generic payload fields to the CAPI custom_data object."""
    custom: Dict[str, Any] = {"currency": payload.currency}

    if payload.value is not None:
        custom["value"] = round(payload.value, 2)
    if payload.product_id:
        custom["content_ids"] = [payload.product_id]
        custom["content_type"] = "product"
    if payload.content_name:
        custom["content_name"] = payload.content_name
    if payload.quantity is not None:
        custom["quantity"] = payload.quantity
    if payload.num_items is not None:
        custom["num_items"] = payload.num_items
    if payload.order_id:
        custom["order_id"] = payload.order_id
    if payload.category:
        custom["content_category"] = payload.category
    if payload.search_string:
        custom["search_string"] = payload.search_string
    if payload.discount_code:
        custom["discount_code"] = payload.discount_code
    if payload.discount_amount is not None:
        custom["discount_amount"] = round(payload.discount_amount, 2)
    if payload.cart_total is not None:
        custom["cart_total"] = round(payload.cart_total, 2)

    return custom


async def _send_to_meta(user_data: dict, payload: CapiEventRequest) -> bool:
    """
    Forward a single event to Meta's Conversions API.
    Returns True on success, False on failure.
    """
    if not META_CAPI_TOKEN or not META_PIXEL_ID:
        logger.debug("META_CAPI_TOKEN or META_PIXEL_ID not configured — skipping CAPI call")
        return False

    event = {
        "event_name": payload.event_name,
        "event_time": int(time.time()),
        "event_id": payload.event_id,
        "action_source": "website",
        "user_data": user_data,
        "custom_data": _build_custom_data(payload),
    }

    body = {
        "data": [event],
        "access_token": META_CAPI_TOKEN,
    }

    url = CAPI_ENDPOINT.format(pixel_id=META_PIXEL_ID)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, json=body)
            if response.status_code != 200:
                logger.warning(
                    "CAPI returned %s for event %s: %s",
                    response.status_code,
                    payload.event_name,
                    response.text[:200],
                )
                return False
        return True
    except Exception as exc:
        logger.warning("CAPI request failed for event %s: %s", payload.event_name, exc)
        return False


# ─── endpoint ─────────────────────────────────────────────────────────────────

ALLOWED_EVENTS = {
    "ViewContent",
    "Search",
    "AddToWishlist",
    "AddToCart",
    "InitiateCheckout",
    "Purchase",
    "Lead",
    "CompleteRegistration",
    "ViewCategory",
    "DiscountApplied",
}


@router.post("/event")
async def capi_event(request: Request, payload: CapiEventRequest):
    """
    Receive a single Conversions API event from the browser and forward it to Meta.

    The browser Pixel fires the matching event simultaneously; both share
    event_id for server-side deduplication.
    """
    if payload.event_name not in ALLOWED_EVENTS:
        # Accept silently — don't break the frontend if an unknown event is sent
        logger.debug("Ignoring unknown CAPI event: %s", payload.event_name)
        return {"success": True, "sent": False}

    user_data = _get_user_data(request)
    sent = await _send_to_meta(user_data, payload)

    return {"success": True, "sent": sent, "event_name": payload.event_name}
