import express from 'express';
import savingsController from '../controllers/savingsController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { attachSubscription, requireFeature, requirePlan } from '../middleware/planRestrictions';
import { body, query } from 'express-validator';

const router = express.Router();

// Apply authentication and subscription middleware to all routes
router.use(authenticate);
router.use(attachSubscription);

/**
 * @swagger
 * components:
 *   schemas:
 *     SavingsStats:
 *       type: object
 *       properties:
 *         total:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             count:
 *               type: integer
 *         monthly:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             count:
 *               type: integer
 *             target:
 *               type: number
 *     SavingsRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         amount:
 *           type: number
 *         reason:
 *           type: string
 *         category:
 *           type: string
 *           enum: [food, shopping, entertainment, transport, subscription, other]
 *         originalAmount:
 *           type: number
 *         savedAmount:
 *           type: number
 *         triggerType:
 *           type: string
 *           enum: [mood_alert, location_alert, ai_suggestion, manual, time_based, weather_based]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/savings/stats:
 *   get:
 *     summary: Get user's savings statistics
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Savings statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SavingsStats'
 */
// Free users can only see limited stats, Pro+ can see full stats
router.get('/stats', requireFeature('limited_savings_view'), savingsController.getSavingsStats);

/**
 * @swagger
 * /api/v1/savings/record:
 *   post:
 *     summary: Record a new savings entry
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *               - originalAmount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Actual amount spent
 *               reason:
 *                 type: string
 *                 description: Reason for the savings
 *               category:
 *                 type: string
 *                 enum: [food, shopping, entertainment, transport, subscription, other]
 *               originalAmount:
 *                 type: number
 *                 description: Amount that would have been spent
 *               triggerType:
 *                 type: string
 *                 enum: [mood_alert, location_alert, ai_suggestion, manual, time_based, weather_based]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Savings recorded successfully
 */
router.post('/record', [
  requireFeature('manual_savings_tracking'), // Requires Pro plan
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('reason').isLength({ min: 1, max: 500 }).withMessage('Reason is required and must be less than 500 characters'),
  body('originalAmount').isNumeric().withMessage('Original amount must be a number'),
  body('category').optional().isIn(['food', 'shopping', 'entertainment', 'transport', 'subscription', 'other']),
  body('triggerType').optional().isIn(['mood_alert', 'location_alert', 'ai_suggestion', 'manual', 'time_based', 'weather_based']),
  validateRequest,
], savingsController.recordSavings);

/**
 * @swagger
 * /api/v1/savings/history:
 *   get:
 *     summary: Get savings history with pagination
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: triggerType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Savings history retrieved successfully
 */
router.get('/history', [
  requirePlan('pro'), // Requires Pro plan for savings history
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(['food', 'shopping', 'entertainment', 'transport', 'subscription', 'other']),
  query('triggerType').optional().isIn(['mood_alert', 'location_alert', 'ai_suggestion', 'manual', 'time_based', 'weather_based']),
  validateRequest,
], savingsController.getSavingsHistory);

/**
 * @swagger
 * /api/v1/savings/target:
 *   put:
 *     summary: Update monthly savings target
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monthlyTarget
 *             properties:
 *               monthlyTarget:
 *                 type: number
 *                 description: Monthly savings target amount
 *     responses:
 *       200:
 *         description: Savings target updated successfully
 */
router.put('/target', [
  requireFeature('basic_savings_stats'), // Requires Pro plan for setting savings targets
  body('monthlyTarget').isNumeric().isFloat({ min: 0 }).withMessage('Monthly target must be a positive number'),
  validateRequest,
], savingsController.updateSavingsTarget);


export default router;