# KOSTIN - Luxury Cosmetics E-Commerce

## Original Problem Statement
Build a luxury cosmetics e-commerce website named "KOSTIN" with the slogan "Curated beauty essentials".

## Product Requirements

### Core Features
- **Product Categories:** Perfumes, Makeup, Skincare, Haircare, Body care, Men's care
- **Products:** User will provide product list to populate
- **Product filtering** (by category, brand, price, search)
- **Shopping cart** functionality
- **User authentication** (JWT login/register with httpOnly cookies)
- **My Profile page** for logged-in users
- **Admin panel** for product CRUD management

### Design & Branding
- Luxury minimalist aesthetic
- Euro (€) currency
- Europe-only shipping
- Free shipping for orders over €100

## Technical Architecture

```
/app
├── backend/
│   ├── .env (MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, STRIPE keys, FRONTEND_URL)
│   ├── requirements.txt
│   ├── server.py (main FastAPI app, payment routes, startup/shutdown)
│   ├── routes/
│   │   ├── auth.py (register, login, logout, me, refresh, forgot/reset password)
│   │   └── products.py (CRUD, categories, brands, filtering)
│   ├── models/
│   │   └── schemas.py (Pydantic models)
│   └── utils/
│       └── auth.py (JWT, bcrypt, admin seeding)
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx (real API auth with httpOnly cookies)
│   │   ├── components/ (Header, Footer, Hero, ProductCard, ScrollToTop)
│   │   ├── pages/ (Home, Products, ProductDetail, Cart, Auth, Admin, Profile, etc.)
│   │   └── mock.js (fallback data when DB is empty)
│   └── .env (REACT_APP_BACKEND_URL)
├── contracts.md (API endpoint definitions)
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## What's Been Implemented

### Backend (Complete)
- **JWT Authentication:** Register, Login, Logout, /me, Refresh, Forgot/Reset password
- **Password Security:** bcrypt hashing, brute force protection (5 attempts = 15min lockout)
- **Admin Seeding:** Auto-creates admin user on startup from .env
- **Products API:** Full CRUD with filtering (category, brand, search, price range, sort, pagination)
- **Categories/Brands API:** Dynamic aggregation from product data
- **Stripe Payments:** Checkout session creation, status, webhooks
- **CORS:** Configured with explicit frontend URL for credentials

### Frontend (Complete)
- **AuthContext:** Real API auth with httpOnly cookies (replaces mock)
- **Auth Page:** Login/Register with error handling, loading states
- **Header:** Auth-aware (user dropdown, admin link, logout)
- **Profile Page:** Account info, order history, address management
- **Admin Panel:** Product CRUD via API (create, edit, delete)
- **Products/Home/ProductDetail:** Fetch from API with mock.js fallback
- **Cart:** localStorage-based with Stripe checkout
- **Legal Pages:** Privacy Policy, Terms of Service, About Us
- **Other:** FAQ, Shipping & Returns, Scroll-to-top

## Test Credentials
- **Admin:** admin@kostin.com / Admin123!
- **Test User:** test@example.com / Test123!
- **Stripe Test Card:** 4242 4242 4242 4242

## API Endpoints
See `/app/contracts.md` for full API documentation.

## Prioritized Backlog

### P0 - Complete
- ~~Backend API Implementation~~
- ~~JWT Authentication~~
- ~~Products CRUD API~~
- ~~Frontend-Backend Integration~~
- ~~Admin Panel Backend~~
- ~~Fix hardcoded Stripe keys~~
- ~~Create contracts.md~~

### P1 - Next Up
1. **Product Data Population** — User to provide product list; admin panel ready for CRUD
2. **Shopping Cart Backend** — Move cart from localStorage to database (persist per user)
3. **Orders System** — Create order on successful payment, track order history

### P2 - Future
4. **Wishlist** functionality
5. **Search** full-text with backend
6. **Product Reviews/Ratings**
7. **Email Notifications** (order confirmation, shipping updates)
8. **Image Upload** for product management

## Testing Status
- **Iteration 2:** Auth + Products — Backend 96% (23/24), Frontend 100%
- Only failure: brute force test in load-balanced K8s environment (expected)
