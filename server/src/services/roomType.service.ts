import prisma from '../config/database';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { AuditService } from './audit.service';

export class RoomTypeService {
  static async getAll() {
    return prisma.roomType.findMany({
      include: {
        _count: { select: { rooms: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            status: true,
          },
        },
        _count: { select: { rooms: true } },
      },
    });

    if (!roomType) {
      throw new NotFoundError('Room type not found');
    }

    return roomType;
  }

  static async create(data: {
    name: string;
    description: string;
    basePrice: number;
    capacity: number;
    amenities?: string[];
    imageUrl?: string;
  }, userId: string) {
    const existing = await prisma.roomType.findUnique({ where: { name: data.name } });
    if (existing) {
      throw new ConflictError('A room type with this name already exists');
    }

    const roomType = await prisma.roomType.create({ data });

    await AuditService.log({
      userId,
      action: 'ROOM_TYPE_CREATED',
      entityType: 'RoomType',
      entityId: roomType.id,
      newValue: data,
    });

    return roomType;
  }

  static async update(id: string, data: Partial<{
    name: string;
    description: string;
    basePrice: number;
    capacity: number;
    amenities: string[];
    imageUrl: string;
  }>, userId: string) {
    const existing = await prisma.roomType.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Room type not found');
    }

    if (data.name && data.name !== existing.name) {
      const nameCheck = await prisma.roomType.findUnique({ where: { name: data.name } });
      if (nameCheck) {
        throw new ConflictError('A room type with this name already exists');
      }
    }

    const roomType = await prisma.roomType.update({
      where: { id },
      data,
    });

    await AuditService.log({
      userId,
      action: 'ROOM_TYPE_UPDATED',
      entityType: 'RoomType',
      entityId: id,
      oldValue: existing,
      newValue: data,
    });

    return roomType;
  }

  static async delete(id: string, userId: string) {
    const existing = await prisma.roomType.findUnique({
      where: { id },
      include: { _count: { select: { rooms: true } } },
    });
    if (!existing) {
      throw new NotFoundError('Room type not found');
    }

    if (existing._count.rooms > 0) {
      throw new BadRequestError('Cannot delete room type with existing rooms. Remove rooms first.');
    }

    await prisma.roomType.delete({ where: { id } });

    await AuditService.log({
      userId,
      action: 'ROOM_TYPE_DELETED',
      entityType: 'RoomType',
      entityId: id,
      oldValue: existing,
    });

    return { message: 'Room type deleted successfully' };
  }
}
