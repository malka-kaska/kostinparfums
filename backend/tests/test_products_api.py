"""
Backend API Tests for KOSTIN Cosmetics - Products API with 186 Real Products
Tests: Products listing, filtering, categories, brands, single product, search
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProductsAPI:
    """Test products API endpoints with 186 real products from DB"""
    
    def test_get_all_products_returns_186(self):
        """GET /api/products should return 186 products total"""
        response = requests.get(f"{BASE_URL}/api/products?limit=200")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 186, f"Expected 186 products, got {data['total']}"
        assert len(data['products']) == 186
        print(f"✓ Total products: {data['total']}")
    
    def test_products_have_required_fields(self):
        """Products should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        product = response.json()['products'][0]
        
        required_fields = ['id', 'name', 'brand', 'category', 'price', 'description', 'image', 'stock', 'is_active']
        for field in required_fields:
            assert field in product, f"Missing field: {field}"
        
        # Verify wholesale_price is NOT exposed (security)
        assert 'wholesale_price' not in product, "wholesale_price should NOT be exposed in API"
        print(f"✓ Product has all required fields, wholesale_price hidden")
    
    def test_filter_by_category_perfumes(self):
        """GET /api/products?category=perfumes should return 71 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=perfumes&limit=100")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 71, f"Expected 71 perfumes, got {data['total']}"
        
        # Verify all products are perfumes
        for product in data['products']:
            assert product['category'] == 'perfumes', f"Product {product['name']} has wrong category"
        print(f"✓ Perfumes category: {data['total']} products")
    
    def test_filter_by_category_skincare(self):
        """GET /api/products?category=skincare should return 25 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=skincare&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 25, f"Expected 25 skincare products, got {data['total']}"
        print(f"✓ Skincare category: {data['total']} products")
    
    def test_filter_by_category_makeup(self):
        """GET /api/products?category=makeup should return 20 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=makeup&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 20, f"Expected 20 makeup products, got {data['total']}"
        print(f"✓ Makeup category: {data['total']} products")
    
    def test_filter_by_category_haircare(self):
        """GET /api/products?category=haircare should return 25 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=haircare&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 25, f"Expected 25 haircare products, got {data['total']}"
        print(f"✓ Haircare category: {data['total']} products")
    
    def test_filter_by_category_bodycare(self):
        """GET /api/products?category=bodycare should return 20 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=bodycare&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 20, f"Expected 20 bodycare products, got {data['total']}"
        print(f"✓ Body Care category: {data['total']} products")
    
    def test_filter_by_category_menscare(self):
        """GET /api/products?category=menscare should return 25 products"""
        response = requests.get(f"{BASE_URL}/api/products?category=menscare&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 25, f"Expected 25 menscare products, got {data['total']}"
        print(f"✓ Men's Care category: {data['total']} products")


class TestCategoriesAPI:
    """Test categories endpoint with correct display names"""
    
    def test_get_categories_returns_6(self):
        """GET /api/products/categories should return 6 categories"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200
        categories = response.json()
        assert len(categories) == 6, f"Expected 6 categories, got {len(categories)}"
        print(f"✓ Categories count: {len(categories)}")
    
    def test_categories_have_correct_display_names(self):
        """Categories should have correct display names (Body Care, Men's Care)"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200
        categories = response.json()
        
        # Build lookup by id
        cat_lookup = {c['id']: c['name'] for c in categories}
        
        # Verify display names
        assert cat_lookup.get('bodycare') == 'Body Care', f"Expected 'Body Care', got '{cat_lookup.get('bodycare')}'"
        assert cat_lookup.get('menscare') == "Men's Care", f"Expected \"Men's Care\", got '{cat_lookup.get('menscare')}'"
        assert cat_lookup.get('perfumes') == 'Perfumes', f"Expected 'Perfumes', got '{cat_lookup.get('perfumes')}'"
        assert cat_lookup.get('makeup') == 'Makeup', f"Expected 'Makeup', got '{cat_lookup.get('makeup')}'"
        assert cat_lookup.get('skincare') == 'Skincare', f"Expected 'Skincare', got '{cat_lookup.get('skincare')}'"
        assert cat_lookup.get('haircare') == 'Haircare', f"Expected 'Haircare', got '{cat_lookup.get('haircare')}'"
        print(f"✓ All category display names correct")
    
    def test_categories_have_product_counts(self):
        """Categories should have correct product counts"""
        response = requests.get(f"{BASE_URL}/api/products/categories")
        assert response.status_code == 200
        categories = response.json()
        
        expected_counts = {
            'perfumes': 71,
            'skincare': 25,
            'haircare': 25,
            'menscare': 25,
            'makeup': 20,
            'bodycare': 20
        }
        
        for cat in categories:
            expected = expected_counts.get(cat['id'])
            if expected:
                assert cat['product_count'] == expected, f"Category {cat['id']}: expected {expected}, got {cat['product_count']}"
        print(f"✓ All category product counts correct")


class TestBrandsAPI:
    """Test brands endpoint"""
    
    def test_get_brands_returns_list(self):
        """GET /api/products/brands should return brands list"""
        response = requests.get(f"{BASE_URL}/api/products/brands")
        assert response.status_code == 200
        brands = response.json()
        assert len(brands) > 0, "Expected at least one brand"
        print(f"✓ Brands count: {len(brands)}")
    
    def test_brands_have_product_counts(self):
        """Brands should have product_count field"""
        response = requests.get(f"{BASE_URL}/api/products/brands")
        assert response.status_code == 200
        brands = response.json()
        
        for brand in brands[:5]:  # Check first 5
            assert 'name' in brand, "Brand missing 'name' field"
            assert 'product_count' in brand, "Brand missing 'product_count' field"
            assert brand['product_count'] > 0, f"Brand {brand['name']} has 0 products"
        print(f"✓ Brands have correct structure")


class TestSingleProductAPI:
    """Test single product endpoint"""
    
    def test_get_single_product_by_id(self):
        """GET /api/products/{id} should return single product"""
        # First get a product ID
        list_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert list_response.status_code == 200
        product_id = list_response.json()['products'][0]['id']
        
        # Get single product
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        product = response.json()
        
        assert product['id'] == product_id
        assert 'name' in product
        assert 'price' in product
        assert 'wholesale_price' not in product, "wholesale_price should NOT be exposed"
        print(f"✓ Single product retrieved: {product['name'][:50]}...")
    
    def test_get_nonexistent_product_returns_404(self):
        """GET /api/products/{invalid_id} should return 404"""
        response = requests.get(f"{BASE_URL}/api/products/000000000000000000000000")
        assert response.status_code == 404
        print(f"✓ Nonexistent product returns 404")


class TestSearchAndSort:
    """Test search and sorting functionality"""
    
    def test_search_products(self):
        """GET /api/products?search=... should filter by search term"""
        response = requests.get(f"{BASE_URL}/api/products?search=Chanel&limit=50")
        assert response.status_code == 200
        data = response.json()
        
        # Should find some Chanel products
        if data['total'] > 0:
            for product in data['products']:
                # Search should match name, brand, or description
                search_term = 'chanel'
                matches = (
                    search_term in product['name'].lower() or
                    search_term in product['brand'].lower() or
                    search_term in product.get('description', '').lower()
                )
                assert matches, f"Product {product['name']} doesn't match search term"
        print(f"✓ Search returned {data['total']} results for 'Chanel'")
    
    def test_sort_by_price_low(self):
        """GET /api/products?sort=price-low should sort ascending"""
        response = requests.get(f"{BASE_URL}/api/products?sort=price-low&limit=10")
        assert response.status_code == 200
        products = response.json()['products']
        
        prices = [p['price'] for p in products]
        assert prices == sorted(prices), "Products not sorted by price ascending"
        print(f"✓ Sort by price-low works (first: €{prices[0]:.2f})")
    
    def test_sort_by_price_high(self):
        """GET /api/products?sort=price-high should sort descending"""
        response = requests.get(f"{BASE_URL}/api/products?sort=price-high&limit=10")
        assert response.status_code == 200
        products = response.json()['products']
        
        prices = [p['price'] for p in products]
        assert prices == sorted(prices, reverse=True), "Products not sorted by price descending"
        print(f"✓ Sort by price-high works (first: €{prices[0]:.2f})")
    
    def test_default_sort_by_name(self):
        """Default sort should be by name"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        products = response.json()['products']
        
        names = [p['name'] for p in products]
        assert names == sorted(names), "Products not sorted by name by default"
        print(f"✓ Default sort by name works")


class TestAuthLogin:
    """Test auth login for admin access"""
    
    def test_admin_login(self):
        """POST /api/auth/login with admin credentials"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@kostin.com", "password": "Admin123!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['email'] == 'admin@kostin.com'
        assert data['role'] == 'admin'
        print(f"✓ Admin login successful: {data['email']}")
    
    def test_test_user_login(self):
        """POST /api/auth/login with test user credentials"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@example.com", "password": "Test123!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['email'] == 'test@example.com'
        assert data['role'] == 'customer'
        print(f"✓ Test user login successful: {data['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
