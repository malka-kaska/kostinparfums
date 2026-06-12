"""
CSV Product Import Script for KOSTIN E-commerce
Imports products from dropshipping supplier CSV into MongoDB
"""
import asyncio
import csv
import os
import re
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "kostin_db")


def clean_html(html_text: str) -> str:
    """Remove HTML tags from text"""
    if not html_text:
        return ""
    clean = re.sub(r'<[^>]+>', '', html_text)
    clean = clean.replace('&nbsp;', ' ').strip()
    return clean


def parse_price(price_str: str) -> float:
    """Parse price string to float"""
    if not price_str:
        return 0.0
    try:
        # Handle European format (e.g., "04.09" or "05.01")
        price_str = price_str.strip().replace(',', '.')
        return float(price_str)
    except (ValueError, TypeError):
        return 0.0


def map_category(categories_str: str) -> str:
    """Map CSV categories to our category IDs"""
    if not categories_str:
        return "other"
    
    cats_lower = categories_str.lower()
    
    # Priority mapping based on category hierarchy
    if 'perfumes' in cats_lower or 'perfume' in cats_lower:
        return 'perfumes'
    elif 'shaving' in cats_lower:
        return 'menscare'
    elif 'hair' in cats_lower or 'shampoo' in cats_lower:
        return 'haircare'
    elif 'makeup' in cats_lower or 'cosmetic' in cats_lower:
        return 'skincare'  # Map general cosmetics to skincare
    elif 'body' in cats_lower:
        return 'bodycare'
    elif 'skin' in cats_lower:
        return 'skincare'
    elif 'men' in cats_lower:
        return 'menscare'
    else:
        return 'skincare'  # Default fallback


def extract_brand(brand_str: str) -> str:
    """Extract and clean brand name"""
    if not brand_str:
        return "Unknown"
    return brand_str.strip()


def get_first_image(images_str: str) -> str:
    """Get the first image URL from comma-separated list"""
    if not images_str:
        return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"
    
    # Split by comma and get first valid URL
    images = images_str.split(',')
    for img in images:
        img = img.strip()
        if img.startswith('http'):
            return img
    
    return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"


async def import_products():
    """Main import function"""
    csv_path = "/tmp/dropship_catalog.csv"
    
    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found at {csv_path}")
        return
    
    print(f"Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Drop existing products
    print("Dropping existing products collection...")
    await db.products.drop()
    
    products_to_insert = []
    skipped = 0
    
    print(f"Reading CSV file from {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            sku = row.get('SKU', '').strip()
            name = row.get('Name', '').strip()
            
            # Skip rows without SKU or name
            if not sku or not name:
                skipped += 1
                continue
            
            price = parse_price(row.get('Regular price', '0'))
            
            # Skip products with no price
            if price <= 0:
                skipped += 1
                continue
            
            # Clean description - remove HTML
            description_raw = row.get('Description', '') or row.get('Short description', '')
            description = clean_html(description_raw)
            
            # Map category
            category = map_category(row.get('Categories', ''))
            
            # Get brand
            brand = extract_brand(row.get('Brands', ''))
            
            # Get image
            image = get_first_image(row.get('Images', ''))
            
            product = {
                "sku": sku,
                "name": name,
                "brand": brand,
                "category": category,
                "price": price,
                "description": description,
                "description_bg": description,  # Bulgarian - same as source (already in BG)
                "image": image,
                "stock": 100,  # Default stock
                "is_active": True,
                "is_visible": True,  # New field for visibility toggle
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            
            products_to_insert.append(product)
    
    if products_to_insert:
        print(f"Inserting {len(products_to_insert)} products into database...")
        
        # Insert in batches of 500 for better performance
        batch_size = 500
        for i in range(0, len(products_to_insert), batch_size):
            batch = products_to_insert[i:i + batch_size]
            await db.products.insert_many(batch)
            print(f"  Inserted batch {i // batch_size + 1}: {len(batch)} products")
        
        print(f"\n=== IMPORT COMPLETE ===")
        print(f"Total products imported: {len(products_to_insert)}")
        print(f"Skipped (no SKU/name/price): {skipped}")
        
        # Show category breakdown
        print(f"\n=== CATEGORY BREAKDOWN ===")
        categories = {}
        for p in products_to_insert:
            cat = p['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        for cat, count in sorted(categories.items()):
            print(f"  {cat}: {count}")
    else:
        print("No products to import!")
    
    client.close()
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(import_products())
