# API Documentation: Hotel Booking Management System

The Hotel Booking API is a fully documented RESTful service with interactive OpenAPI 3.0 documentation available via **Swagger UI** at:
`http://localhost:5000/api-docs`

---

## 1. Authentication & Security Headers

For all protected routes, include the JWT token either in an HTTP-only cookie named `token` or via the standard Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

### Central Error Response Schema
All error responses adhere to a consistent JSON structure:
```json
{
  "success": false,
  "error": "Error description message",
  "details": [
    {
      "field": "checkOutDate",
      "message": "Check-out date must be after check-in date"
    }
  ]
}
```

---

## 2. API Endpoints Reference

### Authentication (`/api/auth`)

#### `POST /api/auth/register`
Creates a new guest profile and returns an authentication session.
- **Access:** Public
- **Rate Limit:** 20 requests / 15 minutes
- **Request Body:**
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "phone": "+1-555-0199"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "role": "GUEST"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### `POST /api/auth/login`
Authenticates user credentials and issues a JWT token.
- **Access:** Public
- **Request Body:** `{"email": "admin@hotel.com", "password": "Password123!"}`
- **Response (200 OK):** User payload, JWT token, and sets `token` HTTP-only cookie.

#### `GET /api/auth/me`
Retrieves current authenticated user profile.
- **Access:** Authenticated (Any role)

---

### Room Catalog & Inventory (`/api/room-types`, `/api/rooms`)

#### `GET /api/room-types`
Lists all room categories with base price, capacity, and amenities.
- **Access:** Public

#### `POST /api/room-types`
Creates a new room category.
- **Access:** Admin only
- **Request Body:**
  ```json
  {
    "name": "Ocean Penthouse",
    "description": "Panoramic penthouse suite with private terrace.",
    "basePrice": 399.99,
    "capacity": 4,
    "amenities": ["Wi-Fi", "Jacuzzi", "Private Terrace", "Butler Service"]
  }
  ```

#### `GET /api/rooms`
Paginated search for physical rooms.
- **Access:** Public
- **Query Parameters:** `page`, `limit`, `status`, `floor`, `roomTypeId`

#### `POST /api/rooms`
Adds an individual room into physical inventory.
- **Access:** Admin only
- **Request Body:** `{"roomNumber": "503", "floor": 5, "roomTypeId": "uuid"}`

#### `PATCH /api/rooms/:id`
Updates room housekeeping status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `INACTIVE`).
- **Access:** Staff or Admin

---

### Availability Search (`/api/availability`)

#### `GET /api/availability`
Calculates available rooms for a given date range using half-open interval overlap detection.
- **Access:** Public
- **Query Parameters:**
  - `checkInDate` (required, `YYYY-MM-DD`): Must not be in the past.
  - `checkOutDate` (required, `YYYY-MM-DD`): Must be strictly after `checkInDate`.
  - `guests` (optional, integer): Filters rooms where `capacity >= guests`.
  - `roomTypeId` (optional, UUID): Filters by category.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "roomNumber": "101",
        "floor": 1,
        "status": "AVAILABLE",
        "roomType": {
          "id": "uuid",
          "name": "Standard Single",
          "basePrice": 99.99,
          "capacity": 1,
          "amenities": ["Wi-Fi", "TV", "Air Conditioning"]
        }
      }
    ]
  }
  ```

---

### Reservations & Booking Workflow (`/api/reservations`)

#### `POST /api/reservations/holds`
Places an atomic 15-minute temporary hold on a room.
- **Access:** Authenticated (Any role)
- **Request Body:**
  ```json
  {
    "roomId": "uuid",
    "checkInDate": "2026-12-01",
    "checkOutDate": "2026-12-04"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "hold": {
        "id": "uuid",
        "roomId": "uuid",
        "expiresAt": "2026-11-15T10:15:00.000Z",
        "status": "ACTIVE"
      },
      "pricing": {
        "roomPrice": 99.99,
        "numberOfNights": 3,
        "subtotal": 299.97,
        "taxRate": 12,
        "taxAmount": 36.00,
        "totalAmount": 335.97
      }
    }
  }
  ```

#### `POST /api/reservations`
Creates a pending reservation from an active hold.
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "roomId": "uuid",
    "checkInDate": "2026-12-01",
    "checkOutDate": "2026-12-04",
    "numberOfGuests": 1,
    "holdId": "uuid"
  }
  ```
- **Response (201 Created):** Generates unique human-readable code: `"HB-20261115-XXXX"` with status `"PENDING"`.

#### `PATCH /api/reservations/:id/cancel`
Cancels an existing reservation and triggers automatic refund of all associated successful payments.
- **Access:** Authenticated (Reservation owner, Staff, or Admin)

---

### Payments Sandbox (`/api/payments`)

#### `POST /api/payments/simulate`
Simulates a transaction and confirms a `PENDING` reservation.
- **Access:** Authenticated (Reservation owner)
- **Request Body:**
  ```json
  {
    "reservationId": "uuid",
    "paymentMethod": "CREDIT_CARD"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "payment": {
        "id": "uuid",
        "amount": 335.97,
        "paymentStatus": "SUCCESS",
        "transactionReference": "TXN-1794733479403-E1D2FDC3"
      },
      "reservation": {
        "id": "uuid",
        "status": "CONFIRMED"
      }
    }
  }
  ```

---

### Staff Front Desk Operations (`/api/staff`)

#### `PATCH /api/staff/reservations/:id/check-in`
Performs guest arrival check-in.
- **State Transition:** `CONFIRMED` -> `CHECKED_IN`
- **Side Effect:** Automatically sets room status to `OCCUPIED`.
- **Access:** Staff or Admin

#### `PATCH /api/staff/reservations/:id/check-out`
Performs guest departure check-out.
- **State Transition:** `CHECKED_IN` -> `CHECKED_OUT`
- **Side Effect:** Automatically restores room status to `AVAILABLE` (if no other active stay).
- **Access:** Staff or Admin

#### `GET /api/staff/arrivals`
Retrieves all confirmed reservations scheduled to arrive today.
- **Access:** Staff or Admin

#### `GET /api/staff/departures`
Retrieves all checked-in reservations scheduled to depart today.
- **Access:** Staff or Admin

---

### Admin Business Intelligence & Reports (`/api/admin`)

#### `GET /api/admin/dashboard`
Returns live operational summary metrics:
- Room inventory breakdown (total, available, occupied, maintenance).
- Live occupancy percentage (`occupied / total * 100`).
- Today's arrivals and departures counts.
- Total accumulated revenue and 12-month rolling trend.
- Recent 10 reservations.
- **Access:** Admin only

#### `GET /api/admin/reports/revenue?startDate=...&endDate=...`
Date-bounded financial report calculating:
- Gross revenue from `SUCCESS` payments.
- Total refund deductions from `REFUNDED` payments.
- Net revenue (`Gross - Refunds`).
- Individual transaction line items.
- **Access:** Admin only

#### `GET /api/admin/reports/occupancy?startDate=...&endDate=...`
Daily occupancy percentage calculations over the selected interval.
- **Access:** Admin only

#### `PATCH /api/admin/users/:id/role`
Promotes or demotes user account authorization (`GUEST`, `STAFF`, `ADMIN`).
- **Access:** Admin only

#### `GET /api/audit-logs`
Paginated query of immutable security and business event audit logs.
- **Access:** Admin only
