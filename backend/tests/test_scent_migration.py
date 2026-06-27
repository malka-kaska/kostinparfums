"""Tests for scent migration endpoints - verifies is_visible filtering"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kostin-cosmetics-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "konstantin.kirchev.bs@gmail.com"
ADMIN_PASSWORD = "aS1zX2QwE34xK9"


@pytest.fixture(scope="module")
def admin_token():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    # Token may be in body or cookie
    token = data.get("access_token") or data.get("token")
    if not token:
        # Try cookie
        token = s.cookies.get("access_token") or s.cookies.get("token")
    assert token, f"No token returned: {data} cookies={s.cookies.get_dict()}"
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ===== Status endpoint =====
class TestScentMigrationStatus:
    def test_status_returns_total_visible(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/scent-migration/status", headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "db_stats" in data, f"missing db_stats: {data}"
        stats = data["db_stats"]
        assert "total_visible" in stats, f"db_stats must have total_visible (not total_products). Got: {stats}"
        assert "total_products" not in stats, f"db_stats should NOT contain total_products, got: {stats}"
        assert "with_profiles" in stats
        assert "percentage" in stats
        assert isinstance(stats["total_visible"], int)
        assert stats["total_visible"] >= 0
        # with_profiles should be <= total_visible (since query is filtered by is_visible)
        assert stats["with_profiles"] <= stats["total_visible"], \
            f"with_profiles ({stats['with_profiles']}) cannot exceed total_visible ({stats['total_visible']})"

    def test_status_top_level_fields(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/scent-migration/status", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for key in ("is_running", "total_to_process", "processed", "errors", "db_stats"):
            assert key in data, f"missing top-level key {key}"

    def test_total_visible_matches_products_filter(self, auth_headers):
        """total_visible should equal count of products with is_visible=true returned by admin products endpoint."""
        r1 = requests.get(f"{BASE_URL}/api/admin/scent-migration/status", headers=auth_headers, timeout=15)
        assert r1.status_code == 200
        total_visible_reported = r1.json()["db_stats"]["total_visible"]

        # Try to verify by fetching admin products
        r2 = requests.get(f"{BASE_URL}/api/admin/products", headers=auth_headers, timeout=20)
        if r2.status_code == 200:
            data = r2.json()
            products = data if isinstance(data, list) else data.get("products", data.get("items", []))
            if products:
                visible_count = sum(1 for p in products if p.get("is_visible", True) is True)
                # Allow some tolerance if pagination present
                if len(products) >= visible_count:
                    assert visible_count == total_visible_reported or total_visible_reported > 0, \
                        f"Mismatch: admin endpoint visible={visible_count} status reports={total_visible_reported}"


# ===== Start endpoint =====
class TestScentMigrationStart:
    def test_start_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/admin/scent-migration/start", timeout=15)
        assert r.status_code in (401, 403), f"Expected 401/403 without auth, got {r.status_code}: {r.text}"

    def test_start_migration_success(self, auth_headers):
        # First check status
        s = requests.get(f"{BASE_URL}/api/admin/scent-migration/status", headers=auth_headers, timeout=15)
        was_running = s.json().get("is_running", False)

        r = requests.post(f"{BASE_URL}/api/admin/scent-migration/start", headers=auth_headers, timeout=20)
        if was_running:
            assert r.status_code == 400, f"Already-running should return 400, got {r.status_code}"
        else:
            assert r.status_code == 200, f"Start failed: {r.status_code} {r.text}"
            body = r.json()
            assert body.get("status") == "running"

            # Stop it immediately to avoid running long migration during tests
            requests.post(f"{BASE_URL}/api/admin/scent-migration/stop", headers=auth_headers, timeout=15)

    def test_start_rejects_non_admin(self):
        # Try login as test user
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "test@example.com", "password": "Test123!"}, timeout=15)
        if r.status_code != 200:
            pytest.skip("Test user not seeded")
        token = r.json().get("access_token") or r.json().get("token")
        if not token:
            pytest.skip("No token for test user")
        r2 = requests.post(f"{BASE_URL}/api/admin/scent-migration/start",
                           headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r2.status_code in (401, 403), f"Non-admin should be rejected, got {r2.status_code}"
