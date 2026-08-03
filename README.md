# RentNest — Rental Property Marketplace API

A complete backend API for a rental property marketplace with three roles (Tenant, Landlord, Admin) built with Express, TypeScript, Prisma ORM, PostgreSQL, JWT authentication, and Stripe payments.

---

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: JWT (access + refresh tokens in httpOnly cookies)
- **Payments**: Stripe Checkout Sessions
- **Validation**: Zod
- **Build**: tsup
- **Deploy**: Vercel-ready

---

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Entry point
├── config/                # Environment config (validated)
├── lib/
│   ├── prisma.ts          # Prisma client
│   └── stripe.ts          # Stripe client
├── middleware/
│   ├── auth.ts            # JWT auth + role authorization
│   ├── validate.ts        # Zod validation wrapper
│   ├── error-handler.ts   # Global error handler
│   └── not-found.ts       # 404 handler
├── modules/
│   ├── auth/              # Register, login, refresh, logout, me
│   ├── category/          # Categories (admin create, public read)
│   ├── property/          # Public property browse + landlord CRUD
│   ├── request/           # Rental requests (tenant/landlord flow)
│   ├── payment/           # Stripe checkout + webhook
│   ├── review/            # Property reviews (tenant, after move-out)
│   └── admin/             # User mgmt + platform oversight
├── types/
│   └── index.ts           # Global types (IAuthRequest, etc.)
└── utils/
    ├── app-error.ts       # AppError class
    ├── catch-async.ts     # Async wrapper
    └── send-response.ts   # Standardized response format
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Stripe account (test mode)

---

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env   # then edit values

# Database setup
npm run db:generate
npm run db:migrate     # or: npx prisma db push

# Seed database (creates test users, categories, properties, requests, reviews)
npm run db:seed

# Development
npm run dev

# Build
npm run build

# Production
node dist/server.mjs
```

---

## Available Scripts

| Command               | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Development with tsx watch                                |
| `npm run build`       | Type-check + build with tsup (includes `prisma generate`) |
| `npm run db:generate` | Generate Prisma Client                                    |
| `npm run db:migrate`  | Run Prisma migrations (dev)                               |
| `npm run db:seed`     | Seed database with test data                              |

---

## Environment Variables

| Variable                        | Required | Description                                        |
| ------------------------------- | -------- | -------------------------------------------------- |
| `NODE_ENV`                      | Yes      | `development` \| `production`                      |
| `PORT`                          | Yes      | Server port (default: 5000)                        |
| `FRONTEND_URL`                  | Yes      | Frontend URL for Stripe redirects                  |
| `DATABASE_URL`                  | Yes      | PostgreSQL connection string                       |
| `BCRYPT_SALT_ROUNDS`            | Yes      | Password hash rounds (10\|12\|14)                  |
| `JWT_ACCESS_SECRET`             | Yes      | 64+ char random string                             |
| `JWT_ACCESS_SECRET_EXPIRES_IN`  | Yes      | Access token TTL (15m\|1h\|1d)                     |
| `JWT_REFRESH_SECRET`            | Yes      | 64+ char random string (different from access)     |
| `JWT_REFRESH_SECRET_EXPIRES_IN` | Yes      | Refresh token TTL (7d\|30d)                        |
| `STRIPE_SECRET_KEY`             | Yes      | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET`         | Yes      | Stripe webhook signing secret (`whsec_...`)        |
| `ADMIN_EMAIL`                   | No       | Seeded admin email (used by seed script)           |
| `ADMIN_PASSWORD`                | No       | Seeded admin password (used by seed script)        |

---

## API Endpoints

All responses follow:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "string",
  "data": {},
  "meta": {}   // pagination meta when applicable
}
```

### Authentication (`/api/auth`)

| Method | Endpoint    | Role          | Description                             |
| ------ | ----------- | ------------- | --------------------------------------- |
| POST   | `/register` | Public        | Register new user (TENANT, LANDLORD)    |
| POST   | `/login`    | Public        | Login, sets httpOnly cookies            |
| POST   | `/refresh`  | Public        | Refresh access token via refresh cookie |
| GET    | `/me`       | Authenticated | Get current user profile                |
| POST   | `/logout`   | Authenticated | Clear cookies                           |

### Categories (`/api/categories`)

| Method | Endpoint | Role   | Description         |
| ------ | -------- | ------ | ------------------- |
| POST   | `/`      | ADMIN  | Create category     |
| GET    | `/`      | Public | List all categories |
| GET    | `/:id`   | Public | Get category by ID  |

### Properties (`/api/properties`)

| Method | Endpoint | Role   | Description                                                                 |
| ------ | -------- | ------ | --------------------------------------------------------------------------- |
| GET    | `/`      | Public | Browse properties (filter: city, min/max rent, category, status; paginated) |
| GET    | `/:id`   | Public | Get property details with landlord + category                               |

### Landlord Properties (`/api/landlord/properties`)

| Method | Endpoint | Role     | Description                     |
| ------ | -------- | -------- | ------------------------------- |
| POST   | `/`      | LANDLORD | Create property listing         |
| GET    | `/`      | LANDLORD | List own properties (paginated) |
| PATCH  | `/:id`   | LANDLORD | Update own property             |
| DELETE | `/:id`   | LANDLORD | Delete own property             |

### Requests (`/api/requests`)

| Method | Endpoint | Role            | Description                                     |
| ------ | -------- | --------------- | ----------------------------------------------- |
| POST   | `/`      | TENANT          | Submit move-in request                          |
| GET    | `/`      | TENANT          | List own requests (paginated, filter by status) |
| GET    | `/:id`   | TENANT/LANDLORD | Get request details                             |
| PATCH  | `/:id`   | TENANT          | Request move-out (1st-10th of month)            |

### Landlord Requests (`/api/landlord/requests`)

| Method | Endpoint                | Role     | Description                                                    |
| ------ | ----------------------- | -------- | -------------------------------------------------------------- |
| GET    | `/`                     | LANDLORD | List requests for own properties (paginated, filter by status) |
| PATCH  | `/:id/approve-move-in`  | LANDLORD | Approve move-in                                                |
| PATCH  | `/:id/reject-move-in`   | LANDLORD | Reject move-in                                                 |
| PATCH  | `/:id/approve-move-out` | LANDLORD | Approve move-out                                               |
| PATCH  | `/:id/reject-move-out`  | LANDLORD | Reject move-out                                                |

### Payments (`/api/payments`)

| Method | Endpoint   | Role   | Description                                            |
| ------ | ---------- | ------ | ------------------------------------------------------ |
| POST   | `/`        | TENANT | Create Stripe Checkout Session (returns `checkoutUrl`) |
| GET    | `/`        | TENANT | List own payments (paginated, filter by status, type)  |
| GET    | `/:id`     | TENANT | Get payment details                                    |
| POST   | `/webhook` | Stripe | Webhook handler (raw body, signature verified)         |

### Reviews (`/api/reviews`)

| Method | Endpoint                  | Role   | Description                                                        |
| ------ | ------------------------- | ------ | ------------------------------------------------------------------ |
| POST   | `/`                       | TENANT | Create review (only after request status = `MOVED_OUT`)            |
| GET    | `/properties/:id/reviews` | Public | Get property reviews (paginated, includes `averageRating` in meta) |

### Admin (`/api/admin`)

| Method | Endpoint      | Role  | Description                                                                   |
| ------ | ------------- | ----- | ----------------------------------------------------------------------------- |
| GET    | `/stats`      | ADMIN | Platform statistics (users, properties, requests, payments, totalTransaction) |
| GET    | `/users`      | ADMIN | List users (paginated, filter: role, isBanned, search)                        |
| PATCH  | `/users/:id`  | ADMIN | Ban/unban user (`{ isBanned: boolean, banReason?: string }`)                  |
| GET    | `/properties` | ADMIN | All properties (filter: status, landlordId)                                   |
| GET    | `/requests`   | ADMIN | All requests (filter: status)                                                 |
| GET    | `/payments`   | ADMIN | All payments (filter: status, type)                                           |

---

## Request Status Flow (8 States)

```
MOVE_IN_REQUESTED → MOVE_IN_APPROVED → MOVED_IN → MOVE_OUT_REQUESTED → MOVE_OUT_APPROVED → MOVED_OUT
                      ↓ (reject)
                  MOVE_IN_REJECTED

MOVE_OUT_APPROVED → MOVE_OUT_REJECTED (if landlord rejects)
```

- **MOVED_IN / MOVED_OUT**: Internal only, triggered by payment webhooks
- **Move-out window**: Request 1st-10th, move-out date 11th-last day of current month

---

## Payment Flow (Stripe Checkout)

1. Tenant creates request → `MOVE_IN_REQUESTED`
2. Landlord approves → `MOVE_IN_APPROVED`
3. Tenant calls `POST /payments` with `{ requestId, type: "SECURITY_DEPOSIT" }`
4. Returns `checkoutUrl` → tenant pays on Stripe hosted page
5. **Stripe webhook** (`checkout.session.completed`) fires:
   - Payment → `PAID`
   - Request → `MOVED_IN`
   - Property → `RENTED`
6. **Move-out**: Landlord approves → `MOVE_OUT_APPROVED`
7. Tenant pays `MOVE_OUT_REFUND` → webhook:
   - Payment → `REFUNDED`
   - Request → `MOVED_OUT`
   - Property → `AVAILABLE`

**Test Card**: `4242 4242 4242 4242` (any future date, any CVC)

---

## Local Webhook Testing

```bash
stripe login
stripe listen --forward-to localhost:5000/api/payments/webhook
# Copy whsec_... to .env as STRIPE_WEBHOOK_SECRET
```

---

## Test Credentials (Seeded)

| Role     | Email                  | Password   |
| -------- | ---------------------- | ---------- |
| Admin    | `admin01@email.com`    | `1a2s3d4f` |
| Landlord | `landlord01@email.com` | `1a2s3d4f` |
| Tenant   | `tenant01@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant02@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant03@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant04@email.com`   | `1a2s3d4f` |
| Tenant   | `tenant05@email.com`   | `1a2s3d4f` |

---

## API Documentation

See **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)** for:
- Importing the Postman collection (`ph-se-026.postman_collection.json`)
- Setting up environments (local + production: `https://ph-se-026.vercel.app/api`)
- Authentication flow
- Testing all endpoints
- Payment flow walkthrough

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables (see table above)
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Deploy

**Vercel config** (`vercel.json`) included for serverless function handling.

---

## Database Schema (Key Models)

- **User**: id, email, passwordHash, role (TENANT/LANDLORD/ADMIN), name, phone, avatar, isBanned, banReason
- **Category**: id, name, description
- **Property**: id, title, description, address, city, rent, securityDeposit, bedrooms, bathrooms, area, images, amenities, status (AVAILABLE/RENTED/UNAVAILABLE), landlordId, categoryId
- **Request**: id, status (8 states), moveInDate, moveOutDate, tenantId, propertyId
- **Payment**: id, amount, currency, status (PENDING/PAID/FAILED/REFUNDED), type (SECURITY_DEPOSIT/MONTHLY_RENT/MOVE_OUT_REFUND), stripePaymentIntentId (Stripe Session ID), userId, requestId
- **Review**: id, rating (1-5), comment, userId, propertyId, requestId (unique)

All models use UUID primary keys. Monetary values use `Decimal` for precision.

---

## License

MIT