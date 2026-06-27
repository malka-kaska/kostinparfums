"""
Admin endpoint for scent profile migration.
Allows admins to trigger and monitor the LLM-based scent profile analysis.
"""
import asyncio
import os
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/scent-migration", tags=["admin"])

# Migration state (in-memory for simplicity)
migration_state = {
    "is_running": False,
    "total": 0,
    "processed": 0,
    "errors": 0,
    "started_at": None,
    "last_product": None,
}

# Scent profile categories
SCENT_PROFILES = {
    "sweet": "Сладки",
    "fresh": "Свежи", 
    "citrus": "Цитрусови",
    "fruity": "Плодови",
    "floral": "Флорални",
    "woody": "Дървесни",
    "spicy": "Пикантни",
    "aquatic": "Водни",
    "musky": "Мускусни",
    "leather": "Кожени",
    "tobacco": "Тютюневи",
    "oriental": "Ориенталски",
    "vanilla": "Ванилови"
}

SYSTEM_PROMPT = """You are a perfume expert. Analyze the perfume name and description to determine its scent profile(s).

Available scent profiles:
- sweet: Sweet, gourmand, sugary notes
- fresh: Clean, crisp, airy scents
- citrus: Lemon, orange, bergamot, grapefruit notes
- fruity: Apple, peach, berry, tropical fruit notes
- floral: Rose, jasmine, lily, iris, violet notes
- woody: Sandalwood, cedar, oud, vetiver notes
- spicy: Pepper, cinnamon, cardamom, saffron notes
- aquatic: Ocean, marine, watery, ozonic notes
- musky: Musk, skin-like, sensual notes
- leather: Leather, suede, smoky notes
- tobacco: Tobacco leaf, smoky, warm notes
- oriental: Amber, incense, resins, exotic spices
- vanilla: Vanilla, tonka bean, benzoin notes

RULES:
1. Return ONLY a JSON array of profile keys (e.g., ["woody", "oriental", "spicy"])
2. Select 1-4 profiles that best describe the fragrance
3. Base your analysis on the name, brand reputation, and description
4. If description is missing or unclear, use brand and name to make educated guesses
5. Do not include any explanation, just the JSON array

Example response: ["oriental", "woody", "vanilla"]"""


async def analyze_product_with_llm(chat: LlmChat, product: dict) -> list:
    """Analyze a single product and return its scent profiles"""
    name = product.get("name", "")
    brand = product.get("brand", "")
    description = product.get("description", "") or product.get("description_bg", "")
    
    prompt = f"""Perfume: {name}
Brand: {brand}
Description: {description if description else "No description available"}

Analyze and return the scent profile JSON array:"""

    try:
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        response_text = response.strip()
        # Handle markdown code blocks
        if "```" in response_text:
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        profiles = json.loads(response_text)
        
        # Validate profiles
        valid_profiles = [p for p in profiles if p in SCENT_PROFILES]
        return valid_profiles[:4]  # Max 4 profiles
        
    except Exception as e:
        logger.error(f"Error analyzing product {name}: {e}")
        return []


async def run_migration_task(db):
    """Background task to run the migration"""
    global migration_state
    
    EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
    if not EMERGENT_LLM_KEY:
        logger.error("EMERGENT_LLM_KEY not found")
        migration_state["is_running"] = False
        return
    
    # Initialize LLM chat
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"scent-migration-{datetime.now().isoformat()}",
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o-mini")
    
    # Get VISIBLE products without scent_profiles (only analyze visible products)
    query = {
        "is_visible": True,
        "$or": [
            {"scent_profiles": {"$exists": False}},
            {"scent_profiles": []},
            {"scent_profiles": None}
        ]
    }
    
    migration_state["total"] = await db.products.count_documents(query)
    migration_state["processed"] = 0
    migration_state["errors"] = 0
    
    cursor = db.products.find(query)
    batch_size = 10
    
    async for product in cursor:
        if not migration_state["is_running"]:
            logger.info("Migration stopped by user")
            break
            
        product_id = product["_id"]
        name = product.get("name", "Unknown")
        
        try:
            profiles = await analyze_product_with_llm(chat, product)
            
            if profiles:
                await db.products.update_one(
                    {"_id": product_id},
                    {"$set": {
                        "scent_profiles": profiles,
                        "scent_profiles_updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                migration_state["last_product"] = f"{name}: {profiles}"
            else:
                migration_state["errors"] += 1
                migration_state["last_product"] = f"{name}: No profiles detected"
            
            migration_state["processed"] += 1
            
            # Rate limiting
            if migration_state["processed"] % batch_size == 0:
                await asyncio.sleep(0.5)
                
        except Exception as e:
            logger.error(f"Error processing {name}: {e}")
            migration_state["errors"] += 1
            migration_state["processed"] += 1
    
    migration_state["is_running"] = False
    logger.info(f"Migration complete! Processed: {migration_state['processed']}, Errors: {migration_state['errors']}")


@router.get("/status")
async def get_migration_status(request: Request):
    """Get the current migration status"""
    db = request.app.state.db
    
    # Get current counts from DB (only visible products)
    total_visible = await db.products.count_documents({"is_visible": True})
    visible_with_profiles = await db.products.count_documents({
        "is_visible": True,
        "scent_profiles": {"$exists": True, "$not": {"$in": [[], None]}}
    })
    
    return {
        "is_running": migration_state["is_running"],
        "total_to_process": migration_state["total"],
        "processed": migration_state["processed"],
        "errors": migration_state["errors"],
        "started_at": migration_state["started_at"],
        "last_product": migration_state["last_product"],
        "db_stats": {
            "total_visible": total_visible,
            "with_profiles": visible_with_profiles,
            "percentage": round(visible_with_profiles / total_visible * 100, 1) if total_visible > 0 else 0
        }
    }


@router.post("/start")
async def start_migration(request: Request, background_tasks: BackgroundTasks):
    """Start the scent profile migration in the background"""
    global migration_state
    
    # Check if already running
    if migration_state["is_running"]:
        raise HTTPException(status_code=400, detail="Migration is already running")
    
    # Verify admin access
    from routes.auth import get_current_user
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Start migration
    migration_state["is_running"] = True
    migration_state["started_at"] = datetime.now(timezone.utc).isoformat()
    migration_state["processed"] = 0
    migration_state["errors"] = 0
    
    # Run in background
    background_tasks.add_task(run_migration_task, db)
    
    return {"message": "Migration started", "status": "running"}


@router.post("/stop")
async def stop_migration(request: Request):
    """Stop the running migration"""
    global migration_state
    
    # Verify admin access
    from routes.auth import get_current_user
    db = request.app.state.db
    user = await get_current_user(request, db)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not migration_state["is_running"]:
        raise HTTPException(status_code=400, detail="Migration is not running")
    
    migration_state["is_running"] = False
    return {"message": "Migration stop requested", "status": "stopping"}
