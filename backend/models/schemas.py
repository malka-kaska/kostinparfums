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
    description: str = ""
    description_bg: Optional[str] = None
    image: str = ""  # Legacy single image field
    images: Optional[List[str]] = None  # New: array of image URLs
    stock: int = 0
    is_active: bool = True
    is_visible: bool = True
    gender: Optional[List[str]] = None  # ["men"], ["women"], or ["men", "women"] for both
    collections: Optional[List[str]] = None  # Collection slugs: ["all_products", "dubai", "campaign_xyz"]


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    description_bg: Optional[str] = None
    image: Optional[str] = None  # Legacy single image field
    images: Optional[List[str]] = None  # New: array of image URLs
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    is_visible: Optional[bool] = None
    gender: Optional[List[str]] = None  # ["men"], ["women"], or ["men", "women"] for both
    collections: Optional[List[str]] = None  # Collection slugs


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
    city: str
    postal_code: str
    notes: Optional[str] = None


class CODOrderRequest(BaseModel):
    items: list
    shipping_address: ShippingAddress
    shipping_method: Optional[str] = "speedy_office"  # 'speedy_office' or 'address'
    shipping_cost: Optional[float] = 0.0
    email: Optional[str] = None  # For guest checkout


# Collection schemas
class CollectionCreate(BaseModel):
    name: str  # Display name: "Дубайски аромати"
    name_en: Optional[str] = None  # English name: "Dubai Fragrances"
    slug: str  # URL-friendly identifier: "dubai"
    description: Optional[str] = None
    description_en: Optional[str] = None
    is_system: bool = False  # System collections can't be deleted (all_products, dubai)
    is_active: bool = True


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    is_active: Optional[bool] = None


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
