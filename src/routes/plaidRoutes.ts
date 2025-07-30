import { Router } from 'express';
import plaidController from '../controllers/plaidController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// All Plaid routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/plaid/link-token:
 *   post:
 *     summary: Create a link token for Plaid Link initialization
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Link token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     linkToken:
 *                       type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/link-token', plaidController.createLinkToken);

/**
 * @swagger
 * /api/v1/plaid/exchange-token:
 *   post:
 *     summary: Exchange public token for access token
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicToken
 *             properties:
 *               publicToken:
 *                 type: string
 *                 description: Public token from Plaid Link
 *     responses:
 *       200:
 *         description: Account connected successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/exchange-token',
  [
    body('publicToken')
      .notEmpty()
      .withMessage('Public token is required')
      .isString()
      .withMessage('Public token must be a string'),
  ],
  validateRequest,
  plaidController.exchangePublicToken
);

/**
 * @swagger
 * /api/v1/plaid/accounts:
 *   get:
 *     summary: Get user's connected bank accounts
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-plaid-access-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaid access token
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           accountId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           subtype:
 *                             type: string
 *                           balance:
 *                             type: object
 *                             properties:
 *                               available:
 *                                 type: number
 *                               current:
 *                                 type: number
 *                               currency:
 *                                 type: string
 *       400:
 *         description: Bank account not connected
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/accounts', plaidController.getAccounts);

/**
 * @swagger
 * /api/v1/plaid/transactions/recent:
 *   get:
 *     summary: Get user's recent transactions (last 30 days)
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-plaid-access-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaid access token
 *       - in: query
 *         name: accountIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by specific account IDs
 *     responses:
 *       200:
 *         description: Recent transactions retrieved successfully
 *       400:
 *         description: Bank account not connected
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/transactions/recent', plaidController.getRecentTransactions);

/**
 * @swagger
 * /api/v1/plaid/transactions:
 *   get:
 *     summary: Get transactions within a date range
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-plaid-access-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaid access token
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: accountIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by specific account IDs
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       400:
 *         description: Invalid request or bank account not connected
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/transactions',
  [
    query('startDate')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Start date must be in YYYY-MM-DD format'),
    query('endDate')
      .notEmpty()
      .withMessage('End date is required')
      .isISO8601()
      .withMessage('End date must be in YYYY-MM-DD format'),
  ],
  validateRequest,
  plaidController.getTransactions
);

/**
 * @swagger
 * /api/v1/plaid/analysis/spending:
 *   get:
 *     summary: Analyze user's spending patterns
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-plaid-access-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaid access token
 *     responses:
 *       200:
 *         description: Spending analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analysis:
 *                       type: object
 *                       properties:
 *                         totalSpent:
 *                           type: number
 *                         averageTransaction:
 *                           type: number
 *                         categoryBreakdown:
 *                           type: object
 *                         topMerchants:
 *                           type: array
 *                         dailySpending:
 *                           type: object
 *       400:
 *         description: Bank account not connected
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/analysis/spending', plaidController.analyzeSpending);

/**
 * @swagger
 * /api/v1/plaid/analysis/savings:
 *   get:
 *     summary: Get savings opportunities based on spending patterns
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-plaid-access-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaid access token
 *     responses:
 *       200:
 *         description: Savings opportunities identified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     opportunities:
 *                       type: object
 *                       properties:
 *                         suggestions:
 *                           type: array
 *                         subscriptionAnalysis:
 *                           type: array
 *       400:
 *         description: Bank account not connected
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/analysis/savings', plaidController.getSavingsOpportunities);

/**
 * @swagger
 * /api/v1/plaid/disconnect:
 *   delete:
 *     summary: Disconnect bank account
 *     tags: [Plaid]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-plaid-access-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Plaid access token
 *     responses:
 *       200:
 *         description: Account disconnected successfully
 *       400:
 *         description: Bank account not connected
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/disconnect', plaidController.disconnectAccount);

export default router;