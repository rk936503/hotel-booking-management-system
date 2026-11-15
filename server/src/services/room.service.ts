import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { AuditService } from './audit.service';
import { parsePagination } from '../utils/helpers';

export class RoomService {
  static async getAll(query: { page?: string; limit?: string; status?: string; roomTypeId?: string; floor?: string; sortBy?: string; sortOrder?: string }) {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.roomTypeId) where.roomTypeId = query.roomTypeId;
    if (query.floor) where.floor = parseInt(query.floor, 10);

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        include: {
          roomType: {
            select: { id: true, name: true, basePrice: true, capacity: true, amenities: true, imageUrl: true },
          },
        },
        orderBy: { [sortBy === 'roomNumber' ? 'roomNumber' : sortBy === 'floor' ? 'floor' : 'createdAt']: sortOrder },
        skip,
        take: limit,
      }),
      prisma.room.count({ where }),
    ]);

    return {
      data: rooms,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        roomType: true,
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          orderBy: { checkInDate: 'asc' },
          take: 5,
          select: {
            id: true,
            bookingReference: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return room;
  }

  static async create(data: { roomNumber: string; roomTypeId: string; floor: number; status?: string }, userId: string) {
    // Verify room type exists
    const roomType = await prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
    if (!roomType) {
      throw new NotFoundError('Room type not found');
    }

    // Check for duplicate room number
    const existing = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
    if (existing) {
      throw new ConflictError('A room with this number already exists');
    }

    const room = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        roomTypeId: data.roomTypeId,
        floor: data.floor,
        status: (data.status as any) || 'AVAILABLE',
      },
      include: { roomType: true },
    });

    await AuditService.log({
      userId,
      action: 'ROOM_CREATED',
      entityType: 'Room',
      entityId: room.id,
      newValue: data,
    });

    return room;
  }

  static async update(id: string, data: Partial<{ roomNumber: string; roomTypeId: string; floor: number; status: string }>, userId: string) {
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Room not found');
    }

    if (data.roomNumber && data.roomNumber !== existing.roomNumber) {
      const duplicate = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
      if (duplicate) {
        throw new ConflictError('A room with this number already exists');
      }
    }

    if (data.roomTypeId) {
      const roomType = await prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
      if (!roomType) {
        throw new NotFoundError('Room type not found');
      }
    }

    // If setting to INACTIVE, check for active reservations
    if (data.status === 'INACTIVE' || data.status === 'MAINTENANCE') {
      const activeReservations = await prisma.reservation.count({
        where: {
          roomId: id,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkOutDate: { gte: new Date() },
        },
      });
      if (activeReservations > 0) {
        throw new BadRequestError('Cannot set room to ' + data.status + ' - there are active reservations');
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: data as any,
      include: { roomType: true },
    });

    await AuditService.log({
      userId,
      action: 'ROOM_UPDATED',
      entityType: 'Room',
      entityId: id,
      oldValue: existing,
      newValue: data,
    });

    return room;
  }

  static async delete(id: string, userId: string) {
    const existing = await prisma.room.findUnique({
      where: { id },
      include: { _count: { select: { reservations: true } } },
    });
    if (!existing) {
      throw new NotFoundError('Room not found');
    }

    if (existing._count.reservations > 0) {
      throw new BadRequestError('Cannot delete room with existing reservations');
    }

    await prisma.room.delete({ where: { id } });

    await AuditService.log({
      userId,
      action: 'ROOM_DELETED',
      entityType: 'Room',
      entityId: id,
      oldValue: existing,
    });

    return { message: 'Room deleted successfully' };
  }
}
