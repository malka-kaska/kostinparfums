# KOSTIN - Luxury Perfumes E-commerce Platform

## Product Overview
KOSTIN is a luxury perfumes e-commerce platform focused exclusively on high-end fragrances for men and women. Built with React + FastAPI + MongoDB, featuring Stripe checkout, Cloudinary image hosting, and Resend email integration.

## Core Features (Completed)

### Authentication & Email System
- [x] JWT-based authentication with secure password hashing
- [x] Email verification on registration (Resend API)
- [x] Order confirmation emails (Resend API)
- [x] COD order confirmation emails
- [x] Admin panel access control

### Payment Methods
- [x] **Card Payment via Stripe** (Live keys configured)
- [x] **Cash on Delivery (COD)** - NEW
  - Full delivery address form (Name, Phone, Address, City, Postal Code, Notes)
  - Email field for guest checkout
  - Order confirmation email
  - No minimum order amount
  - No additional fees

### Product Management
- [x] Dynamic product catalog with filtering (gender, brand, collection)
- [x] Collections system - assign products to pages/campaigns
- [x] Sorting options: popularity, newest, name, price
- [x] Cloudinary image uploads via Admin Panel
- [x] Drag-and-drop product reordering (Admin)
- [x] Product visibility toggle (Admin)

### Checkout Flow
- [x] Dedicated `/checkout` page
- [x] Payment method selection (Card or COD)
- [x] Order summary sidebar
- [x] Free shipping over €100
- [x] Form validation
- [x] Success confirmation page

### Shopping Experience
- [x] Shopping cart with quantity management
- [x] Best Sellers section
- [x] Recently Viewed section
- [x] Smart autocomplete search
- [x] Dark/Light mode toggle
- [x] Bilingual support (BG/EN)

## Technical Stack
- **Frontend**: React 18, React Router, Lucide Icons
- **Backend**: FastAPI, Motor (MongoDB Async)
- **Database**: MongoDB
- **Email**: Resend API (via Emergent Integrations)
- **Payments**: Stripe (Live mode)
- **Image Hosting**: Cloudinary
- **Auth**: JWT tokens, bcrypt hashing

## API Endpoints
- `POST /api/payments/checkout` - Create Stripe checkout session
- `POST /api/orders/cod` - Create Cash on Delivery order
- `GET /api/collections` - List collections
- `GET /api/products?collection=slug` - Filter by collection

## Database Schema
- `orders`: order_number, items, total, payment_method (card/cod), shipping_address, status
- `products`: name, brand, price, collections, visibility, popularity_score
- `collections`: name, slug, is_system, is_active

## Recently Implemented (December 2025)
- [x] **Cash on Delivery payment option**
- [x] **Checkout page with payment method selection**
- [x] **Delivery address form for COD**
- [x] **COD order confirmation emails**
- [x] **Stripe Live keys updated** (KOSTIN company)
- [x] Collections system for product pages
- [x] Smart autocomplete search

## Backlog
- [ ] Dropshipping API integration (awaiting supplier API details)
- [ ] Refactor Admin.jsx into smaller components
- [ ] Extract email HTML templates to separate files

## Test Credentials
- Admin: konstantin.kirchev.bs@gmail.com / aS1zX2QwE34xK9
- Demo User: test_verify@example.com / test12345

## Stripe Configuration
- Account: KOSTIN (Bulgaria)
- Mode: **LIVE** (real payments enabled)
- Account ID: acct_1SwiPmC6hkyA8I5q

## File Structure
```
/app/frontend/src/pages/
├── Checkout.jsx        # Payment method selection + COD form
├── Checkout.css        # Checkout styles
├── Cart.jsx            # Cart page (redirects to /checkout)
└── CheckoutSuccess.jsx # Success page after payment

/app/backend/routes/
├── orders.py           # COD order endpoint (/api/orders/cod)
└── collections.py      # Collections CRUD

/app/backend/utils/
└── email_service.py    # COD confirmation email function
```
