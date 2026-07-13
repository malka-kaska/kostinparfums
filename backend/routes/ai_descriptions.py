"""AI-powered product description generator.

Uses Emergent LLM integration (OpenAI GPT models) to generate rich, SEO-friendly
product descriptions in both Bulgarian and English for luxury perfumes.
"""
import os
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional, List

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai-descriptions", tags=["ai-descriptions"])


SYSTEM_PROMPT_BG = """Ти си експертен копирайтър за луксозен онлайн магазин за парфюми KOSTIN.

Задача: Напиши богато, SEO-оптимизирано описание на парфюм на български език.

ИЗИСКВАНИЯ:
1. Дължина: 120-180 думи
2. Структура (естествено вплетени, БЕЗ заглавия и bullet points):
   - Първо изречение: емоционална, чувствена характеристика на аромата
   - Следващ параграф: ароматна пирамида (връхни, средни, базови нотки) - използвай знанията си за парфюма
   - Финал: за кого е подходящ, повод, настроение
3. Тон: изтънчен, луксозен, но достъпен. Без клишета като "този прекрасен парфюм".
4. Използвай ключови думи естествено: марката, името, "парфюм", "аромат", "нотки", тип аромат.
5. НЕ използвай HTML тагове. Само чист текст с параграфи, разделени с празен ред.

Отговори САМО с описанието, без обяснения."""


SYSTEM_PROMPT_EN = """You are an expert copywriter for KOSTIN, a luxury online perfume boutique.

Task: Write a rich, SEO-friendly product description in English for a perfume.

REQUIREMENTS:
1. Length: 120-180 words
2. Structure (naturally woven, NO headings or bullet points):
   - Opening: emotional, sensory characterization of the fragrance
   - Middle paragraph: scent pyramid (top, heart, base notes) — use your knowledge of the perfume
   - Closing: who it suits, occasions, mood evoked
3. Tone: refined, luxurious, yet accessible. Avoid clichés like "this wonderful fragrance".
4. Use SEO keywords naturally: brand, name, "perfume", "fragrance", "notes", scent type.
5. NO HTML tags. Plain text with paragraphs separated by blank lines.

Respond ONLY with the description text, no explanations."""


class GenerateDescriptionRequest(BaseModel):
    languages: List[str] = ["bg", "en"]  # which languages to generate
    force: bool = False  # regenerate even if description exists


class BulkGenerateRequest(BaseModel):
    languages: List[str] = ["bg", "en"]
    only_missing: bool = True  # if True, only regenerate products missing description
    limit: int = 50  # max products per run


# Bulk generation state
_bulk_state = {
    "is_running": False,
    "total": 0,
    "processed": 0,
    "errors": 0,
    "started_at": None,
    "current_product": "",
}


async def _generate_description(product: dict, language: str) -> str:
    """Generate a description for a single product in the given language."""
    EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY not configured")

    system_prompt = SYSTEM_PROMPT_BG if language == "bg" else SYSTEM_PROMPT_EN

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"desc-{product.get('_id', 'x')}-{language}-{datetime.now().timestamp()}",
        system_message=system_prompt,
    ).with_model("openai", "gpt-4o-mini")

    name = product.get("name", "")
    brand = product.get("brand", "")
    gender = product.get("gender", [])
    scent_profiles = product.get("scent_profiles", [])

    context_parts = [
        f"Perfume name: {name}",
        f"Brand: {brand}",
    ]
    if gender:
        context_parts.append(f"Gender: {', '.join(gender)}")
    if scent_profiles:
        context_parts.append(f"Scent profile tags: {', '.join(scent_profiles)}")

    prompt = "\n".join(context_parts) + (
        "\n\nWrite a compelling product description now (respond in Bulgarian)."
        if language == "bg"
        else "\n\nWrite a compelling product description now (respond in English)."
    )

    response = await chat.send_message(UserMessage(text=prompt))
    text = (response or "").strip()

    # Strip stray markdown fences if any
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith(("text", "markdown")):
            text = text.split("\n", 1)[1] if "\n" in text else text
        text = text.strip("` \n")

    return text


async def _require_admin(request):
    """Helper to verify admin auth."""
    db = request.app.state.db
    from utils.auth import get_current_user
    try:
        user = await get_current_user(request, db)
    except Exception:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.post("/product/{product_id}")
async def generate_for_product(request: Request, product_id: str, data: GenerateDescriptionRequest):
    """Generate AI descriptions for a single product (admin only)."""
    await _require_admin(request)
    db = request.app.state.db

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    languages = [l for l in (data.languages or []) if l in ("bg", "en")]
    if not languages:
        languages = ["bg", "en"]

    updates = {}
    results = {}

    for lang in languages:
        field = "description_bg" if lang == "bg" else "description"
        # Skip if description exists and not forced
        existing = (product.get(field) or "").strip()
        if existing and not data.force:
            results[lang] = {"skipped": True, "reason": "exists", "text": existing}
            continue

        try:
            text = await _generate_description(product, lang)
            updates[field] = text
            results[lang] = {"text": text, "words": len(text.split())}
        except Exception as e:
            logger.error(f"AI description ({lang}) failed for {product_id}: {e}")
            results[lang] = {"error": str(e)}

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.update_one({"_id": product["_id"]}, {"$set": updates})

    return {"product_id": product_id, "results": results}


@router.get("/bulk/status")
async def bulk_status(request: Request):
    """Get current bulk generation status (admin only)."""
    await _require_admin(request)
    return dict(_bulk_state)


@router.post("/bulk/stop")
async def bulk_stop(request: Request):
    """Stop an in-progress bulk run (admin only)."""
    await _require_admin(request)
    _bulk_state["is_running"] = False
    return {"stopped": True, "state": dict(_bulk_state)}


async def _run_bulk_task(db, languages: List[str], only_missing: bool, limit: int):
    """Background task to generate descriptions for many products."""
    global _bulk_state
    try:
        # Build query
        if only_missing:
            or_clauses = []
            if "bg" in languages:
                or_clauses.append({"description_bg": {"$in": [None, ""]}})
                or_clauses.append({"description_bg": {"$exists": False}})
            if "en" in languages:
                or_clauses.append({"description": {"$in": [None, ""]}})
                or_clauses.append({"description": {"$exists": False}})
            query = {"is_active": True, "is_visible": True, "$or": or_clauses}
        else:
            query = {"is_active": True, "is_visible": True}

        total = await db.products.count_documents(query)
        _bulk_state["total"] = min(total, limit)
        _bulk_state["processed"] = 0
        _bulk_state["errors"] = 0
        _bulk_state["started_at"] = datetime.now(timezone.utc).isoformat()

        cursor = db.products.find(query).limit(limit)

        async for product in cursor:
            if not _bulk_state["is_running"]:
                logger.info("Bulk description generation stopped by user")
                break

            _bulk_state["current_product"] = product.get("name", "")
            updates = {}
            for lang in languages:
                field = "description_bg" if lang == "bg" else "description"
                existing = (product.get(field) or "").strip()
                if only_missing and existing:
                    continue
                try:
                    text = await _generate_description(product, lang)
                    if text:
                        updates[field] = text
                except Exception as e:
                    logger.error(f"Bulk desc failed ({lang}) for {product.get('_id')}: {e}")
                    _bulk_state["errors"] += 1

            if updates:
                updates["updated_at"] = datetime.now(timezone.utc).isoformat()
                try:
                    await db.products.update_one({"_id": product["_id"]}, {"$set": updates})
                except Exception as e:
                    logger.error(f"DB update failed: {e}")
                    _bulk_state["errors"] += 1

            _bulk_state["processed"] += 1
    finally:
        _bulk_state["is_running"] = False
        _bulk_state["current_product"] = ""


@router.post("/bulk/start")
async def bulk_start(request: Request, data: BulkGenerateRequest, background_tasks: BackgroundTasks):
    """Start bulk generation of AI descriptions in background (admin only)."""
    await _require_admin(request)
    db = request.app.state.db

    if _bulk_state["is_running"]:
        raise HTTPException(status_code=409, detail="Bulk generation already running")

    languages = [l for l in (data.languages or []) if l in ("bg", "en")]
    if not languages:
        languages = ["bg", "en"]

    limit = max(1, min(500, data.limit))

    _bulk_state["is_running"] = True
    _bulk_state["total"] = 0
    _bulk_state["processed"] = 0
    _bulk_state["errors"] = 0
    _bulk_state["started_at"] = datetime.now(timezone.utc).isoformat()
    _bulk_state["current_product"] = ""

    background_tasks.add_task(_run_bulk_task, db, languages, data.only_missing, limit)

    return {"started": True, "languages": languages, "limit": limit, "only_missing": data.only_missing}
