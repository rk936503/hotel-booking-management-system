import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: Get audit logs (Admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: entityType
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 */
router.get('/', authenticate, authorize('ADMIN'), AuditController.getAll);

export default router;
