import { Router } from 'express';
import {
  initializeOnboarding,
  getOnboardingProgress,
  completeStep,
  skipStep,
  requestPermission,
  grantPermission,
  denyPermission,
  getUserPermissions,
  createTutorial,
  updateTutorialProgress,
  completeTutorial,
  skipTutorial,
  getUserTutorials,
  getCharts,
  getTrendAnalysis,
  getProgressTracking,
  isOnboardingComplete,
  resetOnboarding,
} from '../controllers/onboardingController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/v1/onboarding/initialize:
 *   post:
 *     tags: [Onboarding]
 *     summary: Initialize onboarding flow for new user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Onboarding initialized successfully
 */
router.post('/initialize', authenticate, initializeOnboarding);

/**
 * @swagger
 * /api/v1/onboarding/progress:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get onboarding progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding progress retrieved successfully
 */
router.get('/progress', authenticate, getOnboardingProgress);

/**
 * @swagger
 * /api/v1/onboarding/complete-step:
 *   post:
 *     tags: [Onboarding]
 *     summary: Complete onboarding step
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stepName
 *             properties:
 *               stepName:
 *                 type: string
 *               stepData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Step completed successfully
 */
router.post('/complete-step', authenticate, completeStep);

/**
 * @swagger
 * /api/v1/onboarding/skip-step:
 *   post:
 *     tags: [Onboarding]
 *     summary: Skip onboarding step
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stepName
 *             properties:
 *               stepName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Step skipped successfully
 */
router.post('/skip-step', authenticate, skipStep);

/**
 * @swagger
 * /api/v1/onboarding/permissions/request:
 *   post:
 *     tags: [Onboarding]
 *     summary: Request permission
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionType
 *               - permissionName
 *               - description
 *               - requestReason
 *             properties:
 *               permissionType:
 *                 type: string
 *                 enum: [notifications, location, camera, microphone, calendar, health, contacts, storage]
 *               permissionName:
 *                 type: string
 *               description:
 *                 type: string
 *               requestReason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Permission requested successfully
 */
router.post('/permissions/request', authenticate, requestPermission);

/**
 * @swagger
 * /api/v1/onboarding/permissions/grant:
 *   post:
 *     tags: [Onboarding]
 *     summary: Grant permission
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionType
 *             properties:
 *               permissionType:
 *                 type: string
 *                 enum: [notifications, location, camera, microphone, calendar, health, contacts, storage]
 *     responses:
 *       200:
 *         description: Permission granted successfully
 */
router.post('/permissions/grant', authenticate, grantPermission);

/**
 * @swagger
 * /api/v1/onboarding/permissions/deny:
 *   post:
 *     tags: [Onboarding]
 *     summary: Deny permission
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionType
 *             properties:
 *               permissionType:
 *                 type: string
 *                 enum: [notifications, location, camera, microphone, calendar, health, contacts, storage]
 *     responses:
 *       200:
 *         description: Permission denied successfully
 */
router.post('/permissions/deny', authenticate, denyPermission);

/**
 * @swagger
 * /api/v1/onboarding/permissions:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get user permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 */
router.get('/permissions', authenticate, getUserPermissions);

/**
 * @swagger
 * /api/v1/onboarding/tutorials/create:
 *   post:
 *     tags: [Onboarding]
 *     summary: Create feature tutorial
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
 *               - tutorialType
 *               - title
 *               - description
 *               - content
 *             properties:
 *               featureName:
 *                 type: string
 *               tutorialType:
 *                 type: string
 *                 enum: [intro, walkthrough, tip, advanced]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: object
 *     responses:
 *       201:
 *         description: Tutorial created successfully
 */
router.post('/tutorials/create', authenticate, createTutorial);

/**
 * @swagger
 * /api/v1/onboarding/tutorials/progress:
 *   put:
 *     tags: [Onboarding]
 *     summary: Update tutorial progress
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
 *               - progress
 *             properties:
 *               featureName:
 *                 type: string
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Tutorial progress updated successfully
 */
router.put('/tutorials/progress', authenticate, updateTutorialProgress);

/**
 * @swagger
 * /api/v1/onboarding/tutorials/complete:
 *   post:
 *     tags: [Onboarding]
 *     summary: Complete tutorial
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
 *             properties:
 *               featureName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tutorial completed successfully
 */
router.post('/tutorials/complete', authenticate, completeTutorial);

/**
 * @swagger
 * /api/v1/onboarding/tutorials/skip:
 *   post:
 *     tags: [Onboarding]
 *     summary: Skip tutorial
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
 *             properties:
 *               featureName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tutorial skipped successfully
 */
router.post('/tutorials/skip', authenticate, skipTutorial);

/**
 * @swagger
 * /api/v1/onboarding/tutorials:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get user tutorials
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User tutorials retrieved successfully
 */
router.get('/tutorials', authenticate, getUserTutorials);

/**
 * @swagger
 * /api/v1/onboarding/charts:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get data visualization charts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chartType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mood-trend, sleep-quality, mood-distribution]
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 */
router.get('/charts', authenticate, getCharts);

/**
 * @swagger
 * /api/v1/onboarding/trends:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get trend analysis
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mood, sleep, energy]
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Trend analysis retrieved successfully
 */
router.get('/trends', authenticate, getTrendAnalysis);

/**
 * @swagger
 * /api/v1/onboarding/progress-tracking:
 *   get:
 *     tags: [Onboarding]
 *     summary: Get progress tracking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress tracking retrieved successfully
 */
router.get('/progress-tracking', authenticate, getProgressTracking);

/**
 * @swagger
 * /api/v1/onboarding/complete:
 *   get:
 *     tags: [Onboarding]
 *     summary: Check if onboarding is complete
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding completion status retrieved successfully
 */
router.get('/complete', authenticate, isOnboardingComplete);

/**
 * @swagger
 * /api/v1/onboarding/reset:
 *   post:
 *     tags: [Onboarding]
 *     summary: Reset onboarding
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding reset successfully
 */
router.post('/reset', authenticate, resetOnboarding);

export default router;

