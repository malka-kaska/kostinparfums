# KOSTIN API Contracts

## Authentication Endpoints

### POST /api/auth/register
**Request:**
```json
{ "email": "string", "password": "string", "name": "string" }
```
**Response (200):**
```json
{ "id": "string", "email": "string", "name": "string", "role": "customer" }
```
Sets `access_token` and `refresh_token` httpOnly cookies.

### POST /api/auth/login
**Request:**
```json
{ "email": "string", "password": "string" }
```
**Response (200):**
```json
{ "id": "string", "email": "string", "name": "string", "role": "string", "created_at": "string" }
```
Sets `access_token` and `refresh_token` httpOnly cookies.

### POST /api/auth/logout
**Response (200):**
```json
{ "message": "Logged out successfully" }
```
Clears auth cookies.

### GET /api/auth/me
**Headers:** Requires auth cookie or `Authorization: Bearer <token>`
**Response (200):**
```json
{ "id": "string", "email": "string", "name": "string", "role": "string", "created_at": "string" }
```

### POST /api/auth/refresh
Reads `refresh_token` cookie, issues new `access_token` cookie.

### POST /api/auth/forgot-password
**Request:**
```json
{ "email": "string" }
```

### POST /api/auth/reset-password
**Request:**
```json
{ "token": "string", "new_password": "string" }
```

---

## Products Endpoints

### GET /api/products
**Query Params:** `category`, `brand`, `search`, `sort` (name|price-low|price-high|newest), `min_price`, `max_price`, `page`, `limit`
**Response (200):**
```json
{
  "products": [{ "id": "string", "name": "string", "brand": "string", "category": "string", "price": 0, "description": "string", "image": "string", "stock": 0, "is_active": true }],
  "total": 0,
  "page": 1,
  "pages": 1
}
```

### GET /api/products/categories
**Response (200):**
```json
[{ "id": "string", "name": "string", "product_count": 0 }]
```

### GET /api/products/brands
**Query Params:** `category` (optional)
**Response (200):**
```json
[{ "name": "string", "product_count": 0 }]
```

### GET /api/products/{product_id}
**Response (200):**
```json
{ "id": "string", "name": "string", "brand": "string", "category": "string", "price": 0, "description": "string", "image": "string", "stock": 0, "is_active": true }
```

### POST /api/products (Admin only)
**Request:**
```json
{ "name": "string", "brand": "string", "category": "string", "price": 0, "description": "string", "image": "string", "stock": 0 }
```

### PUT /api/products/{product_id} (Admin only)
**Request:** Partial product object.

### DELETE /api/products/{product_id} (Admin only)

---

## Payments Endpoints

### GET /api/payments/config
**Response:** `{ "publishable_key": "string" }`

### POST /api/payments/checkout
**Request:**
```json
{ "origin_url": "string", "items": [{ "id": 0, "name": "string", "price": 0, "quantity": 0 }] }
```
**Response:** `{ "checkout_url": "string", "session_id": "string" }`

### GET /api/payments/status/{session_id}
**Response:** `{ "status": "string", "payment_status": "string", "amount_total": 0, "currency": "string" }`

---

## Data Models (MongoDB Collections)

### users
```json
{
  "_id": "ObjectId",
  "email": "string (unique, lowercase)",
  "password_hash": "string (bcrypt)",
  "name": "string",
  "role": "admin | customer",
  "created_at": "ISO datetime string"
}
```

### products
```json
{
  "_id": "ObjectId",
  "name": "string",
  "brand": "string",
  "category": "string (perfumes|makeup|skincare|haircare|bodycare|menscare)",
  "price": "float (EUR)",
  "description": "string",
  "image": "string (URL)",
  "stock": "int",
  "is_active": "boolean",
  "created_at": "ISO datetime string",
  "updated_at": "ISO datetime string"
}
```

### payment_transactions
```json
{
  "_id": "ObjectId",
  "id": "UUID string",
  "session_id": "Stripe session ID",
  "amount": "float",
  "currency": "eur",
  "status": "string",
  "payment_status": "string",
  "items": "array",
  "created_at": "ISO datetime string"
}
```

### login_attempts
```json
{
  "identifier": "string (ip:email)",
  "count": "int",
  "locked_until": "ISO datetime string"
}
```

### password_reset_tokens
```json
{
  "token": "string",
  "user_id": "string",
  "expires_at": "datetime (TTL index)",
  "used": "boolean"
}
```
