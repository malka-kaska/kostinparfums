"""Tests for Speedy Bulgaria courier integration endpoints"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fall back to reading frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")


# ----- City search -----
class TestSpeedyCities:
    def test_search_cities_sofia(self):
        r = requests.get(f"{BASE_URL}/api/speedy/cities", params={"name": "София"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "cities" in data
        assert isinstance(data["cities"], list)
        assert len(data["cities"]) > 0
        c = data["cities"][0]
        for k in ["id", "name", "postCode", "type"]:
            assert k in c

    def test_search_cities_varna_en(self):
        r = requests.get(f"{BASE_URL}/api/speedy/cities", params={"name": "Варна"}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data["cities"]) > 0
        # Ensure Varna present
        names = [c["name"] for c in data["cities"]]
        assert any("Варна" in n for n in names)

    def test_search_cities_min_length(self):
        r = requests.get(f"{BASE_URL}/api/speedy/cities", params={"name": "S"}, timeout=30)
        # Validation: min_length=2
        assert r.status_code == 422


# ----- Office lookup -----
class TestSpeedyOffices:
    def test_offices_for_sofia(self):
        # Sofia city_id = 68134 per problem statement
        r = requests.get(f"{BASE_URL}/api/speedy/offices", params={"cityId": 68134}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "offices" in data
        assert isinstance(data["offices"], list)
        assert len(data["offices"]) > 0
        o = data["offices"][0]
        for k in ["id", "name", "address"]:
            assert k in o


# ----- Price calculation -----
class TestSpeedyCalculate:
    def _get_office_id(self, city_id):
        r = requests.get(f"{BASE_URL}/api/speedy/offices", params={"cityId": city_id}, timeout=30)
        assert r.status_code == 200
        offices = r.json()["offices"]
        # Prefer regular OFFICE type
        for o in offices:
            if o.get("type") == "OFFICE":
                return o["id"]
        return offices[0]["id"]

    def test_calculate_office_delivery(self):
        office_id = self._get_office_id(68134)
        payload = {
            "recipient_city_id": 68134,
            "recipient_office_id": office_id,
            "weight": 0.5,
            "delivery_type": "OFFICE",
        }
        r = requests.post(f"{BASE_URL}/api/speedy/calculate", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "price_bgn" in data
        assert "price_eur" in data
        assert isinstance(data["price_bgn"], (int, float))
        assert data["price_bgn"] > 0
        assert data["delivery_type"] == "OFFICE"

    def test_calculate_address_delivery(self):
        payload = {
            "recipient_city_id": 68134,
            "recipient_address": "ул. Витоша 1",
            "weight": 0.5,
            "delivery_type": "ADDRESS",
        }
        r = requests.post(f"{BASE_URL}/api/speedy/calculate", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["delivery_type"] == "ADDRESS"
        assert data["price_bgn"] > 0


# ----- COD order with speedy_data -----
class TestCODOrderWithSpeedy:
    def test_cod_order_with_speedy_data(self):
        # First obtain a real product id
        prod_r = requests.get(f"{BASE_URL}/api/products", params={"limit": 1}, timeout=30)
        assert prod_r.status_code == 200
        products = prod_r.json().get("products") or prod_r.json().get("items") or []
        if not products:
            pytest.skip("No products available for COD order test")
        product = products[0]
        pid = product.get("id") or product.get("_id")

        payload = {
            "items": [{
                "id": pid,
                "name": product.get("name", "Test"),
                "price": product.get("price", 50.0),
                "quantity": 1,
                "image": product.get("image", ""),
            }],
            "shipping_address": {
                "full_name": "TEST Speedy Buyer",
                "phone": "+359888123456",
                "address": "Speedy Office #1",
                "city": "София",
                "postal_code": "1000",
                "notes": "TEST speedy office order",
            },
            "shipping_method": "speedy_office",
            "shipping_cost": 6.50,
            "email": "test_verify@example.com",
            # Per review request - should be accepted (currently NOT in schema)
            "speedy_data": {
                "city_id": 68134,
                "office_id": 1,
                "delivery_type": "OFFICE",
            },
        }
        r = requests.post(f"{BASE_URL}/api/orders/cod", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "order_number" in data
        assert data["shipping_cost"] == 6.50
