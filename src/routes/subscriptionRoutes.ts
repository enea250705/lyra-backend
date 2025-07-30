import express from 'express';
import SubscriptionController from '../controllers/subscriptionController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = express.Router();
const subscriptionController = new SubscriptionController();

// Validation schemas
const createSubscriptionSchema = Joi.object({
  planId: Joi.string().valid('pro', 'premium').required(),
  paymentMethodId: Joi.string().required(),
});

const updateSubscriptionSchema = Joi.object({
  planId: Joi.string().valid('free', 'pro', 'premium').required(),
});

const cancelSubscriptionSchema = Joi.object({
  immediate: Joi.boolean().default(false),
});

/**
 * @swagger
 * /api/v1/subscription:
 *   get:
 *     summary: Get current user's subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, subscriptionController.getSubscription);

/**
 * @swagger
 * /api/v1/subscription/plans:
 *   get:
 *     summary: Get all available subscription plans
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @swagger
 * /api/v1/subscription/create:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [pro, premium]
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', authenticate, validateRequest(createSubscriptionSchema), subscriptionController.createSubscription);

/**
 * @swagger
 * /api/v1/subscription/update:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *                 enum: [free, pro, premium]
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/update', authenticate, validateRequest(updateSubscriptionSchema), subscriptionController.updateSubscription);

/**
 * @swagger
 * /api/v1/subscription/cancel:
 *   delete:
 *     summary: Cancel subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               immediate:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/cancel', authenticate, validateRequest(cancelSubscriptionSchema), subscriptionController.cancelSubscription);

/**
 * @swagger
 * /api/v1/subscription/portal:
 *   get:
 *     summary: Get customer portal URL
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portal URL generated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No Stripe customer found
 *       500:
 *         description: Server error
 */
router.get('/portal', authenticate, subscriptionController.getCustomerPortal);

/**
 * @swagger
 * /api/v1/subscription/webhook:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook
 */
router.post('/webhook', subscriptionController.handleWebhook);

/**
 * @swagger
 * /api/v1/subscription/validate-receipt:
 *   post:
 *     summary: Validate IAP receipt
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receipt:
 *                 type: string
 *                 description: Base64 encoded receipt
 *               productId:
 *                 type: string
 *                 description: Product ID from store
 *               transactionId:
 *                 type: string
 *                 description: Transaction ID
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *               purchaseToken:
 *                 type: string
 *                 description: Android purchase token (Android only)
 *               packageName:
 *                 type: string
 *                 description: Android package name (Android only)
 *     responses:
 *       200:
 *         description: Receipt validated successfully
 *       400:
 *         description: Invalid receipt data
 *       401:
 *         description: Not authenticated
 */
router.post('/validate-receipt', authenticate, subscriptionController.validateReceipt);

/**
 * @swagger
 * /api/v1/subscription/feature/{featureId}:
 *   get:
 *     summary: Check feature access
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: featureId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feature access checked
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/feature/:featureId', authenticate, subscriptionController.checkFeatureAccess);

export default router;