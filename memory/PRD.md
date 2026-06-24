# KOSTIN - Luxury Perfumes E-commerce Platform

## Product Overview
KOSTIN is a luxury perfumes e-commerce platform focused exclusively on high-end fragrances for men and women. Built with React + FastAPI + MongoDB, featuring Stripe checkout, Cloudinary image hosting, and Resend email integration.

**Region**: Bulgaria only (shipping within Bulgaria via Speedy courier)

## Core Features (Completed)

### Authentication & Email System
- [x] JWT-based authentication with secure password hashing
- [x] Email verification on registration (Resend API)
- [x] Order confirmation emails (Resend API)
- [x] COD order confirmation emails
- [x] Admin panel access control

### Payment Methods
- [x] **Card Payment via Stripe** (Live keys configured)
- [x] **Cash on Delivery (COD)**
  - Full delivery address form (Name, Phone, Address, City, Notes)
  - Email field for guest checkout
  - Order confirmation email
  - No minimum order amount
  - No additional fees

### Speedy Courier Integration (NEW - December 2025)
- [x] **Live API integration** with Speedy Bulgaria (api.speedy.bg)
- [x] **City search** - autocomplete from Speedy API
- [x] **Office selection** - dropdown with all offices in selected city
- [x] **Dynamic price calculation** - real-time shipping cost from Speedy
- [x] **Delivery types**: Office pickup (€3.32) / Address delivery (€4.46)
- [x] **speedy_data** stored in orders (city_id, office_id, delivery_type)
- [x] **Auto shipment creation** - товарителница създадена автоматично при COD поръчка
- [x] **COD with receipt** - касов бон при наложен платеж
- [x] **Tracking in Profile** - номер и линк за проследяване в "Моите поръчки"
- [x] **Manual shipment** - Admin може ръчно да създаде товарителница за поръчка

### Product Management
- [x] Dynamic product catalog with filtering (gender, brand, collection)
- [x] Collections system - assign products to pages/campaigns
- [x] Sorting options: popularity, newest, name, price
- [x] Cloudinary image uploads via Admin Panel
- [x] Drag-and-drop product reordering (Admin)
- [x] Product visibility toggle (Admin)

### Checkout Flow
- [x] Dedicated `/checkout` page
- [x] **Step 1**: Delivery type (Speedy Office / Address)
- [x] **Step 2**: City search + Office/Address selection
- [x] **Step 3**: Contact info (Name, Phone, Email)
- [x] **Step 4**: Payment method (Card or COD)
- [x] Order summary with real-time shipping cost
- [x] Free shipping over €100 (announcement banner)
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
- **Shipping**: Speedy Bulgaria API (Live)
- **Image Hosting**: Cloudinary
- **Auth**: JWT tokens, bcrypt hashing

## API Endpoints
### Payments & Orders
- `POST /api/payments/checkout` - Create Stripe checkout session
- `POST /api/orders/cod` - Create Cash on Delivery order

### Speedy Integration
- `GET /api/speedy/cities?name=X` - Search cities
- `GET /api/speedy/offices?cityId=X` - Get offices in city
- `POST /api/speedy/calculate` - Calculate shipping price
- `POST /api/speedy/shipment` - Create shipment (next phase)
- `GET /api/speedy/track/{number}` - Track shipment

### Collections
- `GET /api/collections` - List collections
- `GET /api/products?collection=slug` - Filter by collection

## Database Schema
- `orders`: order_number, items, subtotal, shipping_cost, shipping_method, total, payment_method, shipping_address, speedy_data, status
- `products`: name, brand, price, collections, visibility, popularity_score
- `collections`: name, slug, is_system, is_active

## Speedy Integration Details
- **API URL**: https://api.speedy.bg/v1
- **Service ID**: 505 (Standard 24h)
- **Sender Location**: Варна, бул. "Цар Освободител" 263А
- **Credentials**: Stored in backend/.env (SPEEDY_USERNAME, SPEEDY_PASSWORD)

## Recently Implemented (December 2025)
- [x] **Speedy Bulgaria API Integration** - city search, office selection, price calculation
- [x] **SpeedyShipping.jsx component** - reusable shipping UI
- [x] **speedy_data in orders** - city_id, office_id, delivery_type stored
- [x] **Auto shipment creation** - товарителница автоматично при COD поръчка
- [x] **COD with receipt (касов бон)** - важно за онлайн магазин!
- [x] **Tracking in Profile** - клиентът вижда tracking номер и линк
- [x] Two-step checkout with real-time pricing
- [x] Cash on Delivery payment option
- [x] Stripe Live keys updated (KOSTIN company)
- [x] Collections system for product pages
- [x] Smart autocomplete search
- [x] **GDPR Compliance** (June 2026):
  - Cookie Consent Banner (Customize, Essential Only, Accept All)
  - Terms/Privacy checkbox on Checkout
  - Delete Account functionality (Right to be Forgotten)
  - DELETE /api/auth/delete-account endpoint
  - Cookie Policy page (/cookies) with detailed cookie information
  - Data Export functionality (GET /api/auth/export-data) - downloads JSON with all user data

## Backlog
- [ ] Dropshipping API integration (awaiting supplier API details)
- [x] ~~Refactor Admin.jsx into smaller components~~ (DONE - June 2026)
- [ ] Extract email HTML templates to separate files
- [x] ~~Integrate discount codes in Checkout flow~~ (DONE - June 2026)

## Recently Added (June 2026)
- [x] **Admin Panel Refactoring**
  - Split Admin.jsx (1307 lines) into modular components
  - ProductsManager.jsx, OrdersManager.jsx, CollectionsManager.jsx, HomepageManager.jsx, DiscountCodesManager.jsx
  - Better maintainability and faster hot reload

- [x] **Discount Codes System**
  - Full CRUD for discount codes in Admin Panel
  - Percentage or fixed amount discounts
  - Scope: All products, specific product, category, collection, brand
  - Single-use or multi-use with usage limits
  - Per-user limits, min order amount, max discount cap
  - Validity period (valid_from, valid_until)
  - Auto-generate random codes
  - API: /api/discounts/admin/*, /api/discounts/validate, /api/discounts/apply
  - **Checkout Integration**: Promo code field in order summary
  - Discount applied to both Card and COD payments
  - Usage tracking per order

## Test Credentials
- Admin: konstantin.kirchev.bs@gmail.com / aS1zX2QwE34xK9
- Demo User: test_verify@example.com / test12345

## Speedy Credentials
- Username: 1910084
- Password: (in backend/.env)

## Stripe Configuration
- Account: KOSTIN (Bulgaria)
- Mode: **LIVE** (real payments enabled)
- Account ID: acct_1SwiPmC6hkyA8I5q

## File Structure
```
/app/frontend/src/
├── components/
│   ├── SpeedyShipping.jsx  # City/office selection component
│   └── SpeedyShipping.css  # Shipping component styles
├── pages/
│   ├── Checkout.jsx        # Main checkout page
│   ├── Checkout.css        # Checkout styles
│   └── CheckoutSuccess.jsx # Success page

/app/backend/routes/
├── speedy.py       # Speedy API integration
├── orders.py       # COD order endpoint
└── collections.py  # Collections CRUD

/app/backend/models/
└── schemas.py      # SpeedyData, ShippingAddress, CODOrderRequest
```
