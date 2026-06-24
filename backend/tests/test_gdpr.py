"""GDPR compliance tests - delete account endpoint and related flows."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback for tests running inside container without frontend env
    BASE_URL = "http://localhost:8001"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def gdpr_test_user(api_client):
    """Create a fresh user (admin-verified bypass not available, so register-guest is used)."""
    email = f"test_gdpr_{uuid.uuid4().hex[:8]}@example.com"
    password = "Test12345!"
    name = "GDPR Test User"
    r = api_client.post(
        f"{BASE_URL}/api/auth/register-guest",
        json={"email": email, "password": password, "name": name},
    )
    assert r.status_code == 200, f"register-guest failed: {r.status_code} {r.text}"
    return {"email": email, "password": password, "name": name}


# ---- DELETE /api/auth/delete-account ----
class TestDeleteAccount:
    def test_delete_account_unauthenticated_returns_401(self, api_client):
        r = api_client.delete(f"{BASE_URL}/api/auth/delete-account")
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text}"

    def test_full_delete_account_flow(self, gdpr_test_user):
        """Login → DELETE account → cookies cleared → user can't login again."""
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})

        # 1. Login
        login = s.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": gdpr_test_user["email"], "password": gdpr_test_user["password"]},
        )
        assert login.status_code == 200, f"login failed: {login.text}"
        assert "access_token" in s.cookies, "access_token cookie missing"

        # 2. /me works
        me = s.get(f"{BASE_URL}/api/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == gdpr_test_user["email"]

        # 3. Delete account
        delete = s.delete(f"{BASE_URL}/api/auth/delete-account")
        assert delete.status_code == 200, f"delete failed: {delete.status_code} {delete.text}"
        body = delete.json()
        assert body.get("success") is True
        assert "изтрит" in body.get("message", "").lower() or "delete" in body.get("message", "").lower()

        # 4. Verify cookies cleared on response (Set-Cookie header should clear them)
        set_cookie_headers = delete.headers.get("set-cookie", "")
        # access_token / refresh_token should be in delete-cookie response
        assert "access_token" in set_cookie_headers, f"access_token not cleared: {set_cookie_headers}"
        assert "refresh_token" in set_cookie_headers, f"refresh_token not cleared: {set_cookie_headers}"

        # 5. Verify user no longer exists – login should now fail
        relogin = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": gdpr_test_user["email"], "password": gdpr_test_user["password"]},
        )
        assert relogin.status_code == 401, f"deleted user could still login: {relogin.status_code}"


# ---- Auth basics still work ----
class TestAuthHealth:
    def test_admin_login_works(self, api_client):
        r = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "konstantin.kirchev.bs@gmail.com", "password": "aS1zX2QwE34xK9"},
        )
        assert r.status_code == 200, f"admin login failed: {r.text}"
        data = r.json()
        assert data["role"] == "admin"
        assert data["email"] == "konstantin.kirchev.bs@gmail.com"
