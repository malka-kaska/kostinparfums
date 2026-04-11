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
1. **Product Catalog** - 185 real luxury products from wholesale CSV, with calculated retail pricing
2. **JWT Authentication** - Register/Login with bcrypt password hashing, admin seeding
3. **Product Detail Pages** - Full product info, stock status, related products, quantity selector
4. **Shopping Cart** - localStorage-based, add/remove/update, quantity controls
5. **Stripe Checkout** - Full payment flow with success/error handling
6. **Admin Panel** - CRUD operations for products (admin-only)
7. **User Profile** - Account info, order history, saved addresses
8. **Category Navigation** - Perfumes, Makeup, Skincare, Haircare, Body Care, Men's Care
9. **Search & Filtering** - By category, brand, search term; sorting by name/price

### Content Pages (Complete)
- About Us, FAQ, Shipping & Returns, Privacy Policy, Terms of Service

### BG/EN Localization (Complete - Dec 2025)
- Language toggle in header (Globe icon + BG/EN label)
- Auto-detection from browser language
- Persistent language preference via localStorage
- 290+ translation keys for all UI text
- Bulgarian product descriptions generated via GPT-4.1-mini for all 185 products
- Product names and brand names remain untranslated (as requested)
- Coverage: Header, Footer, Home, Products, Product Detail, Cart, Auth, Profile, Admin, FAQ, About Us, Shipping & Returns

## Database Schema
- `users`: {email, hashed_password, name, role, created_at}
- `products`: {name, brand, category, size, price, wholesale_price, description, description_bg, stock, image_url, is_active}

## API Endpoints
- POST /api/auth/login, POST /api/auth/register, GET /api/auth/me
- GET /api/products, GET /api/products/{id}, GET /api/products/categories, GET /api/products/brands
- POST /api/products, PUT /api/products/{id}, DELETE /api/products/{id}
- POST /api/payments/checkout, GET /api/payments/status/{session_id}, GET /api/payments/config

## Prioritized Backlog
### P1
- Dropshipping supplier API integration (waiting for user's API)
### P2
- Shopping cart backend (persist in DB per user session)
- Admin panel enhancements (order tracking, image upload, translations editing)
### P3
- Privacy Policy / Terms of Service Bulgarian translations
- Loyalty program
- Order confirmation emails
- Stock sync with supplier API
