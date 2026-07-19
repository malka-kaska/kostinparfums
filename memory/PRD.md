# KOSTIN - Luxury Perfumes E-commerce Platform

## Product Overview
KOSTIN is a luxury perfumes e-commerce platform focused exclusively on high-end fragrances for men and women. Built with React + FastAPI + MongoDB, featuring Stripe checkout, Cloudinary image hosting, and Resend email integration.

**Region**: Bulgaria only (shipping within Bulgaria via Speedy courier)


## Recent Changes (Feb 2026)
- **Content pages expanded for SEO** (Feb 2026): 
  - `AboutUs`: added 4 new sections (908 words total, 7 H2 headings): "The Story of KOSTIN", "The Journey of Every Perfume" (verification process), "Delivery Across Bulgaria" (Speedy), "How to Choose the Right Fragrance" (educational). Full BG + EN translations. Injects Organization JSON-LD, dynamic title, meta description, canonical.
  - `FAQ`: expanded from 10 to **25 questions/answers** covering EDT vs EDP, longevity, storage, layering, seasonal picks, COD, invoicing, batch code verification, promo codes, delivery address changes, 14-day voucher, gift orders, Dubai vs designer, GDPR. Full BG + EN. Injects **FAQPage JSON-LD** — enables Google Rich Snippets in search results.
- **SEO Overhaul** (Feb 2026): Dynamic `/api/sitemap.xml` (7359 URLs), `/api/robots.txt`, ProductDetail schema.org Product JSON-LD + dynamic meta tags, fixed Multiple H1 (Header logo → span).
- **AI Product Descriptions** (Feb 2026): Admin tab powered by Emergent LLM (GPT-4o-mini), bulk + per-product generation, BG + EN.
- **Custom Gender Section Images** (Feb 2026): Admin upload for Men/Women homepage cards.
- **Related Products / "You may also like"** (Feb 2026): ProductDetail, Products, Cart. Combined algorithm.
- **Homepage Campaign Banner** (Feb 2026): New full-width admin-managed campaign section on homepage, positioned directly below "Shop by Category" (Men/Women). Bilingual fields (title/description/button BG+EN), background image upload, button link, and enable/disable toggle. Backend: `PUT /api/homepage/campaign-banner`. Frontend: `Home.jsx` + `HomepageManager.jsx`. Data stored in `settings` doc under `campaign_banner`.

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

### Meta Catalog Integration (NEW - July 2026)
- [x] **Live API integration** with Meta (Facebook) Catalog API
- [x] **System User authentication** with appsecret_proof
- [x] **Product sync endpoints**:
  - `POST /api/meta-catalog/sync/product/{id}` - sync single product
  - `POST /api/meta-catalog/sync/all` - batch sync all products (7347+)
  - `DELETE /api/meta-catalog/product/{id}` - remove product
- [x] **Auto-sync on changes** - products automatically sync when created/updated/deleted
- [x] **Admin UI** - Meta Catalog tab in Admin panel with:
  - Connection status indicator
  - Local vs Meta product count comparison
  - Catalog info (ID, name, type)
  - Direct link to Meta Business Manager
  - Manual sync buttons
  - Products preview from Meta
- [x] **Batch processing** - 1000 products per batch via items_batch API
- [x] **Product data mapping**: name, price, images, availability, brand, category

### Speedy Courier Integration (December 2025)
- [x] **Live API integration** with Speedy Bulgaria (api.speedy.bg)
- [x] **City search** - autocomplete from Speedy API
- [x] **Office selection** - dropdown with all offices in selected city
- [x] **Dynamic price calculation** - real-time shipping cost from Speedy
- [x] **Delivery types**: Office pickup (€3.32) / Address delivery (€4.46)
- [x] **speedy_data** stored in orders (city_id, office_id, delivery_type)
- [x] **Auto waybill creation** - товарителница създава се автоматично при COD поръчка
- [x] **Office ID validation** - автоматично валидира и коригира невалидни офис ID-та по име (July 2026)
- [x] **Discount support** - правилно разпределяне на отстъпки във фискалните позиции (July 2026)
- [x] **Auto shipment creation** - товарителница създадена автоматично при COD поръчка
- [x] **COD with receipt** - касов бон при наложен платеж
- [x] **Tracking in Profile** - номер и линк за проследяване в "Моите поръчки"
- [x] **Manual shipment** - Admin може ръчно да създаде товарителница за поръчка

### Product Management
- [x] Dynamic product catalog with filtering (gender, brand, collection, scent profile)
- [x] Collections system - assign products to pages/campaigns
- [x] Sorting options: popularity, newest, name, price
- [x] Cloudinary image uploads via Admin Panel
- [x] Drag-and-drop product reordering (Admin)
- [x] Product visibility toggle (Admin)
- [x] Product-specific discounts with original_price field
- [x] Dual currency display (EUR/BGN) across all views
- [x] **Scent Profiles**: 13-category classification for perfume filtering

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

## Recently Added (July 2026 - Latest)

### Variants Manager - Auto-Groups Display (July 9, 2026)
- [x] **New backend endpoint**: `GET /api/products/variants/all-groups` returns both manual and auto-detected variant groups
- [x] **Auto-detection logic**: Products grouped by base name using `extract_base_name()` function (removes size patterns like "50ml", "100 M", etc.)
- [x] **Admin UI tabs**: VariantsManager now shows two tabs - "Manual Groups" and "Auto-linked" 
- [x] **Auto-groups display**: Shows base name, brand tag, product list with thumbnails and prices
- [x] **Convert to manual**: Button to convert auto-group to manual group (assigns `variant_group_id`)
- [x] **Statistics**: Shows count of manual (0) and auto (910) groups

### Collection Page URL Fix (July 9, 2026)
- [x] **Bug fixed**: `/products` page now reads `?collection=` URL parameter correctly
- [x] **Dynamic title**: Page title shows collection name (e.g., "Лятна колекция" / "Summer Collection") instead of generic "All Products"
- [x] **Clear filters**: Preserves collection parameter when clearing other filters
- [x] **Localization**: Collection name displayed in user's selected language (BG/EN)

### Collection Filter + Hero Button Persistence Fixes (July 11, 2026)
- [x] **Bug fixed**: URL sync effect in `Products.jsx` was dropping the `?collection=` param on mount, causing collection pages to show ALL products. Now preserves the collection param.
- [x] **Bug fixed**: Backend `HeroSlide` model (`routes/homepage.py`) only accepted `image`/`alt`, stripping hero button settings (`show_button`, `button_text`, `button_link_type`, `button_link`, `button_product_id`, `button_collection_slug`) on save. Model extended - button settings now persist and render on homepage.
- [x] Verified in preview: Summer Collection page shows only marked products; hero button "Към Лятна колекция" renders with correct link.
- [ ] USER ACTION: Redeploy to production + re-save hero slide button settings in Admin (old saves had button fields stripped).

### Collection Banner + Description (July 11, 2026)
- [x] **New field `banner_image`** on collections (schemas.py, collections.py CRUD + response)
- [x] **Admin editor**: CollectionsManager pencil button per row → edit panel (description BG/EN, banner upload via /api/upload/image, remove banner, save via PUT /api/collections/{id})
- [x] **Public collection page**: banner block with dark gradient overlay, collection name, localized description, product count. Falls back to plain header (+description) without banner.
- [x] **i18n fix**: Added ~26 missing translation keys (bg.js/en.js) that leaked as raw keys in Admin (manageCollections, collectionsTab labels, brandBackgrounds, variantsTab, etc.)
- [x] Tested: iteration_19.json — backend 100%, frontend 100%

### Hero Button EN Text (July 11, 2026)
- [x] **New field `button_text_en`** on hero slides (backend HeroSlide model + Admin HomepageManager input "Текст на бутона (EN)")
- [x] **Hero.jsx**: shows button_text (BG) or button_text_en based on selected language (fallback to BG text)
- [x] Tested: BG → "КЪМ ЛЯТНА КОЛЕКЦИЯ", EN → "TO SUMMER COLLECTION"

## Backlog
- [ ] Dropshipping API integration (awaiting supplier API details)
- [x] ~~Refactor Admin.jsx into smaller components~~ (DONE - June 2026)
- [ ] Extract email HTML templates to Jinja2 files
- [x] ~~Integrate discount codes in Checkout flow~~ (DONE - June 2026)
- [x] ~~Order Cancellation with Reason~~ (DONE - July 2026)
- [x] ~~Guest Cancel Order Page~~ (DONE - July 2026)
- [ ] НЕкоректен БГ API integration (BLOCKED - awaiting IP whitelist confirmation)
- [x] ~~Meta Catalog Integration~~ (DONE - July 2026)
- [x] ~~Dynamic Brand Backgrounds~~ (DONE - July 2026)

## Recently Added (June-July 2026)

### Dynamic Brand Header Backgrounds (July 2026)
- [x] **Backend CRUD API**: `/api/brand-backgrounds` routes for managing brand backgrounds
- [x] **Admin Panel**: New "Фонове" (Backgrounds) tab with brand selector, image upload, positioning controls
- [x] **Frontend Context**: `BrandBackgroundContext.jsx` - tracks selected brands and provides background data
- [x] **Dynamic Header Component**: `DynamicHeaderBackground.jsx` - renders background images with CSS clip-path
- [x] **Diagonal Splits**: When 2+ brands selected, backgrounds split diagonally (CSS clip-path polygons)
- [x] **Text Color Adaptation**: Logo/navigation colors automatically switch (white/black) based on brand config
- [x] **Product Page Integration**: Brand filters on `/products` and `/dubai-perfumes` update header background
- [x] **Image Positioning**: Admin can set X/Y position percentages for background placement
- [x] **Overlay Control**: Adjustable darkness overlay (0-70%)

### Discount Codes - Exclude Sale Items (July 2026)
- [x] **New field `exclude_sale_items`**: Added to discount code schema
- [x] **Validation logic**: When enabled, discount code only applies to products without `original_price` (non-sale items)
- [x] **Admin UI**: Checkbox "Изключи продукти с намаление" / "Exclude sale items" in discount code form
- [x] **User-friendly errors**: Shows "Този код не важи за продукти с намаление" if all cart items are on sale
- [x] **Partial application**: Applies discount only to eligible items, shows warning about excluded sale items

### Order Cancellation System (July 2026)
- [x] **User Cancel Order (Profile)**: Textarea за описание на причината при отказ
- [x] **Admin Cancel Order**: Textarea за причина в Admin OrdersManager с заглавие "Защо отказвате тази поръчка?"
- [x] **Guest Cancel Order**: Нова страница `/cancel-order?order=X&token=Y` за гости
- [x] **Email Link**: Линк за отказ в COD confirmation email-а за гости
- [x] **Admin Notifications**: Cancellation emails изпращани до `contact@kostinparfums.com`
- [x] **API Endpoints**: 
  - `POST /api/orders/{id}/cancel` - User cancel (requires auth)
  - `POST /api/orders/guest/{id}/cancel?token=X` - Guest cancel
  - `POST /api/orders/admin/{id}/cancel` - Admin cancel
- [x] **Cleanup**: Изтрит obsolete `invoice_generator.py` (заменен от Inv.bg интеграция)

### OrderSuccess Page (June 2026)
- [x] **Tracking Info**: Показва tracking номер и линк за Speedy
- [x] **Recommended Products**: Препоръчани продукти след поръчка

### Free Shipping Threshold
- [x] Праг за безплатна доставка: €90 (преди €100)
- [x] При поръчка под €90 - получателят плаща доставката
- [x] При поръчка над €90 - изпращачът плаща доставката

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
  - **Email Integration**: Discount shown in confirmation emails (subtotal, discount line, total)

- [x] **Dual Currency Display (EUR/BGN)** (June 2026)
  - Fixed exchange rate: 1 EUR = 1.95583 BGN (Bulgaria Euro adoption)
  - New utility module: `/app/frontend/src/utils/currency.js`
  - New component: `/app/frontend/src/components/PriceDisplay.jsx`
  - All product prices show both EUR and BGN (e.g., €129.00 / 252.30 лв.)
  - Cart page: dual currency display
  - Checkout page: dual currency for items, subtotal, shipping, discounts, total
  - Admin Products table: dual price column
  - Admin Orders: dual prices for totals and items
  - Email templates: `format_dual_price()` function in email_service.py
  - Order confirmation, COD, verification emails all show dual currency

- [x] **Mobile Grid Toggle** (June 2026)
  - Toggle between 1 or 2 products per row on mobile devices
  - Hidden on desktop (standard 4-column grid)
  - Compact text styling for 2-column view

- [x] **Product Discounts (Sale Prices)** (June 2026)
  - New `original_price` field in product schema
  - Admin Panel: "Original Price" input field with live discount % preview
  - ProductCard: Old price (strikethrough gray) + New price (GOLD color)
  - ProductDetail: Old price + Discount percentage badge (-XX%) + New price in GOLD
  - Luxury styling: No red badges, only gold accent for elegance
  - Admin table shows sale prices with original crossed out

## Security Audit (December 2025)
### Fixed Vulnerabilities:
- [x] **SEC-001 (CRITICAL)**: Order prices validated from database, not client-supplied values
- [x] **SEC-002 (HIGH)**: Discount admin endpoints require admin authentication
- [x] **SEC-003 (HIGH)**: Speedy shipment endpoints require admin authentication  
- [x] **SEC-004 (MEDIUM)**: Password reset sends email instead of logging token
- [x] **Cookie Security**: Uses secure=True in production environment

## Security Audit (July 2026)
### Fixed Vulnerabilities:
- [x] **SEC-001 (HIGH)**: Guest registration BOLA vulnerability - order ownership now verified via email match or cancellation token before linking (`routes/auth.py:register_guest`)
- [x] **SEC-002 (MEDIUM)**: ReDoS prevention - all user search inputs now escaped with `re.escape()` before MongoDB regex queries (`routes/products.py`, `routes/search.py`)
- [x] **P3 Hardening**: 
  - Auth cookies now use `secure=True` when `ENVIRONMENT=production`
  - Nekorekten `/report` endpoint now uses JWT auth (consistent with app)
  - Nekorekten `/check` endpoint now has rate limiting (10 req/min per IP)

## Test Credentials
- Admin: konstantin.kirchev.bs@gmail.com / aS1zX2QwE34xK9
- Demo User: test_verify@example.com / test12345

## LLM-Powered Scent Profile System (December 2025)
- [x] **13 Scent Categories**: Sweet, Fresh, Citrus, Fruity, Floral, Woody, Spicy, Aquatic, Musky, Leather, Tobacco, Oriental, Vanilla
- [x] **LLM Migration Tool**: Uses GPT-4o-mini via Emergent Integrations to analyze product descriptions and auto-assign profiles
- [x] **Smart Migration**: Only analyzes **visible products WITHOUT existing profile** (saves LLM credits)
- [x] **Admin Manual Edit**: Scent profile checkboxes in product edit form for manual corrections
- [x] **Admin Filter**: Filter products by "All Profiles" / "With Profile" / "Without Profile"
- [x] **Progress Tracking**: Real-time progress bar with stats in Scents admin tab
- **Endpoint**: `POST /api/admin/scent-migration/start`, `GET /api/admin/scent-migration/status`

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
