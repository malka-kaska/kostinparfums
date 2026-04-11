# KOSTIN - Luxury Cosmetics E-Commerce

## Original Problem Statement
Build a luxury cosmetics e-commerce website named "KOSTIN" with the slogan "Curated beauty essentials". Features: product catalog, filtering, shopping cart, JWT auth, admin panel, Stripe payments, bilingual BG/EN support.

## Tech Stack
- **Frontend**: React, React Router, Context API (Auth + Language), Lucide icons
- **Backend**: FastAPI, Motor (async MongoDB), JWT Auth, Stripe SDK
- **Database**: MongoDB (kostin_cosmetics)
- **Integrations**: Stripe Payments, emergentintegrations (LLM for translations)

## What's Been Implemented

### Core Features (Complete)
1. **Product Catalog** - 185 real luxury products from wholesale CSV, calculated retail pricing
2. **JWT Authentication** - Register/Login with bcrypt, admin seeding
3. **Product Detail Pages** - Full product info, stock status, related products, bilingual descriptions
4. **Shopping Cart (Backend)** - MongoDB-persisted for logged-in users, localStorage fallback for guests
5. **Stripe Checkout** - Full payment flow with order creation on webhook
6. **Admin Panel** - Products tab (CRUD) + Orders tab (status management)
7. **User Profile** - Account info, real order history from backend, saved addresses
8. **Category Navigation** - Perfumes, Makeup, Skincare, Haircare, Body Care, Men's Care
9. **Search & Filtering** - By category, brand, search term; sorting by name/price

### BG/EN Localization (Complete)
- Language toggle in header, auto-detection, localStorage persistence
- 290+ translation keys covering all UI text
- Bulgarian product descriptions for all 185 products (GPT-4.1-mini generated)
- Privacy Policy & Terms of Service fully translated to Bulgarian
- Product/brand names remain untranslated

### Content Pages (Complete)
- About Us, FAQ, Shipping & Returns, Privacy Policy (BG/EN), Terms of Service (BG/EN)

## Database Schema
- `users`: {email, password_hash, name, role, created_at}
- `products`: {name, brand, category, size, price, wholesale_price, description, description_bg, stock, image_url, is_active}
- `carts`: {user_id, items: [{product_id, quantity}], updated_at}
- `orders`: {user_id, user_email, user_name, items, total, shipping_cost, status, payment_status, session_id, created_at}
- `payment_transactions`: {session_id, amount, currency, status, payment_status, items, user_id, user_email}

## API Endpoints
- Auth: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout
- Products: GET /api/products, GET /api/products/{id}, GET /api/products/categories, GET /api/products/brands, POST/PUT/DELETE /api/products
- Cart: GET /api/cart, POST /api/cart/add, PUT /api/cart/update/{id}, DELETE /api/cart/remove/{id}, DELETE /api/cart/clear
- Orders: GET /api/orders, GET /api/orders/{id}, PUT /api/orders/{id}/status
- Payments: POST /api/payments/checkout, GET /api/payments/status/{session_id}, GET /api/payments/config

## Prioritized Backlog
### P1
- Dropshipping supplier API integration (waiting for user's API)
### P2
- Admin image upload for products (object storage integration)
### P3
- Loyalty program
- Order confirmation emails
- Stock sync with supplier API
