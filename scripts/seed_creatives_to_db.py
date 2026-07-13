#!/usr/bin/env python3
"""
KOSTIN Parfums — Database Creative Seeder
Connects to MongoDB and populates the meta_creatives and social_posts collections
using the uploaded Cloudinary URLs.
"""
import os
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

def main():
    repo_root = Path(__file__).resolve().parent.parent
    load_dotenv(dotenv_path=repo_root / ".env")
    
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    
    if not mongo_url or not db_name:
        logger.error("MONGO_URL or DB_NAME missing from environment variables (.env).")
        return
        
    cloudinary_urls_path = repo_root / "marketing" / "creatives" / "generated" / "cloudinary_urls.json"
    if not cloudinary_urls_path.exists():
        logger.error(f"Cloudinary URLs manifest not found at: {cloudinary_urls_path}")
        logger.error("Please run scripts/upload_creatives_to_cloudinary.py first.")
        return
        
    with open(cloudinary_urls_path, "r", encoding="utf-8") as f:
        cloudinary_data = json.load(f)
        
    logger.info(f"Connecting to database: {db_name} ...")
    try:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        client.admin.command('ping')
        logger.info("Database connection successful!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.warning("If this is a timeout/whitelist issue, the script can be run on the production server where access is allowed.")
        return

    # Seed Meta Creatives (from meta_briefs)
    meta_briefs_info = {
        "tofu_top_luxury": {
            "name": "Meta TOFU — Top luxury",
            "headline": "2026-те са най-желаните лукс аромати",
            "body": "Разкрий най-актуалните нише и дизайнер аромати за 2026: Xerjoff Erba Pura, Creed Aventus, Parfums de Marly Delina, Dior Sauvage Elixir. 100% автентичност, бърза BG/ЕУ доставка и подходяща цена за лукс ниво.",
            "labels": ["TOFU", "Luxury", "Bestsellers"]
        },
        "mofu_everyday": {
            "name": "Meta MOFU — Everyday",
            "headline": "Ароматът, който ще носиш всеки ден",
            "body": "Избери аромат, който става част от ежедневието. От €76 — от нише oud/musk до класически премиум. Подходящ за работа, събития и личен стил.",
            "labels": ["MOFU", "Everyday", "Casual"]
        },
        "bofu_cart": {
            "name": "Meta BOFU — Cart",
            "headline": "Количка/Checkout спасяване",
            "body": "Sauvage Elixir и топ аромати с намалена наличност. Не оставяй избраното да изчезне. Добави в количката сега, за да го резервираш. Безплатна доставка от €90.",
            "labels": ["BOFU", "Cart", "Urgency"]
        },
        "auth_authentic": {
            "name": "Meta AUTH — Authentic",
            "headline": "4.7★ от 200+ потвърдени купувачи",
            "body": "Не вярвай на думите ни — вярвай на тези, които вече са опитали. Над 200 потвърдени ревюта с 4.7★ средна оценка. 100% автентични лукс парфюми.",
            "labels": ["AUTH", "SocialProof", "UGC"]
        },
        "price_gift": {
            "name": "Meta PRICE — Gift",
            "headline": "Завърши образа / Изпрати подарък",
            "body": "Избери бестселъра или очаквай подаръка с колекционерски сет/дуо/трио от топ марки — Dior, Chanel, Xerjoff, YSL. Редакторски подбор за повод.",
            "labels": ["PRICE", "Gift", "Editorial"]
        }
    }
    
    logger.info("Seeding meta_creatives...")
    meta_count = 0
    for key, info in meta_briefs_info.items():
        # Find matching Cloudinary URL
        match_key = f"marketing/creatives/generated/meta_briefs/{key}.png"
        if match_key not in cloudinary_data:
            logger.warning(f"Cloudinary URL missing for {match_key}")
            continue
            
        url = cloudinary_data[match_key]["url"]
        doc = {
            "name": info["name"],
            "type": "image",
            "image_url": url,
            "video_url": None,
            "headline": info["headline"],
            "body": info["body"],
            "link_url": "https://kostinparfums.com",
            "cta": "SHOP_NOW",
            "labels": info["labels"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert by name
        db.meta_creatives.replace_one({"name": info["name"]}, doc, upsert=True)
        meta_count += 1
        logger.info(f"✓ Seeded meta creative: {info['name']}")
        
    # Seed Social Posts (from ig_stories and fb_ads)
    social_posts_info = [
        {
            "match_key": "marketing/creatives/generated/ig_stories/day1_erba_pura_teaser.png",
            "title": "IG Story Ден 1 — Тийзър (Erba Pura)",
            "body": "Спираш на улицата. Питаш какво е. Точно такъв е Erba Pura от Xerjoff.",
            "platforms": ["instagram"],
            "tags": ["teaser", "erba-pura"]
        },
        {
            "match_key": "marketing/creatives/generated/ig_stories/day1_erba_pura_reveal.png",
            "title": "IG Story Ден 1 — Представяне (Erba Pura)",
            "body": "Спираш на улицата. Питаш какво е. Точно такъв е Erba Pura от Xerjoff. Вече наличен на kostinparfums.com",
            "platforms": ["instagram"],
            "tags": ["reveal", "erba-pura"]
        },
        {
            "match_key": "marketing/creatives/generated/ig_stories/day3_quiz.png",
            "title": "IG Story Ден 3 — Куиз",
            "body": "Знаеш ли кои са основните нотки на любимия ти аромат? Направи куиза в стори!",
            "platforms": ["instagram"],
            "tags": ["quiz", "education"]
        },
        {
            "match_key": "marketing/creatives/generated/ig_stories/day4_tip.png",
            "title": "IG Story Ден 4 — Съвет за нанасяне",
            "body": "Как да нанасяме парфюм правилно? Виж нашите 3 бързи съвета.",
            "platforms": ["instagram"],
            "tags": ["tips", "education"]
        },
        {
            "match_key": "marketing/creatives/generated/ig_stories/day5_weekend_offer.png",
            "title": "IG Story Ден 5 — Уикенд оферта",
            "body": "Специални предложения за уикенда! Спести сега на избрани нише и дизайнер аромати.",
            "platforms": ["instagram"],
            "tags": ["offer", "weekend"]
        },
        {
            "match_key": "marketing/creatives/generated/ig_stories/day6_poll.png",
            "title": "IG Story Ден 6 — Анкета нотки",
            "body": "Сладък или свеж? Кажи ни в анкетата коя ароматна категория предпочиташ.",
            "platforms": ["instagram"],
            "tags": ["poll", "engagement"]
        },
        {
            "match_key": "marketing/creatives/generated/ig_stories/day7_reviews.png",
            "title": "IG Story Ден 7 — Ревюта",
            "body": "4.7★ от 200+ потвърдени купувачи. Прочети какво казват клиентите ни.",
            "platforms": ["instagram"],
            "tags": ["reviews", "social-proof"]
        },
        {
            "match_key": "marketing/creatives/generated/fb_ads/launch_brand_1200.png",
            "title": "FB Launch — Brand",
            "body": "KOSTIN Parfums — твоят нов стандарт за луксозни аромати в Европа. 100% автентичност, безплатна доставка над €100.",
            "platforms": ["facebook"],
            "tags": ["launch", "brand"]
        },
        {
            "match_key": "marketing/creatives/generated/fb_ads/spotlight_1200x1500.png",
            "title": "FB Spotlight",
            "body": "В светлината на прожекторите: най-желаните летни аромати. Открий своя подпис сега.",
            "platforms": ["facebook"],
            "tags": ["spotlight", "bestsellers"]
        },
        {
            "match_key": "marketing/creatives/generated/fb_ads/cart_reminder_1200x628.png",
            "title": "FB Cart Reminder",
            "body": "Ароматът в количката ти те очаква. Завърши поръчката си с бърза доставка.",
            "platforms": ["facebook"],
            "tags": ["cart-reminder", "urgency"]
        }
    ]
    
    logger.info("Seeding social_posts...")
    social_count = 0
    for info in social_posts_info:
        if info["match_key"] not in cloudinary_data:
            logger.warning(f"Cloudinary URL missing for {info['match_key']}")
            continue
            
        url = cloudinary_data[info["match_key"]]["url"]
        doc = {
            "title": info["title"],
            "body": info["body"],
            "platforms": info["platforms"],
            "media_urls": [url],
            "scheduled_at": None,
            "status": "draft",
            "tags": info["tags"] + ["auto-seeded"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Upsert by title
        db.social_posts.replace_one({"title": info["title"]}, doc, upsert=True)
        social_count += 1
        logger.info(f"✓ Seeded social post: {info['title']}")
        
    print(f"\nSuccessfully seeded {meta_count} meta creatives and {social_count} social posts to MongoDB!")

if __name__ == "__main__":
    main()
