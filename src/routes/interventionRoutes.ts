import express from 'express';
import InterventionController from '../controllers/interventionController';
import { authenticate } from '../middleware/auth';
import { attachSubscription, requirePlan } from '../middleware/planRestrictions';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();
const interventionController = new InterventionController();

// Validation schemas
const evaluateInterventionSchema = Joi.object({
  currentMood: Joi.number().min(1).max(10).required(),
  location: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).required(),
  weather: Joi.object().optional(),
  nearbyStores: Joi.array().optional(),
  sleepData: Joi.object().optional(),
  recentSpending: Joi.array().optional(),
});

const recordSavingSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().required(),
  category: Joi.string().valid('prevented_purchase', 'mood_intervention', 'location_alert', 'sleep_intervention', 'weather_intervention').required(),
  interventionType: Joi.string().required(),
  metadata: Joi.object().optional(),
});

const contextSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  currentMood: Joi.number().min(1).max(10).required(),
});

const confirmSavingsSchema = Joi.object({
  interventionId: Joi.string().required(),
  actualAmount: Joi.number().min(0).required(),
  originalAmount: Joi.number().positive().required(),
  category: Joi.string().required(),
  triggerType: Joi.string().required(),
  reason: Joi.string().required(),
  metadata: Joi.object().optional(),
});

/**
 * @swagger
 * /api/v1/intervention/evaluate:
 *   post:
 *     summary: Evaluate intervention for current user context
 *     tags: [Intervention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentMood:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               weather:
 *                 type: object
 *               nearbyStores:
 *                 type: array
 *               sleepData:
 *                 type: object
 *               recentSpending:
 *                 type: array
 *     responses:
 *       200:
 *         description: Intervention evaluation completed
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/evaluate', 
  authenticate, 
  attachSubscription, 
  requirePlan('pro'), 
  validateRequest(evaluateInterventionSchema), 
  interventionController.evaluateIntervention
);

/**
 * @swagger
 * /api/v1/intervention/savings:
 *   get:
 *     summary: Get user's savings statistics
 *     tags: [Intervention]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *         description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Savings statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/savings', 
  authenticate, 
  attachSubscription, 
  requirePlan('pro'), 
  interventionController.getSavingsStats
);

/**
 * @swagger
 * /api/v1/intervention/savings/history:
 *   get:
 *     summary: Get user's savings history
 *     tags: [Intervention]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *         description: Number of entries to return
 *     responses:
 *       200:
 *         description: Savings history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/savings/history', 
  authenticate, 
  attachSubscription, 
  requirePlan('pro'), 
  interventionController.getSavingsHistory
);

/**
 * @swagger
 * /api/v1/intervention/savings/record:
 *   post:
 *     summary: Record a manual savings entry
 *     tags: [Intervention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [prevented_purchase, mood_intervention, location_alert, sleep_intervention, weather_intervention]
 *               interventionType:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Savings recorded successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/savings/record', 
  authenticate, 
  attachSubscription, 
  requirePlan('pro'), 
  validateRequest(recordSavingSchema), 
  interventionController.recordSaving
);

/**
 * @swagger
 * /api/v1/intervention/context:
 *   post:
 *     summary: Get comprehensive intervention context
 *     tags: [Intervention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               currentMood:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *     responses:
 *       200:
 *         description: Intervention context retrieved successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/context', 
  authenticate, 
  attachSubscription, 
  requirePlan('pro'), 
  validateRequest(contextSchema), 
  interventionController.getInterventionContext
);

/**
 * @swagger
 * /api/v1/intervention/confirm-savings:
 *   post:
 *     summary: Confirm real savings after an intervention
 *     tags: [Intervention]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interventionId:
 *                 type: string
 *               actualAmount:
 *                 type: number
 *                 minimum: 0
 *               originalAmount:
 *                 type: number
 *                 minimum: 0.01
 *               category:
 *                 type: string
 *               triggerType:
 *                 type: string
 *               reason:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Real savings confirmed successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/confirm-savings', 
  authenticate, 
  attachSubscription, 
  requirePlan('pro'), 
  validateRequest(confirmSavingsSchema), 
  interventionController.confirmSavings
);

/**
 * @swagger
 * /api/v1/intervention/test:
 *   post:
 *     summary: Test intervention system
 *     tags: [Intervention]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test intervention completed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/test', 
  authenticate, 
  attachSubscription, 
  requirePlan('pro'), 
  interventionController.testIntervention
);

export default router;