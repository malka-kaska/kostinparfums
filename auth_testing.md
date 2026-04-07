# Auth Testing Playbook

## Step 1: MongoDB Verification
```bash
mongosh
use kostin_cosmetics
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique), login_attempts.identifier, password_reset_tokens.expires_at (TTL).

## Step 2: API Testing
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Login
curl -c cookies.txt -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@kostin.com","password":"Admin123!"}'

# Check cookies
cat cookies.txt

# Get current user
curl -b cookies.txt "$API_URL/api/auth/me"

# Register new user
curl -c cookies2.txt -X POST "$API_URL/api/auth/register" -H "Content-Type: application/json" -d '{"email":"newuser@test.com","password":"NewUser123!","name":"New User"}'

# Logout
curl -b cookies.txt -X POST "$API_URL/api/auth/logout"
```

## Step 3: Frontend Testing
1. Go to /auth page
2. Login with admin@kostin.com / Admin123!
3. Verify header shows user name and dropdown
4. Navigate to /profile — should show account info
5. Navigate to /admin — should show admin panel
6. Logout — verify redirect and header changes
7. Register a new account — verify redirect to home
