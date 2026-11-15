import { Router } from 'express';
import { AvailabilityController } from '../controllers/availability.controller';

const router = Router();

/**
 * @swagger
 * /api/availability:
 *   get:
 *     tags: [Availability]
 *     summary: Search available rooms
 *     parameters:
 *       - in: query
 *         name: checkInDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: checkOutDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: guests
 *         schema: { type: integer }
 *       - in: query
 *         name: roomTypeId
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of available rooms }
 *       400: { description: Invalid date range }
 */
router.get('/', AvailabilityController.search);

export default router;
