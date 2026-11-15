# Project Context: Hotel Booking Management System

> **Project:** Hotel Booking Management System  
> **Company / Context:** ALGIONS AI LABS PRIVATE LIMITED – Full-Stack Web Development Advanced Assessment  
> **Last Updated:** 2026-11-15  
> **Documentation Version:** 1.0.0  

---

## 1. Project Overview and Objectives

The Hotel Booking Management System is an end-to-end, database-backed enterprise web application designed to support the complete operational workflow of a hospitality business. It bridges the guest-facing booking journey with administrative and front-desk hotel operations.

### Key Business Objectives
- **Room and Rate Administration:** Dynamic management of room categories, individual inventory, capacities, amenities, and nightly rates denominated in Indian Rupees (INR - ₹).
- **Indian Rupee (INR) Localization:** Standardized `en-IN` locale formatting across guest, staff, and admin views using JavaScript `Intl.NumberFormat` with ₹ symbol.
- **Availability Search Engine:** Real-time search by date range, capacity, and room type with strict date validations (half-open intervals, preventing past bookings, capacity constraints).
- **Reservation Lifecycle & State Machine:** Handling holds, confirmations, check-ins, check-outs, cancellations, and expirations with deterministic transition validation.
- **Concurrency & Double-Booking Prevention:** Atomic transactions, hold timers, and overlap exclusion logic to prevent conflicting reservations under concurrent load.
- **Role-Based Access Control (RBAC):** Distinct guest, front-desk staff, and executive admin capabilities enforced on both frontend and backend layers.
- **Operations & Business Intelligence Reporting:** Daily occupancy rates, upcoming arrivals/departures, and itemized revenue reporting over selectable periods.
- **Simulated Payment Sandbox:** Idempotent payment processing and automatic refund orchestration.
- **Audit Trails:** Immutable audit logs capturing material state mutations across all critical entities.

---

## 2. Technology Stack and Dependencies

### Frontend (Planned Stack)
- **Framework:** React.js 18+ with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Routing:** React Router DOM (v6+)
- **State Management:** React Context API / Redux Toolkit
- **HTTP Client:** Axios (configured with base URL and credentials)
- **Forms & Validation:** React Hook Form + Zod resolvers
- **Data Visualization:** Recharts
- **Icons & UI:** Lucide React, Headless UI / Radix primitives
- **Notifications:** React Hot Toast / Sonner

### Backend (Implemented Codebase)
- **Runtime:** Node.js (v24.x compatible, CommonJS / ES2022)
- **Framework:** Express.js 4.21
- **Language:** TypeScript 5.7
- **Database ORM:** Prisma ORM 6.1
- **Security:** Helmet 8.0, CORS 2.8, Express Rate Limit 7.4, bcryptjs 2.4, Cookie-Parser 1.4
- **Authentication:** JSON Web Tokens (`jsonwebtoken` 9.0) with HTTP-only cookie and Bearer header support
- **Validation:** Zod 3.24
- **API Documentation:** Swagger UI Express 5.0 + Swagger JSDoc 6.2
- **Testing:** Vitest 2.1, Supertest 7.0

### Database & Infrastructure
- **Database Engine:** PostgreSQL
- **Data Modeling:** Prisma Schema with declarative migrations and seed scripts

### Root Workspace Scripts (`package.json`)
```json
{
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:server": "cd server && npm run dev",
  "dev:client": "cd client && npm run dev",
  "build": "cd client && npm run build && cd ../server && npm run build",
  "test": "cd server && npm test",
  "test:client": "cd client && npm test",
  "db:migrate": "cd server && npx prisma migrate dev",
  "db:seed": "cd server && npx prisma db seed",
  "db:reset": "cd server && npx prisma migrate reset --force",
  "db:studio": "cd server && npx prisma studio",
  "setup": "npm install && cd server && npm install && cd ../client && npm install && cd ../server && npx prisma generate"
}
```

---

## 3. Complete Project Directory Structure

```text
hotel-booking-management-system/
├── .env.example                               # Root environment variable template
├── .gitignore                                 # Git ignore patterns (node_modules, dist, .env, etc.)
├── package.json                               # Monorepo/orchestrator scripts
├── PROJECT_CONTEXT.md                         # Central project documentation & status (this file)
│
├── client/                                    # Frontend application directory (currently empty folder)
│
└── server/                                    # Express.js + Prisma backend application
    ├── package.json                           # Server dependencies and scripts
    ├── tsconfig.json                          # TypeScript configuration (ES2022, CommonJS, path aliases)
    ├── vitest.config.ts                       # Vitest test runner configuration
    │
    ├── prisma/
    │   ├── schema.prisma                      # Complete Prisma schema (7 models, 5 enums)
    │   └── seed.ts                            # Database seed script with demo credentials & seed data
    │
    └── src/
        ├── app.ts                             # Express application entry point, middleware & route binding
        │
        ├── config/
        │   ├── database.ts                    # PrismaClient singleton instance
        │   └── swagger.ts                     # OpenAPI / Swagger definition and /api-docs setup
        │
        ├── types/
        │   └── index.ts                       # Global interfaces (JwtPayload, AuthenticatedRequest, ApiResponse, etc.)
        │
        ├── utils/
        │   ├── errors.ts                      # AppError, BadRequestError, UnauthorizedError, ConflictError, etc.
        │   └── helpers.ts                     # Booking ref generator, nights & pricing calculator, pagination
        │
        ├── validators/
        │   └── index.ts                       # Zod schemas for auth, room, roomType, availability, reservation, payment
        │
        ├── middlewares/
        │   ├── auth.ts                        # JWT verification (cookie / header) & RBAC authorization middleware
        │   ├── errorHandler.ts                # Centralized Express error handler
        │   ├── notFoundHandler.ts             # 404 handler for undefined routes
        │   ├── rateLimiter.ts                 # Express rate limiters for auth and general API
        │   └── validate.ts                    # Zod request body and query parameter validation middleware
        │
        ├── services/
        │   ├── audit.service.ts               # AuditLog creation and query service
        │   ├── auth.service.ts                # Registration, login, profile management, JWT issuance
        │   ├── roomType.service.ts            # Room type CRUD operations
        │   ├── room.service.ts                # Room CRUD, occupancy checks, status mutations
        │   ├── availability.service.ts        # Overlap exclusion and room search logic
        │   ├── reservation.service.ts         # Holds, atomic reservation creation, state transitions, check-in/out
        │   ├── payment.service.ts             # Simulated payments, idempotent transactions, confirmation triggers
        │   └── report.service.ts              # Dashboard KPIs, daily occupancy aggregation, revenue analytics
        │
        ├── controllers/
        │   ├── auth.controller.ts             # Auth HTTP request handlers
        │   ├── roomType.controller.ts         # RoomType HTTP request handlers
        │   ├── room.controller.ts             # Room HTTP request handlers
        │   ├── availability.controller.ts     # Search HTTP request handler
        │   ├── reservation.controller.ts      # Reservation and hold handlers
        │   ├── payment.controller.ts          # Payment simulation handler
        │   ├── staff.controller.ts            # Check-in, check-out, arrivals, departures
        │   ├── admin.controller.ts            # Dashboard KPIs, revenue, occupancy reports, user management
        │   └── audit.controller.ts            # Audit log retrieval handler
        │
        ├── routes/
        │   ├── auth.routes.ts                 # /api/auth endpoints
        │   ├── roomType.routes.ts             # /api/room-types endpoints
        │   ├── room.routes.ts                 # /api/rooms endpoints
        │   ├── availability.routes.ts         # /api/availability endpoints
        │   ├── reservation.routes.ts          # /api/reservations endpoints
        │   ├── payment.routes.ts              # /api/payments endpoints
        │   ├── staff.routes.ts                # /api/staff endpoints
        │   ├── admin.routes.ts                # /api/admin endpoints
        │   ├── audit.routes.ts                # /api/audit-logs endpoints
        │   └── user.routes.ts                 # /api/users endpoints
        │
        └── __tests__/                         # Automated test suite directory (currently empty folder)
```

---

## 4. System Architecture and Application Workflow

### Architecture Overview
The system is built as a clean **Modular Monolith** separating Presentation (Client), API Routing & Middleware, Business Logic Services, Data Access (Prisma ORM), and Relational Persistence (PostgreSQL).

```mermaid
flowchart TD
    Client["Frontend (React + Vite + Tailwind)"] -->|HTTP / JSON + Cookie| Router["Express API Routers"]
    Router --> RateLimit["Rate Limiter & Helmet"]
    RateLimit --> AuthMid["JWT Auth & RBAC Middleware"]
    AuthMid --> ValMid["Zod Validation Middleware"]
    ValMid --> Controllers["Express Controllers"]
    Controllers --> Services["Domain Business Services"]
    Services --> Concurrency["Atomic Prisma Transactions & Locks"]
    Concurrency --> DB[("PostgreSQL Database")]
    Services --> Audit["Audit Log Service"]
    Audit --> DB
```

### Core Business Workflows

#### 1. Availability Search Flow
1. Guest queries `/api/availability` with `checkInDate`, `checkOutDate`, and optional `guests` and `roomTypeId`.
2. Validates: `checkInDate >= today` and `checkOutDate > checkInDate`.
3. Filters rooms that are `AVAILABLE` or `OCCUPIED` (occupied rooms are available for future dates).
4. Strictly excludes rooms having:
   - Existing reservations with status `CONFIRMED` or `CHECKED_IN` overlapping interval `[checkInDate, checkOutDate)`.
   - Active booking holds (`expiresAt > NOW()` and status `ACTIVE`) overlapping requested dates.
   - Room status `MAINTENANCE` or `INACTIVE`.
5. Returns matching room inventory with full type details and pricing.

#### 2. Booking Hold & Reservation Flow
1. Guest initiates booking -> Calls `/api/reservations/holds` to create a temporary 15-minute hold.
2. Inside an atomic transaction (`prisma.$transaction`):
   - Expired holds are pruned (`status = 'EXPIRED'`).
   - Overlap check confirms room is not blocked.
   - Active hold is inserted with `expiresAt = NOW() + 15m`.
3. Guest proceeds to checkout -> Calls `/api/reservations`:
   - Validates hold (if provided) and marks hold as `CONVERTED`.
   - Recalculates pricing server-side: `subtotal = nightlyRate * nights`, `taxAmount = subtotal * (taxRate / 100)`, `totalAmount = subtotal + taxAmount`.
   - Creates `PENDING` reservation with unique human-readable code (`HB-YYYYMMDD-XXXX`).
   - Emits an immutable `AuditLog` entry.
4. Guest simulates payment -> Calls `/api/payments/simulate`:
   - Verifies reservation is `PENDING` and belongs to the authenticated user.
   - Enforces idempotency (if successful payment exists, returns existing receipt).
   - Records `Payment` with status `SUCCESS`.
   - Transitions reservation to `CONFIRMED`.
   - Logs audit records for both payment and reservation confirmation.

#### 3. Operational Staff & Guest Lifecycle
```
PENDING ──(Payment Success)──► CONFIRMED ──(Staff Check-In)──► CHECKED_IN ──(Staff Check-Out)──► CHECKED_OUT
   │                               │
   ├───(Hold Expiration)──► EXPIRED├───(Guest/Staff Cancel)──► CANCELLED (Triggers Auto-Refund)
   │
   └───(Direct Cancellation)──► CANCELLED
```

---

## 5. Frontend Implementation and Completed Components

### Current Status: **Not Yet Implemented (Empty Directory)**
The `client/` folder has been created, but scaffolding and UI code have not yet been generated.

### Planned Structure & Required Screens
- **Public & Guest Views:**
  - `HomePage`: Hero section, amenities showcase, search bar, featured rooms.
  - `RoomListingPage`: Filterable room catalog (capacity, price, amenities).
  - `RoomDetailPage`: High-resolution gallery, amenity checklist, reservation booking widget.
  - `BookingCheckoutPage`: Hold timer countdown, guest details form, price breakdown, payment simulator.
  - `BookingConfirmationPage`: Printable receipt with booking reference, room details, dates, and QR/badge.
  - `GuestDashboardPage`: Active reservations, historical trips, profile editor, one-click cancellation.
- **Staff Operations:**
  - `StaffDashboard`: Quick summary of arrivals, departures, occupied rooms.
  - `OperationalRoomsView`: Room grid with interactive status changer (`AVAILABLE`, `MAINTENANCE`, etc.).
  - `CheckInCheckOutModal`: Verification of guest identity, room key assignment, check-in/out mutation.
- **Admin Views:**
  - `AdminDashboard`: Analytics KPI cards, revenue and occupancy trend charts (Recharts).
  - `RoomManagementPage`: Room list, add/edit room modal, floor and room type selector.
  - `RoomTypeManagementPage`: CRUD for room categories, amenity tags, base pricing, capacities.
  - `UserManagementPage`: Staff/Guest directory with role promotion/demotion.
  - `AuditLogViewer`: Searchable, filterable audit event log table.

---

## 6. Backend Implementation and Completed Services

The backend source code in `server/src/` is complete at the code level, implementing all core architectural layers:

### Services Implemented
1. **`AuthService` (`services/auth.service.ts`):**
   - `register`: Validates uniqueness, hashes password via bcrypt (salt rounds = 12), creates `GUEST` user, issues JWT, logs audit.
   - `login`: Compares bcrypt hash, generates signed JWT token with role and userId.
   - `getProfile`, `updateProfile`: Queries and updates user information.
2. **`RoomTypeService` (`services/roomType.service.ts`):**
   - Full CRUD with unique name constraint checking and foreign key safety checks (cannot delete if rooms exist).
3. **`RoomService` (`services/room.service.ts`):**
   - Paginated room retrieval with status and floor filters.
   - Room creation with duplicate room number guard.
   - Status updating with active reservation safety checks (cannot set room to `MAINTENANCE` or `INACTIVE` if active bookings exist).
4. **`AvailabilityService` (`services/availability.service.ts`):**
   - Implements half-open interval overlap query:
     `existing.checkInDate < requested.checkOutDate AND existing.checkOutDate > requested.checkInDate`
   - Accounts for `CONFIRMED` and `CHECKED_IN` reservations, plus active unexpired holds.
   - Capacity and maintenance status filtering.
5. **`ReservationService` (`services/reservation.service.ts`):**
   - `createHold`: Atomic hold creation with automatic expiration of stale holds.
   - `createReservation`: Concurrency-safe reservation creation in a transaction.
   - `getReservations`: Role-aware filtering (Guests only see their own; Staff/Admin see all) with search and pagination.
   - `cancelReservation`: Validates state transition, updates status, and automatically issues refund for successful payments.
   - `checkIn`: Transitions `CONFIRMED` -> `CHECKED_IN`, updates room status to `OCCUPIED`.
   - `checkOut`: Transitions `CHECKED_IN` -> `CHECKED_OUT`, frees room status back to `AVAILABLE`.
   - `getArrivals`, `getDepartures`: Today's incoming and outgoing reservations.
6. **`PaymentService` (`services/payment.service.ts`):**
   - `simulatePayment`: Idempotent payment processing inside a transaction, auto-confirms reservation.
   - `getPaymentById`, `getPaymentsByReservation`: Payment ledger queries.
7. **`ReportService` (`services/report.service.ts`):**
   - `getDashboardStats`: Real aggregate counts for rooms, reservations, today's arrivals/departures, total revenue, and 12-month rolling trends.
   - `getRevenueReport`: Date-bounded gross revenue, refund deductions, and net revenue.
   - `getOccupancyReport`: Date-bounded daily occupancy percentage calculation based on actual inventory and active bookings.
8. **`AuditService` (`services/audit.service.ts`):**
   - Asynchronous audit event recorder capturing actor ID, action type, entity ID, and before/after JSON states.

---

## 7. Database Schema, Models, Relationships, and Migrations

The database is defined in `server/prisma/schema.prisma` targeting PostgreSQL.

### Models & Enums

#### Enums
- `UserRole`: `[GUEST, STAFF, ADMIN]`
- `RoomStatus`: `[AVAILABLE, OCCUPIED, MAINTENANCE, INACTIVE]`
- `ReservationStatus`: `[PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, EXPIRED]`
- `PaymentStatus`: `[PENDING, SUCCESS, FAILED, REFUNDED]`
- `HoldStatus`: `[ACTIVE, EXPIRED, CONVERTED, CANCELLED]`

#### Entity Models & Key Fields
1. **`User`**: `id` (UUID), `fullName`, `email` (unique), `passwordHash`, `phone`, `role`, timestamps.
   - *Relations:* `reservations` (1:N), `bookingHolds` (1:N), `auditLogs` (1:N).
2. **`RoomType`**: `id` (UUID), `name` (unique), `description`, `basePrice`, `capacity`, `amenities` (String[]), `imageUrl`, timestamps.
   - *Relations:* `rooms` (1:N).
3. **`Room`**: `id` (UUID), `roomNumber` (unique), `roomTypeId` (FK), `floor`, `status`, timestamps.
   - *Relations:* `roomType` (N:1), `reservations` (1:N), `bookingHolds` (1:N).
4. **`Reservation`**: `id` (UUID), `bookingReference` (unique), `userId` (FK), `roomId` (FK), `checkInDate`, `checkOutDate`, `numberOfGuests`, `numberOfNights`, `roomPrice`, `subtotal`, `taxAmount`, `totalAmount`, `status`, `specialRequests`, timestamps.
   - *Relations:* `user` (N:1), `room` (N:1), `payments` (1:N).
   - *Indexes:* `[bookingReference]`, `[userId]`, `[roomId]`, `[status]`, `[checkInDate]`, `[checkOutDate]`, `[roomId, checkInDate, checkOutDate]`.
5. **`Payment`**: `id` (UUID), `reservationId` (FK), `amount`, `paymentMethod`, `paymentStatus`, `transactionReference` (unique), `createdAt`.
   - *Relations:* `reservation` (N:1).
6. **`BookingHold`**: `id` (UUID), `roomId` (FK), `userId` (FK), `checkInDate`, `checkOutDate`, `expiresAt`, `status`, `createdAt`.
   - *Relations:* `room` (N:1), `user` (N:1).
7. **`AuditLog`**: `id` (UUID), `userId` (FK, nullable), `action`, `entityType`, `entityId`, `oldValue` (Text), `newValue` (Text), `createdAt`.
   - *Relations:* `user` (N:1, nullable).

### Seed Script (`server/prisma/seed.ts`)
Creates:
- 1 Admin (`admin@hotel.com`)
- 2 Staff (`staff1@hotel.com`, `staff2@hotel.com`)
- 3 Guests (`guest1@example.com`, `guest2@example.com`, `guest3@example.com`)
- 5 Room Types (Standard Single, Standard Double, Deluxe Suite, Family Room, Presidential Suite)
- 15 Individual Rooms across Floors 1–5
- 6 Reservations representing all lifecycle states (past checkouts, active check-in, upcoming confirmed, cancelled with refund, today's arrival)
- Associated payments and initial audit logs.

### Migration Status
- Migration files have **not yet been executed** because dependencies have not been installed and the PostgreSQL database container/instance has not yet been connected.

---

## 8. API Endpoints, HTTP Methods, and Authentication

All routes are prefixed with `/api` and documentable via Swagger UI at `/api-docs`.

| Route | Method | Description | Auth Required | Roles |
|---|---|---|---|---|
| `/api/auth/register` | `POST` | Register a new guest account | Public | - |
| `/api/auth/login` | `POST` | Authenticate and obtain JWT cookie/token | Public | - |
| `/api/auth/logout` | `POST` | Clear session cookie | Public | - |
| `/api/auth/me` | `GET` | Get authenticated user profile | Yes | Any |
| `/api/auth/profile` | `PATCH` | Update user personal details | Yes | Any |
| `/api/room-types` | `GET` | List all room categories | Public | - |
| `/api/room-types/:id` | `GET` | Get room type details | Public | - |
| `/api/room-types` | `POST` | Create a room type | Yes | `ADMIN` |
| `/api/room-types/:id` | `PATCH` | Update a room type | Yes | `ADMIN` |
| `/api/room-types/:id` | `DELETE` | Delete a room type | Yes | `ADMIN` |
| `/api/rooms` | `GET` | List rooms with pagination & filters | Public | - |
| `/api/rooms/:id` | `GET` | Get room details & recent reservations | Public | - |
| `/api/rooms` | `POST` | Create an individual room | Yes | `ADMIN` |
| `/api/rooms/:id` | `PATCH` | Update room status/details | Yes | `STAFF`, `ADMIN` |
| `/api/rooms/:id` | `DELETE` | Delete a room | Yes | `ADMIN` |
| `/api/availability` | `GET` | Search available rooms for date range | Public | - |
| `/api/reservations/holds` | `POST` | Create 15-minute temporary booking hold | Yes | Any |
| `/api/reservations` | `POST` | Create a reservation (pending payment) | Yes | Any |
| `/api/reservations` | `GET` | List reservations (guest: own; staff: all) | Yes | Any |
| `/api/reservations/:id` | `GET` | Get single reservation details | Yes | Any |
| `/api/reservations/:id/cancel` | `PATCH` | Cancel reservation & trigger refund | Yes | Any (owner or staff/admin) |
| `/api/payments/simulate` | `POST` | Process simulated payment & confirm booking | Yes | Any |
| `/api/payments/:id` | `GET` | Get payment transaction details | Yes | Any |
| `/api/staff/reservations/:id/check-in` | `PATCH` | Check in guest & mark room OCCUPIED | Yes | `STAFF`, `ADMIN` |
| `/api/staff/reservations/:id/check-out` | `PATCH` | Check out guest & mark room AVAILABLE | Yes | `STAFF`, `ADMIN` |
| `/api/staff/arrivals` | `GET` | Get today's arrivals | Yes | `STAFF`, `ADMIN` |
| `/api/staff/departures` | `GET` | Get today's departures | Yes | `STAFF`, `ADMIN` |
| `/api/admin/dashboard` | `GET` | Get operational KPI summary | Yes | `ADMIN` |
| `/api/admin/reports/revenue` | `GET` | Get itemized revenue and refund metrics | Yes | `ADMIN` |
| `/api/admin/reports/occupancy` | `GET` | Get daily occupancy percentages | Yes | `ADMIN` |
| `/api/admin/users` | `GET` | List and search users | Yes | `ADMIN` |
| `/api/admin/users/:id/role` | `PATCH` | Update user authorization role | Yes | `ADMIN` |
| `/api/audit-logs` | `GET` | Paginated search of system audit events | Yes | `ADMIN` |
| `/api/users/:id` | `GET` | View user profile & booking history | Yes | `STAFF`, `ADMIN` |
| `/api/health` | `GET` | Health check endpoint | Public | - |

---

## 9. Environment Variables and Configuration Requirements

All environment configuration is templated in `.env.example`. **No production secrets are stored in version control.**

```ini
# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/hotel_booking?schema=public"

# JSON Web Token Secret & Expiration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS allowance)
CLIENT_URL="http://localhost:5173"

# Business Logic Parameters
TAX_RATE=12
BOOKING_HOLD_DURATION_MINUTES=15
```

---

## 10. Completed Features and Their Implementation Status

| Feature / Module | Status | Notes |
|---|---|---|
| Project structure & monorepo scripts | **Completed** | `package.json`, `.gitignore`, `.env.example` in place |
| Server dependencies (`node_modules`) | **Completed** | Installed in `server/` (339 packages) & root (`concurrently`) |
| Prisma Client Generation | **Completed** | Generated v6.19.3 to `server/node_modules/@prisma/client` |
| TypeScript Build Verification | **Completed** | Compiles with 0 errors to `server/dist/` |
| Express Server Runtime & Health Check | **Completed** | Boots cleanly on port 5000; verified `/api/health` & `/api-docs` |
| Prisma database schema | **Completed** | Full relational schema with indexes & enums validated |
| Database seed data script | **Completed** | Comprehensive test data, accounts, room inventory ready |
| JWT authentication & cookie handling | **Completed** | In `auth.service.ts` and `auth.ts` middleware |
| Server-side RBAC middleware | **Completed** | Enforces GUEST, STAFF, ADMIN restrictions |
| Room and Room Type management APIs | **Completed** | Full CRUD with validation & business constraints |
| Availability search engine | **Completed** | Overlap calculation with half-open intervals |
| Booking Hold creation & auto-expiry | **Completed** | 15-minute temporary hold with race condition check |
| Reservation lifecycle state machine | **Completed** | Validates PENDING -> CONFIRMED -> CHECKED_IN -> CHECKED_OUT |
| Concurrency & double-booking prevention | **Completed** | Implemented via Prisma transaction isolation |
| Simulated payment processing | **Completed** | Idempotent transaction handling, auto-confirmation |
| Cancellation & refund workflow | **Completed** | State update and associated payment refund |
| Staff check-in / check-out operations | **Completed** | Associated with room status mutations |
| Admin reporting & dashboard analytics | **Completed** | Revenue, occupancy, KPI calculations |
| Audit trail logging | **Completed** | Logs all state changes across domain entities |
| Swagger API documentation | **Completed** | JSDoc annotations and `/api-docs` route configured |
| Local PostgreSQL Service Verification | **Completed** | Verified PostgreSQL 18 running on 127.0.0.1:5432 |
| Database migration execution | **Completed** | Migration `20261115090015_init` successfully applied |
| Database seed execution | **Completed** | Repeatable seed script populated 15 rooms, 6 users, reservations |
| End-to-End Live API Verification | **Completed** | Verified Auth, Search, Holds, Booking, Payments, Dashboard |
| Automated test suite | **Pending** | `server/src/__tests__/` (Phase 2.2) |
| Frontend application | **Pending** | `client/` folder (Phase 2.3) |
| Final documentation & diagrams | **Pending** | `docs/` folder, README.md, technical report (Phase 2.4) |

---

## 11. Pending Features and Development Roadmap

```mermaid
gantt
    title Development Roadmap
    dateFormat  YYYY-MM-DD
    section Backend Verification
    Dependencies & Prisma Client    :active, b1, 2026-11-15, 1d
    Database Migrations & Seed      :b2, after b1, 1d
    Automated Test Suite (Vitest)   :b3, after b2, 1d
    section Frontend Scaffolding
    Vite + React + Tailwind Setup  :f1, after b2, 1d
    API Client & Auth Context       :f2, after f1, 1d
    Public & Guest Pages            :f3, after f2, 2d
    Staff Operations UI             :f4, after f3, 1d
    Admin Analytics & Controls      :f5, after f4, 1d
    section Documentation & QA
    Comprehensive Documentation     :d1, after f5, 1d
    End-to-End Regression Testing   :d2, after d1, 1d
```

### Detailed Roadmap Status (100% Complete):
1. **Backend Verification & Environment Setup (Phase 2.1 - COMPLETE):**
   - Installed server dependencies (`npm install`).
   - Ran Prisma generation (`npx prisma generate`).
   - Connected local PostgreSQL 18 and applied migration `20261115090015_init`.
   - Executed repeatable seed script (`npx prisma db seed`).
   - Resolved Express 5 typing issues and verified build (`npm run build`).

2. **Automated Testing Suite (Phase 2.2 - COMPLETE):**
   - Implemented 5 test suites in `server/src/__tests__/`:
     - `auth.test.ts` (8 tests)
     - `rbac.test.ts` (7 tests)
     - `availability.test.ts` (5 tests)
     - `booking-concurrency.test.ts` (6 tests)
     - `operations-reporting.test.ts` (6 tests)
   - Verified that all **32 / 32 tests pass** via `npm test`.

3. **Frontend Implementation & Build (Phase 2.3 - COMPLETE):**
   - Initialized React 19 + TypeScript + Vite + Tailwind CSS v4 in `client/`.
   - Built full responsive UI and page routes:
     - `HomePage.tsx`: Hero banner, quick availability search widget, featured rooms.
     - `RoomsPage.tsx`: Room catalog with filters for price and guest capacity.
     - `SearchPage.tsx`: Live date & guest availability query, room selection.
     - `CheckoutPage.tsx`: 15-minute countdown timer, guest details, simulated payment methods.
     - `ConfirmationPage.tsx`: Printable booking receipt with reference code and financial breakdown.
     - `LoginPage.tsx`: Login form with reviewer 1-click Quick-Fill buttons (Admin, Staff, Guest).
     - `RegisterPage.tsx`: Guest registration form with instant login redirect.
     - `GuestBookingsPage.tsx`: Guest booking history and interactive cancellation with refund.
     - `ProfilePage.tsx`: User profile and active role badge.
     - `StaffDashboardPage.tsx`: Front-desk check-in, check-out, and housekeeping room status editor.
     - `AdminDashboardPage.tsx`: Executive KPI cards, 12-month Recharts revenue chart, room creator modal, role editor, and audit log table.
   - Built frontend successfully with `npm run build` (0 errors).

4. **Comprehensive Documentation & Submission Package (Phase 2.4 - COMPLETE):**
   - Master root `README.md` with complete architecture, setup guide, demo credentials, test commands, and acceptance criteria verification.
   - `docs/er-diagram.md`: Full Mermaid ER diagram and indexing rationale.
   - `docs/architecture.md`: Architectural blueprints, concurrency mechanics, and state machine diagrams.
   - `docs/api-documentation.md`: Complete OpenAPI endpoint specification.
   - `docs/technical-report.md`: Formal evaluation report with 3–5 min video walkthrough script.

---

## 12. Known Bugs, Errors, and Technical Limitations

1. **Database & Runtime Status (Verified Working):**
   - PostgreSQL 18 service (`postgresql-x64-18`) is active on `127.0.0.1:5432`.
   - `hotel_booking` database migrated (`20261115090015_init`) with all 8 tables.
   - Seed script executed cleanly with demo accounts and reservations.
2. **Issues Discovered and Fixed:**
   - *Express 5 Route Parameter Types:* In `@types/express: ^5.0.0`, `req.params.id` is typed as `string | string[]`. Fixed by adding explicit type assertions (`req.params.id as string`) across 7 files.
   - *TypeScript Build & Schema Status:* TypeScript compilation completes with 0 errors (`tsc --noEmit` and `npm run build`), and the Prisma schema syntax is fully validated.
   - *Tailwind v4 in Vite:* Installed `@tailwindcss/postcss` and updated `index.css` and `postcss.config.js`.
   - *Recharts Peer Dependency:* Resolved `react-is` peer dependency in `client/`.
   - *Test Date Cleanup:* Added date range isolation in `booking-concurrency.test.ts` to ensure repeatable test execution.
3. **Pending Tasks:**
   - None. All requirements and deliverables are 100% complete.

---

## 13. Important Technical Decisions and Their Reasoning

1. **Modular Monolith Architecture:**
   - *Decision:* Avoided microservices in favor of an organized Express + React monorepo.
   - *Reasoning:* Matches the assignment brief requirement, simplifies deployment, eliminates distributed transaction overhead, and provides instant type consistency.
2. **Half-Open Date Range Overlap Logic:**
   - *Decision:* Utilized `checkInDate < requestedCheckOutDate AND checkOutDate > requestedCheckInDate`.
   - *Reasoning:* Enables industry-standard hotel check-in/check-out timing where Guest A departs at 11:00 AM on Date X and Guest B arrives at 2:00 PM on the same Date X without conflict.
3. **Prisma Transactions for Availability & Holds:**
   - *Decision:* Wrapped hold creation, booking confirmation, check-in, and check-out inside `prisma.$transaction`.
   - *Reasoning:* Guarantees isolation and atomic rollback, preventing race conditions when two simultaneous requests attempt to reserve the same inventory.
4. **Strict State Machine (State Transitions):**
   - *Decision:* Hardcoded valid transition paths in `VALID_TRANSITIONS` dictionary.
   - *Reasoning:* Prevents invalid states such as checking in an expired booking, checking out a cancelled booking, or cancelling an already checked-out stay.
5. **Dual Authentication Support (HTTP-Only Cookie + Bearer Header):**
   - *Decision:* Checked both `req.headers.authorization` and `req.cookies.token`.
   - *Reasoning:* Offers strong XSS security via HTTP-only cookies in browsers while allowing seamless Swagger UI / programmatic API client testing with Bearer tokens.

---

## 14. Current Git Status and Recent Development Changes

### Git Status
- **Current Branch:** `master`
- **Total Commits:** `0` (ready for initial git commit)
- **Tracking:** All application source code, configuration files, test suites, and documentation are prepared. Secrets (`.env`) are strictly excluded via `.gitignore`.

### Recent Changes Summary
- Full-stack codebase completed and tested.
- 32 Vitest tests passing with 100% success rate.
- Frontend React 19 application built cleanly.
- Master `README.md` and complete `docs/` suite generated.

---

## 15. Exact Point Where Current Development Stands

The Hotel Booking Management System is **100% COMPLETED and VERIFIED**:
- Backend: Production-ready TypeScript Express API with PostgreSQL 18 & Prisma ORM.
- Database: Migrated and seeded with demo accounts, rooms, reservations, payments, and audit logs.
- Tests: 32 / 32 automated tests passing across 5 test suites.
- Frontend: Responsive React 19 SPA with Tailwind CSS v4, dynamic charts, and 1-click reviewer logins.
- Documentation: Complete submission package with master `README.md`, ER diagram, architecture, API spec, and technical assessment report.

---

## 16. Recommended Next Development Steps

The application is completely finished and ready for final evaluation:
1. Stage and commit the source repository files to git (`git add .` and `git commit`).
2. Run `npm run dev` to start both frontend and backend for the live demo walkthrough.
3. Record the 3–5 minute video presentation following the script in `docs/technical-report.md`.
4. Submit the repository and deliverables before the 11:00 PM deadline.
