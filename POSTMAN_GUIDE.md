# Postman Collection Guide

## Collection File
`ph-se-026.postman_collection.json` — Import this into Postman via **File → Import**.

---

## Base URLs

| Environment         | Base URL                           |
| ------------------- | ---------------------------------- |
| Local Development   | `http://localhost:5000/api`        |
| Production (Vercel) | `https://ph-se-026.vercel.app/api` |

The collection uses a `baseUrl` variable. Set it in your Postman environment:

1. Click **Environments** → **+** (New)
2. Name: `RentNest Local` or `RentNest Production`
3. Add variable:
   - `baseUrl` = `http://localhost:5000/api` (or production URL)
4. Select the environment in the top-right dropdown

---

## Authentication Flow

All protected endpoints require a **JWT access token** in an `httpOnly` cookie.

### 1. Register / Login
- **POST `/auth/register`** — Create account (TENANT, LANDLORD)
- **POST `/auth/login`** — Returns access + refresh tokens in cookies

**Test credentials (seeded):**

| Role     | Email                  | Password   |
| -------- | ---------------------- | ---------- |
| Admin    | `admin01@email.com`    | `1a2s3d4f` |
| Landlord | `landlord01@email.com` | `1a2s3d4f` |
| Tenant   | `tenant01@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant02@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant03@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant04@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant05@email.com`   | `1a2s3d4f` |

### 2. Cookie Handling
Postman **automatically stores cookies** per domain. After login, subsequent requests send cookies automatically.

- Enable **Cookies** in Postman: Settings → General → "Automatically follow redirects" + "Cookie jar"
- Or manually copy `accessToken` from login response → set as `Cookie` header: `accessToken=<value>; refreshToken=<value>`

### 3. Refresh Token
- **POST `/auth/refresh`** — Uses `refreshToken` cookie to issue new access token

---

## Collection Structure

```
ph-se-026
├── Auth
│   ├── Register
│   ├── Login
│   ├── Refresh Token
│   ├── Logout
│   └── Get Me
├── Category
│   ├── Create Category (ADMIN)
│   ├── Get All Categories
│   └── Get Category by ID
├── Property
│   ├── Get All Properties (public)
│   └── Get Property by ID (public)
├── Landlord Properties
│   ├── Create Property (LANDLORD)
│   ├── Get My Properties (LANDLORD)
│   ├── Update Property (LANDLORD)
│   └── Delete Property (LANDLORD)
├── Requests (Tenant)
│   ├── Create Request (TENANT)
│   ├── Get My Requests (TENANT)
│   ├── Get Request by ID
│   └── Request Move-Out (TENANT)
├── Landlord Requests
│   ├── Get Property Requests (LANDLORD)
│   ├── Approve Move-In (LANDLORD)
│   ├── Reject Move-In (LANDLORD)
│   ├── Approve Move-Out (LANDLORD)
│   └── Reject Move-Out (LANDLORD)
├── Payment
│   ├── Create Checkout Session (TENANT)
│   ├── Get My Payments (TENANT)
│   ├── Get Payment by ID
│   ├── Stripe Webhook (internal)
│   └── [Admin subfolder]
│       └── Get All Payments (ADMIN)
├── Review
│   ├── Create Review (TENANT, after MOVED_OUT)
│   └── Get Property Reviews (public)
└── Admin
    ├── Get Stats (ADMIN)
    ├── Get Users (ADMIN)
    ├── Ban/Unban User (ADMIN)
    ├── Get All Properties (ADMIN)
    ├── Get All Requests (ADMIN)
    └── Get All Payments (ADMIN)
```

---

## Common Request Patterns

### Pagination
```
GET {{baseUrl}}/properties?page=1&limit=10
```

### Filtering
```
GET {{baseUrl}}/admin/users?role=TENANT&isBanned=false&search=john
GET {{baseUrl}}/admin/properties?status=RENTED&landlordId=<uuid>
GET {{baseUrl}}/admin/requests?status=MOVE_IN_REQUESTED
GET {{baseUrl}}/admin/payments?status=PAID&type=SECURITY_DEPOSIT
GET {{baseUrl}}/payments?status=PENDING&type=SECURITY_DEPOSIT
```

### Role-Based Access
| Endpoint Prefix                   | Required Role |
| --------------------------------- | ------------- |
| `/auth/*`                         | Public        |
| `/categories` (GET)               | Public        |
| `/properties` (GET)               | Public        |
| `/landlord/properties`            | LANDLORD      |
| `/requests`                       | TENANT        |
| `/landlord/requests`              | LANDLORD      |
| `/payments`                       | TENANT        |
| `/reviews` (create)               | TENANT        |
| `/reviews/properties/:id/reviews` | Public        |
| `/admin/*`                        | ADMIN         |

---

## Testing Payment Flow (Stripe)

1. **Create Checkout Session**
   - `POST /payments` with `{ "requestId": "<uuid>", "type": "SECURITY_DEPOSIT" }`
   - Returns `checkoutUrl` — open in browser

2. **Pay on Stripe**
   - Test card: `4242 4242 4242 4242` (any future date, any CVC)
   - Success redirect: `FRONTEND_URL/payment/success?session_id=<id>`
   - Cancel redirect: `FRONTEND_URL/payment/cancel`

3. **Webhook Fires Automatically**
   - Stripe sends `checkout.session.completed` to `/payments/webhook`
   - Updates request status → `MOVED_IN` + property → `RENTED`
   - Or for refund: request → `MOVED_OUT` + property → `AVAILABLE`

4. **Verify**
   - `GET /payments` → shows payment with `status: "PAID"`
   - `GET /admin/stats` → `totalTransaction` updated

---

## Webhook Testing (Local)

For local Stripe webhook testing, use **Stripe CLI**:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the `whsec_...` signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## Environment Variables Reference

| Variable                        | Description                     | Example                               |
| ------------------------------- | ------------------------------- | ------------------------------------- |
| `NODE_ENV`                      | Environment                     | `development` / `production`          |
| `PORT`                          | Server port                     | `5000`                                |
| `FRONTEND_URL`                  | Frontend base URL for redirects | `http://localhost:5173`               |
| `DATABASE_URL`                  | PostgreSQL connection string    | `postgresql://user:pass@host:5432/db` |
| `BCRYPT_SALT_ROUNDS`            | Password hash rounds            | `12`                                  |
| `JWT_ACCESS_SECRET`             | Access token signing secret     | `random-64-char-string`               |
| `JWT_ACCESS_SECRET_EXPIRES_IN`  | Access token TTL                | `15m`                                 |
| `JWT_REFRESH_SECRET`            | Refresh token signing secret    | `random-64-char-string`               |
| `JWT_REFRESH_SECRET_EXPIRES_IN` | Refresh token TTL               | `7d`                                  |
| `STRIPE_SECRET_KEY`             | Stripe secret key               | `sk_test_...`                         |
| `STRIPE_WEBHOOK_SECRET`         | Stripe webhook signing secret   | `whsec_...`                           |

---

## Quick Start Checklist

- [ ] Import `ph-se-026.postman_collection.json`
- [ ] Create Postman environment with `baseUrl`
- [ ] Run **Auth → Login** with admin/landlord/tenant credentials
- [ ] Test public endpoints (categories, properties)
- [ ] Test role-specific endpoints (landlord properties, tenant requests)
- [ ] Test admin endpoints (users, stats, oversight)
- [ ] Test payment flow (create checkout → pay → verify webhook)
- [ ] Test review creation (after MOVED_OUT)

---

## Notes

- All timestamps: ISO 8601 UTC
- Monetary values: Decimal (BDT), e.g., `"amount": "50000.00"`
- UUIDs used for all IDs
- Enum values are uppercase strings (e.g., `UserRole.TENANT`, `RequestStatus.MOVED_IN`)
- Soft delete not implemented — deletions are permanent