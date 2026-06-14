# KOSTIN - Luxury Cosmetics E-Commerce

## Original Problem Statement
Build a luxury cosmetics e-commerce website named "KOSTIN" with the slogan "Curated fragrances and beauty essentials". Features: product catalog, filtering, shopping cart, JWT auth, admin panel, Stripe payments, bilingual BG/EN support.

## Tech Stack
- **Frontend**: React, React Router, Context API (Auth + Language), Lucide icons, Tailwind-inspired CSS
- **Backend**: FastAPI, Motor (async MongoDB), JWT Auth, Stripe SDK
- **Database**: MongoDB (kostin_cosmetics)
- **Integrations**: Stripe Payments

## What's Been Implemented

### Core Features (Complete)
1. **Product Catalog** - 7,347 products imported from dropshipping supplier CSV
2. **JWT Authentication** - Register/Login with bcrypt, admin seeding
3. **Product Detail Pages** - Full product info, image gallery support, stock status, related products
4. **Shopping Cart** - MongoDB-persisted for logged-in users, localStorage fallback for guests
5. **Stripe Checkout** - Full payment flow with order creation on webhook
6. **Admin Panel** - Products tab (CRUD, visibility toggle, pagination) + Orders tab (status management)
7. **User Profile** - Account info, real order history from backend, saved addresses
8. **Category Navigation** - Perfumes, Skincare, Haircare, Men's Care (+ Other)
9. **Search & Filtering** - By category, brand, search term; sorting by name/price
10. **Product Visibility Toggle** - Admin can hide/show products from public store

### Image Handling (June 2026)
- Created `imageUtils.js` with helper functions:
  - `getProductImages()` - splits URLs by `|` separator
  - `getMainImage()` - returns first valid URL
  - `getGalleryImages()` - returns additional images for detail page
  - `FALLBACK_IMAGE` - luxury cosmetics placeholder
  - `CATEGORY_IMAGES` - beautiful Unsplash images for each category
- Product cards use `onError` fallback for broken images
- Product detail page supports image gallery with thumbnails

### Homepage Improvements (June 2026)
- **Hero Section**: New luxury beauty/makeup image (cosmetics flat lay)
- **Categories Section**: Each category card has background image overlay:
  - PERFUMES: Perfume bottles
  - SKINCARE: Skincare serums/jars
  - HAIRCARE: Hair products
  - MEN'S CARE: Men's grooming
  - OTHER: Body care products
- Premium styling with soft shadows, gradient overlays

### BG/EN Localization (Complete)
- Language toggle in header, auto-detection, localStorage persistence
- 290+ translation keys covering all UI text
- Fixed Bulgarian grammar: "1 луксозен продукт" vs "X луксозни продукта"
- Privacy Policy & Terms of Service fully translated to Bulgarian

### Content Pages (Complete)
- About Us, FAQ, Shipping & Returns, Privacy Policy (BG/EN), Terms of Service (BG/EN)

## Database Schema
- `users`: {email, password_hash, name, role, created_at}
- `products`: {sku, name, brand, category, price, description, description_bg, image, stock, is_active, is_visible, created_at}
- `carts`: {user_id, items: [{product_id, quantity}], updated_at}
- `orders`: {user_id, user_email, user_name, items, total, shipping_cost, status, payment_status, session_id, created_at}

## API Endpoints
- Auth: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me, POST /api/auth/logout
- Products: GET /api/products (public, visible only), GET /api/products/admin/all (admin), GET /api/products/{id}, GET /api/products/categories, GET /api/products/brands, PATCH /api/products/{id}/visibility
- Cart: GET /api/cart, POST /api/cart/add, PUT /api/cart/update/{id}, DELETE /api/cart/remove/{id}, DELETE /api/cart/clear
- Orders: GET /api/orders, PUT /api/orders/{id}/status
- Payments: POST /api/payments/checkout, GET /api/payments/status/{session_id}

## Prioritized Backlog
### P1
- Dropshipping supplier API integration (waiting for user's API) - automated order forwarding
### P2
- Admin image upload for products (object storage)
- Restore MAKEUP and BODY CARE categories when supplier provides products
- Suppress 401 console noise for anonymous users
### P3
- Loyalty program
- Order confirmation emails
- Stock sync with supplier API

## Known Issues
- Product images from `image.cosmeticwholesale.eu` often fail to load → fallback image used
- Anonymous users see 401 errors in console (non-blocking, cosmetic)

## Files Structure
```
/app/frontend/src/
├── utils/
│   └── imageUtils.js          # Image helpers, fallbacks, category images
├── components/
│   ├── ProductCard.jsx        # Uses getMainImage with onError fallback
│   ├── ProductCard.css
│   ├── Hero.jsx
│   └── Hero.css               # New luxury hero image
├── pages/
│   ├── Home.jsx               # Categories with background images
│   ├── Home.css
│   ├── Products.jsx
│   ├── ProductDetail.jsx      # Gallery support
│   └── Admin.jsx              # Visibility toggle, pagination
├── context/
│   └── AuthContext.jsx        # localStorage cart for guests (no mock.js)
└── translations/
    ├── en.js
    └── bg.js                  # Fixed singular/plural grammar
```
