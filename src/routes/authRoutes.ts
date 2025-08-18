import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  deleteAccount,
} from '../controllers/authController';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  connectCalendar,
  getCalendarEvents,
} from '../controllers/googleAuthController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { authSchemas } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: User already exists
 */
router.post('/register', authLimiter, validateBody(authSchemas.register), register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, validateBody(authSchemas.login), login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validateBody(authSchemas.refreshToken), refreshToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, logout);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     tags: [Authentication]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @swagger
 * /api/v1/auth/delete-account:
 *   delete:
 *     tags: [Authentication]
 *     summary: Permanently delete the authenticated user's account and associated data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/delete-account', authenticate, deleteAccount);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     tags: [Authentication]
 *     summary: Get Google OAuth URL
 *     responses:
 *       200:
 *         description: Google OAuth URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.get('/google', getGoogleAuthUrl);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: Google OAuth callback
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Google OAuth authentication successful
 */
router.get('/google/callback', handleGoogleCallback);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   post:
 *     tags: [Authentication]
 *     summary: Google OAuth callback (mobile)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google OAuth authentication successful
 */
router.post('/google/callback', handleGoogleCallback);

/**
 * @swagger
 * /api/v1/auth/calendar/connect:
 *   post:
 *     tags: [Calendar]
 *     summary: Connect Google Calendar
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar connected successfully
 */
router.post('/calendar/connect', authenticate, connectCalendar);

/**
 * @swagger
 * /api/v1/auth/calendar/events:
 *   get:
 *     tags: [Calendar]
 *     summary: Get calendar events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar events retrieved
 */
router.get('/calendar/events', authenticate, getCalendarEvents);

export default router;