import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { simulatePaymentSchema } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/payments/simulate:
 *   post:
 *     tags: [Payments]
 *     summary: Simulate a payment for a reservation
 *     security: [{ bearerAuth: [] }]
 */
router.post('/simulate', authenticate, validateBody(simulatePaymentSchema), PaymentController.simulate);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', authenticate, PaymentController.getById);

export default router;
