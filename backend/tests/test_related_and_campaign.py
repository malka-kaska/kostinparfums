"""Backend tests for Iteration 20: You may also like + Campaign Banner."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kostin-cosmetics-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "konstantin.kirchev.bs@gmail.com"
ADMIN_PASSWORD = "aS1zX2QwE34xK9"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return api  # cookies now set


@pytest.fixture(scope="module")
def products(api):
    r = api.get(f"{BASE_URL}/api/products?limit=10")
    assert r.status_code == 200
    data = r.json()
    assert len(data.get("products", [])) >= 3
    return data["products"]


# ---- Related products ----

def test_related_default_returns_up_to_6(api, products):
    pid = products[0]["id"]
    r = api.get(f"{BASE_URL}/api/products/{pid}/related?limit=6")
    assert r.status_code == 200
    body = r.json()
    assert "products" in body
    items = body["products"]
    assert len(items) <= 6
    assert len(items) > 0
    ids = [p["id"] for p in items]
    assert pid not in ids
    for p in items:
        assert "id" in p and "name" in p and "brand" in p
        assert "image" in p


def test_related_manual_picks_priority(admin, products):
    p_target = products[0]
    p_a = products[1]
    p_b = products[2]
    # Save original related_product_ids
    original = p_target.get("related_product_ids", [])
    try:
        r = admin.put(
            f"{BASE_URL}/api/products/{p_target['id']}",
            json={"related_product_ids": [p_a["id"], p_b["id"]]},
        )
        assert r.status_code == 200, r.text
        updated = r.json()
        assert updated.get("related_product_ids") == [p_a["id"], p_b["id"]]

        # GET product should include the field
        rg = admin.get(f"{BASE_URL}/api/products/{p_target['id']}")
        assert rg.status_code == 200
        assert rg.json().get("related_product_ids") == [p_a["id"], p_b["id"]]

        # Related endpoint should return A, B first
        rr = admin.get(f"{BASE_URL}/api/products/{p_target['id']}/related?limit=6")
        assert rr.status_code == 200
        rel_ids = [p["id"] for p in rr.json()["products"]]
        assert rel_ids[0] == p_a["id"]
        assert rel_ids[1] == p_b["id"]
        assert len(rel_ids) <= 6
        assert p_target["id"] not in rel_ids
    finally:
        admin.put(
            f"{BASE_URL}/api/products/{p_target['id']}",
            json={"related_product_ids": original},
        )


def test_related_bulk(api, products):
    ids = [p["id"] for p in products[:3]]
    r = api.post(f"{BASE_URL}/api/products/related-bulk", json={"product_ids": ids, "limit": 6})
    assert r.status_code == 200, r.text
    body = r.json()
    items = body.get("products", [])
    assert len(items) <= 6
    returned_ids = [p["id"] for p in items]
    for i in ids:
        assert i not in returned_ids
    for p in items:
        assert p.get("id") and p.get("name")


# ---- Campaign banner ----

def test_homepage_settings_returns_campaign_banner(api):
    r = api.get(f"{BASE_URL}/api/homepage/settings")
    assert r.status_code == 200
    body = r.json()
    assert "campaign_banner" in body
    cb = body["campaign_banner"]
    for k in ["enabled", "image", "title", "title_en", "description", "description_en",
              "button_text", "button_text_en", "button_link"]:
        assert k in cb, f"Missing key {k}"


def test_campaign_banner_requires_auth(api):
    unauth = requests.Session()
    r = unauth.put(
        f"{BASE_URL}/api/homepage/campaign-banner",
        json={"banner": {"enabled": True}},
        headers={"Content-Type": "application/json"},
    )
    assert r.status_code in (401, 403), f"Expected 401/403 but got {r.status_code}"


def test_campaign_banner_admin_update(admin, api):
    # Save current
    orig = api.get(f"{BASE_URL}/api/homepage/settings").json().get("campaign_banner") or {}
    new_banner = {
        "enabled": True,
        "image": "https://example.com/banner.jpg",
        "title": "TEST Кампания",
        "title_en": "TEST Campaign",
        "description": "TEST описание",
        "description_en": "TEST description",
        "button_text": "Пазарувай",
        "button_text_en": "Shop Now",
        "button_link": "/products",
    }
    try:
        r = admin.put(f"{BASE_URL}/api/homepage/campaign-banner", json={"banner": new_banner})
        assert r.status_code == 200, r.text
        # verify persisted
        s = api.get(f"{BASE_URL}/api/homepage/settings").json().get("campaign_banner")
        assert s["enabled"] is True
        assert s["title"] == "TEST Кампания"
        assert s["title_en"] == "TEST Campaign"
        assert s["button_link"] == "/products"
    finally:
        # restore
        restore = {
            "enabled": orig.get("enabled", False),
            "image": orig.get("image"),
            "title": orig.get("title"),
            "title_en": orig.get("title_en"),
            "description": orig.get("description"),
            "description_en": orig.get("description_en"),
            "button_text": orig.get("button_text"),
            "button_text_en": orig.get("button_text_en"),
            "button_link": orig.get("button_link"),
        }
        admin.put(f"{BASE_URL}/api/homepage/campaign-banner", json={"banner": restore})
