"""
Tests for the order cancellation feature.

Covers:
- POST /api/orders/guest/{order_id}/cancel?token=...  (guest flow)
- POST /api/orders/{order_id}/cancel                  (logged in user flow)
- POST /api/orders/admin/{order_id}/cancel            (admin flow - existence check)

Note: We rely on the test admin credentials in /app/memory/test_credentials.md.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://kostin-cosmetics-1.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "konstantin.kirchev.bs@gmail.com"
ADMIN_PASSWORD = "aS1zX2QwE34xK9"


@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    # Cookies should now be set in session. Also add Bearer if returned.
    data = r.json()
    token = data.get("access_token") or data.get("token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------- Guest cancellation flow ----------

class TestGuestCancel:
    def test_guest_cancel_invalid_token(self):
        """Guest cancel must reject invalid token with 4xx (not 200)."""
        r = requests.post(
            f"{BASE_URL}/api/orders/guest/000000000000000000000000/cancel?token=INVALID_TOKEN_TEST",
            json={"reason": "TEST_invalid_token"},
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code in (400, 404), f"Expected 4xx, got {r.status_code}: {r.text}"

    def test_guest_cancel_missing_token(self):
        """Guest cancel without ?token must return 400."""
        r = requests.post(
            f"{BASE_URL}/api/orders/guest/000000000000000000000000/cancel",
            json={"reason": "TEST_missing_token"},
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"
        data = r.json()
        assert "token" in (data.get("detail", "") or "").lower()

    def test_guest_cancel_invalid_objectid_format(self):
        """Guest cancel with non-ObjectId order id and bogus token returns 404 (not 500)."""
        r = requests.post(
            f"{BASE_URL}/api/orders/guest/not-an-objectid/cancel?token=abc",
            json={"reason": "TEST"},
            headers={"Content-Type": "application/json"},
        )
        # Either route's $or with order_number lookup returns 404 or 400, never 500
        assert r.status_code in (400, 404, 422), f"Unexpected status {r.status_code}: {r.text}"


# ---------- User cancellation flow ----------

class TestUserCancel:
    def test_user_cancel_requires_auth(self):
        """Without auth -> 401."""
        r = requests.post(
            f"{BASE_URL}/api/orders/000000000000000000000000/cancel",
            json={"reason": "TEST"},
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"

    def test_user_cancel_nonexistent_order_authenticated(self, admin_session):
        """Authenticated request for non-existent order -> 404."""
        r = admin_session.post(
            f"{BASE_URL}/api/orders/000000000000000000000000/cancel",
            json={"reason": "TEST_nonexistent"},
        )
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"

    def test_user_cancel_requires_reason_body(self, admin_session):
        """Endpoint expects pydantic body with 'reason'. Missing body returns 422."""
        r = admin_session.post(
            f"{BASE_URL}/api/orders/000000000000000000000000/cancel",
            json={},
        )
        assert r.status_code == 422, f"Expected 422 validation error, got {r.status_code}: {r.text}"


# ---------- Admin cancellation endpoint ----------

class TestAdminCancel:
    def test_admin_cancel_endpoint_exists(self, admin_session):
        """Admin cancel endpoint exists and responds (404 for missing order, not 405)."""
        r = admin_session.post(
            f"{BASE_URL}/api/orders/admin/000000000000000000000000/cancel",
            json={"reason": "TEST_admin"},
        )
        assert r.status_code != 405, "Endpoint should accept POST"
        assert r.status_code in (404, 400), f"Expected 404/400 for missing order, got {r.status_code}: {r.text}"

    def test_admin_cancel_requires_admin(self):
        """Admin cancel requires authentication."""
        r = requests.post(
            f"{BASE_URL}/api/orders/admin/000000000000000000000000/cancel",
            json={"reason": "TEST"},
            headers={"Content-Type": "application/json"},
        )
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"


# ---------- Frontend route reachability ----------

class TestFrontendRoute:
    def test_cancel_order_page_loads(self):
        """SPA route /cancel-order should serve the React app (200 + HTML)."""
        r = requests.get(f"{BASE_URL}/cancel-order?order=abc&token=xyz", timeout=20)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert "<html" in r.text.lower() or "<!doctype" in r.text.lower()
