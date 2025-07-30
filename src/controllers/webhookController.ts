import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';
import plaidService from '../services/plaidService';

interface PlaidWebhookPayload {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  error?: {
    error_type: string;
    error_code: string;
    error_message: string;
    display_message: string;
  };
  new_transactions?: number;
  removed_transactions?: string[];
  consent_expiration_time?: string;
}

class WebhookController {
  /**
   * Verify Plaid webhook signature
   */
  private verifyPlaidWebhook(body: string, signature: string): boolean {
    const webhookSecret = process.env.PLAID_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      logger.warn('PLAID_WEBHOOK_SECRET not configured');
      return true; // Allow in development, but log warning
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle Plaid webhooks
   * @route POST /webhooks/plaid
   */
  handlePlaidWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['plaid-verification'] as string;
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      if (signature && !this.verifyPlaidWebhook(body, signature)) {
        logger.error('Invalid Plaid webhook signature');
        sendError(res, 'Invalid signature', 401);
        return;
      }

      const payload: PlaidWebhookPayload = req.body;
      
      logger.info('Received Plaid webhook:', {
        webhook_type: payload.webhook_type,
        webhook_code: payload.webhook_code,
        item_id: payload.item_id,
      });

      // Handle different webhook types
      switch (payload.webhook_type) {
        case 'TRANSACTIONS':
          await this.handleTransactionsWebhook(payload);
          break;
        
        case 'ITEM':
          await this.handleItemWebhook(payload);
          break;
        
        case 'AUTH':
          await this.handleAuthWebhook(payload);
          break;
        
        case 'ASSETS':
          await this.handleAssetsWebhook(payload);
          break;
        
        case 'HOLDINGS':
          await this.handleHoldingsWebhook(payload);
          break;
        
        case 'INVESTMENTS_TRANSACTIONS':
          await this.handleInvestmentsTransactionsWebhook(payload);
          break;
        
        case 'LIABILITIES':
          await this.handleLiabilitiesWebhook(payload);
          break;
        
        default:
          logger.warn(`Unhandled webhook type: ${payload.webhook_type}`);
      }

      // Always respond with 200 to acknowledge receipt
      sendSuccess(res, { received: true }, 'Webhook processed successfully');
    } catch (error) {
      logger.error('Error processing Plaid webhook:', error);
      // Still send 200 to prevent Plaid from retrying
      sendSuccess(res, { received: true, error: 'Processing failed' }, 'Webhook acknowledged with error');
    }
  };

  /**
   * Handle TRANSACTIONS webhooks
   */
  private async handleTransactionsWebhook(payload: PlaidWebhookPayload): Promise<void> {
    switch (payload.webhook_code) {
      case 'INITIAL_UPDATE':
        logger.info(`Initial transaction update completed for item ${payload.item_id}`);
        // TODO: Fetch and store initial transactions
        break;
        
      case 'HISTORICAL_UPDATE':
        logger.info(`Historical transaction update completed for item ${payload.item_id}`);
        // TODO: Fetch and store historical transactions
        break;
        
      case 'DEFAULT_UPDATE':
        logger.info(`New transactions available for item ${payload.item_id}`, {
          new_transactions: payload.new_transactions,
          removed_transactions: payload.removed_transactions?.length || 0,
        });
        // TODO: Fetch new transactions and update database
        await this.processNewTransactions(payload.item_id, payload.new_transactions || 0);
        break;
        
      case 'TRANSACTIONS_REMOVED':
        logger.info(`Transactions removed for item ${payload.item_id}`, {
          removed_transactions: payload.removed_transactions,
        });
        // TODO: Remove transactions from database
        break;
        
      default:
        logger.warn(`Unhandled TRANSACTIONS webhook code: ${payload.webhook_code}`);
    }
  }

  /**
   * Handle ITEM webhooks
   */
  private async handleItemWebhook(payload: PlaidWebhookPayload): Promise<void> {
    switch (payload.webhook_code) {
      case 'ERROR':
        logger.error(`Item error for ${payload.item_id}:`, payload.error);
        // TODO: Handle item errors (notify user, mark as requiring re-authentication, etc.)
        break;
        
      case 'NEW_ACCOUNTS_AVAILABLE':
        logger.info(`New accounts available for item ${payload.item_id}`);
        // TODO: Notify user about new accounts
        break;
        
      case 'PENDING_EXPIRATION':
        logger.warn(`Item ${payload.item_id} access will expire at ${payload.consent_expiration_time}`);
        // TODO: Notify user to re-authenticate
        break;
        
      case 'USER_PERMISSION_REVOKED':
        logger.warn(`User revoked permissions for item ${payload.item_id}`);
        // TODO: Handle permission revocation
        break;
        
      case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
        logger.info(`Webhook update acknowledged for item ${payload.item_id}`);
        break;
        
      default:
        logger.warn(`Unhandled ITEM webhook code: ${payload.webhook_code}`);
    }
  }

  /**
   * Handle AUTH webhooks
   */
  private async handleAuthWebhook(payload: PlaidWebhookPayload): Promise<void> {
    switch (payload.webhook_code) {
      case 'AUTOMATICALLY_VERIFIED':
        logger.info(`Auth automatically verified for item ${payload.item_id}`);
        break;
        
      case 'VERIFICATION_EXPIRED':
        logger.warn(`Auth verification expired for item ${payload.item_id}`);
        // TODO: Notify user to re-verify
        break;
        
      default:
        logger.warn(`Unhandled AUTH webhook code: ${payload.webhook_code}`);
    }
  }

  /**
   * Handle ASSETS webhooks
   */
  private async handleAssetsWebhook(payload: PlaidWebhookPayload): Promise<void> {
    switch (payload.webhook_code) {
      case 'PRODUCT_READY':
        logger.info(`Assets product ready for item ${payload.item_id}`);
        break;
        
      case 'ERROR':
        logger.error(`Assets error for item ${payload.item_id}:`, payload.error);
        break;
        
      default:
        logger.warn(`Unhandled ASSETS webhook code: ${payload.webhook_code}`);
    }
  }

  /**
   * Handle HOLDINGS webhooks
   */
  private async handleHoldingsWebhook(payload: PlaidWebhookPayload): Promise<void> {
    switch (payload.webhook_code) {
      case 'DEFAULT_UPDATE':
        logger.info(`Holdings updated for item ${payload.item_id}`);
        // TODO: Fetch and update investment holdings
        break;
        
      default:
        logger.warn(`Unhandled HOLDINGS webhook code: ${payload.webhook_code}`);
    }
  }

  /**
   * Handle INVESTMENTS_TRANSACTIONS webhooks
   */
  private async handleInvestmentsTransactionsWebhook(payload: PlaidWebhookPayload): Promise<void> {
    switch (payload.webhook_code) {
      case 'DEFAULT_UPDATE':
        logger.info(`Investment transactions updated for item ${payload.item_id}`);
        // TODO: Fetch and update investment transactions
        break;
        
      default:
        logger.warn(`Unhandled INVESTMENTS_TRANSACTIONS webhook code: ${payload.webhook_code}`);
    }
  }

  /**
   * Handle LIABILITIES webhooks
   */
  private async handleLiabilitiesWebhook(payload: PlaidWebhookPayload): Promise<void> {
    switch (payload.webhook_code) {
      case 'DEFAULT_UPDATE':
        logger.info(`Liabilities updated for item ${payload.item_id}`);
        // TODO: Fetch and update liability information
        break;
        
      default:
        logger.warn(`Unhandled LIABILITIES webhook code: ${payload.webhook_code}`);
    }
  }

  /**
   * Process new transactions
   */
  private async processNewTransactions(itemId: string, newTransactionCount: number): Promise<void> {
    try {
      if (newTransactionCount === 0) return;

      logger.info(`Processing ${newTransactionCount} new transactions for item ${itemId}`);
      
      // TODO: Implement transaction processing logic
      // 1. Get access token for this item_id from database
      // 2. Fetch new transactions using Plaid API
      // 3. Analyze transactions for spending patterns
      // 4. Update user's financial insights
      // 5. Check for savings opportunities
      // 6. Send notifications if needed

      // Example implementation:
      /*
      const accessToken = await getUserAccessTokenByItemId(itemId);
      if (accessToken) {
        const transactions = await plaidService.getRecentTransactions(accessToken);
        const analysis = await plaidService.analyzeSpendingPatterns(transactions);
        const opportunities = await plaidService.identifySavingsOpportunities(transactions);
        
        // Update database with new insights
        // Send push notifications for important changes
      }
      */
      
    } catch (error) {
      logger.error('Error processing new transactions:', error);
    }
  }

  /**
   * Health check endpoint for webhooks
   * @route GET /webhooks/health
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, { status: 'healthy' }, 'Webhook endpoint is healthy');
  };
}

export default new WebhookController();