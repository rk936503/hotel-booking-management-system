import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/staff/reservations/{id}/check-in:
 *   patch:
 *     tags: [Staff Operations]
 *     summary: Check in a guest (Staff/Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/reservations/:id/check-in', authenticate, authorize('STAFF', 'ADMIN'), StaffController.checkIn);

/**
 * @swagger
 * /api/staff/reservations/{id}/check-out:
 *   patch:
 *     tags: [Staff Operations]
 *     summary: Check out a guest (Staff/Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/reservations/:id/check-out', authenticate, authorize('STAFF', 'ADMIN'), StaffController.checkOut);

/**
 * @swagger
 * /api/staff/arrivals:
 *   get:
 *     tags: [Staff Operations]
 *     summary: Get today's arrivals (Staff/Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/arrivals', authenticate, authorize('STAFF', 'ADMIN'), StaffController.getArrivals);

/**
 * @swagger
 * /api/staff/departures:
 *   get:
 *     tags: [Staff Operations]
 *     summary: Get today's departures (Staff/Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/departures', authenticate, authorize('STAFF', 'ADMIN'), StaffController.getDepartures);

export default router;
