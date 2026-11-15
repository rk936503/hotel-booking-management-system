import prisma from '../config/database';
import { BadRequestError } from '../utils/errors';

export class AvailabilityService {
  /**
   * Search for available rooms based on date range, guest count, and room type.
   * A room is considered unavailable if it has:
   * - A CONFIRMED or CHECKED_IN reservation overlapping the requested dates
   * - An ACTIVE, non-expired booking hold overlapping the requested dates
   * - Room status is MAINTENANCE or INACTIVE
   * 
   * Overlap condition (half-open interval [checkIn, checkOut)):
   *   existing.checkInDate < requested.checkOutDate AND
   *   existing.checkOutDate > requested.checkInDate
   */
  static async searchAvailability(params: {
    checkInDate: string;
    checkOutDate: string;
    guests?: number;
    roomTypeId?: string;
  }) {
    const checkIn = new Date(params.checkInDate);
    const checkOut = new Date(params.checkOutDate);
    const now = new Date();

    // Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
      throw new BadRequestError('Check-in date cannot be in the past');
    }

    if (checkOut <= checkIn) {
      throw new BadRequestError('Check-out date must be after check-in date');
    }

    // Build the query to find rooms that DO NOT have overlapping reservations
    const where: any = {
      status: { in: ['AVAILABLE', 'OCCUPIED'] }, // Occupied rooms can be booked for future dates
      // Exclude rooms with overlapping confirmed/checked-in reservations
      NOT: {
        OR: [
          {
            reservations: {
              some: {
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                checkInDate: { lt: checkOut },
                checkOutDate: { gt: checkIn },
              },
            },
          },
          {
            bookingHolds: {
              some: {
                status: 'ACTIVE',
                expiresAt: { gt: now },
                checkInDate: { lt: checkOut },
                checkOutDate: { gt: checkIn },
              },
            },
          },
        ],
      },
    };

    // Filter by room type
    if (params.roomTypeId) {
      where.roomTypeId = params.roomTypeId;
    }

    // Filter by capacity
    if (params.guests) {
      where.roomType = {
        capacity: { gte: parseInt(params.guests as any, 10) },
      };
    }

    // Exclude MAINTENANCE and INACTIVE rooms
    where.status = { notIn: ['MAINTENANCE', 'INACTIVE'] };

    const rooms = await prisma.room.findMany({
      where,
      include: {
        roomType: true,
      },
      orderBy: [
        { roomType: { basePrice: 'asc' } },
        { roomNumber: 'asc' },
      ],
    });

    // Filter out rooms that actually have conflicts (double-check with explicit query)
    // This handles the edge case where NOT + OR might not filter correctly
    const roomIds = rooms.map(r => r.id);
    
    const conflictingRoomIds = await prisma.reservation.findMany({
      where: {
        roomId: { in: roomIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
      select: { roomId: true },
    });

    const conflictingHoldRoomIds = await prisma.bookingHold.findMany({
      where: {
        roomId: { in: roomIds },
        status: 'ACTIVE',
        expiresAt: { gt: now },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
      select: { roomId: true },
    });

    const blockedIds = new Set([
      ...conflictingRoomIds.map(r => r.roomId),
      ...conflictingHoldRoomIds.map(r => r.roomId),
    ]);

    const availableRooms = rooms.filter(r => !blockedIds.has(r.id));

    return availableRooms;
  }

  /**
   * Check if a specific room is available for a date range
   */
  static async isRoomAvailable(roomId: string, checkIn: Date, checkOut: Date, excludeReservationId?: string): Promise<boolean> {
    const now = new Date();
    
    const conflictWhere: any = {
      roomId,
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    };

    if (excludeReservationId) {
      conflictWhere.id = { not: excludeReservationId };
    }

    const conflictingReservation = await prisma.reservation.findFirst({
      where: conflictWhere,
    });

    if (conflictingReservation) return false;

    // Check active holds
    const conflictingHold = await prisma.bookingHold.findFirst({
      where: {
        roomId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });

    if (conflictingHold) return false;

    // Check room status
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.status === 'MAINTENANCE' || room.status === 'INACTIVE') {
      return false;
    }

    return true;
  }
}
