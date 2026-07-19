"""
Database migrations for KOSTIN E-commerce
Runs automatically on server startup
"""
import json
import logging
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

MIGRATIONS_COLLECTION = "migrations"
DATA_DIR = Path(__file__).parent / "data"
REQUIRED_PRODUCT_COUNT = 7000  # Minimum products we expect


async def migrate_products_from_backup(db):
    """
    Import products from JSON backup file.
    This ensures we always have products in the database.
    """
    migration_name = "import_products_v2"  # New version to force re-check
    
    # Always check product count first
    product_count = await db.products.count_documents({})
    logger.info(f"Current product count in database: {product_count}")
    
    # If we have enough products, we're done
    if product_count >= REQUIRED_PRODUCT_COUNT:
        logger.info(f"Database has {product_count} products (>= {REQUIRED_PRODUCT_COUNT}), no import needed")
        # Mark migration as done if not already
        existing = await db[MIGRATIONS_COLLECTION].find_one({"name": migration_name})
        if not existing:
            await db[MIGRATIONS_COLLECTION].insert_one({
                "name": migration_name,
                "applied_at": datetime.now(timezone.utc).isoformat(),
                "product_count": product_count
            })
        return
    
    # Need to import products
    logger.info(f"Database has only {product_count} products, need to import from backup")
    
    # Load products from backup
    backup_file = DATA_DIR / "products_backup.json"
    logger.info(f"Looking for backup file at: {backup_file}")
    logger.info(f"Backup file exists: {backup_file.exists()}")
    
    if not backup_file.exists():
        logger.error(f"CRITICAL: Products backup file not found at {backup_file}")
        logger.error(f"DATA_DIR contents: {list(DATA_DIR.iterdir()) if DATA_DIR.exists() else 'DIR NOT FOUND'}")
        return
    
    logger.info(f"Loading products from {backup_file}")
    
    try:
        with open(backup_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
        logger.info(f"Loaded {len(products)} products from backup file")
    except Exception as e:
        logger.error(f"Failed to load products from backup: {e}")
        return
    
    if not products:
        logger.error("No products found in backup file")
        return
    
    # Clear existing products
    if product_count > 0:
        logger.info(f"Clearing {product_count} existing products")
        await db.products.delete_many({})
    
    # Insert in batches
    batch_size = 500
    total_inserted = 0
    
    try:
        for i in range(0, len(products), batch_size):
            batch = products[i:i + batch_size]
            await db.products.insert_many(batch)
            total_inserted += len(batch)
            logger.info(f"Inserted batch: {total_inserted}/{len(products)} products")
        
        logger.info(f"Successfully imported {total_inserted} products")
        
        # Mark migration as done
        await db[MIGRATIONS_COLLECTION].update_one(
            {"name": migration_name},
            {
                "$set": {
                    "applied_at": datetime.now(timezone.utc).isoformat(),
                    "product_count": total_inserted,
                    "status": "success"
                }
            },
            upsert=True
        )
        
    except Exception as e:
        logger.error(f"Failed to insert products: {e}")
        raise


async def run_migrations(db):
    """Run all pending migrations with timeout protection"""
    logger.info("=" * 50)
    logger.info("Starting database migrations...")
    logger.info(f"DATA_DIR: {DATA_DIR}")
    logger.info(f"DATA_DIR exists: {DATA_DIR.exists()}")
    
    try:
        # Set a reasonable timeout for migrations (30 seconds)
        import asyncio
        try:
            await asyncio.wait_for(migrate_products_from_backup(db), timeout=30.0)
        except asyncio.TimeoutError:
            logger.warning("Product migration timed out - will continue without blocking startup")
        
        try:
            await asyncio.wait_for(migrate_collections(db), timeout=10.0)
        except asyncio.TimeoutError:
            logger.warning("Collections migration timed out - will continue without blocking startup")
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Don't raise - allow app to start even if migrations fail
    
    logger.info("Migration check complete")
    logger.info("=" * 50)


# Dubai/Arabian perfume brands
DUBAI_BRANDS = [
    'Afnan',
    'Ahmed Al Maghribi',
    'Ajmal',
    'Al Haramain',
    'Armaf',
    'Lattafa',
    'Rasasi',
]


async def migrate_collections(db):
    """
    Create system collections and assign products to collections.
    - all_products: Default collection for all non-Dubai products
    - dubai: Dubai/Arabian fragrances
    """
    migration_name = "collections_v1"
    
    # Check if migration already done
    existing = await db[MIGRATIONS_COLLECTION].find_one({"name": migration_name})
    if existing:
        logger.info("Collections migration already applied")
        return
    
    logger.info("Starting collections migration...")
    
    # Create system collections if they don't exist
    system_collections = [
        {
            "name": "Всички парфюми",
            "name_en": "All Fragrances",
            "slug": "all_products",
            "description": "Всички налични парфюми",
            "description_en": "All available fragrances",
            "is_system": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "name": "Дубайски аромати",
            "name_en": "Dubai Fragrances",
            "slug": "dubai",
            "description": "Екзотични ориенталски аромати от престижни арабски парфюмерийни къщи",
            "description_en": "Exotic oriental fragrances from prestigious Arabian perfume houses",
            "is_system": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    ]
    
    for col in system_collections:
        existing_col = await db.collections.find_one({"slug": col["slug"]})
        if not existing_col:
            await db.collections.insert_one(col)
            logger.info(f"Created system collection: {col['name']} ({col['slug']})")
        else:
            logger.info(f"System collection already exists: {col['slug']}")
    
    # Assign products to collections
    # 1. Dubai brands -> "dubai" collection only
    # 2. All other products -> "all_products" collection
    
    dubai_count = 0
    all_products_count = 0
    
    # Update Dubai brand products
    for brand in DUBAI_BRANDS:
        result = await db.products.update_many(
            {"brand": brand, "collections": {"$exists": False}},
            {"$set": {"collections": ["dubai"]}}
        )
        dubai_count += result.modified_count
        
        # Also update products that might have empty collections array
        result2 = await db.products.update_many(
            {"brand": brand, "collections": []},
            {"$set": {"collections": ["dubai"]}}
        )
        dubai_count += result2.modified_count
    
    logger.info(f"Assigned {dubai_count} products to 'dubai' collection")
    
    # Update all other products to "all_products"
    result = await db.products.update_many(
        {
            "brand": {"$nin": DUBAI_BRANDS},
            "$or": [
                {"collections": {"$exists": False}},
                {"collections": []},
                {"collections": None}
            ]
        },
        {"$set": {"collections": ["all_products"]}}
    )
    all_products_count = result.modified_count
    
    logger.info(f"Assigned {all_products_count} products to 'all_products' collection")
    
    # Mark migration as done
    await db[MIGRATIONS_COLLECTION].insert_one({
        "name": migration_name,
        "applied_at": datetime.now(timezone.utc).isoformat(),
        "dubai_products": dubai_count,
        "all_products": all_products_count
    })
    
    logger.info("Collections migration complete")
