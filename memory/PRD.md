# KOSTIN - Luxury Perfume E-Commerce

## Original Problem Statement
Build a luxury perfume e-commerce website named "KOSTIN" with the slogan "Селекция от луксозни аромати" (Selection of luxury fragrances). Features: massive dropship product catalog (7,300+ perfumes), filtering, shopping cart, JWT auth, comprehensive admin panel with Cloudinary image uploads, Stripe payments, bilingual BG/EN support.

## Tech Stack
- **Frontend**: React, React Router, Context API (Auth + Language), Lucide icons, Tailwind-inspired CSS
- **Backend**: FastAPI, Motor (async MongoDB), JWT Auth, Stripe SDK, Cloudinary SDK
- **Database**: MongoDB (kostin_cosmetics)
- **Integrations**: Stripe Payments, Cloudinary Image Hosting

## What's Been Implemented

### Core Features (Complete)
1. **Product Catalog** - 7,347 products imported from dropshipping supplier CSV
2. **JWT Authentication** - Register/Login with bcrypt, admin seeding, brute force protection
3. **Product Detail Pages** - Full product info, image gallery support, stock status, related products
4. **Shopping Cart** - MongoDB-persisted for logged-in users, localStorage fallback for guests
5. **Stripe Checkout** - Full payment flow with order creation on webhook
6. **Admin Panel** - Products tab (CRUD, visibility toggle, pagination, multi-image upload, drag-and-drop reordering, advanced filtering/sorting) + Orders tab
7. **User Profile** - Account info, real order history from backend, saved addresses
8. **Perfume Categories** - Men's Fragrances, Women's Fragrances
9. **Search & Filtering** - By category, brand, search term; sorting by name/price/bestsellers
10. **Product Visibility Toggle** - Admin can hide/show products from public store
11. **Auto-Migration Script** - Automatically seeds production DB from products_backup.json on startup

### Image Handling (June 2026)
- Created `imageUtils.js` with helper functions for legacy pipe-separated URLs
- Cloudinary integration for new image uploads with auto-optimization
- Multi-image support per product with drag-and-drop reordering in Admin
- Product cards use `onError` fallback for broken images
- Product detail page supports image gallery with thumbnails

### Hero & Homepage (June 2026)
- **3-Image Rotating Carousel** with auto-advance and manual navigation
- **Luxury Perfume Focus** - Men's & Women's fragrance navigation
- **New Slogan**: "Селекция от луксозни аромати"
- Premium styling with soft shadows, gradient overlays

### Admin Panel Enhancements (June 2026)
- Advanced filtering: search, category, visibility status (all/visible/hidden)
- Multiple sorting options: A-Z, Z-A, price low-high, price high-low, bestsellers, newest
- Cloudinary image upload with drag-and-drop reordering
- Support for multiple images per product
- Visibility toggle for each product

### Code Quality Fixes (June 2026)
- **XSS Fix**: Removed `dangerouslySetInnerHTML` from AboutUs.jsx, replaced with SafeText component
- **React Hooks Optimization**: Added useMemo/useCallback to AuthContext.jsx to prevent unnecessary re-renders
- **Context Provider**: Wrapped AuthContext value in useMemo for better performance

### Dark/Light Theme System (June 2026)
- **ThemeContext**: Created context for managing theme state with localStorage persistence
- **System Preference Detection**: Auto-detects user's system theme (prefers-color-scheme)
- **Theme Toggle Button**: Added Sun/Moon icon button in header for manual theme switching
- **CSS Variables**: Implemented comprehensive dark theme with CSS custom properties
- **Persistence**: Theme preference saved in localStorage and persists across sessions

### BG/EN Localization (Complete)
- Language toggle in header, auto-detection, localStorage persistence
- 290+ translation keys covering all UI text
- Fixed Bulgarian grammar: "1 луксозен продукт" vs "X луксозни продукта"
- Privacy Policy & Terms of Service fully translated to Bulgarian

### Content Pages (Complete)
- About Us (updated for perfume focus), FAQ, Shipping & Returns, Privacy Policy (BG/EN), Terms of Service (BG/EN)

## Database Schema
- `users`: {email, password_hash, name, role, created_at}
- `products`: {sku, name, brand, category, price, description, description_bg, image, images: [], stock, is_active, is_visible, created_at}
- `carts`: {user_id, items: [{product_id, quantity}], updated_at}
- `orders`: {user_id, user_email, user_name, items, total, shipping_cost, status, payment_status, session_id, created_at}

## API Endpoints
- Auth: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout
- Products: GET /api/products (public, visible only), GET /api/products/admin/all (admin with filters), GET /api/products/{id}, GET /api/products/categories, GET /api/products/brands, PATCH /api/products/{id}/visibility
- Cart: GET /api/cart, POST /api/cart/add, PUT /api/cart/update/{id}, DELETE /api/cart/remove/{id}, DELETE /api/cart/clear
- Orders: GET /api/orders, PUT /api/orders/{id}/status
- Payments: POST /api/payments/checkout, GET /api/payments/status/{session_id}
- Upload: POST /api/upload/image (Cloudinary)

## Prioritized Backlog
### P1
- Dropshipping supplier API integration (waiting for user's API) - automated order forwarding

### P2
- Stock sync with supplier API

### P3
- Loyalty program
- Order confirmation emails

## Files Structure
```
/app/frontend/src/
├── utils/
│   └── imageUtils.js          # Image helpers, fallbacks
├── components/
│   ├── ProductCard.jsx        # Uses getMainImage with onError fallback
│   ├── Hero.jsx               # 3-image rotating carousel
│   └── Hero.css
├── pages/
│   ├── Home.jsx               # Perfume-focused categories
│   ├── Products.jsx
│   ├── ProductDetail.jsx      # Gallery support
│   ├── Admin.jsx              # Advanced filtering, multi-image upload, drag-drop
│   ├── AboutUs.jsx            # XSS-safe with SafeText component
│   └── Profile.jsx
├── context/
│   ├── AuthContext.jsx        # Optimized with useMemo/useCallback
│   ├── LanguageContext.jsx
│   └── ThemeContext.jsx       # Dark/Light theme management
└── translations/
    ├── en.js
    └── bg.js

/app/backend/
├── routes/
│   ├── products.py
│   ├── upload.py              # Cloudinary upload endpoint
│   └── ...
├── utils/
│   └── cloudinary_utils.py    # Cloudinary SDK integration
├── migrations.py              # Auto-seeds DB on startup
└── data/
    └── products_backup.json   # 7,347 products backup for deployment
```
