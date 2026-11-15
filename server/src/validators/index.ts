import { z } from 'zod';

// Auth validators
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Room Type validators
export const roomTypeSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(1000),
  basePrice: z.number().positive('Price must be positive'),
  capacity: z.number().int().min(1).max(20),
  amenities: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
});

export const updateRoomTypeSchema = roomTypeSchema.partial();

// Room validators
export const roomSchema = z.object({
  roomNumber: z.string().min(1).max(10),
  roomTypeId: z.string().uuid(),
  floor: z.number().int().min(0).max(100),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'INACTIVE']).optional(),
});

export const updateRoomSchema = roomSchema.partial();

// Availability search validators
export const availabilitySearchSchema = z.object({
  checkInDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOutDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
  guests: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  roomTypeId: z.string().uuid().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  return checkOut > checkIn;
}, { message: 'Check-out date must be after check-in date', path: ['checkOutDate'] });

// Reservation validators
export const createHoldSchema = z.object({
  roomId: z.string().uuid(),
  checkInDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOutDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
});

export const createReservationSchema = z.object({
  roomId: z.string().uuid(),
  checkInDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOutDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
  numberOfGuests: z.number().int().min(1),
  specialRequests: z.string().max(500).optional(),
  holdId: z.string().uuid().optional(),
});

// Payment validators
export const simulatePaymentSchema = z.object({
  reservationId: z.string().uuid(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'UPI']).default('CREDIT_CARD'),
});

// Report validators
export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// User profile validators
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['GUEST', 'STAFF', 'ADMIN']),
});
