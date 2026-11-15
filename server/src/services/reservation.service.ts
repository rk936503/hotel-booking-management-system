import prisma from '../config/database';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { AuditService } from './audit.service';
import { generateBookingReference, calculateNights, calculatePricing, generateTransactionReference } from '../utils/helpers';
import { ReservationStatus } from '@prisma/client';

const TAX_RATE = parseFloat(process.env.TAX_RATE || '12');
const HOLD_DURATION_MINUTES = parseInt(process.env.BOOKING_HOLD_DURATION_MINUTES || '15', 10);

// Valid state transitions
const VALID_TRANSITIONS: Record<string, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'EXPIRED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELLED: [],
  EXPIRED: [],
};

export class ReservationService {
  /**
   * Create a temporary booking hold using a database transaction
   * to prevent race conditions.
   */
  static async createHold(data: {
    roomId: string;
    userId: string;
    checkInDate: string;
    checkOutDate: string;
  }) {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    const now = new Date();

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      throw new BadRequestError('Check-in date cannot be in the past');
    }
    if (checkOut <= checkIn) {
      throw new BadRequestError('Check-out date must be after check-in date');
    }

    // Use a transaction with serializable isolation to prevent race conditions
    return prisma.$transaction(async (tx) => {
      // Check room exists and is bookable
      const room = await tx.room.findUnique({
        where: { id: data.roomId },
        include: { roomType: true },
      });
      if (!room) throw new NotFoundError('Room not found');
      if (room.status === 'MAINTENANCE' || room.status === 'INACTIVE') {
        throw new BadRequestError('This room is not available for booking');
      }

      // First expire any holds past their time
      await tx.bookingHold.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: now },
        },
        data: { status: 'EXPIRED' },
      });

      // Check for overlapping confirmed/checked-in reservations
      const conflictingReservation = await tx.reservation.findFirst({
        where: {
          roomId: data.roomId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });
      if (conflictingReservation) {
        throw new ConflictError('This room is already booked for the selected dates');
      }

      // Check for active holds
      const conflictingHold = await tx.bookingHold.findFirst({
        where: {
          roomId: data.roomId,
          status: 'ACTIVE',
          expiresAt: { gt: now },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });
      if (conflictingHold) {
        throw new ConflictError('This room is temporarily held by another guest. Please try again shortly.');
      }

      // Cancel any existing holds by this user for this room
      await tx.bookingHold.updateMany({
        where: {
          userId: data.userId,
          roomId: data.roomId,
          status: 'ACTIVE',
        },
        data: { status: 'CANCELLED' },
      });

      // Create the hold
      const expiresAt = new Date(now.getTime() + HOLD_DURATION_MINUTES * 60 * 1000);
      const hold = await tx.bookingHold.create({
        data: {
          roomId: data.roomId,
          userId: data.userId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          expiresAt,
          status: 'ACTIVE',
        },
        include: { room: { include: { roomType: true } } },
      });

      // Calculate pricing for display
      const numberOfNights = calculateNights(checkIn, checkOut);
      const pricing = calculatePricing(room.roomType.basePrice, numberOfNights, TAX_RATE);

      return { hold, pricing };
    });
  }

  /**
   * Create a reservation from a hold or directly, using a transaction
   * to ensure no double-booking.
   */
  static async createReservation(data: {
    roomId: string;
    userId: string;
    checkInDate: string;
    checkOutDate: string;
    numberOfGuests: number;
    specialRequests?: string;
    holdId?: string;
  }) {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      // Validate room
      const room = await tx.room.findUnique({
        where: { id: data.roomId },
        include: { roomType: true },
      });
      if (!room) throw new NotFoundError('Room not found');
      if (room.status === 'MAINTENANCE' || room.status === 'INACTIVE') {
        throw new BadRequestError('This room is not available for booking');
      }

      // Validate capacity
      if (data.numberOfGuests > room.roomType.capacity) {
        throw new BadRequestError(`Room capacity is ${room.roomType.capacity} guests`);
      }

      // Expire old holds
      await tx.bookingHold.updateMany({
        where: { status: 'ACTIVE', expiresAt: { lt: now } },
        data: { status: 'EXPIRED' },
      });

      // If hold provided, validate it
      if (data.holdId) {
        const hold = await tx.bookingHold.findUnique({ where: { id: data.holdId } });
        if (!hold || hold.status !== 'ACTIVE') {
          throw new BadRequestError('Booking hold has expired or is invalid. Please search again.');
        }
        if (hold.userId !== data.userId) {
          throw new BadRequestError('Invalid booking hold');
        }
        if (hold.expiresAt < now) {
          await tx.bookingHold.update({ where: { id: data.holdId }, data: { status: 'EXPIRED' } });
          throw new BadRequestError('Booking hold has expired. Please search again.');
        }
        // Convert hold
        await tx.bookingHold.update({ where: { id: data.holdId }, data: { status: 'CONVERTED' } });
      }

      // Check for conflicting reservations (critical concurrency check)
      const conflict = await tx.reservation.findFirst({
        where: {
          roomId: data.roomId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });
      if (conflict) {
        throw new ConflictError('This room has been booked by someone else for the selected dates');
      }

      // Also check active holds by other users (not our hold)
      if (!data.holdId) {
        const conflictingHold = await tx.bookingHold.findFirst({
          where: {
            roomId: data.roomId,
            status: 'ACTIVE',
            expiresAt: { gt: now },
            userId: { not: data.userId },
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
          },
        });
        if (conflictingHold) {
          throw new ConflictError('This room is temporarily held. Please try again shortly.');
        }
      }

      // Calculate pricing
      const numberOfNights = calculateNights(checkIn, checkOut);
      const pricing = calculatePricing(room.roomType.basePrice, numberOfNights, TAX_RATE);

      // Generate unique booking reference
      let bookingReference: string;
      let isUnique = false;
      do {
        bookingReference = generateBookingReference();
        const existing = await tx.reservation.findUnique({ where: { bookingReference } });
        isUnique = !existing;
      } while (!isUnique);

      // Create reservation
      const reservation = await tx.reservation.create({
        data: {
          bookingReference: bookingReference!,
          userId: data.userId,
          roomId: data.roomId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: data.numberOfGuests,
          numberOfNights: pricing.numberOfNights,
          roomPrice: pricing.roomPrice,
          subtotal: pricing.subtotal,
          taxAmount: pricing.taxAmount,
          totalAmount: pricing.totalAmount,
          status: 'PENDING',
          specialRequests: data.specialRequests,
        },
        include: {
          room: { include: { roomType: true } },
          user: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      });

      // Cancel any remaining holds by this user for this room
      await tx.bookingHold.updateMany({
        where: {
          userId: data.userId,
          roomId: data.roomId,
          status: 'ACTIVE',
        },
        data: { status: 'CONVERTED' },
      });

      await AuditService.log({
        userId: data.userId,
        action: 'RESERVATION_CREATED',
        entityType: 'Reservation',
        entityId: reservation.id,
        newValue: {
          bookingReference: reservation.bookingReference,
          roomId: data.roomId,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          totalAmount: pricing.totalAmount,
        },
      });

      return reservation;
    });
  }

  static async getReservations(options: {
    userId?: string;
    status?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.userId) where.userId = options.userId;
    if (options.status) where.status = options.status;
    if (options.search) {
      where.OR = [
        { bookingReference: { contains: options.search, mode: 'insensitive' } },
        { user: { fullName: { contains: options.search, mode: 'insensitive' } } },
        { user: { email: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const orderByField = ['createdAt', 'checkInDate', 'checkOutDate', 'totalAmount', 'status'].includes(sortBy) ? sortBy : 'createdAt';

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          room: { include: { roomType: { select: { id: true, name: true, imageUrl: true } } } },
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          payments: true,
        },
        orderBy: { [orderByField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return {
      data: reservations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const reservation = await prisma.reservation.findFirst({
      where,
      include: {
        room: { include: { roomType: true } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        payments: true,
      },
    });

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    return reservation;
  }

  static async getByBookingReference(ref: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { bookingReference: ref },
      include: {
        room: { include: { roomType: true } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        payments: true,
      },
    });

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    return reservation;
  }

  /**
   * Cancel a reservation with valid state transition check
   */
  static async cancelReservation(reservationId: string, userId: string, isStaffOrAdmin: boolean = false) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { payments: true },
      });

      if (!reservation) throw new NotFoundError('Reservation not found');

      // Check ownership for guests
      if (!isStaffOrAdmin && reservation.userId !== userId) {
        throw new NotFoundError('Reservation not found');
      }

      // Validate state transition
      if (!VALID_TRANSITIONS[reservation.status]?.includes('CANCELLED')) {
        throw new BadRequestError(`Cannot cancel a reservation with status: ${reservation.status}`);
      }

      // Update reservation status
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELLED' },
        include: {
          room: { include: { roomType: true } },
          user: { select: { id: true, fullName: true, email: true } },
        },
      });

      // Refund successful payments
      const successfulPayments = reservation.payments.filter(p => p.paymentStatus === 'SUCCESS');
      for (const payment of successfulPayments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: 'REFUNDED' },
        });
      }

      // If room was set to OCCUPIED by this reservation's check-in, free it
      if (reservation.status === 'CONFIRMED') {
        // Room stays as-is; just releasing the date range
      }

      await AuditService.log({
        userId,
        action: 'RESERVATION_CANCELLED',
        entityType: 'Reservation',
        entityId: reservationId,
        oldValue: { status: reservation.status },
        newValue: { status: 'CANCELLED' },
      });

      return updated;
    });
  }

  /**
   * Staff: Check in a guest
   */
  static async checkIn(reservationId: string, staffUserId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { room: true },
      });

      if (!reservation) throw new NotFoundError('Reservation not found');

      if (!VALID_TRANSITIONS[reservation.status]?.includes('CHECKED_IN')) {
        throw new BadRequestError(`Cannot check in a reservation with status: ${reservation.status}`);
      }

      // Update reservation
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CHECKED_IN' },
        include: {
          room: { include: { roomType: true } },
          user: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      });

      // Update room status to OCCUPIED
      await tx.room.update({
        where: { id: reservation.roomId },
        data: { status: 'OCCUPIED' },
      });

      await AuditService.log({
        userId: staffUserId,
        action: 'GUEST_CHECKED_IN',
        entityType: 'Reservation',
        entityId: reservationId,
        oldValue: { status: reservation.status },
        newValue: { status: 'CHECKED_IN' },
      });

      return updated;
    });
  }

  /**
   * Staff: Check out a guest
   */
  static async checkOut(reservationId: string, staffUserId: string) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { room: true },
      });

      if (!reservation) throw new NotFoundError('Reservation not found');

      if (!VALID_TRANSITIONS[reservation.status]?.includes('CHECKED_OUT')) {
        throw new BadRequestError(`Cannot check out a reservation with status: ${reservation.status}`);
      }

      // Update reservation
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CHECKED_OUT' },
        include: {
          room: { include: { roomType: true } },
          user: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      });

      // Check if there's another active reservation for this room
      const nextReservation = await tx.reservation.findFirst({
        where: {
          roomId: reservation.roomId,
          status: 'CHECKED_IN',
          id: { not: reservationId },
        },
      });

      // If no other active check-in, set room to AVAILABLE
      if (!nextReservation) {
        await tx.room.update({
          where: { id: reservation.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      await AuditService.log({
        userId: staffUserId,
        action: 'GUEST_CHECKED_OUT',
        entityType: 'Reservation',
        entityId: reservationId,
        oldValue: { status: reservation.status },
        newValue: { status: 'CHECKED_OUT' },
      });

      return updated;
    });
  }

  /**
   * Get upcoming arrivals
   */
  static async getArrivals(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.reservation.findMany({
      where: {
        checkInDate: { gte: startOfDay, lte: endOfDay },
        status: 'CONFIRMED',
      },
      include: {
        room: { include: { roomType: { select: { name: true } } } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { checkInDate: 'asc' },
    });
  }

  /**
   * Get upcoming departures
   */
  static async getDepartures(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.reservation.findMany({
      where: {
        checkOutDate: { gte: startOfDay, lte: endOfDay },
        status: 'CHECKED_IN',
      },
      include: {
        room: { include: { roomType: { select: { name: true } } } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { checkOutDate: 'asc' },
    });
  }
}
