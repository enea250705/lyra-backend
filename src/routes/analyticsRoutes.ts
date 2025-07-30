import { Router } from 'express';
import {
  trackEvent,
  getUserAnalytics,
  getFeatureAdoption,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/analytics/track:
 *   post:
 *     tags: [Analytics]
 *     summary: Track a usage event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - featureName
 *               - action
 *             properties:
 *               featureName:
 *                 type: string
 *                 maxLength: 100
 *               action:
 *                 type: string
 *                 maxLength: 100
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event tracked successfully
 */
router.post('/track', authenticate, trackEvent);

/**
 * @swagger
 * /api/v1/analytics/user:
 *   get:
 *     tags: [Analytics]
 *     summary: Get user analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *       - in: query
 *         name: feature
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 */
router.get('/user', authenticate, getUserAnalytics);

/**
 * @swagger
 * /api/v1/analytics/adoption:
 *   get:
 *     tags: [Analytics]
 *     summary: Get feature adoption statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature adoption retrieved successfully
 */
router.get('/adoption', authenticate, getFeatureAdoption);

export default router;