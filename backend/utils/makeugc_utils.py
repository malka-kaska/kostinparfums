import os
import uuid
from datetime import datetime, timezone
from typing import Optional
import httpx


class MakeUGCClient:
    def __init__(self, db) -> None:
        self.api_key = os.environ.get("MAKEUGC_API_KEY")
        self.base_url = "https://api.makeugc.ai/v1"
        self.db = db

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

    async def import_flow(self, *, flow_id: str, overrides: Optional[dict] = None) -> dict:
        if not self.api_key:
            return {"success": False, "error": "MAKEUGC_API_KEY is not configured"}

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.get(
                f"{self.base_url}/flows/{flow_id}",
                headers=self.auth_headers(),
            )
            response.raise_for_status()
            flow = response.json()

        if overrides:
            flow.update(overrides)

        campaign_id = await self._persist_flow(flow, source="imported")
        return {"success": True, "campaign_id": str(campaign_id), "flow": flow}

    async def create_flow(self, *, preset: str, product_url: str, hook: str, setting: str, cta: str, language: str = "bg", metadata: Optional[dict] = None) -> dict:
        flow_doc = {
            "preset": preset,
            "product_url": product_url,
            "hook": hook,
            "setting": setting,
            "cta": cta,
            "language": language,
            "status": "draft",
            "metadata": metadata or {},
            "source": "manual",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        campaign_id = await self._persist_flow(flow_doc, source="manual")
        return {"success": True, "campaign_id": str(campaign_id), "flow": flow_doc}

    async def generate_script(self, *, product_name: str, brand: str, language: str = "bg", hook: str = "", cta: str = "", setting: str = "") -> dict:
        title = f"KOSTIN UGC — {product_name} by {brand}"
        duration_seconds = 22
        scene_outline = [
            {"t": "0-3s", "visual": f"{setting or 'clean bedroom vanity with soft daylight'}", "action": hook or f"Reveal {product_name} packaging"},
            {"t": "3-10s", "visual": f"{product_name} bottle close-up", "action": "Scent description / feel"},
            {"t": "10-17s", "visual": "marble surface + spray mist", "action": "Use context / occasion"},
            {"t": "17-22s", "visual": "CTA card on black/gold background", "action": cta or "Discover at kostinparfums.com"},
        ]
        if language == "bg":
            narration = (
                f"Ако търсиш оригинален парфюм, който изглежда и се усеща като истински подарък, "
                f"KOSTIN има точно това. Подбрани нишови и дизайнерски аромати, премиум усещане и доставка в България. "
                f"{cta or 'Открий своя аромат в KOSTIN.'}"
            )
        else:
            narration = (
                f"If you want an original fragrance that feels like a real gift, KOSTIN is made for that. "
                f"Curated niche and designer perfumes with premium presentation and delivery in Bulgaria. "
                f"{cta or 'Discover your scent at kostinparfums.com.'}"
            )

        script = {
            "title": title,
            "duration_seconds": duration_seconds,
            "language": language,
            "brand_safe": True,
            "narration": narration,
            "scene_outline": scene_outline,
            "ugc_prompt": f"{hook}. {setting}. CTA={cta}",
        }
        return {"success": True, "script": script}

    async def _persist_flow(self, flow_doc: dict, *, source: str) -> str:
        campaign_id = flow_doc.get("id") or str(uuid.uuid4())
        await self.db.campaign_flows.update_one(
            {"_id": campaign_id},
            {
                "$set": {
                    **flow_doc,
                    "_id": campaign_id,
                    "source": source,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()},
            },
            upsert=True,
        )
        return campaign_id
