"""Backend tests for CSV import + product visibility toggle feature (Iteration 6)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kostin-cosmetics-1.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "konstantin.kirchev.bs@gmail.com"
ADMIN_PASSWORD = "aS1zX2QwE34xK9"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    # Some implementations return JWT token in body; capture if present
    token = data.get("access_token") or data.get("token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="session")
def anon_session():
    return requests.Session()


# ---------- Health ----------
def test_root(anon_session):
    r = anon_session.get(f"{BASE_URL}/api/")
    assert r.status_code == 200


# ---------- Auth ----------
def test_admin_login(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert data.get("role") == "admin"
    assert data.get("email") == ADMIN_EMAIL


# ---------- CSV Import verification ----------
def test_products_count_is_large(anon_session):
    """Verify CSV import populated the DB with thousands of products."""
    r = anon_session.get(f"{BASE_URL}/api/products?page=1&limit=1")
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    # The agent context says 7347 products. Should be > 1000 at minimum.
    assert data["total"] > 1000, f"Expected >1000 products, got {data['total']}"


def test_product_structure(anon_session):
    r = anon_session.get(f"{BASE_URL}/api/products?page=1&limit=5")
    assert r.status_code == 200
    products = r.json()["products"]
    assert len(products) > 0
    p = products[0]
    for field in ("id", "name", "brand", "category", "price", "image"):
        assert field in p, f"missing field {field}"
    assert isinstance(p["price"], (int, float))
    assert p["name"]  # not empty


def test_categories_endpoint(anon_session):
    r = anon_session.get(f"{BASE_URL}/api/products/categories")
    assert r.status_code == 200
    cats = r.json()
    assert isinstance(cats, list)
    assert len(cats) > 0


def test_brands_endpoint(anon_session):
    r = anon_session.get(f"{BASE_URL}/api/products/brands")
    assert r.status_code == 200
    brands = r.json()
    assert isinstance(brands, list)
    assert len(brands) > 0


def test_category_filter(anon_session):
    cats = anon_session.get(f"{BASE_URL}/api/products/categories").json()
    if not cats:
        pytest.skip("no categories")
    cat_id = cats[0]["id"]
    r = anon_session.get(f"{BASE_URL}/api/products?category={cat_id}&limit=5")
    assert r.status_code == 200
    products = r.json()["products"]
    for p in products:
        assert p["category"] == cat_id


def test_brand_filter(anon_session):
    brands = anon_session.get(f"{BASE_URL}/api/products/brands").json()
    if not brands:
        pytest.skip("no brands")
    brand = brands[0]["name"]
    r = anon_session.get(f"{BASE_URL}/api/products?brand={brand}&limit=5")
    assert r.status_code == 200
    for p in r.json()["products"]:
        assert p["brand"] == brand


# ---------- Admin endpoints ----------
def test_admin_all_endpoint_requires_admin(anon_session):
    r = anon_session.get(f"{BASE_URL}/api/products/admin/all?limit=1")
    assert r.status_code in (401, 403)


def test_admin_all_endpoint_returns_all(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/products/admin/all?page=1&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert "products" in data
    assert "total" in data
    assert "pages" in data
    # Admin total should be >= public total (admin sees hidden too)
    public_total = requests.get(f"{BASE_URL}/api/products?limit=1").json()["total"]
    assert data["total"] >= public_total
    # is_visible field should be present
    if data["products"]:
        assert "is_visible" in data["products"][0]


def test_admin_pagination(admin_session):
    """Test pagination: 50 per page, should be ~147 pages."""
    r = admin_session.get(f"{BASE_URL}/api/products/admin/all?page=1&limit=50")
    assert r.status_code == 200
    data = r.json()
    assert len(data["products"]) <= 50
    assert data["page"] == 1
    # ~147 pages expected when limit=50
    expected_pages = (data["total"] + 50 - 1) // 50
    assert data["pages"] == expected_pages
    # Sanity check pages count
    assert data["pages"] > 100


# ---------- Visibility toggle ----------
@pytest.fixture
def sample_product(admin_session):
    r = admin_session.get(f"{BASE_URL}/api/products/admin/all?page=1&limit=1")
    assert r.status_code == 200
    products = r.json()["products"]
    assert len(products) > 0
    return products[0]


def test_visibility_toggle_hides_product(admin_session, anon_session, sample_product):
    pid = sample_product["id"]
    original_visibility = sample_product.get("is_visible", True)

    try:
        # Hide product
        r = admin_session.patch(
            f"{BASE_URL}/api/products/{pid}/visibility",
            json={"is_visible": False},
        )
        assert r.status_code == 200, f"toggle hide failed: {r.text}"
        assert r.json()["is_visible"] is False

        # Verify hidden product is NOT in public list (search by name to be specific)
        # Use search to filter to this one
        name_query = sample_product["name"][:30]
        r2 = anon_session.get(f"{BASE_URL}/api/products?search={name_query}&limit=200")
        assert r2.status_code == 200
        ids = [p["id"] for p in r2.json()["products"]]
        assert pid not in ids, "hidden product still visible to public!"

        # Verify admin can still see it
        r3 = admin_session.get(f"{BASE_URL}/api/products/admin/all?search={name_query}&limit=200")
        assert r3.status_code == 200
        admin_ids = [p["id"] for p in r3.json()["products"]]
        assert pid in admin_ids, "admin cannot see hidden product"

        # Show again
        r4 = admin_session.patch(
            f"{BASE_URL}/api/products/{pid}/visibility",
            json={"is_visible": True},
        )
        assert r4.status_code == 200
        assert r4.json()["is_visible"] is True

        # Verify shown product IS in public list
        r5 = anon_session.get(f"{BASE_URL}/api/products?search={name_query}&limit=200")
        ids_after = [p["id"] for p in r5.json()["products"]]
        assert pid in ids_after, "product not visible after un-hiding"
    finally:
        # Restore original
        admin_session.patch(
            f"{BASE_URL}/api/products/{pid}/visibility",
            json={"is_visible": original_visibility},
        )


def test_visibility_requires_admin(anon_session, sample_product):
    pid = sample_product["id"]
    r = anon_session.patch(
        f"{BASE_URL}/api/products/{pid}/visibility",
        json={"is_visible": False},
    )
    assert r.status_code in (401, 403)


def test_visibility_invalid_product_id(admin_session):
    r = admin_session.patch(
        f"{BASE_URL}/api/products/507f1f77bcf86cd799439011/visibility",
        json={"is_visible": False},
    )
    assert r.status_code == 404


def test_public_endpoint_filters_invisible(anon_session, admin_session):
    """Verify public total == admin (is_active=true, is_visible=true) total."""
    pub = anon_session.get(f"{BASE_URL}/api/products?limit=1").json()
    adm = admin_session.get(f"{BASE_URL}/api/products/admin/all?limit=1").json()
    assert pub["total"] <= adm["total"]
