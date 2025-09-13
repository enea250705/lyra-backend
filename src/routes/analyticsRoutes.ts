import { Router } from 'express';
import {
  trackEvent,
  getUserAnalytics,
  getFeatureAdoption,
  trackBehavior,
  getUserEngagement,
  getFeatureUsage,
  getBehaviorInsights,
  generateReport,
  getChartData,
  getDashboard,
  getSavedReports,
  getReportById,
  deleteReport,
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

/**
 * @swagger
 * /api/v1/analytics/behavior/track:
 *   post:
 *     tags: [Analytics]
 *     summary: Track user behavior event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - eventType
 *               - eventName
 *             properties:
 *               sessionId:
 *                 type: string
 *               eventType:
 *                 type: string
 *                 enum: [page_view, click, scroll, focus, blur, form_submit, api_call]
 *               eventName:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Behavior event tracked successfully
 */
router.post('/behavior/track', authenticate, trackBehavior);

/**
 * @swagger
 * /api/v1/analytics/engagement:
 *   get:
 *     tags: [Analytics]
 *     summary: Get user engagement metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: User engagement metrics retrieved successfully
 */
router.get('/engagement', authenticate, getUserEngagement);

/**
 * @swagger
 * /api/v1/analytics/features:
 *   get:
 *     tags: [Analytics]
 *     summary: Get feature usage metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: featureName
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Feature usage metrics retrieved successfully
 */
router.get('/features', authenticate, getFeatureUsage);

/**
 * @swagger
 * /api/v1/analytics/behavior/insights:
 *   get:
 *     tags: [Analytics]
 *     summary: Get behavior insights
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Behavior insights retrieved successfully
 */
router.get('/behavior/insights', authenticate, getBehaviorInsights);

/**
 * @swagger
 * /api/v1/analytics/reports:
 *   post:
 *     tags: [Analytics]
 *     summary: Generate analytics report
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [user_summary, feature_usage, behavior_analysis, retention, conversion, engagement]
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date
 *                   end:
 *                     type: string
 *                     format: date
 *               filters:
 *                 type: object
 *     responses:
 *       201:
 *         description: Analytics report generated successfully
 */
router.post('/reports', authenticate, generateReport);

/**
 * @swagger
 * /api/v1/analytics/reports:
 *   get:
 *     tags: [Analytics]
 *     summary: Get saved reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Saved reports retrieved successfully
 */
router.get('/reports', authenticate, getSavedReports);

/**
 * @swagger
 * /api/v1/analytics/reports/{id}:
 *   get:
 *     tags: [Analytics]
 *     summary: Get specific report by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *       404:
 *         description: Report not found
 */
router.get('/reports/:id', authenticate, getReportById);

/**
 * @swagger
 * /api/v1/analytics/reports/{id}:
 *   delete:
 *     tags: [Analytics]
 *     summary: Delete report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 */
router.delete('/reports/:id', authenticate, deleteReport);

/**
 * @swagger
 * /api/v1/analytics/charts:
 *   get:
 *     tags: [Analytics]
 *     summary: Get chart data for visualization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chartType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [line, bar, pie, area, scatter, doughnut, radar]
 *       - in: query
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *           enum: [usage, engagement, retention, conversion, behavior]
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 */
router.get('/charts', authenticate, getChartData);

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard configuration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: customWidgets
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard configuration retrieved successfully
 */
router.get('/dashboard', authenticate, getDashboard);

export default router;