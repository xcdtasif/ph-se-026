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
npx prisma generate
npx prisma db push     # or: npx prisma migrate dev

# Seed database (creates test users, categories, properties, requests, reviews)
npx tsx prisma/seeds/index.ts

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

---

## Environment Variables

| Variable                | Required | Description                              |
| ----------------------- | -------- | ---------------------------------------- |
| `DATABASE_URL`          | Yes      | PostgreSQL connection string             |
| `JWT_ACCESS_SECRET`     | Yes      | Access token secret (64+ chars)          |
| `JWT_REFRESH_SECRET`    | Yes      | Refresh token secret (64+ chars)         |
| `JWT_ACCESS_EXPIRY`     | Yes      | Access token TTL (e.g., `15m`)           |
| `JWT_REFRESH_EXPIRY`    | Yes      | Refresh token TTL (e.g., `7d`)           |
| `STRIPE_SECRET_KEY`     | Yes      | Stripe secret key (`sk_test_...`)        |
| `STRIPE_WEBHOOK_SECRET` | Yes      | Stripe webhook secret (`whsec_...`)      |
| `STRIPE_API_VERSION`    | Yes      | Stripe API version (`2026-07-29.dahlia`) |
| `FRONTEND_URL`          | Yes      | Frontend base URL for redirects          |
| `PORT`                  | No       | Server port (default: 5000)              |
| `NODE_ENV`              | No       | `development` / `production`             |

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint    | Role          | Description          |
| ------ | ----------- | ------------- | -------------------- |
| POST   | `/register` | Public        | Register new user    |
| POST   | `/login`    | Public        | Login, sets cookies  |
| POST   | `/refresh`  | Public        | Refresh access token |
| POST   | `/logout`   | Authenticated | Clear cookies        |
| GET    | `/me`       | Authenticated | Get current user     |

### Categories (`/api/categories`)
| Method | Endpoint | Role   | Description         |
| ------ | -------- | ------ | ------------------- |
| POST   | `/`      | Admin  | Create category     |
| GET    | `/`      | Public | List all categories |
| GET    | `/:id`   | Public | Get category by ID  |

### Properties (`/api/properties`)
| Method | Endpoint       | Role     | Description                          |
| ------ | -------------- | -------- | ------------------------------------ |
| GET    | `/`            | Public   | Browse properties (filter, paginate) |
| GET    | `/:id`         | Public   | Get property details                 |
| POST   | `/`            | Landlord | Create property                      |
| GET    | `/landlord/my` | Landlord | List own properties                  |
| PATCH  | `/:id`         | Landlord | Update own property                  |
| DELETE | `/:id`         | Landlord | Delete own property                  |

### Requests (`/api/requests`)
| Method | Endpoint                         | Role            | Description                |
| ------ | -------------------------------- | --------------- | -------------------------- |
| POST   | `/`                              | Tenant          | Create rental request      |
| GET    | `/my`                            | Tenant          | List own requests          |
| GET    | `/:id`                           | Tenant/Landlord | Get request details        |
| PATCH  | `/:id/cancel`                    | Tenant          | Cancel pending request     |
| GET    | `/landlord/property/:propertyId` | Landlord        | List requests for property |
| PATCH  | `/:id/approve-move-in`           | Landlord        | Approve move-in            |
| PATCH  | `/:id/reject-move-in`            | Landlord        | Reject move-in             |
| PATCH  | `/:id/approve-move-out`          | Landlord        | Approve move-out           |
| PATCH  | `/:id/reject-move-out`           | Landlord        | Reject move-out            |

### Payments (`/api/payments`)
| Method | Endpoint   | Role   | Description                    |
| ------ | ---------- | ------ | ------------------------------ |
| POST   | `/`        | Tenant | Create Stripe Checkout Session |
| GET    | `/my`      | Tenant | List own payments              |
| GET    | `/:id`     | Tenant | Get payment details            |
| POST   | `/webhook` | Stripe | Webhook handler (raw body)     |
| GET    | `/admin`   | Admin  | List all payments              |

### Reviews (`/api/reviews`)
| Method | Endpoint                  | Role   | Description                       |
| ------ | ------------------------- | ------ | --------------------------------- |
| POST   | `/`                       | Tenant | Create review (after MOVED_OUT)   |
| GET    | `/properties/:id/reviews` | Public | Get property reviews + avg rating |

### Admin (`/api/admin`)
| Method | Endpoint      | Role  | Description                        |
| ------ | ------------- | ----- | ---------------------------------- |
| GET    | `/users`      | Admin | List users (paginated, filterable) |
| PATCH  | `/users/:id`  | Admin | Ban/unban user                     |
| GET    | `/stats`      | Admin | Platform statistics                |
| GET    | `/properties` | Admin | All properties                     |
| GET    | `/requests`   | Admin | All requests                       |
| GET    | `/payments`   | Admin | All payments                       |

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

## Payment Flow (Stripe)

1. **Tenant** creates request → status `MOVE_IN_REQUESTED`
2. **Landlord** approves → status `MOVE_IN_APPROVED`
3. **Tenant** calls `POST /payments` with `{ requestId, type: "SECURITY_DEPOSIT" }`
4. Returns `checkoutUrl` → tenant pays on Stripe hosted page
5. **Stripe webhook** (`checkout.session.completed`) fires:
   - Payment → `PAID`
   - Request → `MOVED_IN`
   - Property → `RENTED`
6. **Move-out**: Landlord approves → status `MOVE_OUT_APPROVED`
7. **Tenant** pays `MOVE_OUT_REFUND` → webhook:
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

## API Documentation

See **[POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md)** for:
- Importing the Postman collection (`ph-se-026.postman_collection.json`)
- Setting up environments (local + production)
- Authentication flow
- Testing all endpoints
- Payment flow walkthrough
- Environment variables reference

---

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables
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

## Scripts

```bash
npm run dev        # Development with tsx watch
npm run build      # Type-check + build with tsup
npm run start      # Run production build
npm run lint       # ESLint
npm run format     # Prettier
```

---

## License

MIT