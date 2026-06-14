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
    """Run all pending migrations"""
    logger.info("=" * 50)
    logger.info("Starting database migrations...")
    logger.info(f"DATA_DIR: {DATA_DIR}")
    logger.info(f"DATA_DIR exists: {DATA_DIR.exists()}")
    
    try:
        await migrate_products_from_backup(db)
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
    
    logger.info("Migration check complete")
    logger.info("=" * 50)
