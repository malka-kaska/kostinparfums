"""
Backend API Tests for KOSTIN Cosmetics
Tests: Auth endpoints (register, login, logout, me, refresh) and Products CRUD
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API root response: {data}")


class TestAuthRegister:
    """Test user registration endpoint"""
    
    def test_register_new_user(self):
        """Test registering a new user"""
        session = requests.Session()
        unique_email = f"TEST_user_{int(time.time())}@example.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Test User"
        })
        
        assert response.status_code == 200, f"Register failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Test User"
        assert data["role"] == "customer"
        
        # Verify cookies are set
        cookies = session.cookies.get_dict()
        assert "access_token" in cookies, "access_token cookie not set"
        assert "refresh_token" in cookies, "refresh_token cookie not set"
        print(f"Registered user: {data['email']}, cookies set: {list(cookies.keys())}")
    
    def test_register_duplicate_email(self):
        """Test registering with existing email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "admin@kostin.com",
            "password": "TestPass123!",
            "name": "Duplicate User"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
        print(f"Duplicate email error: {data['detail']}")
    
    def test_register_short_password(self):
        """Test registering with short password fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_short_{int(time.time())}@example.com",
            "password": "12345",
            "name": "Short Pass User"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "6 characters" in data["detail"]
        print(f"Short password error: {data['detail']}")


class TestAuthLogin:
    """Test user login endpoint"""
    
    def test_login_admin_success(self):
        """Test admin login with correct credentials"""
        session = requests.Session()
        
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kostin.com",
            "password": "Admin123!"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == "admin@kostin.com"
        assert data["role"] == "admin"
        
        # Verify cookies are set
        cookies = session.cookies.get_dict()
        assert "access_token" in cookies, "access_token cookie not set"
        assert "refresh_token" in cookies, "refresh_token cookie not set"
        print(f"Admin login successful: {data['email']}, role: {data['role']}")
    
    def test_login_invalid_password(self):
        """Test login with wrong password fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kostin.com",
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()
        print(f"Invalid password error: {data['detail']}")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data["detail"].lower()
        print(f"Non-existent user error: {data['detail']}")


class TestAuthMe:
    """Test /me endpoint for current user"""
    
    def test_get_me_authenticated(self):
        """Test getting current user when authenticated"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kostin.com",
            "password": "Admin123!"
        })
        assert login_response.status_code == 200
        
        # Get current user
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        data = me_response.json()
        assert data["email"] == "admin@kostin.com"
        assert data["role"] == "admin"
        assert "id" in data
        print(f"GET /me response: {data}")
    
    def test_get_me_unauthenticated(self):
        """Test getting current user without auth fails"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print(f"Unauthenticated /me returns 401")


class TestAuthLogout:
    """Test logout endpoint"""
    
    def test_logout_clears_cookies(self):
        """Test logout clears auth cookies"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kostin.com",
            "password": "Admin123!"
        })
        assert login_response.status_code == 200
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        
        data = logout_response.json()
        assert "logged out" in data["message"].lower()
        print(f"Logout response: {data}")


class TestAuthRefresh:
    """Test token refresh endpoint"""
    
    def test_refresh_token(self):
        """Test refreshing access token"""
        session = requests.Session()
        
        # Login first
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kostin.com",
            "password": "Admin123!"
        })
        assert login_response.status_code == 200
        
        # Refresh token
        refresh_response = session.post(f"{BASE_URL}/api/auth/refresh")
        assert refresh_response.status_code == 200
        
        data = refresh_response.json()
        assert "refreshed" in data["message"].lower()
        print(f"Refresh response: {data}")
    
    def test_refresh_without_token(self):
        """Test refresh without refresh token fails"""
        response = requests.post(f"{BASE_URL}/api/auth/refresh")
        assert response.status_code == 401
        print(f"Refresh without token returns 401")


class TestForgotPassword:
    """Test forgot password endpoint"""
    
    def test_forgot_password_existing_email(self):
        """Test forgot password with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "admin@kostin.com"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "reset link" in data["message"].lower() or "email exists" in data["message"].lower()
        print(f"Forgot password response: {data}")
    
    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with non-existent email (should not reveal)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })
        
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        data = response.json()
        print(f"Forgot password (non-existent) response: {data}")


class TestProductsRead:
    """Test products read endpoints (public)"""
    
    def test_get_products_list(self):
        """Test getting products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert "page" in data
        assert isinstance(data["products"], list)
        print(f"Products list: {data['total']} total, page {data['page']}")
    
    def test_get_products_with_filters(self):
        """Test getting products with filters"""
        response = requests.get(f"{BASE_URL}/api/products?category=perfumes&sort=price-low&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        print(f"Filtered products: {len(data['products'])} results")
    
    def test_get_categories(self):
        """Test getting product categories"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Categories: {len(data)} categories")
    
    def test_get_brands(self):
        """Test getting product brands"""
        response = requests.get(f"{BASE_URL}/api/products/brands")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Brands: {len(data)} brands")


class TestProductsCRUD:
    """Test products CRUD operations (admin only)"""
    
    @pytest.fixture
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@kostin.com",
            "password": "Admin123!"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    def test_create_product_admin(self, admin_session):
        """Test creating a product as admin"""
        product_data = {
            "name": f"TEST_Product_{int(time.time())}",
            "brand": "TEST_Brand",
            "category": "perfumes",
            "price": 99.99,
            "description": "Test product description",
            "image": "https://example.com/image.jpg",
            "stock": 50
        }
        
        response = admin_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code == 200, f"Create product failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["name"] == product_data["name"]
        assert data["brand"] == product_data["brand"]
        assert data["price"] == product_data["price"]
        print(f"Created product: {data['id']} - {data['name']}")
        
        # Verify product exists via GET
        get_response = admin_session.get(f"{BASE_URL}/api/products/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == product_data["name"]
        print(f"Verified product via GET: {fetched['id']}")
        
        return data["id"]
    
    def test_update_product_admin(self, admin_session):
        """Test updating a product as admin"""
        # First create a product
        create_response = admin_session.post(f"{BASE_URL}/api/products", json={
            "name": f"TEST_Update_{int(time.time())}",
            "brand": "TEST_Brand",
            "category": "makeup",
            "price": 49.99,
            "description": "Original description",
            "image": "https://example.com/image.jpg",
            "stock": 25
        })
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Update the product
        update_data = {
            "name": "TEST_Updated_Name",
            "price": 59.99,
            "stock": 30
        }
        
        update_response = admin_session.put(f"{BASE_URL}/api/products/{product_id}", json=update_data)
        assert update_response.status_code == 200
        
        updated = update_response.json()
        assert updated["name"] == "TEST_Updated_Name"
        assert updated["price"] == 59.99
        assert updated["stock"] == 30
        print(f"Updated product: {product_id}")
        
        # Verify via GET
        get_response = admin_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == "TEST_Updated_Name"
        print(f"Verified update via GET")
    
    def test_delete_product_admin(self, admin_session):
        """Test deleting a product as admin"""
        # First create a product
        create_response = admin_session.post(f"{BASE_URL}/api/products", json={
            "name": f"TEST_Delete_{int(time.time())}",
            "brand": "TEST_Brand",
            "category": "skincare",
            "price": 29.99,
            "description": "To be deleted",
            "image": "https://example.com/image.jpg",
            "stock": 10
        })
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Delete the product
        delete_response = admin_session.delete(f"{BASE_URL}/api/products/{product_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert "deleted" in data["message"].lower()
        print(f"Deleted product: {product_id}")
        
        # Verify product no longer exists
        get_response = admin_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert get_response.status_code == 404
        print(f"Verified deletion via GET (404)")
    
    def test_create_product_unauthorized(self):
        """Test creating product without auth fails"""
        response = requests.post(f"{BASE_URL}/api/products", json={
            "name": "Unauthorized Product",
            "brand": "Brand",
            "category": "perfumes",
            "price": 99.99
        })
        
        assert response.status_code == 401
        print(f"Unauthorized create returns 401")
    
    def test_create_product_non_admin(self):
        """Test creating product as non-admin fails"""
        session = requests.Session()
        
        # Register a regular user
        unique_email = f"TEST_regular_{int(time.time())}@example.com"
        reg_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Regular User"
        })
        assert reg_response.status_code == 200
        
        # Try to create product
        response = session.post(f"{BASE_URL}/api/products", json={
            "name": "Non-Admin Product",
            "brand": "Brand",
            "category": "perfumes",
            "price": 99.99
        })
        
        assert response.status_code == 403
        data = response.json()
        assert "admin" in data["detail"].lower()
        print(f"Non-admin create returns 403: {data['detail']}")


class TestBruteForceProtection:
    """Test brute force protection on login"""
    
    def test_brute_force_lockout(self):
        """Test that multiple failed logins trigger lockout"""
        # Use a unique email to avoid affecting other tests
        test_email = f"TEST_bruteforce_{int(time.time())}@example.com"
        
        # First register the user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "CorrectPass123!",
            "name": "Brute Force Test"
        })
        assert reg_response.status_code == 200
        
        # Attempt 5 failed logins
        for i in range(5):
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "WrongPassword!"
            })
            assert response.status_code == 401, f"Attempt {i+1} should fail with 401"
        
        # 6th attempt should be locked out (429)
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "WrongPassword!"
        })
        
        assert response.status_code == 429, f"Expected 429 lockout, got {response.status_code}"
        data = response.json()
        assert "too many" in data["detail"].lower() or "15 minutes" in data["detail"].lower()
        print(f"Brute force lockout triggered: {data['detail']}")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Cleanup would require admin access to delete test users/products
    # For now, test data with TEST_ prefix can be identified and cleaned manually
    print("Test session complete. TEST_ prefixed data may need manual cleanup.")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
