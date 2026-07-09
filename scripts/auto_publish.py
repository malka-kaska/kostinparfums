#!/usr/bin/env python3
"""
KOSTIN Parfums — Automated Content Publishing Pipeline
Publishes blog + social content from local markdown to live channels via backend API.
"""

import asyncio
import os
import sys
import logging
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")


async def publish_blog_post(api_client, file_path: Path):
    """Publish a blog markdown post via backend API."""
    content = file_path.read_text(encoding="utf-8")
    title = file_path.stem.replace("-", " ").title()
    payload = {
        "title": title,
        "slug": file_path.stem,
        "content": content,
        "status": "published",
        "published_at": datetime.utcnow().isoformat(),
        "content_type": "blog",
    }
    try:
        # TODO: replace with actual backend endpoint once finalized
        logger.info("Publishing blog post: %s", title)
        # await api_client.post("/api/content/publish", json=payload)
        logger.info("Blog post queued: %s", title)
        return True
    except Exception as exc:
        logger.error("Failed to publish blog post %s: %s", title, exc)
        return False


async def publish_social_story(api_client, file_path: Path):
    """Publish a social story/post via backend API."""
    content = file_path.read_text(encoding="utf-8")
    title = file_path.stem.replace("-", " ")
    payload = {
        "title": title,
        "content": content,
        "status": "scheduled",
        "channel": file_path.parent.name,
        "scheduled_at": datetime.utcnow().isoformat(),
    }
    try:
        # TODO: replace with actual backend endpoint once finalized
        logger.info("Publishing social content: %s", title)
        # await api_client.post("/api/content/publish", json=payload)
        logger.info("Social content queued: %s", title)
        return True
    except Exception as exc:
        logger.error("Failed to publish social content %s: %s", title, exc)
        return False


async def main():
    content_root = Path(__file__).resolve().parent.parent / "content"
    blog_dir = content_root / "blog"
    social_dir = content_root / "social"

    results = {"blog": [], "social": []}

    if blog_dir.exists():
        for path in sorted(blog_dir.glob("*.md")):
            ok = await publish_blog_post(None, path)
            results["blog"].append((path.name, ok))

    if social_dir.exists():
        for channel_dir in sorted(social_dir.iterdir()):
            if not channel_dir.is_dir():
                continue
            for path in sorted(channel_dir.glob("*.md")):
                ok = await publish_social_story(None, path)
                results["social"].append((path.name, ok))

    logger.info("Publishing results: %s", results)
    return results


if __name__ == "__main__":
    asyncio.run(main())
