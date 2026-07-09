import os
import uuid
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from bson import ObjectId
from utils.huggingface_utils import HuggingFaceClient
from utils.cloudinary_utils import cloudinary_upload
from models.schemas import HuggingFaceGenerateRequest, CampaignAssetResponse


class CloudinaryAssetIdFormatter:
    @staticmethod
    def to_meta_asset_id(cloudinary_result: dict | None) -> str | None:
        if not cloudinary_result:
            return None
        public_id = cloudinary_result.get("public_id") or cloudinary_result.get("asset_id")
        if public_id:
            return f"cloudinary:{public_id}"
        return None


router = APIRouter()
hf_client = HuggingFaceClient()


def _asset_doc_to_response(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", "")),
        "product_id": doc.get("product_id"),
        "product_name": doc.get("product_name"),
        "brand": doc.get("brand"),
        "campaign_type": doc.get("campaign_type"),
        "aspect_ratio": doc.get("aspect_ratio"),
        "prompt": doc.get("prompt"),
        "provider": doc.get("provider", "huggingface"),
        "status": doc.get("status", "generated"),
        "asset_url": doc.get("asset_url"),
        "thumbnail_url": doc.get("thumbnail_url"),
        "meta_asset_id": doc.get("meta_asset_id"),
        "metadata": doc.get("metadata"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.post("/generate")
async def generate_image(request: Request, payload: HuggingFaceGenerateRequest):
    db = request.app.state.db
    if not hf_client.is_configured():
        raise HTTPException(status_code=400, detail="HuggingFace integration is not configured on the server")

    effective_prompt = payload.prompt
    brand = payload.brand
    if payload.product_id:
        if ObjectId.is_valid(payload.product_id):
            product = await db.products.find_one({"_id": ObjectId(payload.product_id)})
            if product:
                brand = brand or product.get("brand")
                effective_prompt = hf_client.build_marketing_prompt(
                    base_prompt=payload.prompt,
                    product_name=product.get("name", payload.prompt),
                    brand=product.get("brand", "KOSTIN"),
                    aspect_ratio=payload.aspect_ratio,
                )

    try:
        result = hf_client.text_to_image_sync(
            prompt=effective_prompt,
            negative_prompt=payload.negative_prompt,
            aspect_ratio=payload.aspect_ratio,
            model=payload.model,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"HuggingFace generation failed: {exc}") from exc

    asset_url = result.get("image_url") if isinstance(result, dict) else None
    thumbnail_url = asset_url
    cloudinary_result = None
    if payload.save_to_cloudinary and asset_url:
        try:
            async with httpx.AsyncClient(timeout=185) as client:
                image_response = await client.get(asset_url)
            cloudinary_result = cloudinary_upload(file_bytes=image_response.content, folder="campaigns/huggingface")
            asset_url = cloudinary_result.get("secure_url", asset_url)
            thumbnail_url = cloudinary_result.get("secure_url", asset_url)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Cloudinary upload failed: {exc}") from exc

    asset_doc = {
        "product_id": payload.product_id,
        "product_name": payload.product_name or (payload.prompt.split(" ", 1)[0] if payload.prompt else None),
        "brand": brand,
        "campaign_type": payload.campaign_type,
        "aspect_ratio": payload.aspect_ratio,
        "prompt": payload.prompt,
        "provider": "huggingface",
        "status": "generated",
        "asset_url": asset_url,
        "thumbnail_url": thumbnail_url,
        "meta_asset_id": CloudinaryAssetIdFormatter.to_meta_asset_id(cloudinary_result),
        "metadata": payload.metadata or {
            "model": result.get("model") if isinstance(result, dict) else None,
            "provider": result.get("provider") if isinstance(result, dict) else "huggingface",
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    insert_result = await db.campaign_assets.insert_one(asset_doc)
    asset_doc["_id"] = insert_result.inserted_id

    return CampaignAssetResponse(**_asset_doc_to_response(asset_doc))
