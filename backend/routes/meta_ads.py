"""
Meta Ads helpers for KOSTIN Parfums.
Campaign scaffolding, creative A/B structure, audience suggestions, and CAPI event forwarding.
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/meta-ads", tags=["meta-ads"])

META_GRAPH_VERSION = os.environ.get("META_GRAPH_VERSION", "v19.0")


class CampaignDraft(BaseModel):
    name: str
    objective: str = Field(default="OUTCOME_SALES", description="Use Meta sales objective")
    budget_daily: Optional[int] = None
    status: str = Field(default="PAUSED")
    advantage_audience: bool = Field(default=True)
    advantage_placements: bool = Field(default=True)


class AdCreativeDraft(BaseModel):
    name: str
    type: str = Field(default="image", description="image | video | carousel")
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    headline: Optional[str] = None
    body: Optional[str] = None
    link_url: Optional[str] = None
    cta: Optional[str] = Field(default="SHOP_NOW")
    labels: Optional[List[str]] = None


class AdSetDraft(BaseModel):
    name: str
    campaign_id: str
    audience_hints: Optional[List[str]] = Field(default_factory=lambda: ["Perfume", "Luxury Goods", "Cosmetics"])
    targeting: Optional[Dict[str, Any]] = None
    placements: Optional[str] = Field(default="advantage")
    bid_strategy: Optional[str] = Field(default="LOWEST_COST_WITHOUT_CAP")


@router.get("/audience-suggestions")
async def get_audience_suggestions(request: Request):
    """Suggested starting audiences for a cold perfume/luxury account."""
    db = request.app.state.db
    user = await __import__("utils.auth", fromlist=["get_current_user"]).get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return {
        "success": True,
        "account_id": os.environ.get("META_AD_ACCOUNT_ID"),
        "suggestions": [
            {"name": "Luxury fragrance enthusiasts", "interests": ["Perfume", "Luxury Goods", "Cosmetics"]},
            {"name": "Gift buyers", "interests": ["Gifts", "Luxury Gifts", "Special Occasions"]},
            {"name": "Beauty and personal care", "interests": ["Beauty", "Personal Care", "Skin Care"]},
        ],
        "recommendation": "Start with Advantage+ Audience, then layer these as audience suggestions.",
    }


@router.post("/campaigns/draft")
async def create_campaign_draft(request: Request, campaign: CampaignDraft):
    db = request.app.state.db
    user = await __import__("utils.auth", fromlist=["get_current_user"]).get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    campaign_doc = {
        "name": campaign.name,
        "objective": campaign.objective,
        "budget_daily": campaign.budget_daily,
        "status": campaign.status,
        "advantage_audience": campaign.advantage_audience,
        "advantage_placements": campaign.advantage_placements,
        "account_id": os.environ.get("META_AD_ACCOUNT_ID"),
    }
    result = await db.meta_campaigns.insert_one(campaign_doc)
    return {"success": True, "id": str(result.inserted_id), "campaign": campaign_doc}


@router.post("/creatives/draft")
async def create_creative_draft(request: Request, creative: AdCreativeDraft):
    db = request.app.state.db
    user = await __import__("utils.auth", fromlist=["get_current_user"]).get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    creative_doc = {
        "name": creative.name,
        "type": creative.type,
        "image_url": creative.image_url,
        "video_url": creative.video_url,
        "headline": creative.headline,
        "body": creative.body,
        "link_url": creative.link_url,
        "cta": creative.cta,
        "labels": creative.labels or [],
    }
    result = await db.meta_creatives.insert_one(creative_doc)
    return {"success": True, "id": str(result.inserted_id), "creative": creative_doc}


@router.post("/adsets/draft")
async def create_adset_draft(request: Request, adset: AdSetDraft):
    db = request.app.state.db
    user = await __import__("utils.auth", fromlist=["get_current_user"]).get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    adset_doc = {
        "name": adset.name,
        "campaign_id": adset.campaign_id,
        "audience_hints": adset.audience_hints,
        "targeting": adset.targeting or {},
        "placements": adset.placements,
        "bid_strategy": adset.bid_strategy,
    }
    result = await db.meta_adsets.insert_one(adset_doc)
    return {"success": True, "id": str(result.inserted_id), "adset": adset_doc}


@router.get("/experiments/suggest")
async def suggest_ab_experiments(request: Request):
    """Suggest first A/B tests based on Meta manager guidance."""
    db = request.app.state.db
    user = await __import__("utils.auth", fromlist=["get_current_user"]).get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return {
        "success": True,
        "priority_order": ["creatives", "audiences", "placements"],
        "experiments": [
            {
                "name": "Creative A/B: product image vs unboxing Reel",
                "type": "creative",
                "why": "Creative is highest leverage for a cold account.",
            },
            {
                "name": "Audience A/B: Advantage+ vs manual perfume/luxury interests",
                "type": "audience",
                "why": "Validate whether guided interests help early delivery.",
            },
            {
                "name": "Placement A/B: Advantage+ Placements vs Instagram-only",
                "type": "placement",
                "why": "Find efficient delivery surface after winning creative is known.",
            },
        ],
    }
