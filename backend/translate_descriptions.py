import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

BATCH_SIZE = 10

async def translate_descriptions():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Find products that don't have description_bg yet
    cursor = db.products.find(
        {"description": {"$exists": True, "$ne": ""}, "description_bg": {"$exists": False}},
        {"_id": 1, "name": 1, "brand": 1, "description": 1}
    )
    products = await cursor.to_list(length=500)
    total = len(products)
    print(f"Found {total} products needing Bulgarian descriptions")

    if total == 0:
        print("All products already have Bulgarian descriptions!")
        client.close()
        return

    for i in range(0, total, BATCH_SIZE):
        batch = products[i:i+BATCH_SIZE]
        print(f"\nProcessing batch {i//BATCH_SIZE + 1} ({i+1}-{min(i+BATCH_SIZE, total)} of {total})...")

        # Build a single prompt for the batch
        descriptions_text = ""
        for idx, prod in enumerate(batch):
            desc = prod["description"].replace("<br>", " ").replace("<br/>", " ")
            # Strip HTML tags
            import re
            desc = re.sub(r'<[^>]+>', '', desc)
            descriptions_text += f"[{idx}] Product: {prod['name']} by {prod['brand']}\nDescription: {desc}\n\n"

        chat = LlmChat(
            api_key=LLM_KEY,
            session_id=f"translate-batch-{i}",
            system_message=(
                "You are a professional translator. Translate the following product descriptions from English to Bulgarian. "
                "DO NOT translate product names, brand names, or technical terms that are universally recognized. "
                "Keep the same luxurious, marketing tone. "
                "Return ONLY the translations in the format:\n[0] translation\n[1] translation\n... etc.\n"
                "Do not add any extra text, headers, or explanations."
            )
        )
        chat.with_model("openai", "gpt-4.1-mini")

        msg = UserMessage(text=f"Translate these {len(batch)} product descriptions to Bulgarian:\n\n{descriptions_text}")

        try:
            response = await chat.send_message(msg)
            # Parse the response
            lines = response.strip().split("\n")
            translations = {}
            current_idx = None
            current_text = []

            for line in lines:
                import re as re2
                match = re2.match(r'^\[(\d+)\]\s*(.*)', line)
                if match:
                    if current_idx is not None:
                        translations[current_idx] = " ".join(current_text).strip()
                    current_idx = int(match.group(1))
                    current_text = [match.group(2)]
                elif current_idx is not None:
                    current_text.append(line)

            if current_idx is not None:
                translations[current_idx] = " ".join(current_text).strip()

            # Update products in DB
            updated = 0
            for idx, prod in enumerate(batch):
                if idx in translations and translations[idx]:
                    await db.products.update_one(
                        {"_id": prod["_id"]},
                        {"$set": {"description_bg": translations[idx]}}
                    )
                    updated += 1
                    print(f"  Updated: {prod['name'][:50]}...")
                else:
                    print(f"  MISSING translation for [{idx}] {prod['name'][:50]}")

            print(f"  Batch complete: {updated}/{len(batch)} updated")

        except Exception as e:
            print(f"  ERROR in batch: {e}")
            # Try individual translations as fallback
            for idx, prod in enumerate(batch):
                try:
                    desc = prod["description"].replace("<br>", " ").replace("<br/>", " ")
                    import re
                    desc = re.sub(r'<[^>]+>', '', desc)
                    
                    single_chat = LlmChat(
                        api_key=LLM_KEY,
                        session_id=f"translate-single-{prod['_id']}",
                        system_message="Translate the product description to Bulgarian. Keep brand/product names untranslated. Return ONLY the translation."
                    )
                    single_chat.with_model("openai", "gpt-4.1-mini")
                    single_msg = UserMessage(text=f"Product: {prod['name']} by {prod['brand']}\nDescription: {desc}")
                    single_resp = await single_chat.send_message(single_msg)
                    
                    await db.products.update_one(
                        {"_id": prod["_id"]},
                        {"$set": {"description_bg": single_resp.strip()}}
                    )
                    print(f"  Updated (single): {prod['name'][:50]}...")
                except Exception as e2:
                    print(f"  FAILED (single) {prod['name'][:50]}: {e2}")

    # Verify
    count = await db.products.count_documents({"description_bg": {"$exists": True, "$ne": ""}})
    total_products = await db.products.count_documents({})
    print(f"\nDone! {count}/{total_products} products now have Bulgarian descriptions.")
    client.close()

if __name__ == "__main__":
    asyncio.run(translate_descriptions())
