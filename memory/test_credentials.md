# KOSTIN Test Credentials

## Admin Account
- **Email:** konstantin.kirchev.bs@gmail.com
- **Password:** aS1zX2QwE34xK9
- **Role:** admin

## Test User Account
- **Email:** test@example.com
- **Password:** Test123!
- **Role:** customer

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- DELETE /api/auth/delete-account (GDPR - Right to be Forgotten)

## Stripe Test Card
- **Card:** 4242 4242 4242 4242
- **Expiry:** Any future date
- **CVC:** Any 3 digits

## GDPR Testing
- Cookie Banner: Clear `localStorage.cookie_consent` to show banner again
- Delete Account: Type "ИЗТРИЙ" (BG) or "DELETE" (EN) to confirm
