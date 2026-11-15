import { Router } from 'express';
import { RoomTypeController } from '../controllers/roomType.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { roomTypeSchema, updateRoomTypeSchema } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/room-types:
 *   get:
 *     tags: [Room Types]
 *     summary: Get all room types
 *     responses:
 *       200: { description: List of room types }
 */
router.get('/', RoomTypeController.getAll);

/**
 * @swagger
 * /api/room-types/{id}:
 *   get:
 *     tags: [Room Types]
 *     summary: Get room type by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Room type details }
 *       404: { description: Not found }
 */
router.get('/:id', RoomTypeController.getById);

/**
 * @swagger
 * /api/room-types:
 *   post:
 *     tags: [Room Types]
 *     summary: Create a new room type (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, authorize('ADMIN'), validateBody(roomTypeSchema), RoomTypeController.create);

/**
 * @swagger
 * /api/room-types/{id}:
 *   patch:
 *     tags: [Room Types]
 *     summary: Update a room type (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id', authenticate, authorize('ADMIN'), validateBody(updateRoomTypeSchema), RoomTypeController.update);

/**
 * @swagger
 * /api/room-types/{id}:
 *   delete:
 *     tags: [Room Types]
 *     summary: Delete a room type (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', authenticate, authorize('ADMIN'), RoomTypeController.delete);

export default router;
