import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique booking reference
 * Format: HB-YYYYMMDD-XXXX (e.g., HB-20241215-A3F7)
 */
export function generateBookingReference(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = uuidv4().slice(0, 4).toUpperCase();
  return `HB-${dateStr}-${random}`;
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate pricing breakdown
 */
export function calculatePricing(nightlyRate: number, numberOfNights: number, taxRate: number = 12) {
  const subtotal = nightlyRate * numberOfNights;
  const taxAmount = Math.round((subtotal * taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    roomPrice: nightlyRate,
    numberOfNights,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
  };
}

/**
 * Generate a simulated transaction reference
 */
export function generateTransactionReference(): string {
  return `TXN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

/**
 * Parse pagination parameters
 */
export function parsePagination(query: { page?: string; limit?: string; sortBy?: string; sortOrder?: string }) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = (query.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  return { page, limit, skip: (page - 1) * limit, sortBy, sortOrder };
}
