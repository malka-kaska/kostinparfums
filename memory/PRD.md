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

### Shopping Experience
- [x] Shopping cart with quantity management
- [x] Stripe checkout integration
- [x] Best Sellers section (popularity-based)
- [x] Rotating hero carousel
- [x] Dark/Light mode toggle
- [x] Bilingual support (BG/EN)

### Special Pages
- [x] Dubai Fragrances - dedicated page for Arabian brands (Afnan, Al Haramain, Armaf, Lattafa, Rasasi, etc.)
- [x] Legal pages (About Us, Terms, Privacy Policy, Legal Info)
- [x] Responsive design for mobile/tablet/desktop

## Technical Stack
- **Frontend**: React 18, React Router, Lucide Icons
- **Backend**: FastAPI, Motor (async MongoDB)
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

## Database Schema
- `products`: name, brand, price, image_url, gender, category, description, visibility, popularity_score
- `users`: email, password_hash, is_admin, email_verified, verification_token, token_expires
- `orders`: user_id, items, total, status, order_token, created_at

## Completed Tasks (December 2025)
- [x] Fixed Dubai Fragrances page CSS grid layout (4 products per row)
- [x] Fixed infinite re-render loop in DubaiPerfumes.jsx
- [x] Implemented parseProductName.js utility for clean product display
- [x] Email verification flow (registration)
- [x] Order confirmation emails
- [x] Open Graph image from Cloudinary
- [x] Legal pages with company info
- [x] Popularity-based sorting

## Backlog
- [ ] Dropshipping API integration (awaiting supplier API details)
- [ ] Refactor Admin.jsx (>1000 lines) into smaller components
- [ ] Extract email HTML templates to separate files

## Test Credentials
- Admin: konstantin.kirchev.bs@gmail.com / aS1zX2QwE34xK9
- Demo User: test_verify@example.com / test12345
