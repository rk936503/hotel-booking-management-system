import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { updateUserRoleSchema } from '../validators';

const router = Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', authenticate, authorize('ADMIN'), AdminController.getDashboard);

/**
 * @swagger
 * /api/admin/reports/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get revenue report (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/reports/revenue', authenticate, authorize('ADMIN'), AdminController.getRevenueReport);

/**
 * @swagger
 * /api/admin/reports/occupancy:
 *   get:
 *     tags: [Admin]
 *     summary: Get occupancy report (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/reports/occupancy', authenticate, authorize('ADMIN'), AdminController.getOccupancyReport);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/users', authenticate, authorize('ADMIN'), AdminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user role (Admin only)
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/users/:id/role', authenticate, authorize('ADMIN'), validateBody(updateUserRoleSchema), AdminController.updateUserRole);

export default router;
