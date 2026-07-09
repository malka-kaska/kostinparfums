#!/usr/bin/env python3
"""
Minimal publisher for KOSTIN Parfums content.
Reads the local markdown draft files and creates live posts via the backend API.

Usage:
  export KOSTIN_BACKEND_URL="https://kostinparfums.com"
  export KOSTIN_ADMIN_COOKIE="access_token=...; refresh_token=..."
  python3 scripts/publish_content.py
"""

import os
import re
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_URL = os.environ.get("KOSTIN_BACKEND_URL", "http://localhost:8000").rstrip("/")
COOKIES = os.environ.get("KOSTIN_ADMIN_COOKIE", "")

STORY_PATH = REPO_ROOT / "content" / "social" / "launch-story-01.md"
BLOG_PATH = REPO_ROOT / "content" / "blog" / "first-campaign-story.md"


def request_json(method: str, path: str, payload: dict | None = None) -> dict:
    url = f"{BACKEND_URL}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if COOKIES:
        req.add_header("Cookie", COOKIES)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code}: {e.read().decode('utf-8')}") from e


if not STORY_PATH.exists() or not BLOG_PATH.exists():
    raise SystemExit("Missing draft content under content/social or content/blog")


story_text = STORY_PATH.read_text(encoding="utf-8")
blog_text = BLOG_PATH.read_text(encoding="utf-8")


def first_match(patterns: list[str], text: str) -> str | None:
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            return m.group(1).strip()
    return None


story_payload = {
    "title": first_match([r"^#\s+(.+)$", r"^Title:\s*(.+)$"], story_text) or "KOSTIN Launch Story 01",
    "body": story_text,
    "platforms": ["instagram"],
    "status": "published",
    "tags": ["ugc", "launch", "story"],
}
print("Publishing social post...")
print(request_json("POST", "/api/content/social/posts", story_payload))


blog_excerpt = first_match(
    [r"^(.{0,220}.*?)(?:\n\n|$)", r"excerpt:\s*(.+)$"],
    blog_text,
)
blog_payload = {
    "title": first_match([r"^#\s+(.+)$", r"^Title:\s*(.+)$"], blog_text) or "First KOSTIN Campaign Story",
    "slug": re.sub(r"[^a-z0-9\-]+", "-", first_match([r"^#\s+(.+)$"], blog_text).lower())[:80] if first_match([r"^#\s+(.+)$"], blog_text) else "first-campaign-story",
    "content_md": blog_text,
    "excerpt": blog_excerpt,
    "tags": ["campaign", "bulgaria", "luxury", "perfume"],
    "status": "published",
    "lang": "bg",
}
print("Publishing blog post...")
print(request_json("POST", "/api/content/blog", blog_payload))
