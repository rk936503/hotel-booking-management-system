import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new guest account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               phone: { type: string }
 *     responses:
 *       201: { description: User registered successfully }
 *       400: { description: Validation error or user exists }
 */
router.post('/register', authLimiter, validateBody(registerSchema), AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout and clear token cookie
 *     responses:
 *       200: { description: Logged out successfully }
 */
router.post('/logout', AuthController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile }
 *       401: { description: Not authenticated }
 */
router.get('/me', authenticate, AuthController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     tags: [Authentication]
 *     summary: Update profile
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/profile', authenticate, validateBody(updateProfileSchema), AuthController.updateProfile);

export default router;
