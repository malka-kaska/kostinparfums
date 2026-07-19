from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class UserRegister(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: str


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str


class ProductCreate(BaseModel):
    name: str
    brand: str
    category: str
    price: float
    original_price: Optional[float] = None  # Original price before discount (if on sale)
    description: str = ""
    description_bg: Optional[str] = None
    image: str = ""  # Legacy single image field
    images: Optional[List[str]] = None  # New: array of image URLs
    stock: int = 0
    is_active: bool = True
    is_visible: bool = True
    gender: Optional[List[str]] = None  # ["men"], ["women"], or ["men", "women"] for both
    collections: Optional[List[str]] = None  # Collection slugs: ["all_products", "dubai", "campaign_xyz"]
    scent_profiles: Optional[List[str]] = None  # Scent profile tags: ["sweet", "woody", "oriental", etc.]
    related_product_ids: Optional[List[str]] = None  # Manual "You may also like" picks


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None  # Original price before discount (if on sale), set to None to remove discount
    description: Optional[str] = None
    description_bg: Optional[str] = None
    image: Optional[str] = None  # Legacy single image field
    images: Optional[List[str]] = None  # New: array of image URLs
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    is_visible: Optional[bool] = None
    gender: Optional[List[str]] = None  # ["men"], ["women"], or ["men", "women"] for both
    collections: Optional[List[str]] = None  # Collection slugs
    scent_profiles: Optional[List[str]] = None  # Scent profile tags
    related_product_ids: Optional[List[str]] = None  # Manual "You may also like" picks


class ProductVisibilityUpdate(BaseModel):
    is_visible: bool


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class ProductResponse(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price: float
    description: str
    image: str
    stock: int
    is_active: bool
    is_visible: bool = True
    created_at: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    product_count: int


class CheckoutRequest(BaseModel):
    origin_url: str
    items: list


# Cash on Delivery (COD) Order
class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    address: str
    city: Optional[str] = None  # City name from Speedy selection
    postal_code: Optional[str] = None  # Made optional for Speedy integration
    notes: Optional[str] = None
    office_id: Optional[int] = None  # Speedy office ID
    office_name: Optional[str] = None  # Speedy office name


class SpeedyData(BaseModel):
    """Speedy courier integration data"""
    city_id: Optional[int] = None
    city_name: Optional[str] = None
    office_id: Optional[int] = None
    office_name: Optional[str] = None
    delivery_type: Optional[str] = None  # 'OFFICE' or 'ADDRESS'
    address: Optional[str] = None  # Full address for address delivery


class CODOrderRequest(BaseModel):
    items: list
    shipping_address: ShippingAddress
    shipping_method: Optional[str] = "speedy_office"  # 'speedy_office' or 'address'
    shipping_cost: Optional[float] = 0.0
    email: Optional[str] = None  # For guest checkout
    speedy_data: Optional[SpeedyData] = None  # Speedy integration data
    discount_code: Optional[str] = None  # Discount code applied
    discount_amount: Optional[float] = 0.0  # Discount amount in EUR


# Collection schemas
class CollectionCreate(BaseModel):
    name: str  # Display name: "Дубайски аромати"
    name_en: Optional[str] = None  # English name: "Dubai Fragrances"
    name_bg: Optional[str] = None  # Bulgarian name
    slug: str  # URL-friendly identifier: "dubai"
    description: Optional[str] = None
    description_en: Optional[str] = None
    banner_image: Optional[str] = None
    is_system: bool = False  # System collections can't be deleted (all_products, dubai)
    is_active: bool = True
    show_in_nav: bool = False  # Show in header/footer navigation


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    name_bg: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    banner_image: Optional[str] = None
    is_active: Optional[bool] = None
    show_in_nav: Optional[bool] = None


class CollectionResponse(BaseModel):
    id: str
    name: str
    name_en: Optional[str] = None
    slug: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    is_system: bool = False
    is_active: bool = True
    product_count: Optional[int] = 0
    created_at: Optional[str] = None
