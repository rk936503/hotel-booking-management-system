import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

const router = Router();

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user details (for staff/admin guest lookup)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        reservations: {
          select: {
            id: true,
            bookingReference: true,
            checkInDate: true,
            checkOutDate: true,
            status: true,
            totalAmount: true,
            room: { select: { roomNumber: true, roomType: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) throw new NotFoundError('User not found');

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
