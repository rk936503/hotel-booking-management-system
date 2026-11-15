# Entity Relationship (ER) Diagram

This document illustrates the normalized relational database schema designed for the Hotel Booking Management System using PostgreSQL and Prisma ORM.

## Mermaid ER Diagram

```mermaid
erDiagram
    User ||--o{ Reservation : "places"
    User ||--o{ BookingHold : "holds"
    User ||--o{ AuditLog : "initiates"
    RoomType ||--o{ Room : "categorizes"
    Room ||--o{ Reservation : "allocated to"
    Room ||--o{ BookingHold : "reserved in"
    Reservation ||--o{ Payment : "settled via"

    User {
        string id PK "UUID"
        string fullName "Full legal name"
        string email UK "Unique email address"
        string passwordHash "Bcrypt hash (cost 12)"
        string phone "Contact telephone"
        UserRole role "GUEST | STAFF | ADMIN"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    RoomType {
        string id PK "UUID"
        string name UK "Unique category name"
        string description "Text description"
        float basePrice "Nightly rate"
        int capacity "Max guest limit"
        string[] amenities "Array of amenity tags"
        string imageUrl "Cover photo URL"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    Room {
        string id PK "UUID"
        string roomNumber UK "Unique room identifier"
        string roomTypeId FK "References RoomType(id)"
        int floor "Building floor number"
        RoomStatus status "AVAILABLE | OCCUPIED | MAINTENANCE | INACTIVE"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    Reservation {
        string id PK "UUID"
        string bookingReference UK "HB-YYYYMMDD-XXXX"
        string userId FK "References User(id)"
        string roomId FK "References Room(id)"
        datetime checkInDate "Start of stay"
        datetime checkOutDate "Departure date"
        int numberOfGuests "Guest count"
        int numberOfNights "Duration in nights"
        float roomPrice "Rate locked at booking"
        float subtotal "Nightly rate * nights"
        float taxAmount "Configurable demo tax (12%)"
        float totalAmount "Subtotal + tax"
        ReservationStatus status "PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED | EXPIRED"
        string specialRequests "Optional guest requests"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    Payment {
        string id PK "UUID"
        string reservationId FK "References Reservation(id)"
        float amount "Transaction currency amount"
        string paymentMethod "CREDIT_CARD | DEBIT_CARD | NET_BANKING | UPI"
        PaymentStatus paymentStatus "PENDING | SUCCESS | FAILED | REFUNDED"
        string transactionReference UK "TXN-Timestamp-UUID"
        datetime createdAt "Timestamp"
    }

    BookingHold {
        string id PK "UUID"
        string roomId FK "References Room(id)"
        string userId FK "References User(id)"
        datetime checkInDate "Hold start"
        datetime checkOutDate "Hold departure"
        datetime expiresAt "Active hold deadline (NOW + 15m)"
        HoldStatus status "ACTIVE | EXPIRED | CONVERTED | CANCELLED"
        datetime createdAt "Timestamp"
    }

    AuditLog {
        string id PK "UUID"
        string userId FK "Nullable actor reference"
        string action "USER_REGISTERED | RESERVATION_CREATED | etc."
        string entityType "Domain entity name"
        string entityId "Target entity UUID"
        text oldValue "Pre-mutation JSON state"
        text newValue "Post-mutation JSON state"
        datetime createdAt "Timestamp"
    }
```

---

## Schema Indices and Performance Optimizations

| Table | Index Columns | Index Purpose |
|---|---|---|
| `User` | `email` | Fast O(1) user lookup during login authentication |
| `User` | `role` | Filtered directory queries for staff/admin management |
| `RoomType` | `name` | Quick category lookups and unique constraint enforcement |
| `Room` | `roomNumber` | Direct room identity verification |
| `Room` | `roomTypeId` | Fast join query when loading rooms by category |
| `Room` | `status` | Rapid filtering of available rooms in the search engine |
| `Reservation` | `bookingReference` | O(1) human-readable reference resolution on arrival |
| `Reservation` | `userId` | Immediate listing of guest personal booking history |
| `Reservation` | `roomId` | Join index for room reservation lookups |
| `Reservation` | `status` | Operational queries (all CONFIRMED or CHECKED_IN stays) |
| `Reservation` | `checkInDate`, `checkOutDate` | B-tree index for date-range overlap scans |
| `Reservation` | `[roomId, checkInDate, checkOutDate]` | **Composite Index:** Eliminates table scans during critical double-booking concurrency checks |
| `Payment` | `reservationId` | Fast payment ledger retrieval for receipts and refunds |
| `Payment` | `paymentStatus` | Financial aggregations and dashboard revenue calculation |
| `BookingHold` | `expiresAt` | Quick cleanup of stale holds during background queries |
| `AuditLog` | `createdAt`, `action`, `entityType` | Filtered audit history retrieval by time and action |
