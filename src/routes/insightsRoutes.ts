import { Router } from 'express';
import {
  getEmotionInsights,
  getCorrelations,
  getWeeklySummary,
  getTrends,
} from '../controllers/insightsController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/insights/emotions:
 *   get:
 *     tags: [Insights]
 *     summary: Get emotion insights
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: regenerate
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Emotion insights retrieved successfully
 */
router.get('/emotions', authenticate, getEmotionInsights);

/**
 * @swagger
 * /api/v1/insights/correlations:
 *   get:
 *     tags: [Insights]
 *     summary: Get data correlations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Correlations retrieved successfully
 */
router.get('/correlations', authenticate, getCorrelations);

/**
 * @swagger
 * /api/v1/insights/weekly-summary:
 *   get:
 *     tags: [Insights]
 *     summary: Get weekly summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly summary retrieved successfully
 */
router.get('/weekly-summary', authenticate, getWeeklySummary);

/**
 * @swagger
 * /api/v1/insights/trends:
 *   get:
 *     tags: [Insights]
 *     summary: Get data trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter]
 *           default: month
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
 */
router.get('/trends', authenticate, getTrends);

export default router;