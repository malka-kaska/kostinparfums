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
- [x] Dynamic product catalog with filtering (gender, brand, **collection**)
- [x] **Collections/Pages system** - assign products to multiple pages/campaigns
- [x] Sorting options: popularity, newest, name, price
- [x] Product name parsing (Brand + Main Name | Variant)
- [x] Cloudinary image uploads via Admin Panel
- [x] Drag-and-drop product reordering (Admin)
- [x] Product visibility toggle (Admin)

### **Collections System (NEW)**
- [x] System collections: "Всички парфюми" (all_products), "Дубайски аромати" (dubai)
- [x] Custom collections for campaigns (create/edit/delete from Admin)
- [x] Multi-select: products can belong to multiple collections
- [x] Auto-migration: Dubai brands auto-assigned to "dubai" collection
- [x] Default behavior: products without collection go to "all_products"
- [x] Collection management tab in Admin panel

### Smart Autocomplete Search
- [x] Two-level search: Brand suggestions → Product suggestions
- [x] Brand alias support (YSL, JPG, Paco, etc.)
- [x] Collection-aware navigation (Dubai brands → Dubai page)
- [x] Max 4-5 results per section
- [x] Mobile-responsive dropdown

### Shopping Experience
- [x] Shopping cart with quantity management
- [x] Stripe checkout integration
- [x] Best Sellers section (popularity-based)
- [x] Recently Viewed section (localStorage, 7-day expiry)
- [x] Rotating hero carousel
- [x] Dark/Light mode toggle
- [x] Bilingual support (BG/EN)

### Special Pages
- [x] Dubai Fragrances - filtered by "dubai" collection
- [x] All Fragrances - filtered by "all_products" collection
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
- `GET /api/collections` - List all active collections
- `GET /api/collections/all` - List all collections (Admin)
- `POST /api/collections` - Create collection (Admin)
- `PUT /api/collections/{id}` - Update collection (Admin)
- `DELETE /api/collections/{id}` - Delete collection (Admin)
- `GET /api/products?collection=slug` - Filter products by collection
- `PATCH /api/products/{id}/collections` - Update product collections (Admin)

## Database Schema
- `products`: name, brand, price, ..., **collections** (array of slugs)
- `collections`: name, name_en, slug, description, is_system, is_active
- `users`: email, password_hash, is_admin, email_verified
- `orders`: user_id, items, total, status, order_token

## Recently Implemented (December 2025)
- [x] **Collections system** - manage which pages products appear on
- [x] Admin UI for creating/managing collections
- [x] Product multi-select for collections in Admin
- [x] Auto-migration for existing Dubai brand products
- [x] Collection-based filtering in Products.jsx and DubaiPerfumes.jsx
- [x] Smart Search collection-aware navigation

## Backlog
- [ ] Dropshipping API integration (awaiting supplier API details)
- [ ] Refactor Admin.jsx into smaller components
- [ ] Extract email HTML templates to separate files

## Test Credentials
- Admin: konstantin.kirchev.bs@gmail.com / aS1zX2QwE34xK9
- Demo User: test_verify@example.com / test12345

## File Structure
```
/app/backend/
├── routes/
│   ├── collections.py    # Collections CRUD API
│   ├── products.py       # Products with collection filter
│   └── search.py         # Smart search with collections
├── models/schemas.py     # CollectionCreate, CollectionUpdate schemas
└── migrations.py         # Auto-creates system collections

/app/frontend/src/
├── pages/
│   ├── Admin.jsx         # Collections tab, product collection selector
│   ├── Products.jsx      # Uses collection=all_products filter
│   └── DubaiPerfumes.jsx # Uses collection=dubai filter
└── components/
    └── SmartSearch.jsx   # Collection-aware brand navigation
```
