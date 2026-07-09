import os
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from bson import ObjectId
from pydantic import BaseModel, ConfigDict
from typing import Optional, List

router = APIRouter(prefix="/api/content", tags=["content"])


class BlogPostCreate(BaseModel):
    title: str
    slug: str
    content_md: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: List[str] = []
    status: str = "draft"
    lang: str = "bg"


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content_md: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    lang: Optional[str] = None


class BlogPostResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    slug: str
    content_md: str
    excerpt: Optional[str]
    cover_image_url: Optional[str]
    tags: List[str]
    status: str
    lang: str
    published_at: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]


def _post_doc_to_response(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", "")),
        "title": doc.get("title", ""),
        "slug": doc.get("slug", ""),
        "content_md": doc.get("content_md", ""),
        "excerpt": doc.get("excerpt"),
        "cover_image_url": doc.get("cover_image_url"),
        "tags": doc.get("tags", []),
        "status": doc.get("status", "draft"),
        "lang": doc.get("lang", "bg"),
        "published_at": doc.get("published_at"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.post("/blog", response_model=BlogPostResponse)
async def create_blog_post(request: Request, payload: BlogPostCreate):
    db = request.app.state.db
    now = datetime.now(timezone.utc).isoformat()
    post = {
        "title": payload.title,
        "slug": payload.slug,
        "content_md": payload.content_md,
        "excerpt": payload.excerpt,
        "cover_image_url": payload.cover_image_url,
        "tags": payload.tags,
        "status": payload.status,
        "lang": payload.lang,
        "published_at": now if payload.status == "published" else None,
        "created_at": now,
        "updated_at": now,
    }
    insert = await db.blog_posts.insert_one(post)
    post["_id"] = insert.inserted_id
    return BlogPostResponse(**_post_doc_to_response(post))


@router.get("/blog", response_model=List[BlogPostResponse])
async def list_blog_posts(request: Request, status: Optional[str] = None, lang: Optional[str] = None):
    db = request.app.state.db
    query = {}
    if status:
        query["status"] = status
    if lang:
        query["lang"] = lang
    cursor = db.blog_posts.find(query).sort("published_at", -1)
    posts = await cursor.to_list(200)
    return [BlogPostResponse(**_post_doc_to_response(p)) for p in posts]


class SocialPostCreate(BaseModel):
    title: str
    body: str
    platforms: List[str]
    media_urls: List[str] = []
    scheduled_at: Optional[str] = None
    status: str = "draft"
    tags: List[str] = []


class SocialPostResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    body: str
    platforms: List[str]
    media_urls: List[str]
    scheduled_at: Optional[str]
    status: str
    tags: List[str]
    created_at: Optional[str]
    updated_at: Optional[str]


def _social_doc_to_response(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id", "")),
        "title": doc.get("title", ""),
        "body": doc.get("body", ""),
        "platforms": doc.get("platforms", []),
        "media_urls": doc.get("media_urls", []),
        "scheduled_at": doc.get("scheduled_at"),
        "status": doc.get("status", "draft"),
        "tags": doc.get("tags", []),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.post("/social/posts", response_model=SocialPostResponse)
async def create_social_post(request: Request, payload: SocialPostCreate):
    db = request.app.state.db
    now = datetime.now(timezone.utc).isoformat()
    post = {
        "title": payload.title,
        "body": payload.body,
        "platforms": payload.platforms,
        "media_urls": payload.media_urls,
        "scheduled_at": payload.scheduled_at,
        "status": payload.status,
        "tags": payload.tags,
        "created_at": now,
        "updated_at": now,
    }
    insert = await db.social_posts.insert_one(post)
    post["_id"] = insert.inserted_id
    return SocialPostResponse(**_social_doc_to_response(post))


@router.get("/social/posts", response_model=List[SocialPostResponse])
async def list_social_posts(request: Request, status: Optional[str] = None, platform: Optional[str] = None):
    db = request.app.state.db
    query = {}
    if status:
        query["status"] = status
    if platform:
        query["platforms"] = platform
    cursor = db.social_posts.find(query).sort("scheduled_at", -1)
    posts = await cursor.to_list(200)
    return [SocialPostResponse(**_social_doc_to_response(p)) for p in posts]
