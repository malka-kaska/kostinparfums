# KOSTIN - Luxury Cosmetics E-Commerce

## Original Problem Statement
Build a luxury cosmetics e-commerce website named "KOSTIN" with the slogan "Curated fragrances and beauty essentials". Features: product catalog, filtering, shopping cart, JWT auth, admin panel, Stripe payments, bilingual BG/EN support.

## Tech Stack
- **Frontend**: React, React Router, Context API (Auth + Language), Lucide icons
- **Backend**: FastAPI, Motor (async MongoDB), JWT Auth, Stripe SDK
- **Database**: MongoDB (kostin_cosmetics)
- **Integrations**: Stripe Payments

## What's Been Implemented

### Core Features (Complete)
1. **Product Catalog** - 7,347 products imported from dropshipping supplier CSV
2. **JWT Authentication** - Register/Login with bcrypt, admin seeding
3. **Product Detail Pages** - Full product info, stock status, related products
4. **Shopping Cart (Backend)** - MongoDB-persisted for logged-in users, localStorage fallback for guests
5. **Stripe Checkout** - Full payment flow with order creation on webhook
6. **Admin Panel** - Products tab (CRUD, visibility toggle, pagination) + Orders tab (status management)
7. **User Profile** - Account info, real order history from backend, saved addresses
8. **Category Navigation** - Perfumes, Skincare, Haircare, Men's Care
9. **Search & Filtering** - By category, brand, search term; sorting by name/price
10. **Product Visibility Toggle** - Admin can hide/show products from public store

### Product Import (June 2026)
- Imported 7,347 products from dropshipping supplier CSV (`/tmp/dropship_catalog.csv`)
- Categories mapped: perfumes (6,775), haircare (348), other (150), skincare (62), menscare (12)
- Each product has: SKU, name, brand, price, description, image URL, is_visible flag

### Admin Panel Features
- Products table with pagination (50 per page, 147 pages total)
- Visibility toggle button for each product (Eye/EyeOff icon)
- Hidden products appear dimmed in admin, not visible in public store
- Add/Edit/Delete products
- Order status management (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled)

### BG/EN Localization (Complete)
- Language toggle in header, auto-detection, localStorage persistence
- 290+ translation keys covering all UI text
- Privacy Policy & Terms of Service fully translated to Bulgarian

### Content Pages (Complete)
- About Us, FAQ, Shipping & Returns, Privacy Policy (BG/EN), Terms of Service (BG/EN)

## Database Schema
- `users`: {email, password_hash, name, role, created_at}
- `products`: {sku, name, brand, category, price, description, description_bg, image, stock, is_active, is_visible, created_at}
- `carts`: {user_id, items: [{product_id, quantity}], updated_at}
- `orders`: {user_id, user_email, user_name, items, total, shipping_cost, status, payment_status, session_id, created_at}
- `payment_transactions`: {session_id, amount, currency, status, payment_status, items, user_id, user_email}

## API Endpoints
- Auth: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout
- Products: GET /api/products (public, visible only), GET /api/products/admin/all (admin, all products), GET /api/products/{id}, GET /api/products/categories, GET /api/products/brands, POST/PUT/DELETE /api/products, PATCH /api/products/{id}/visibility
- Cart: GET /api/cart, POST /api/cart/add, PUT /api/cart/update/{id}, DELETE /api/cart/remove/{id}, DELETE /api/cart/clear
- Orders: GET /api/orders, GET /api/orders/{id}, PUT /api/orders/{id}/status
- Payments: POST /api/payments/checkout, GET /api/payments/status/{session_id}, GET /api/payments/config

## Prioritized Backlog
### P1
- Dropshipping supplier API integration (waiting for user's API) - automated order forwarding
### P2
- Admin image upload for products (object storage integration)
- Restore MAKEUP and BODY CARE categories when supplier provides relevant products
### P3
- Loyalty program
- Order confirmation emails
- Stock sync with supplier API
