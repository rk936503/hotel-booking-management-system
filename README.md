# Hotel Booking Management System (HBMS)

[![Assessment](https://img.shields.io/badge/ALGIONS%20AI%20LABS-Full--Stack%20Assessment-blue.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933.svg?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000.svg?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1.svg?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-32%2F32%20Passing-brightgreen.svg?logo=vitest)](#12-automated-testing-suite)

A full-stack, enterprise-grade Hotel Booking Management System engineered with strict separation of concerns, multi-role RBAC security, deterministic concurrency controls, half-open interval availability arithmetic, 15-minute expiring booking holds, and an audit trail for all business-critical operations.

Built for **ALGIONS AI LABS PRIVATE LIMITED — Advanced Individual Assessment (Full-Stack Web Development)**.

---

## Table of Contents

1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Core Features & Business Scope](#2-core-features--business-scope)
3. [Technology Stack](#3-technology-stack)
4. [Database Design & ER Diagram](#4-database-design--er-diagram)
5. [Application UI & Screen Previews (Screenshots)](#5-application-ui--screen-previews-screenshots)
6. [Prerequisites & Environment Setup](#6-prerequisites--environment-setup)
7. [Database Migrations & Seed Data](#7-database-migrations--seed-data)
8. [Running the Application](#8-running-the-application)
9. [Demo Accounts & Evaluator Credentials](#9-demo-accounts--evaluator-credentials)
10. [Acceptance Tests Demonstration Guide](#10-acceptance-tests-demonstration-guide)
11. [Concurrency & Overbooking Prevention](#11-concurrency--overbooking-prevention)
12. [Automated Testing Suite](#12-automated-testing-suite)
13. [API Specification & Swagger UI](#13-api-specification--swagger-ui)
14. [Repository Structure](#14-repository-structure)
15. [Known Limitations & Future Roadmap](#15-known-limitations--future-roadmap)

---

## 1. Executive Summary & System Architecture

The application adopts a **Modular Monolith** architecture that cleanly separates Presentation (React 19 SPA), Business Logic (Express Services & Domain Controllers), and Persistence (PostgreSQL with Prisma ORM).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (SPA)                        │
│               React 19 • TypeScript • Vite • Tailwind CSS v4           │
│   [Guest Booking Flow]       [Staff Operations]       [Admin Command]  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ JSON / REST via Axios Interceptors
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION API LAYER                          │
│               Node.js 24 • Express 5 • JWT RBAC Middleware             │
│   ┌───────────────┬───────────────────┬───────────────┬────────────┐   │
│   │ Auth & Users  │ Availability/Hold │ Reservations  │ Operations │   │
│   └───────────────┴───────────────────┴───────────────┴────────────┘   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Prisma Client (Typed ORM)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA PERSISTENCE LAYER                          │
│                    PostgreSQL 18 Relational Engine                     │
│  • B-Tree Composite Indexes  • Foreign Keys (CASCADE/RESTRICT)         │
│  • ACID Multi-Model Txns     • Audit Trail Triggers                    │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Pillars
- **Strict Server-Side RBAC:** Zero reliance on UI hiding alone. Every operational and administrative route enforces server-side JWT verification and role evaluation (`GUEST`, `STAFF`, `ADMIN`).
- **Half-Open Interval Availability:** Booking intervals are evaluated mathematically as `[checkIn, checkOut)`. A guest checking out on Day $N$ does not block an arriving guest on Day $N$, eliminating turnover dead-zones.
- **15-Minute Soft Holds:** Temporary holds reserve a room during checkout. If the guest abandons checkout or payment times out, the hold self-expires without human intervention.
- **Atomic Two-Phase Booking Transactions:** When a booking is finalized, room re-verification, hold release, reservation insertion, mock payment creation, room status transition, and audit log persistence execute inside an atomic Prisma `$transaction`.

---

## 2. Core Features & Business Scope

### Room and Rate Administration
- Dynamic room type management with customizable nightly rates, capacity limits, descriptions, and amenity tags.
- Individual room tracking by room number, floor level, and status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `DIRTY`).

### Real-Time Availability Engine
- Search by check-in / check-out dates, guest count, and room type.
- Rejection of invalid dates (check-out before check-in, past dates).
- Exclusion of active reservations and unexpired 15-minute booking holds.

### Reservation Lifecycle & Workflow
- Interactive 15-minute countdown during hold checkout.
- **Indian Rupee (INR - ₹) Currency Localization:** Complete Indian locale formatting (`en-IN`) across all guest, staff, and admin views using JavaScript `Intl.NumberFormat`.
- Itemized pricing breakdown with subtotal, government tax (12%), and total balance.
- Unique booking reference generation (`HB-YYYY-XXXXX`).
- Deterministic state machine supporting `PENDING` ➔ `CONFIRMED` ➔ `CHECKED_IN` ➔ `CHECKED_OUT` and `CANCELLED`.
- Automated mock payment gateway integration (Credit Card, UPI, Net Banking) and cancellation refunds.

### Concurrency & Data Integrity
- Atomic Prisma transactions preventing race conditions and double-bookings.
- Conflict rejection (`HTTP 409 Conflict`) on simultaneous reservation attempts for the same physical room.
- Immediate availability restoration when bookings are cancelled or holds expire.

### Multi-Role Operations
- **Guest Experience:** Search inventory, hold rooms, complete payments, view booking history, and cancel active reservations.
- **Staff Operations:** View daily arrivals/departures, 1-click guest check-in (marks room `OCCUPIED`), 1-click check-out (marks room `AVAILABLE`), and update room housekeeping statuses.
- **Admin Command Suite:** Executive KPI analytics, 12-month revenue bar chart, room creation forms, user role modifications, and immutable audit logs.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | Node.js v24.11, Express.js 5.0, TypeScript 5.7 |
| **Database & ORM** | PostgreSQL 18 Local Server, Prisma ORM 5.22 |
| **Authentication & Security** | JWT (JSON Web Tokens), BCrypt password hashing, Helmet, CORS, Express-Rate-Limit |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts |
| **State & Networking** | React Context API, Axios with dynamic Bearer Token Interceptors, React Hot Toast |
| **Testing** | Vitest 2.1, Supertest, In-memory isolation & PostgreSQL integration |
| **Documentation** | Swagger / OpenAPI 3.0, Mermaid.js diagrams |

---

## 4. Database Design & ER Diagram

The database schema comprises **7 relational entities** designed in third normal form (3NF) with strict referential integrity and performance-tuned composite indexes:

- `User`: System accounts with `Role` enum (`GUEST`, `STAFF`, `ADMIN`).
- `RoomType`: Master room categories (Standard, Deluxe, Executive Suite, Family Suite, Presidential Villa).
- `Room`: Individual physical rooms with room number, floor, and `RoomStatus` (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `DIRTY`).
- `Reservation`: Booking lifecycle contracts with `ReservationStatus` (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`).
- `Payment`: Transaction receipts linked to reservations (`PENDING`, `COMPLETED`, `REFUNDED`, `FAILED`).
- `BookingHold`: 15-minute concurrency reservations with TTL timestamp.
- `AuditLog`: Immutable, append-only history of administrative and operational actions.

Detailed entity-relationship documentation and full Mermaid diagrams are available in [`docs/er-diagram.md`](docs/er-diagram.md).

---

## 5. Application UI & Screen Previews (Screenshots)

The application provides intuitive, responsive user experiences across all roles:

### 1. Guest Journey: Homepage & Live Search
- **Home View (`/`):** Luxury hero banner, quick availability search widget, featured suites catalog, and hotel amenities showcase.
- **Search Catalog (`/search`):** Date range selection, guest capacity filter, real-time availability cards, pricing breakdown, and direct "Book Now" trigger.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Grand Horizon Hotel & Suites                        [Login] [Register] │
├────────────────────────────────────────────────────────────────────────┤
│                     EXPERIENCE UNRIVALED LUXURY                        │
│   [ Check-in: 2026-12-01 ] [ Check-out: 2026-12-05 ] [ 2 Guests ]     │
│                         [ Search Availability ]                        │
├────────────────────────────────────────────────────────────────────────┤
│ Available Rooms:                                                       │
│ ┌───────────────────────────┐  ┌───────────────────────────────────┐   │
│ │ Deluxe Suite - ₹6,500/night │ │ Executive Suite - ₹15,000/night   │   │
│ │ Max Guests: 3 • King Bed  │  │ Max Guests: 4 • Panoramic View    │   │
│ │ [ Book Now with 15m Hold ]│  │ [ Book Now with 15m Hold ]        │   │
│ └───────────────────────────┘  └───────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Checkout & Concurrency Hold (`/checkout/:holdId`)
- **15-Minute Countdown Timer:** Displays live remaining time on room lock; auto-expires if payment is not finalized.
- **Itemized Bill:** Room rate, number of nights, 12% government tax, and total charge.
- **Simulated Payment Gateway:** Credit Card, UPI, and Net Banking options with instant confirmation.

### 3. Front-Desk Staff Portal (`/staff`)
- **Upcoming Arrivals Table:** Guest details, room assignments, check-in dates, and 1-click **"Check In"** action (transitions reservation to `CHECKED_IN` and room to `OCCUPIED`).
- **Active Stays & Departures:** 1-click **"Check Out"** action (transitions reservation to `CHECKED_OUT` and room to `AVAILABLE`).
- **Housekeeping Room Status Editor:** Quick selector to toggle physical room conditions (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `DIRTY`).

### 4. Admin Executive Dashboard (`/admin`)
- **KPI Metrics:** Total Revenue, Active Bookings, Total Rooms, and Current Occupancy Rate.
- **12-Month Financial Chart:** Visual bar chart powered by Recharts illustrating monthly net revenue.
- **Room Management & User Role Control:** Add new rooms, adjust nightly pricing, and promote staff members.
- **Live Audit Trail:** Complete chronological audit log of all system actions.

---

## 6. Prerequisites & Environment Setup

### Prerequisites
- **Node.js**: v20+ (developed on Node v24.11)
- **npm**: v10+ (developed on npm v11.6)
- **PostgreSQL**: v14+ (tested on PostgreSQL 18 local server) running on port `5432`

### Step 1: Clone or Navigate to the Workspace
```bash
git clone <repository_url> hotel-booking-management-system
cd hotel-booking-management-system
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the root and in `server/`:

```bash
cp .env.example .env
cp .env.example server/.env
cp client/.env.example client/.env
```

Ensure the `.env` file reflects your local PostgreSQL credentials:

```env
# Application Port
PORT=5000
NODE_ENV=development

# Database Connection (replace user, password, and port if custom)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hotel_booking?schema=public"

# JWT Authentication
JWT_SECRET="algions-ai-labs-secure-jwt-secret-key-32chars"
JWT_EXPIRES_IN="7d"

# Client CORS
CLIENT_URL="http://localhost:5173"

# Payment Gateway Simulation
PAYMENT_GATEWAY_MODE="simulated"
```

---

## 7. Database Migrations & Seed Data

### Step 1: Install Dependencies
Run from the root directory:
```bash
npm run setup
```
*(This command installs root, server, and client dependencies, and runs `prisma generate`)*.

### Step 2: Apply Migrations
Create the database and apply the initial schema:
```bash
npm run db:migrate
```

### Step 3: Populate Seed Data
Execute the deterministic seed script:
```bash
npm run db:seed
```

The database will be populated with:
- **6 Users**: 1 Admin, 2 Staff members, 3 Guest accounts.
- **5 Room Types**: Standard Single (₹2,500/night), Standard Double (₹4,000/night), Deluxe Suite (₹6,500/night), Family Room (₹5,500/night), Presidential Suite (₹15,000/night).
- **15 Physical Rooms**: Across floors 1, 2, 3, and 4.
- **6 Real-world Reservations**: Demonstrating all lifecycle states (`CHECKED_IN`, `CONFIRMED`, `CANCELLED`, `CHECKED_OUT`, `PENDING`).
- **Complete Payments & Audit Logs**: Fully reconciled transactions for immediate dashboard metrics.

---

## 8. Running the Application

### Option A: Simultaneous Dev Mode (Recommended)
From the root directory, launch both backend and frontend concurrently:
```bash
npm run dev
```

### Option B: Separate Terminal Launch
- **Terminal 1 (Backend Server):**
  ```bash
  cd server
  npm run dev
  # Server listens at http://localhost:5000
  ```
- **Terminal 2 (Frontend Client):**
  ```bash
  cd client
  npm run dev
  # Client opens at http://localhost:5173
  ```

### Access URLs
- **Web Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Base:** [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Interactive Swagger Documentation:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

## 9. Demo Accounts & Evaluator Credentials

The login page at [http://localhost:5173/login](http://localhost:5173/login) includes **1-Click Reviewer Quick-Fill Buttons** for instant evaluation without typing:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **ADMIN** | `admin@hotel.com` | `Password123!` | Executive KPI dashboard, 12-month revenue chart, room & rate creation, user role management, system audit trail. |
| **STAFF** | `staff1@hotel.com` | `Password123!` | Front-desk operations: arrivals/departures, 1-click check-in (marks room OCCUPIED), check-out (marks room AVAILABLE), room housekeeping status editor. |
| **GUEST** | `guest1@example.com` | `Password123!` | Public catalog, availability search, 15-min hold checkout, simulated payments, printable confirmation receipt, booking history, instant cancellations. |
| **GUEST 2**| `guest2@example.com` | `Password123!` | Secondary guest profile for concurrency and multi-user testing. |

---

## 10. Acceptance Tests Demonstration Guide

Here is how an evaluator can verify the 5 required assessment acceptance criteria:

### Acceptance Test 1: Guest Search & Booking
1. Navigate to [http://localhost:5173](http://localhost:5173).
2. Click **"Book Your Stay"** or use the homepage search widget.
3. Select valid future dates (e.g., Check-in: `2026-12-01`, Check-out: `2026-12-05`, 2 Guests).
4. Browse the filtered room list and select **"Book Now"**.
5. Log in or use the 1-click **"Guest"** quick-fill button.
6. The system places an atomic 15-minute hold on the selected room with an active countdown timer.
7. Fill in guest contact info, select simulated payment (Credit Card / UPI / Net Banking), and click **"Complete Booking"**.
8. **Result:** Booking reference is generated (e.g., `HB-2026-XXXXX`), payment is recorded as `COMPLETED`, and an itemized printable receipt is displayed.

### Acceptance Test 2: Double-Booking & Concurrency Prevention
1. Open two browser tabs or private windows.
2. In Tab A, initiate a booking for Room 101 on dates `2026-12-10` to `2026-12-15` and complete the checkout.
3. In Tab B, attempt to search or book Room 101 for overlapping dates (e.g., `2026-12-12` to `2026-12-18`).
4. **Result:** The system excludes Room 101 from search availability. If an attempt is forced directly via API, the backend rejects the transaction with `HTTP 409 Conflict: Room is no longer available for the selected dates`.

### Acceptance Test 3: Invalid Dates, Full Occupancy & Cancellation
- **Invalid Dates:** In the search bar, select a check-out date before the check-in date. The UI displays an inline validation error and disables submission; the backend validator returns `HTTP 400 Bad Request`.
- **Full Occupancy:** When all rooms of a type are held or confirmed, the search results clearly display `No rooms available for the selected dates and criteria`.
- **Cancellation:** Log in as `guest1@example.com`, navigate to **"My Bookings"**, and click **"Cancel Booking"** on an active reservation.
- **Result:** Status changes to `CANCELLED`, payment is set to `REFUNDED`, the room immediately returns to available inventory, and an audit log entry is recorded.

### Acceptance Test 4: Front-Desk Staff Check-In & Check-Out
1. Log in as `staff1@hotel.com` (use 1-click Staff button).
2. Navigate to **"Staff Operations"** ([/staff](http://localhost:5173/staff)).
3. Under **"Upcoming Arrivals"**, find a confirmed guest and click **"Check In"**.
4. **Result:** Reservation status transitions to `CHECKED_IN` and physical room status transitions from `AVAILABLE` to `OCCUPIED`.
5. Under **"Active Stays / Departures"**, click **"Check Out"**.
6. **Result:** Reservation status transitions to `CHECKED_OUT` and physical room status returns to `AVAILABLE` (or `DIRTY` pending housekeeping).

### Acceptance Test 5: Admin Report Matches Underlying Reservation Data
1. Log in as `admin@hotel.com`.
2. Navigate to **"Admin Portal"** ([/admin](http://localhost:5173/admin)).
3. Review the KPI cards: Total Revenue, Active Bookings, Total Rooms, and Occupancy Rate.
4. Review the **12-Month Revenue Breakdown** chart and the **Live Audit Trail** table.
5. Cross-reference the revenue figures against the seeded completed payments in the database.
6. **Result:** Metric figures precisely match `SELECT SUM(amount) FROM "Payment" WHERE status = 'COMPLETED'`, confirming zero discrepancies.

---

## 11. Concurrency & Overbooking Prevention

The system enforces three defense layers against race conditions:

### 1. Half-Open Interval Algebra
Availability is queried using standard interval overlap logic:
```sql
WHERE r."checkInDate" < :requestedCheckOut
  AND r."checkOutDate" > :requestedCheckIn
  AND r."status" NOT IN ('CANCELLED', 'CHECKED_OUT')
```
This guarantees that check-out on Day $N$ and check-in on Day $N$ do not collide.

### 2. Time-To-Live (TTL) Soft Holds
When a user begins checkout:
- A `BookingHold` record is created for 15 minutes (`expiresAt = NOW() + 15 min`).
- Any search query treats active holds with `expiresAt > NOW()` as occupied rooms.
- Abandoned holds require zero manual purging; queries filter `WHERE expiresAt > NOW()`.

### 3. ACID Prisma Transactions with Serializable Checks
Final booking execution runs inside `prisma.$transaction`:
1. Re-queries confirmed reservations and unexpired holds for the specific room ID.
2. If any conflicting record exists, aborts with `HTTP 409 Conflict`.
3. Creates reservation, marks hold as released, records payment, updates room status, and registers the audit event within the same atomic commit.

---

## 12. Automated Testing Suite

The backend test suite is built on **Vitest** and **Supertest**, executing against a real database environment to validate business logic, HTTP contracts, and concurrent transactions.

Run the test suite from the root:
```bash
npm test
```

### Test Suite Summary: 32 / 32 Passed

```text
✓ src/__tests__/availability.test.ts (5 tests)
  ✓ 3. Availability & Search Tests > 3.1 should return available room types for valid date range
  ✓ 3. Availability & Search Tests > 3.2 should reject invalid date range (check-out before check-in)
  ✓ 3. Availability & Search Tests > 3.3 should reject check-in date in the past
  ✓ 3. Availability & Search Tests > 3.4 should filter by guest capacity
  ✓ 3. Availability & Search Tests > 3.5 should respect temporary booking holds within TTL

✓ src/__tests__/booking-concurrency.test.ts (6 tests)
  ✓ 4. Booking Concurrency & Integrity Tests > 4.1 should successfully create a reservation and hold
  ✓ 4. Booking Concurrency & Integrity Tests > 4.2 should prevent double booking for overlapping dates
  ✓ 4. Booking Concurrency & Integrity Tests > 4.3 should allow booking the same room for non-overlapping dates
  ✓ 4. Booking Concurrency & Integrity Tests > 4.4 should handle concurrent booking attempts for the same room
  ✓ 4. Booking Concurrency & Integrity Tests > 4.5 should allow booking a room after previous reservation is cancelled
  ✓ 4. Booking Concurrency & Integrity Tests > 4.6 should calculate itemized pricing correctly

✓ src/__tests__/rbac.test.ts (7 tests)
  ✓ 2. Role-Based Access Control (RBAC) Tests > 2.1 should reject requests without token
  ✓ 2. Role-Based Access Control (RBAC) Tests > 2.2 should reject requests with invalid token
  ✓ 2. Role-Based Access Control (RBAC) Tests > 2.3 should allow guest to view their own bookings
  ✓ 2. Role-Based Access Control (RBAC) Tests > 2.4 should prevent guest from accessing staff routes
  ✓ 2. Role-Based Access Control (RBAC) Tests > 2.5 should prevent guest from accessing admin routes
  ✓ 2. Role-Based Access Control (RBAC) Tests > 2.6 should allow staff to access staff routes
  ✓ 2. Role-Based Access Control (RBAC) Tests > 2.7 should allow admin to access admin routes

✓ src/__tests__/auth.test.ts (8 tests)
  ✓ 1. Authentication & Authorization Tests > 1.1 should register a new guest user successfully
  ✓ 1. Authentication & Authorization Tests > 1.2 should reject registration with existing email
  ✓ 1. Authentication & Authorization Tests > 1.3 should login an existing user with valid credentials
  ✓ 1. Authentication & Authorization Tests > 1.4 should reject login with invalid password
  ✓ 1. Authentication & Authorization Tests > 1.5 should reject login with non-existent email
  ✓ 1. Authentication & Authorization Tests > 1.6 should login demo admin account successfully
  ✓ 1. Authentication & Authorization Tests > 1.7 should login demo staff account successfully
  ✓ 1. Authentication & Authorization Tests > 1.8 should login demo guest account successfully

✓ src/__tests__/operations-reporting.test.ts (6 tests)
  ✓ 5. Operations & Reporting Tests > 5.1 should allow staff to view arrivals and departures
  ✓ 5. Operations & Reporting Tests > 5.2 should allow staff to check in a guest
  ✓ 5. Operations & Reporting Tests > 5.3 should allow staff to check out a guest
  ✓ 5. Operations & Reporting Tests > 5.4 should allow staff to update room status
  ✓ 5. Operations & Reporting Tests > 5.5 should provide admin occupancy and revenue report
  ✓ 5. Operations & Reporting Tests > 5.6 should record audit logs for critical actions

Test Files  5 passed (5)
     Tests  32 passed (32)
```

---

## 13. API Specification & Swagger UI

The server exports interactive OpenAPI 3.0 documentation:
- **Swagger UI:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **OpenAPI JSON Spec:** [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

### Primary API Endpoints Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new guest account |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Fetch current profile |
| `GET` | `/api/availability/search` | Public | Real-time availability by dates & guests |
| `POST` | `/api/availability/hold` | Authenticated | Place 15-minute hold on a room |
| `GET` | `/api/rooms` | Public | List room catalog with filtering |
| `POST` | `/api/reservations` | Authenticated | Create confirmed reservation |
| `GET` | `/api/reservations/my` | Authenticated | List guest booking history |
| `POST` | `/api/reservations/:id/cancel`| Authenticated | Cancel reservation & issue refund |
| `GET` | `/api/staff/arrivals` | Staff, Admin | Upcoming guest arrivals |
| `POST` | `/api/staff/check-in/:id` | Staff, Admin | Check-in guest & mark room occupied |
| `POST` | `/api/staff/check-out/:id`| Staff, Admin | Check-out guest & mark room available |
| `GET` | `/api/admin/reports/occupancy`| Admin | Occupancy & revenue analytics |
| `GET` | `/api/audit-logs` | Admin | Full business audit trail |

Complete schemas, query parameters, and sample payloads are detailed in [`docs/api-documentation.md`](docs/api-documentation.md).

---

## 14. Repository Structure

```
hotel-booking-management-system/
├── client/                        # Frontend React 19 Application
│   ├── public/                    # Static brand assets & icons
│   ├── src/
│   │   ├── assets/                # Hero banner & visual resources
│   │   ├── components/            # Reusable UI (Navbar, Footer, ProtectedRoute)
│   │   ├── context/               # AuthContext & session state management
│   │   ├── layouts/               # Shell layout with notifications
│   │   ├── pages/                 # Full-page views:
│   │   │   ├── HomePage.tsx       # Landing page with availability widget
│   │   │   ├── RoomsPage.tsx      # Room catalog with capacity filters
│   │   │   ├── SearchPage.tsx     # Live search & available inventory
│   │   │   ├── CheckoutPage.tsx   # 15-min countdown & simulated gateway
│   │   │   ├── ConfirmationPage.tsx # Printable receipt & reference code
│   │   │   ├── LoginPage.tsx      # Auth form with 1-click quick-fills
│   │   │   ├── RegisterPage.tsx   # Guest registration
│   │   │   ├── GuestBookingsPage.tsx # History & cancellation handling
│   │   │   ├── ProfilePage.tsx    # User details & role viewer
│   │   │   ├── StaffDashboardPage.tsx # Front-desk arrivals & housekeeping
│   │   │   └── AdminDashboardPage.tsx # KPIs, Recharts graph, room creator
│   │   ├── services/              # Axios instance with auth interceptor
│   │   ├── types/                 # Shared TypeScript data models
│   │   ├── App.tsx                # Client router configuration
│   │   ├── main.tsx               # Application mount point
│   │   └── index.css              # Tailwind CSS v4 styling directives
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── vite.config.ts
├── server/                        # Backend Node.js / Express 5 API
│   ├── prisma/
│   │   ├── migrations/            # Version-controlled SQL migrations
│   │   ├── schema.prisma          # 7 relational models & enums
│   │   └── seed.ts                # Deterministic database seeder
│   ├── src/
│   │   ├── config/                # Database & Swagger configurations
│   │   ├── controllers/           # HTTP controllers for all domains
│   │   ├── middlewares/           # JWT auth, RBAC guards, rate limiter, errors
│   │   ├── routes/                # Express router mounts
│   │   ├── services/              # Pure business logic services
│   │   ├── types/                 # Express & entity type declarations
│   │   ├── utils/                 # Error classes & helper functions
│   │   ├── validators/            # Joi/Zod request payload validators
│   │   ├── __tests__/             # 32 Vitest integration & concurrency tests
│   │   └── app.ts                 # Express server factory
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── tsconfig.json
│   └── vitest.config.ts
├── docs/                          # In-Depth Project Documentation
│   ├── api-documentation.md       # OpenAPI endpoint specification
│   ├── architecture.md            # Architecture diagrams & design patterns
│   ├── er-diagram.md              # Mermaid ER diagram & indexing rationale
│   └── technical-report.md        # Assessment evaluation report & video script
├── PROJECT_CONTEXT.md             # Centralized project tracking log
├── package.json                   # Root orchestrator scripts
├── .env.example                   # Clean environment variable template
├── .gitignore                     # Git ignore rules
└── README.md                      # Master assessment documentation
```

---

## 15. Known Limitations & Future Roadmap

- **Simulated Payment Gateway:** Payments are simulated locally with instant card, UPI, and Net Banking authorization to comply with assessment guidelines without incurring external costs. In production, this can be transitioned to Stripe Elements or Razorpay Webhooks.
- **Single-Node In-Memory Holds:** Booking holds are currently persisted in PostgreSQL with indexed TTL queries. For multi-datacenter deployments, Redis with keyspace expiration events could be adopted for sub-millisecond lease coordination.
- **Email Notifications:** Receipts and confirmation codes are presented interactively on screen and are fully printable. Production integration with SendGrid or AWS SES would enable automated SMTP transactional dispatch.

---

### Candidate Submission Verification

- **Candidate Role:** Full-Stack Web Development  
- **Project Assigned:** Hotel Booking Management System  
- **Status:** Complete, Verified, All 32 Tests Passing  
- **Date Completed:** November 15, 2026 (Submitted well before the 11:00 PM deadline)
