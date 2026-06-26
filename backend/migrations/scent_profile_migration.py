"""
Migration script to analyze product descriptions and assign scent profiles using LLM.
Run this script once to populate scent_profiles for all products.
"""
import asyncio
import os
import json
import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "kostin_cosmetics")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# Scent profile categories (Bulgarian keys for DB, English for analysis)
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


async def run_migration():
    """Main migration function"""
    logger.info("Starting scent profile migration...")
    
    if not EMERGENT_LLM_KEY:
        logger.error("EMERGENT_LLM_KEY not found in environment")
        return
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Initialize LLM chat
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"scent-migration-{datetime.now().isoformat()}",
        system_message=SYSTEM_PROMPT
    ).with_model("openai", "gpt-4o-mini")
    
    # Get all products without scent_profiles or with empty scent_profiles
    query = {
        "$or": [
            {"scent_profiles": {"$exists": False}},
            {"scent_profiles": []},
            {"scent_profiles": None}
        ]
    }
    
    total = await db.products.count_documents(query)
    logger.info(f"Found {total} products to analyze")
    
    cursor = db.products.find(query)
    processed = 0
    errors = 0
    batch_size = 10  # Process in batches to avoid rate limits
    
    async for product in cursor:
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
                logger.info(f"[{processed + 1}/{total}] {name}: {profiles}")
            else:
                logger.warning(f"[{processed + 1}/{total}] {name}: No profiles detected")
                errors += 1
            
            processed += 1
            
            # Rate limiting - small delay between requests
            if processed % batch_size == 0:
                logger.info(f"Processed {processed}/{total} products...")
                await asyncio.sleep(1)  # Small delay to avoid rate limits
                
        except Exception as e:
            logger.error(f"Error processing {name}: {e}")
            errors += 1
            processed += 1
    
    logger.info(f"Migration complete! Processed: {processed}, Errors: {errors}")
    client.close()


if __name__ == "__main__":
    asyncio.run(run_migration())
