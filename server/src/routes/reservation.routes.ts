import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createHoldSchema, createReservationSchema } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/reservations/holds:
 *   post:
 *     tags: [Reservations]
 *     summary: Create a temporary booking hold
 *     security: [{ bearerAuth: [] }]
 */
router.post('/holds', authenticate, validateBody(createHoldSchema), ReservationController.createHold);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     tags: [Reservations]
 *     summary: Create a reservation
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, validateBody(createReservationSchema), ReservationController.create);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     tags: [Reservations]
 *     summary: Get reservations (guests see own, staff/admin see all)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', authenticate, ReservationController.getAll);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     tags: [Reservations]
 *     summary: Get reservation by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', authenticate, ReservationController.getById);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   patch:
 *     tags: [Reservations]
 *     summary: Cancel a reservation
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/cancel', authenticate, ReservationController.cancel);

export default router;
