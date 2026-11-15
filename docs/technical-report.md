# Technical Report: Hotel Booking Management System

> **Candidate Assessment Submission**  
> **Company:** ALGIONS AI LABS PRIVATE LIMITED  
> **Role:** Full-Stack Web Development  
> **Assigned Project:** Hotel Booking Management System  
> **Date:** November 15, 2026  

---

## 1. Executive Summary

This report documents the architectural design, implementation, concurrency safeguards, security controls, and verification testing of the **Hotel Booking Management System**. 

The deliverable is a production-quality, responsive web application backed by a live PostgreSQL relational database. It fulfills all operational requirements across Guest self-service, Front-Desk Staff operations, and Executive Administration.

---

## 2. Business Problem & Technical Solution

### The Challenge
A hotel booking system operates in a high-contention, real-time environment. Critical technical pitfalls include:
1. **Double-Booking Race Conditions:** Two guests submitting simultaneous requests for the same room on overlapping dates.
2. **Stale Holds Locking Inventory:** Abandoned shopping carts leaving rooms artificially unbookable.
3. **Improper Date Arithmetic:** Failing to account for half-open intervals, allowing booking in the past, or rejecting valid same-day turnover (checkout at 11:00 AM, check-in at 2:00 PM).
4. **Client-Side Authorization Vulnerabilities:** Hiding buttons on the UI without strict server-side middleware enforcement.
5. **Inaccurate Reporting:** Financial summaries disconnected from actual transaction ledgers or ignoring cancellation refunds.

### The Engineering Solution
- **Transactional Two-Phase Locking:** All reservation creations, booking holds, check-ins, and check-outs are encapsulated in atomic PostgreSQL database transactions (`prisma.$transaction`).
- **Half-Open Interval Exclusions:** Date overlap is enforced mathematically using half-open intervals $[checkIn, checkOut)$, permitting turnover without conflict:
  $$\text{Existing.checkInDate} < \text{Requested.checkOutDate} \quad \text{AND} \quad \text{Existing.checkOutDate} > \text{Requested.checkInDate}$$
- **Self-Expiring Hold Timers:** Active holds feature an `expiresAt` timestamp set to `NOW() + 15 minutes`. Background queries automatically prune expired holds before calculating availability.
- **Strict Deterministic State Machine:** State transitions are verified by server-side invariant rules (`PENDING` -> `CONFIRMED` -> `CHECKED_IN` -> `CHECKED_OUT`), with automatic payment refunding on cancellation.
- **Server-Side RBAC Middleware:** JWT authentication verifying claims against an immutable user table. Route middleware enforces role permissions independently of the UI.
- **Ledger-Backed Reporting:** Occupancy and revenue calculations are aggregated dynamically from actual room records and payment rows with full audit logging.

---

## 3. Technology Stack Decisions

| Layer | Chosen Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 19 + Vite | Instant HMR development, optimal production tree-shaking, fast client-side routing. |
| **Styling & Design** | Tailwind CSS | Utility-first CSS allowing custom design system with bespoke palette (slate/brand teal/navy) without heavy CSS runtime. |
| **Backend Framework** | Node.js + Express.js + TypeScript | High I/O performance, asynchronous transaction handling, universal TypeScript typing across backend and client types. |
| **ORM & Persistence** | Prisma ORM 6.1 + PostgreSQL 18 | Declarative data modeling, automated schema migrations, zero SQL injection risk, native composite indexing support. |
| **Security & Auth** | JWT + Bcryptjs + Helmet + Rate Limit | Secure password hashing (cost 12), dual cookie/header token transport, DDoS/brute-force rate limiting. |
| **Testing** | Vitest 2.1 + Supertest 7.0 | Fast native ESM test runner with live PostgreSQL integration testing. |

---

## 4. Acceptance Criteria Demonstration Evidence

The assessment requires demonstrating 5 core business capabilities:

### 1. A guest can search and book an available room for valid dates
- **Implementation:** Guest specifies dates and capacity on `/search`. Available rooms are calculated in real time. Clicking "Select & Hold Room" reserves an atomic 15-minute hold, calculates pricing server-side (including configurable 12% demo tax), captures guest details, processes simulated payment, and issues a permanent confirmation receipt (`HB-YYYYMMDD-XXXX`).
- **Test Evidence:** Verified in `auth.test.ts` and `booking-concurrency.test.ts` (Test 4.1 & 4.3).

### 2. A second request cannot confirm an overlapping booking for the same room
- **Implementation:** When Guest B attempts to hold or book Room X for dates that overlap with Guest A's active hold or confirmed stay, the database transaction detects the intersection and immediately throws a `409 Conflict`.
- **Test Evidence:** Verified in `booking-concurrency.test.ts` (Test 4.2 & 4.4 - concurrent simultaneous promises).

### 3. Invalid dates, full occupancy, and cancelled bookings are handled correctly
- **Implementation:**
  - Past dates and `checkOut <= checkIn` return `400 Bad Request`.
  - When all rooms are booked, `/search` returns a clear empty state without crashing.
  - When a booking is cancelled, its status updates to `CANCELLED`, any `SUCCESS` payments are set to `REFUNDED`, and the date range is immediately released for new bookings.
- **Test Evidence:** Verified in `availability.test.ts` (Test 3.2, 3.3) and `booking-concurrency.test.ts` (Test 4.6).

### 4. Staff can check in/out a guest and view booking status
- **Implementation:** Staff members access `/staff/dashboard` to view scheduled arrivals and departures. Clicking "Check-In" updates reservation status to `CHECKED_IN` and marks the physical room as `OCCUPIED`. Clicking "Check-Out" transitions the stay to `CHECKED_OUT` and restores the room to `AVAILABLE`.
- **Test Evidence:** Verified in `operations-reporting.test.ts` (Test 5.1 & 5.2).

### 5. The admin report matches the underlying reservation data
- **Implementation:** `/api/admin/dashboard` and `/api/admin/reports/revenue` execute real aggregate queries against PostgreSQL (`prisma.payment.aggregate`, `prisma.room.count`). Gross revenue minus refunds equals net revenue.
- **Test Evidence:** Verified in `operations-reporting.test.ts` (Test 5.4 & 5.5).

---

## 5. Automated Test Suite Results

All **32 automated tests** execute against the live PostgreSQL database and pass with 100% success rate:

```text
 ✓ src/__tests__/availability.test.ts (5 tests)
 ✓ src/__tests__/booking-concurrency.test.ts (6 tests)
 ✓ src/__tests__/rbac.test.ts (7 tests)
 ✓ src/__tests__/auth.test.ts (8 tests)
 ✓ src/__tests__/operations-reporting.test.ts (6 tests)

Test Files  5 passed (5)
     Tests  32 passed (32)
  Duration  5.48s
```

---

## 6. Walkthrough Video Recording Checklist (3–5 Minutes)

When recording your submission walkthrough video, follow this recommended sequence:

| Timestamp | Phase | What to Show on Screen | Key Talking Point |
|---|---|---|---|
| **0:00 - 0:45** | **Architecture & Overview** | Terminal (`npm run build`, `npm test`) & Swagger `/api-docs` | Mention the modular monolith, PostgreSQL 18 with Prisma, and 32 passing automated tests. |
| **0:45 - 1:45** | **Guest Journey** | Homepage -> `/search` -> `/checkout` -> `/confirmation` | Demonstrate date search, 15-minute hold timer countdown, server price breakdown (tax), simulated payment, and unique booking reference generation. |
| **1:45 - 2:30** | **Concurrency & Overlap** | Open incognito window or second browser tab | Attempt to book the exact same room for overlapping dates. Show the application cleanly rejecting the conflict (HTTP 409). |
| **2:30 - 3:30** | **Front-Desk Staff Desk** | Sign in as `staff1@hotel.com` -> `/staff/dashboard` | Show the newly created reservation in Today's Arrivals. Click "Check-In" -> show room status change to OCCUPIED. Then click "Check-Out" -> show room status return to AVAILABLE. |
| **3:30 - 4:30** | **Executive Admin Suite** | Sign in as `admin@hotel.com` -> `/admin/dashboard` | Show live KPI cards, Recharts 12-month revenue chart, Room inventory manager, and immutable audit logs. |
| **4:30 - 5:00** | **Conclusion & Wrap-Up** | `docs/er-diagram.md` & `PROJECT_CONTEXT.md` | Highlight database integrity, RBAC security, and honest engineering ownership. |

---

## 7. Known Limitations & Future Enhancements

1. **Simulated Payment Sandbox:**
   - In accordance with the assignment brief, real credit card gateways (Stripe/PayPal) are simulated to prevent incurring external service fees.
2. **Email & SMS Notifications:**
   - Currently, confirmations are presented on-screen and saved to the database. An integration with Nodemailer/SendGrid would enable transactional email dispatch.
3. **Dynamic Seasonal Pricing:**
   - Room rates currently use fixed base prices per room type. A future version can introduce seasonal multiplier rules.
