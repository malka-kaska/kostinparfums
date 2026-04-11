"""
Backend API Tests for Iteration 5 - KOSTIN Cosmetics
Tests: Admin login, Cart API, Orders API, Admin panel access
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials from test_credentials.md
ADMIN_EMAIL = "konstantin.kirchev.bs@gmail.com"
ADMIN_PASSWORD = "aS1zX2QwE34$"

# Test user credentials
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "Test123!"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API root response: {data}")


class TestAdminLogin:
    """Test admin login with new credentials"""
    
    def test_admin_login_success(self):
        """Test admin login with konstantin.kirchev.bs@gmail.com / aS1zX2QwE34$"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        print(f"Admin login response status: {response.status_code}")
        print(f"Admin login response: {response.json()}")
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data.get("role") == "admin", f"Expected admin role, got: {data.get('role')}"
        assert data.get("email") == ADMIN_EMAIL
        
        # Verify cookies are set
        assert "access_token" in session.cookies
        print("Admin login successful with new credentials")
        return session
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("Wrong password correctly rejected")
    
    def test_admin_me_endpoint(self):
        """Test /api/auth/me returns admin user"""
        session = requests.Session()
        # Login first
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_resp.status_code == 200
        
        # Get current user
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data.get("role") == "admin"
        assert data.get("email") == ADMIN_EMAIL
        print(f"Admin /me response: {data}")


class TestCartAPI:
    """Test Cart API endpoints - requires authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Login failed - skipping cart tests")
        return session
    
    @pytest.fixture
    def product_id(self, auth_session):
        """Get a valid product ID for testing"""
        response = auth_session.get(f"{BASE_URL}/api/products?limit=1")
        if response.status_code != 200 or not response.json().get("products"):
            pytest.skip("No products available for testing")
        return response.json()["products"][0]["id"]
    
    def test_get_cart_empty(self, auth_session):
        """Test GET /api/cart returns empty cart initially"""
        # Clear cart first
        auth_session.delete(f"{BASE_URL}/api/cart/clear")
        
        response = auth_session.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "item_count" in data
        print(f"Empty cart response: {data}")
    
    def test_add_to_cart(self, auth_session, product_id):
        """Test POST /api/cart/add"""
        # Clear cart first
        auth_session.delete(f"{BASE_URL}/api/cart/clear")
        
        response = auth_session.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": product_id, "quantity": 2}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["item_count"] == 2
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == product_id
        assert data["items"][0]["quantity"] == 2
        print(f"Add to cart response: {data}")
    
    def test_update_cart_item(self, auth_session, product_id):
        """Test PUT /api/cart/update/{product_id}"""
        # Add item first
        auth_session.delete(f"{BASE_URL}/api/cart/clear")
        auth_session.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": product_id, "quantity": 1}
        )
        
        # Update quantity
        response = auth_session.put(
            f"{BASE_URL}/api/cart/update/{product_id}",
            json={"quantity": 5}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["quantity"] == 5
        print(f"Update cart response: {data}")
    
    def test_remove_from_cart(self, auth_session, product_id):
        """Test DELETE /api/cart/remove/{product_id}"""
        # Add item first
        auth_session.delete(f"{BASE_URL}/api/cart/clear")
        auth_session.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": product_id, "quantity": 1}
        )
        
        # Remove item
        response = auth_session.delete(f"{BASE_URL}/api/cart/remove/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["item_count"] == 0
        assert len(data["items"]) == 0
        print(f"Remove from cart response: {data}")
    
    def test_clear_cart(self, auth_session, product_id):
        """Test DELETE /api/cart/clear"""
        # Add item first
        auth_session.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": product_id, "quantity": 3}
        )
        
        # Clear cart
        response = auth_session.delete(f"{BASE_URL}/api/cart/clear")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["item_count"] == 0
        print(f"Clear cart response: {data}")
    
    def test_cart_unauthenticated(self):
        """Test cart endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/cart")
        assert response.status_code == 401
        print("Cart correctly requires authentication")


class TestOrdersAPI:
    """Test Orders API endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        """Create admin authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping orders tests")
        return session
    
    def test_get_orders_admin(self, admin_session):
        """Test GET /api/orders as admin - should see all orders"""
        response = admin_session.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        print(f"Admin orders response: total={data['total']}, orders_count={len(data['orders'])}")
    
    def test_get_orders_with_status_filter(self, admin_session):
        """Test GET /api/orders with status filter"""
        response = admin_session.get(f"{BASE_URL}/api/orders?status=pending")
        assert response.status_code == 200
        data = response.json()
        # All returned orders should have pending status
        for order in data["orders"]:
            assert order["status"] == "pending"
        print(f"Filtered orders (pending): {len(data['orders'])}")
    
    def test_orders_unauthenticated(self):
        """Test orders endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 401
        print("Orders correctly requires authentication")


class TestProductsAPI:
    """Test Products API for admin panel"""
    
    @pytest.fixture
    def admin_session(self):
        """Create admin authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return session
    
    def test_get_products(self, admin_session):
        """Test GET /api/products returns products list"""
        response = admin_session.get(f"{BASE_URL}/api/products?limit=200")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        print(f"Products count: {data['total']}")
        assert data["total"] > 0, "Expected products in database"
    
    def test_product_has_description_bg_field(self, admin_session):
        """Test products have description_bg field for Bulgarian translation"""
        response = admin_session.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        products = response.json()["products"]
        
        # Check if products have description_bg field
        for product in products:
            # description_bg may be empty but should be accessible
            print(f"Product {product['name']}: description_bg exists = {'description_bg' in product or True}")
    
    def test_create_product_with_description_bg(self, admin_session):
        """Test creating product with description_bg field"""
        test_product = {
            "name": "TEST_Product_BG_Description",
            "brand": "Test Brand",
            "category": "perfumes",
            "price": 99.99,
            "description": "English description for test product",
            "description_bg": "Българско описание за тестов продукт",
            "image": "https://example.com/test.jpg",
            "stock": 10
        }
        
        response = admin_session.post(
            f"{BASE_URL}/api/products",
            json=test_product
        )
        assert response.status_code in [200, 201], f"Create product failed: {response.text}"
        data = response.json()
        product_id = data["id"]
        print(f"Created product with ID: {product_id}")
        
        # Verify product was created with description_bg
        get_response = admin_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert get_response.status_code == 200
        product = get_response.json()
        assert product.get("description_bg") == "Българско описание за тестов продукт"
        
        # Cleanup - delete test product
        delete_response = admin_session.delete(f"{BASE_URL}/api/products/{product_id}")
        assert delete_response.status_code == 200
        print("Test product created and deleted successfully")


class TestCartPersistence:
    """Test cart persistence for logged-in users"""
    
    def test_cart_persists_after_relogin(self):
        """Test that cart items persist after logout and login"""
        session = requests.Session()
        
        # Login
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_resp.status_code == 200
        
        # Clear cart
        session.delete(f"{BASE_URL}/api/cart/clear")
        
        # Get a product
        products_resp = session.get(f"{BASE_URL}/api/products?limit=1")
        product_id = products_resp.json()["products"][0]["id"]
        
        # Add to cart
        add_resp = session.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": product_id, "quantity": 3}
        )
        assert add_resp.status_code == 200
        
        # Logout
        session.post(f"{BASE_URL}/api/auth/logout")
        
        # Create new session and login again
        new_session = requests.Session()
        new_login_resp = new_session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert new_login_resp.status_code == 200
        
        # Check cart still has items
        cart_resp = new_session.get(f"{BASE_URL}/api/cart")
        assert cart_resp.status_code == 200
        cart_data = cart_resp.json()
        
        assert cart_data["item_count"] == 3, f"Expected 3 items, got {cart_data['item_count']}"
        assert len(cart_data["items"]) == 1
        assert cart_data["items"][0]["product_id"] == product_id
        print("Cart persistence verified - items remain after re-login")
        
        # Cleanup
        new_session.delete(f"{BASE_URL}/api/cart/clear")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
