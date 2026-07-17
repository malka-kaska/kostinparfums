#!/usr/bin/env python3
"""
Reconcile product visibility against official PDF catalog.
Marks products NOT in the official PDFs as hidden in MongoDB.
"""

import json
import re
from pathlib import Path
from pypdf import PdfReader

try:
    from motor.motor_asyncio import AsyncIOMotorClient
except Exception:
    AsyncIOMotorClient = None

PDF_PATHS = [
    '/Users/Ghost/Downloads/KOSTIN _ Selection of Luxury Fragrances.pdf',
    '/Users/Ghost/Downloads/KOSTIN _ Selection of Luxury Fragrances 2.pdf',
    '/Users/Ghost/Downloads/KOSTIN _ Selection of Luxury Fragrances 3.pdf',
]

MONGO_URL = 'mongodb://localhost:27017'
DB_NAME = 'kostinparfums'


def extract_pdf_product_names():
    names = set()
    for path in PDF_PATHS:
        reader = PdfReader(path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        for line in text.splitlines():
            line = line.strip()
            if not line or '€' not in line:
                continue
            if any(x in line for x in ['СНИМКА', 'ПРОДУКТ', 'МАРКА', 'КАТЕГОРИЯ', 'ЦЕНА', 'НАЛИЧНОСТ', 'ВИДИМОСТ', 'АДМИН', 'Управление', 'Търси', 'Всички', 'Име', 'ИЗЧИСТИ', 'KOSTIN', 'СЕЛЕКЦИЯ', 'EN', 'ВСИЧКИ', 'ЖЕНИ', 'МЪЖЕ', 'Дубайски', 'БЕЗПЛАТНА', 'АВТЕНТИЧНИ', 'https://', '9.07.26', 'Продукт(', 'Поръчки(', 'Колекции(', 'Начална', 'Отстъпки(', 'Аромати', 'MetaCatalog']):
                continue
            name = line.split('€')[0].strip()
            if name:
                names.add(name.lower())
    return names


async def reconcile():
    if AsyncIOMotorClient is None:
        raise RuntimeError('motor not installed')

    pdf_names = extract_pdf_product_names()
    print(f'PDF official visible products: {len(pdf_names)}')

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Count current visible products
    visible_count = await db.products.count_documents({'is_visible': True, 'is_active': True})
    print(f'Current visible+active in DB: {visible_count}')

    # Find products to hide
    to_hide = []
    cursor = db.products.find({'is_visible': True, 'is_active': True})
    async for p in cursor:
        name = p.get('name', '').lower()
        if not any(name in pdf_name or pdf_name in name for pdf_name in pdf_names):
            to_hide.append(str(p['_id']))

    print(f'Products to hide: {len(to_hide)}')

    if to_hide:
        result = await db.products.update_many(
            {'_id': {'$in': [__import__('bson').ObjectId(x) for x in to_hide]}},
            {'$set': {'is_visible': False, 'updated_at': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()}}
        )
        print(f'Hidden: {result.modified_count}')

    # Final count
    final_count = await db.products.count_documents({'is_visible': True, 'is_active': True})
    print(f'Final visible+active in DB: {final_count}')

    client.close()


if __name__ == '__main__':
    import asyncio
    asyncio.run(reconcile())
