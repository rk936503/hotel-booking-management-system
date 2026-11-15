import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { roomSchema, updateRoomSchema } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all rooms with pagination and filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [AVAILABLE, OCCUPIED, MAINTENANCE, INACTIVE] }
 *       - in: query
 *         name: roomTypeId
 *         schema: { type: string }
 *       - in: query
 *         name: floor
 *         schema: { type: integer }
 */
router.get('/', RoomController.getAll);

/**
 * @swagger
 * /api/rooms/{id}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room by ID
 */
router.get('/:id', RoomController.getById);

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a new room (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, authorize('ADMIN'), validateBody(roomSchema), RoomController.create);

/**
 * @swagger
 * /api/rooms/{id}:
 *   patch:
 *     tags: [Rooms]
 *     summary: Update a room (Admin/Staff)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id', authenticate, authorize('ADMIN', 'STAFF'), validateBody(updateRoomSchema), RoomController.update);

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete a room (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', authenticate, authorize('ADMIN'), RoomController.delete);

export default router;
