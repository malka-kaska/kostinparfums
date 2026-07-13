"""Backend tests: collection banner, hero slide buttons, product filtering."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kostin-cosmetics-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "konstantin.kirchev.bs@gmail.com"
ADMIN_PASSWORD = "aS1zX2QwE34xK9"

BANNER_URL = "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1920&q=80"
BANNER_DESC_BG = "Свежи летни аромати за горещите дни"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


def test_collections_include_banner_and_description():
    r = requests.get(f"{BASE_URL}/api/collections")
    assert r.status_code == 200
    cols = r.json()
    summer = next((c for c in cols if c.get("slug") == "summer_collection"), None)
    assert summer, f"summer_collection not found in {[c.get('slug') for c in cols]}"
    assert "banner_image" in summer
    assert summer.get("banner_image"), "banner_image should be set"
    assert summer.get("description"), "description should be set"
    print(f"summer banner={summer['banner_image'][:60]}..., desc={summer.get('description')}")


def test_products_filter_by_collection():
    r = requests.get(f"{BASE_URL}/api/products?collection=summer_collection")
    assert r.status_code == 200
    data = r.json()
    products = data.get("products", data) if isinstance(data, dict) else data
    total = data.get("total") if isinstance(data, dict) else len(products)
    print(f"summer_collection total={total}, returned={len(products)}")
    assert total == 1 or len(products) == 1, f"Expected 1 product for summer_collection, got total={total}"

    r2 = requests.get(f"{BASE_URL}/api/products?collection=all_products&limit=1")
    assert r2.status_code == 200
    d2 = r2.json()
    total2 = d2.get("total") if isinstance(d2, dict) else None
    print(f"all_products total={total2}")
    assert total2 and total2 > 1000


def test_put_collection_persists_banner_desc(admin_session):
    # Find summer collection id
    cols = requests.get(f"{BASE_URL}/api/collections").json()
    summer = next(c for c in cols if c.get("slug") == "summer_collection")
    cid = summer["id"]
    orig_banner = summer.get("banner_image")
    orig_desc = summer.get("description")
    orig_desc_en = summer.get("description_en")

    # Update with test values
    new_desc = "TEST_DESC_BG_iteration19"
    new_desc_en = "TEST_DESC_EN_iteration19"
    put = admin_session.put(f"{BASE_URL}/api/collections/{cid}", json={
        "description": new_desc,
        "description_en": new_desc_en,
        "banner_image": BANNER_URL,
    })
    assert put.status_code == 200, f"PUT failed: {put.status_code} {put.text}"

    # Verify via GET
    fresh = requests.get(f"{BASE_URL}/api/collections").json()
    s2 = next(c for c in fresh if c.get("slug") == "summer_collection")
    assert s2["description"] == new_desc
    assert s2["description_en"] == new_desc_en
    assert s2["banner_image"] == BANNER_URL

    # Test clearing banner
    clr = admin_session.put(f"{BASE_URL}/api/collections/{cid}", json={"banner_image": ""})
    assert clr.status_code == 200
    fresh2 = requests.get(f"{BASE_URL}/api/collections").json()
    s3 = next(c for c in fresh2 if c.get("slug") == "summer_collection")
    assert not s3.get("banner_image"), f"banner_image should be cleared, got {s3.get('banner_image')}"

    # Restore original
    restore = admin_session.put(f"{BASE_URL}/api/collections/{cid}", json={
        "description": orig_desc or BANNER_DESC_BG,
        "description_en": orig_desc_en or "",
        "banner_image": orig_banner or BANNER_URL,
    })
    assert restore.status_code == 200
    final = requests.get(f"{BASE_URL}/api/collections").json()
    sf = next(c for c in final if c.get("slug") == "summer_collection")
    assert sf.get("banner_image") == (orig_banner or BANNER_URL)


def test_hero_slide_button_fields_persist(admin_session):
    # Get current settings
    r = requests.get(f"{BASE_URL}/api/homepage/settings")
    assert r.status_code == 200
    settings = r.json()
    orig_slides = settings.get("hero_slides", [])
    assert orig_slides, "Expected existing hero_slides"

    # Build new slides preserving button fields
    test_slides = []
    for i, s in enumerate(orig_slides):
        test_slides.append({
            "image": s.get("image", ""),
            "alt": s.get("alt", ""),
            "show_button": True if i == 0 else s.get("show_button", False),
            "button_text": "TEST_BUTTON" if i == 0 else s.get("button_text", ""),
            "button_link_type": "collection" if i == 0 else s.get("button_link_type", "url"),
            "button_link": s.get("button_link", ""),
            "button_product_id": s.get("button_product_id", ""),
            "button_collection_slug": "summer_collection" if i == 0 else s.get("button_collection_slug", ""),
        })

    put = admin_session.put(f"{BASE_URL}/api/homepage/hero-slides", json={"slides": test_slides})
    assert put.status_code == 200, f"PUT hero-slides failed: {put.status_code} {put.text}"

    # Verify persistence
    fresh = requests.get(f"{BASE_URL}/api/homepage/settings").json()
    fs = fresh.get("hero_slides", [])
    assert len(fs) == len(test_slides)
    assert fs[0].get("show_button") is True
    assert fs[0].get("button_text") == "TEST_BUTTON"
    assert fs[0].get("button_link_type") == "collection"
    assert fs[0].get("button_collection_slug") == "summer_collection"

    # Restore original
    restore_payload = {"slides": [{
        "image": s.get("image", ""),
        "alt": s.get("alt", ""),
        "show_button": s.get("show_button", False),
        "button_text": s.get("button_text", ""),
        "button_link_type": s.get("button_link_type", "url"),
        "button_link": s.get("button_link", ""),
        "button_product_id": s.get("button_product_id", ""),
        "button_collection_slug": s.get("button_collection_slug", ""),
    } for s in orig_slides]}
    rest = admin_session.put(f"{BASE_URL}/api/homepage/hero-slides", json=restore_payload)
    assert rest.status_code == 200
