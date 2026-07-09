import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from utils.makeugc_utils import MakeUGCClient
from models.schemas import MakeUGCFlowRequest, CampaignAssetResponse


router = APIRouter()
makeugc_client_factory = lambda db: MakeUGCClient(db=db)


def _asset_doc_to_response(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", "")),
        "product_id": doc.get("product_id"),
        "product_name": doc.get("product_name"),
        "brand": doc.get("brand"),
        "campaign_type": doc.get("campaign_type"),
        "aspect_ratio": doc.get("aspect_ratio"),
        "prompt": doc.get("prompt"),
        "provider": doc.get("provider"),
        "status": doc.get("status", "generated"),
        "asset_url": doc.get("asset_url"),
        "thumbnail_url": doc.get("thumbnail_url"),
        "meta_asset_id": doc.get("meta_asset_id"),
        "metadata": doc.get("metadata"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.post("/flows/import")
async def import_flow(request: Request, payload: MakeUGCFlowRequest):
    if not payload.flow_id:
        raise HTTPException(status_code=400, detail="flow_id is required")

    client = makeugc_client_factory(request.app.state.db)
    result = await client.import_flow(flow_id=payload.flow_id)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "MakeUGC import failed"))
    return result


@router.post("/flows")
async def create_flow(request: Request, payload: MakeUGCFlowRequest):
    client = makeugc_client_factory(request.app.state.db)
    if not client.is_configured() and not payload.product_url:
        raise HTTPException(status_code=400, detail="MakeUGC integration is not configured")

    result = await client.create_flow(
        preset=payload.flow_preset,
        product_url=payload.product_url or "https://kostinparfums.com",
        hook=payload.hook or "This feels like opening a luxury gift.",
        setting=payload.setting or "clean bedroom vanity with soft daylight",
        cta=payload.cta or "Открий своя аромат в KOSTIN.",
        language=payload.language,
    )
    return result


@router.post("/flows/scripts")
async def generate_script(request: Request, payload: MakeUGCFlowRequest):
    db = request.app.state.db
    product_name = payload.product_name or "KOSTIN Parfums"
    brand = payload.brand or "KOSTIN"

    if payload.product_id:
        if ObjectId.is_valid(payload.product_id):
            product = await db.products.find_one({"_id": ObjectId(payload.product_id)})
            if product:
                product_name = product.get("name", product_name)
                brand = product.get("brand", brand)

    client = makeugc_client_factory(db)
    result = await client.generate_script(
        product_name=product_name,
        brand=brand,
        language=payload.language,
        hook=payload.hook,
        cta=payload.cta,
        setting=payload.setting,
    )

    asset_id = None
    if payload.save_script and result.get("script"):
        script_doc = {
            "product_id": payload.product_id,
            "product_name": product_name,
            "brand": brand,
            "campaign_type": "ugc_video",
            "aspect_ratio": "9:16",
            "prompt": payload.hook or result["script"].get("ugc_prompt", ""),
            "provider": "makeugc",
            "status": "script_ready",
            "asset_url": None,
            "thumbnail_url": None,
            "metadata": result.get("script"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        insert_result = await db.campaign_assets.insert_one(script_doc)
        asset_id = str(insert_result.inserted_id)

    return {"success": True, "script": result.get("script"), "asset_id": asset_id, **result}
