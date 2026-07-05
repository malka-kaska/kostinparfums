from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from utils.meta_catalog import (
    transform_product_for_meta,
    to_batch_feed_item,
    _parse_image_dimensions,
    _has_clean_background_hint,
)


def test_transform_product_for_meta_generates_required_labels_and_pdp_link():
    product = {
        "_id": "abc123",
        "name": "Test Perfume",
        "description_bg": "Описание на продукта",
        "brand": "Test Brand",
        "category": "perfumes",
        "price": 120.0,
        "images": ["https://cdn.example.com/clean-white-product.jpg"],
        "stock": 10,
        "is_active": True,
        "is_visible": True,
        "bestseller_rank": 3,
        "gtin": "1234567890123",
        "mpn": "TP-120",
    }

    meta_product = transform_product_for_meta(product)
    assert meta_product["url"] == "https://kostinparfums.com/product/abc123"
    assert meta_product["currency"] == "EUR"
    assert meta_product["custom_label_0"] == "perfumes"
    assert meta_product["custom_label_1"] == "3"
    assert meta_product["custom_label_2"] == "yes"
    assert meta_product["gtin"] == "1234567890123"
    assert meta_product["mpn"] == "TP-120"


def test_to_batch_feed_item_contains_required_and_optional_fields():
    meta_product = {
        "retailer_id": "abc123",
        "name": "Test Perfume",
        "description": "Описание",
        "availability": "in stock",
        "condition": "new",
        "price": 12000,
        "currency": "EUR",
        "url": "https://kostinparfums.com/product/abc123",
        "image_url": "https://cdn.example.com/img.jpg",
        "brand": "Test Brand",
        "custom_label_0": "perfumes",
        "custom_label_1": "3",
        "custom_label_2": "yes",
        "gtin": "1234567890123",
        "mpn": "TP-120",
    }

    feed_item = to_batch_feed_item(meta_product)
    assert feed_item["id"] == "abc123"
    assert feed_item["condition"] == "new"
    assert feed_item["price"] == "120.00 EUR"
    assert feed_item["link"] == "https://kostinparfums.com/product/abc123"
    assert feed_item["gtin"] == "1234567890123"
    assert feed_item["mpn"] == "TP-120"


def test_parse_image_dimensions_png():
    png_header = (
        b"\x89PNG\r\n\x1a\n"
        b"\x00\x00\x00\rIHDR"
        b"\x00\x00\x01\xf4"  # width = 500
        b"\x00\x00\x01\xf4"  # height = 500
        b"\x08\x02\x00\x00\x00"
    )
    assert _parse_image_dimensions(png_header) == (500, 500)


def test_clean_background_hint_detection():
    assert _has_clean_background_hint("https://cdn.example.com/products/white-bg-image.jpg") is True
    assert _has_clean_background_hint("https://cdn.example.com/products/item-01.jpg") is False
