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
    image: str = ""
    stock: int = 0
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    description_bg: Optional[str] = None
    image: Optional[str] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None


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
    created_at: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    product_count: int


class CheckoutRequest(BaseModel):
    origin_url: str
    items: list
