#!/usr/bin/env python3
"""
KOSTIN Parfums — Automated Content Publishing Pipeline
Publishes blog + social content from local markdown to live backend API.
"""

import asyncio
import os
import sys
import logging
import re
from pathlib import Path
from datetime import datetime

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")


def parse_frontmatter_and_title(text: str):
    title = "Untitled"
    body = text
    match = re.match(r"^#\s+(.+)$", text.strip(), re.MULTILINE)
    if match:
        title = match.group(1).strip()
    return title, body


async def publish_blog_post(client: httpx.AsyncClient, file_path: Path):
    title, content = parse_frontmatter_and_title(file_path.read_text(encoding="utf-8"))
    payload = {
        "title": title,
        "slug": file_path.stem,
        "content_md": content,
        "status": "published",
        "tags": ["auto-published"],
        "lang": "bg",
    }
    logger.info("Publishing blog post: %s", title)
    response = await client.post(
        f"{BACKEND_URL}/api/content/blog",
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    logger.info("Blog post published: %s", response.json())
    return True


async def publish_social_post(client: httpx.AsyncClient, file_path: Path):
    title, body = parse_frontmatter_and_title(file_path.read_text(encoding="utf-8"))
    platform = file_path.parent.name
    payload = {
        "title": title,
        "body": body,
        "platforms": [platform],
        "status": "scheduled",
        "tags": ["auto-published"],
    }
    logger.info("Publishing social post: %s", title)
    response = await client.post(
        f"{BACKEND_URL}/api/content/social/posts",
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    logger.info("Social post queued: %s", response.json())
    return True


async def main():
    content_root = Path(__file__).resolve().parent.parent / "content"
    blog_dir = content_root / "blog"
    social_dir = content_root / "social"

    results = {"blog": [], "social": []}

    async with httpx.AsyncClient() as client:
        if blog_dir.exists():
            for path in sorted(blog_dir.glob("*.md")):
                try:
                    ok = await publish_blog_post(client, path)
                    results["blog"].append((path.name, ok, None))
                except Exception as exc:
                    logger.error("Failed to publish blog post %s: %s", path.name, exc)
                    results["blog"].append((path.name, False, str(exc)))

        if social_dir.exists():
            for channel_dir in sorted(social_dir.iterdir()):
                if not channel_dir.is_dir():
                    continue
                for path in sorted(channel_dir.glob("*.md")):
                    try:
                        ok = await publish_social_post(client, path)
                        results["social"].append((path.name, ok, None))
                    except Exception as exc:
                        logger.error("Failed to publish social post %s: %s", path.name, exc)
                        results["social"].append((path.name, False, str(exc)))

    logger.info("Publishing results: %s", results)
    return results


if __name__ == "__main__":
    asyncio.run(main())
