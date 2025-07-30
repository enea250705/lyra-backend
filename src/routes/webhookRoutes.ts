import { Router } from 'express';
import webhookController from '../controllers/webhookController';
import { json } from 'express';

const router = Router();

// Use raw JSON parser for webhook verification
const rawJsonParser = json({ 
  verify: (req: any, res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf.toString('utf8');
  }
});

/**
 * @swagger
 * /webhooks/plaid:
 *   post:
 *     summary: Handle Plaid webhooks
 *     tags: [Webhooks]
 *     description: |
 *       Endpoint to receive webhooks from Plaid about account and transaction updates.
 *       
 *       **Webhook Types:**
 *       - `TRANSACTIONS`: New transactions, historical updates
 *       - `ITEM`: Account errors, permission changes
 *       - `AUTH`: Account verification status
 *       - `ASSETS`: Asset report updates
 *       - `HOLDINGS`: Investment holding updates
 *       - `INVESTMENTS_TRANSACTIONS`: Investment transaction updates
 *       - `LIABILITIES`: Liability updates
 *       
 *       **Setup Instructions:**
 *       1. Set webhook URL in Plaid Dashboard: `https://your-domain.com/webhooks/plaid`
 *       2. Configure PLAID_WEBHOOK_SECRET in environment variables
 *       3. Enable desired webhook types in Plaid Dashboard
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               webhook_type:
 *                 type: string
 *                 enum: [TRANSACTIONS, ITEM, AUTH, ASSETS, HOLDINGS, INVESTMENTS_TRANSACTIONS, LIABILITIES]
 *               webhook_code:
 *                 type: string
 *               item_id:
 *                 type: string
 *               error:
 *                 type: object
 *                 properties:
 *                   error_type:
 *                     type: string
 *                   error_code:
 *                     type: string
 *                   error_message:
 *                     type: string
 *                   display_message:
 *                     type: string
 *               new_transactions:
 *                 type: integer
 *               removed_transactions:
 *                 type: array
 *                 items:
 *                   type: string
 *               consent_expiration_time:
 *                 type: string
 *                 format: date-time
 *           examples:
 *             transactions_update:
 *               summary: New transactions available
 *               value:
 *                 webhook_type: "TRANSACTIONS"
 *                 webhook_code: "DEFAULT_UPDATE"
 *                 item_id: "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6"
 *                 new_transactions: 5
 *             item_error:
 *               summary: Item authentication error
 *               value:
 *                 webhook_type: "ITEM"
 *                 webhook_code: "ERROR"
 *                 item_id: "eVBnVMp7zdTJLkRNr33Rs6zr7KNJqBFL9DrE6"
 *                 error:
 *                   error_type: "ITEM_ERROR"
 *                   error_code: "ITEM_LOGIN_REQUIRED"
 *                   error_message: "the provided credentials are no longer valid"
 *                   display_message: "The account credentials are no longer valid. Please reconnect your account."
 *     responses:
 *       200:
 *         description: Webhook processed successfully
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
 *                     received:
 *                       type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Invalid webhook signature
 *       500:
 *         description: Internal server error (still returns 200 to prevent retries)
 */
router.post('/plaid', rawJsonParser, webhookController.handlePlaidWebhook);

/**
 * @swagger
 * /webhooks/health:
 *   get:
 *     summary: Webhook endpoint health check
 *     tags: [Webhooks]
 *     description: Check if the webhook endpoint is operational
 *     responses:
 *       200:
 *         description: Webhook endpoint is healthy
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
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                 message:
 *                   type: string
 */
router.get('/health', webhookController.healthCheck);

export default router;