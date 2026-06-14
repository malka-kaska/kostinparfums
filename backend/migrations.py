"""
Database migrations for KOSTIN E-commerce
Runs automatically on server startup
"""
import asyncio
import json
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MIGRATIONS_COLLECTION = "migrations"
DATA_DIR = Path(__file__).parent / "data"


async def check_migration_done(db, migration_name: str) -> bool:
    """Check if a migration has already been applied"""
    result = await db[MIGRATIONS_COLLECTION].find_one({"name": migration_name})
    return result is not None


async def mark_migration_done(db, migration_name: str):
    """Mark a migration as completed"""
    from datetime import datetime, timezone
    await db[MIGRATIONS_COLLECTION].insert_one({
        "name": migration_name,
        "applied_at": datetime.now(timezone.utc).isoformat()
    })
    logger.info(f"Migration '{migration_name}' marked as complete")


async def migrate_products_from_backup(db):
    """
    Import products from JSON backup file.
    This migration runs only once - when products collection is empty or migration not done.
    """
    migration_name = "import_products_v1"
    
    # Check if already done
    if await check_migration_done(db, migration_name):
        logger.info(f"Migration '{migration_name}' already applied, skipping")
        return
    
    # Check if products already exist
    product_count = await db.products.count_documents({})
    if product_count > 100:  # Allow some manual products, but if we have many, skip
        logger.info(f"Products collection already has {product_count} items, marking migration as done")
        await mark_migration_done(db, migration_name)
        return
    
    # Load products from backup
    backup_file = DATA_DIR / "products_backup.json"
    if not backup_file.exists():
        logger.warning(f"Products backup file not found at {backup_file}")
        return
    
    logger.info(f"Starting product import from {backup_file}")
    
    with open(backup_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    if not products:
        logger.warning("No products found in backup file")
        return
    
    # Clear existing products (if any)
    if product_count > 0:
        logger.info(f"Clearing {product_count} existing products")
        await db.products.delete_many({})
    
    # Insert in batches
    batch_size = 500
    total_inserted = 0
    
    for i in range(0, len(products), batch_size):
        batch = products[i:i + batch_size]
        await db.products.insert_many(batch)
        total_inserted += len(batch)
        logger.info(f"Inserted batch: {total_inserted}/{len(products)} products")
    
    logger.info(f"Successfully imported {total_inserted} products")
    await mark_migration_done(db, migration_name)


async def run_migrations(db):
    """Run all pending migrations"""
    logger.info("Checking for pending migrations...")
    
    # Add new migrations here
    migrations = [
        migrate_products_from_backup,
    ]
    
    for migration in migrations:
        try:
            await migration(db)
        except Exception as e:
            logger.error(f"Migration failed: {migration.__name__} - {e}")
            # Don't stop other migrations
            continue
    
    logger.info("Migration check complete")
