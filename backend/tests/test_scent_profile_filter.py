"""Tests for new scent_profile_filter on /api/products/admin/all and scent migration target text."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_EMAIL = "konstantin.kirchev.bs@gmail.com"
ADMIN_PASSWORD = "aS1zX2QwE34xK9"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


class TestScentProfileFilter:
    """Verify /api/products/admin/all supports scent_profile_filter=all|with|without"""

    def test_admin_all_no_filter(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/products/admin/all?limit=10")
        assert r.status_code == 200
        data = r.json()
        assert "products" in data and "total" in data
        assert isinstance(data["products"], list)

    def test_filter_all(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/products/admin/all?scent_profile_filter=all&limit=10")
        assert r.status_code == 200
        total_all_param = r.json()["total"]
        r2 = admin_session.get(f"{BASE_URL}/api/products/admin/all?limit=10")
        assert r2.status_code == 200
        assert total_all_param == r2.json()["total"], "scent_profile_filter=all should match no filter"

    def test_filter_with_returns_only_products_with_profiles(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/products/admin/all?scent_profile_filter=with&limit=50")
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        # Every returned product must have non-empty scent_profiles
        for p in data["products"]:
            assert p.get("scent_profiles"), f"product without profiles returned: {p.get('name')}"
            assert isinstance(p["scent_profiles"], list)
            assert len(p["scent_profiles"]) > 0

    def test_filter_without_returns_only_products_without_profiles(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/products/admin/all?scent_profile_filter=without&limit=50")
        assert r.status_code == 200
        data = r.json()
        for p in data["products"]:
            sp = p.get("scent_profiles")
            assert (sp is None) or (sp == []), f"product with profiles returned: {p.get('name')} -> {sp}"

    def test_with_plus_without_equals_total(self, admin_session):
        r_all = admin_session.get(f"{BASE_URL}/api/products/admin/all?limit=1").json()["total"]
        r_with = admin_session.get(f"{BASE_URL}/api/products/admin/all?scent_profile_filter=with&limit=1").json()["total"]
        r_without = admin_session.get(f"{BASE_URL}/api/products/admin/all?scent_profile_filter=without&limit=1").json()["total"]
        assert r_with + r_without == r_all, f"with({r_with})+without({r_without}) != all({r_all})"

    def test_search_combined_with_scent_filter_without(self, admin_session):
        # Ensure $or merging works (combined search + scent_profile_filter)
        r = admin_session.get(f"{BASE_URL}/api/products/admin/all?scent_profile_filter=without&search=a&limit=5")
        assert r.status_code == 200, r.text


class TestProductScentProfilesUpdate:
    """Verify product update preserves/saves scent_profiles."""

    def test_update_scent_profiles_persists(self, admin_session):
        # Find any product (preferably one without profile)
        r = admin_session.get(f"{BASE_URL}/api/products/admin/all?limit=5")
        assert r.status_code == 200
        products = r.json()["products"]
        assert len(products) > 0
        product = products[0]
        pid = product["id"]
        original_profiles = product.get("scent_profiles", []) or []

        new_profiles = ["sweet", "fresh", "citrus"]
        payload = {"scent_profiles": new_profiles}
        r2 = admin_session.put(f"{BASE_URL}/api/products/{pid}", json=payload)
        assert r2.status_code == 200, f"Update failed: {r2.status_code} {r2.text}"
        updated = r2.json()
        assert set(updated.get("scent_profiles", [])) == set(new_profiles)

        # GET to verify persistence
        r3 = admin_session.get(f"{BASE_URL}/api/products/{pid}")
        assert r3.status_code == 200
        assert set(r3.json().get("scent_profiles", [])) == set(new_profiles)

        # Restore original
        admin_session.put(f"{BASE_URL}/api/products/{pid}", json={"scent_profiles": original_profiles})


class TestScentMigrationStatus:
    """Verify db_stats includes total_visible/with_profiles/percentage used by ScentMigrationManager."""

    def test_status_has_required_db_stats(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/admin/scent-migration/status")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "db_stats" in data
        stats = data["db_stats"]
        for k in ("total_visible", "with_profiles", "percentage"):
            assert k in stats, f"missing {k} in {stats}"
        assert stats["with_profiles"] <= stats["total_visible"]
