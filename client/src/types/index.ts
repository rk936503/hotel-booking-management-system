export type UserRole = 'GUEST' | 'STAFF' | 'ADMIN';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type HoldStatus = 'ACTIVE' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  capacity: number;
  amenities: string[];
  imageUrl?: string | null;
  createdAt?: string;
  _count?: { rooms: number };
}

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  status: RoomStatus;
  createdAt: string;
  roomType: RoomType;
}

export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  transactionReference: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  bookingReference: string;
  userId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfNights: number;
  roomPrice: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: ReservationStatus;
  specialRequests?: string | null;
  createdAt: string;
  room: Room;
  user?: User;
  payments?: Payment[];
}

export interface BookingHold {
  id: string;
  roomId: string;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  expiresAt: string;
  status: HoldStatus;
  room?: Room;
}

export interface PricingBreakdown {
  roomPrice: number;
  numberOfNights: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface DashboardStats {
  rooms: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    occupancyRate: number;
  };
  reservations: {
    total: number;
    confirmed: number;
    checkedIn: number;
    todayArrivals: number;
    todayDepartures: number;
  };
  revenue: {
    total: number;
    monthly: Array<{ month: string; revenue: number }>;
  };
  recentReservations: Reservation[];
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: { id: string; fullName: string; email: string; role: string } | null;
}
