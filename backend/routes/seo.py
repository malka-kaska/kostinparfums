"""Dynamic SEO sitemap generator.

Serves an XML sitemap of canonical, indexable pages including all active,
visible products and navigation collections. Excludes utility pages
(cart, checkout, profile, auth, admin, etc.).
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Response
from xml.sax.saxutils import escape
import os

router = APIRouter(tags=["seo"])

SITE_URL = os.environ.get("PUBLIC_SITE_URL", "https://kostinparfums.com").rstrip("/")

# Static canonical pages with priority + change frequency
STATIC_PAGES = [
    {"path": "/", "priority": "1.0", "changefreq": "daily"},
    {"path": "/products", "priority": "0.9", "changefreq": "daily"},
    {"path": "/dubai-perfumes", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/about", "priority": "0.6", "changefreq": "monthly"},
    {"path": "/faq", "priority": "0.5", "changefreq": "monthly"},
    {"path": "/shipping-returns", "priority": "0.5", "changefreq": "monthly"},
    {"path": "/privacy-policy", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/terms-of-service", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/cookie-policy", "priority": "0.3", "changefreq": "yearly"},
    {"path": "/legal", "priority": "0.3", "changefreq": "yearly"},
]


def _iso_date(dt) -> str:
    if isinstance(dt, str):
        return dt.split("T")[0]
    if isinstance(dt, datetime):
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%d")
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


@router.get("/api/sitemap.xml")
async def get_sitemap(request: Request):
    """Generate a dynamic sitemap.xml including all active products."""
    db = request.app.state.db
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    # Static pages
    for page in STATIC_PAGES:
        lines.append("  <url>")
        lines.append(f"    <loc>{escape(SITE_URL + page['path'])}</loc>")
        lines.append(f"    <lastmod>{today}</lastmod>")
        lines.append(f"    <changefreq>{page['changefreq']}</changefreq>")
        lines.append(f"    <priority>{page['priority']}</priority>")
        lines.append("  </url>")

    # Navigation collections
    try:
        collections = await db.nav_collections.find({"is_active": True}).to_list(50)
        for c in collections:
            slug = c.get("slug")
            path = c.get("path") or (f"/products?collection={slug}" if slug else None)
            if not path:
                continue
            lines.append("  <url>")
            lines.append(f"    <loc>{escape(SITE_URL + path)}</loc>")
            lines.append(f"    <lastmod>{today}</lastmod>")
            lines.append("    <changefreq>weekly</changefreq>")
            lines.append("    <priority>0.7</priority>")
            lines.append("  </url>")
    except Exception:
        pass

    # Active + visible products
    try:
        cursor = db.products.find(
            {"is_active": True, "is_visible": True},
            {"_id": 1, "updated_at": 1, "created_at": 1}
        )
        async for product in cursor:
            pid = str(product["_id"])
            lastmod = _iso_date(product.get("updated_at") or product.get("created_at"))
            lines.append("  <url>")
            lines.append(f"    <loc>{escape(SITE_URL + '/product/' + pid)}</loc>")
            lines.append(f"    <lastmod>{lastmod}</lastmod>")
            lines.append("    <changefreq>weekly</changefreq>")
            lines.append("    <priority>0.8</priority>")
            lines.append("  </url>")
    except Exception:
        pass

    lines.append("</urlset>")
    xml_content = "\n".join(lines)

    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Type": "application/xml; charset=utf-8",
        },
    )


@router.get("/api/robots.txt")
async def get_robots(request: Request):
    """Serve robots.txt with correct sitemap URL and disallow rules."""
    robots = (
        "# KOSTIN Parfums - robots.txt\n"
        "# Allow all search engines\n\n"
        "User-agent: *\n"
        "Allow: /\n\n"
        "# Disallow non-canonical / utility pages\n"
        "Disallow: /cart\n"
        "Disallow: /checkout\n"
        "Disallow: /checkout-success\n"
        "Disallow: /order-success\n"
        "Disallow: /profile\n"
        "Disallow: /auth\n"
        "Disallow: /verify\n"
        "Disallow: /verify-order\n"
        "Disallow: /verify-email\n"
        "Disallow: /guest-cancel-order\n"
        "Disallow: /admin\n\n"
        "# Explicitly allow SEO crawlers\n"
        "User-agent: SemrushBot\nAllow: /\n\n"
        "User-agent: AhrefsBot\nAllow: /\n\n"
        "User-agent: Googlebot\nAllow: /\n\n"
        "User-agent: Bingbot\nAllow: /\n\n"
        f"Sitemap: {SITE_URL}/api/sitemap.xml\n"
    )
    return Response(
        content=robots,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=3600"},
    )
