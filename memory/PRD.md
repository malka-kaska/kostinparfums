# KOSTIN - Luxury Perfumes E-commerce Platform

## Product Overview
KOSTIN is a luxury perfumes e-commerce platform focused exclusively on high-end fragrances for men and women. Built with React + FastAPI + MongoDB, featuring Stripe checkout, Cloudinary image hosting, and Resend email integration.

## Core Features (Completed)

### Authentication & Email System
- [x] JWT-based authentication with secure password hashing (bcrypt)
- [x] Email verification on registration (Resend API)
- [x] Order confirmation emails (Resend API)
- [x] Admin panel access control

### Product Management
- [x] Dynamic product catalog with filtering (gender, brand)
- [x] Sorting options: popularity, newest, name, price
- [x] Product name parsing (Brand + Main Name | Variant)
- [x] Cloudinary image uploads via Admin Panel
- [x] Drag-and-drop product reordering (Admin)
- [x] Product visibility toggle (Admin)

### **Smart Autocomplete Search (NEW)**
- [x] Two-level search: Brand suggestions → Product suggestions
- [x] Brand alias support (YSL → Yves Saint Laurent, JPG → Jean Paul Gaultier, Paco → Paco Rabanne)
- [x] After brand selection, filter products within that brand
- [x] Max 4-5 results per section
- [x] Sorted by relevance and popularity
- [x] Brand tag with X to clear selection
- [x] Mobile-responsive dropdown
- [x] "No results found" message
- [x] Click outside to close

### Shopping Experience
- [x] Shopping cart with quantity management
- [x] Stripe checkout integration
- [x] Best Sellers section (popularity-based)
- [x] Recently Viewed section (localStorage, 7-day expiry)
- [x] Rotating hero carousel
- [x] Dark/Light mode toggle
- [x] Bilingual support (BG/EN)

### Special Pages
- [x] Dubai Fragrances - dedicated page for Arabian brands
- [x] Legal pages (About Us, Terms, Privacy Policy, Legal Info)
- [x] Responsive design for mobile/tablet/desktop

## Technical Stack
- **Frontend**: React 18, React Router, Lucide Icons
- **Backend**: FastAPI, Motor (MongoDB Async)
- **Database**: MongoDB
- **Email**: Resend API (via Emergent Integrations)
- **Payments**: Stripe
- **Image Hosting**: Cloudinary
- **Auth**: JWT tokens, bcrypt hashing

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email?token=` - Email verification
- `GET /api/products` - Product listing with filters
- `GET /api/products/brands` - Available brands
- `POST /api/orders` - Create order
- `GET /api/orders/verify-order?token=` - Order verification
- `POST /api/upload/image` - Cloudinary upload (Admin)
- **NEW** `GET /api/search/brands?q=` - Search brands
- **NEW** `GET /api/search/products?q=&brand=` - Search products with brand filter
- **NEW** `GET /api/search/suggestions?q=` - Combined brand + product suggestions

## Database Schema
- `products`: name, brand, price, image_url, gender, category, description, visibility, popularity_score
- `users`: email, password_hash, is_admin, email_verified, verification_token, token_expires
- `orders`: user_id, items, total, status, order_token, created_at

## Recently Implemented (December 2025)
- [x] **Smart Autocomplete Search** with two-level suggestions
- [x] Brand alias support (YSL, JPG, Paco, etc.)
- [x] Product search within selected brand
- [x] Recently Viewed section on Home page
- [x] Fixed Dubai Fragrances page CSS grid layout
- [x] Email verification flow (registration)
- [x] Order confirmation emails

## Backlog
- [ ] Dropshipping API integration (awaiting supplier API details)
- [ ] Refactor Admin.jsx (>1000 lines) into smaller components
- [ ] Extract email HTML templates to separate files

## Test Credentials
- Admin: konstantin.kirchev.bs@gmail.com / aS1zX2QwE34xK9
- Demo User: test_verify@example.com / test12345

## File Structure
```
/app/frontend/src/
├── components/
│   ├── SmartSearch.jsx       # Smart autocomplete search
│   ├── SmartSearch.css       # Search styles
│   ├── RecentlyViewed.jsx    # Recently Viewed section
│   └── Header.jsx            # Includes SmartSearch
├── utils/
│   ├── recentlyViewed.js     # localStorage utility (7-day expiry)
│   └── parseProductName.js   # Product name parsing
├── pages/
│   ├── Home.jsx              # Includes RecentlyViewed
│   ├── ProductDetail.jsx     # Adds to recentlyViewed
│   └── Products.jsx          # Main shop page
└── translations/
    ├── bg.js                 # Bulgarian translations
    └── en.js                 # English translations

/app/backend/routes/
├── search.py                 # Smart search API endpoints
├── products.py               # Product CRUD
└── auth.py                   # Authentication
```
