import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import plaidService from '../services/plaidService';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

class PlaidController {
  /**
   * Create a link token for Plaid Link initialization
   * @route POST /api/v1/plaid/link-token
   */
  createLinkToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const linkToken = await plaidService.createLinkToken({
        userId,
        clientName: 'Lyra - Personal Life Operating System',
      });

      sendSuccess(res, { linkToken }, 'Link token created successfully');
    } catch (error: any) {
      logger.error('Error creating link token:', error);
      sendError(res, error.message || 'Failed to create link token', 500);
    }
  };

  /**
   * Exchange public token for access token
   * @route POST /api/v1/plaid/exchange-token
   */
  exchangePublicToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const { publicToken } = req.body;

      if (!publicToken) {
        sendError(res, 'Public token is required', 400);
        return;
      }

      const accessToken = await plaidService.exchangePublicToken(publicToken);

      // TODO: Store access token securely in database
      // For now, just return it (in production, store encrypted in user settings)
      
      sendSuccess(res, { 
        message: 'Bank account connected successfully',
        // Don't return access token in production - store it securely
        success: true 
      }, 'Account connected successfully');
    } catch (error: any) {
      logger.error('Error exchanging public token:', error);
      sendError(res, error.message || 'Failed to connect bank account', 500);
    }
  };

  /**
   * Get user's connected accounts
   * @route GET /api/v1/plaid/accounts
   */
  getAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      // TODO: Retrieve access token from database
      const accessToken = req.headers['x-plaid-access-token'] as string;
      
      if (!accessToken) {
        sendError(res, 'Bank account not connected', 400);
        return;
      }

      const accounts = await plaidService.getAccounts(accessToken);

      sendSuccess(res, { accounts }, 'Accounts retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting accounts:', error);
      sendError(res, error.message || 'Failed to retrieve accounts', 500);
    }
  };

  /**
   * Get user's recent transactions
   * @route GET /api/v1/plaid/transactions/recent
   */
  getRecentTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      // TODO: Retrieve access token from database
      const accessToken = req.headers['x-plaid-access-token'] as string;
      
      if (!accessToken) {
        sendError(res, 'Bank account not connected', 400);
        return;
      }

      const accountIds = req.query.accountIds as string[];
      const transactions = await plaidService.getRecentTransactions(accessToken, accountIds);

      sendSuccess(res, { transactions }, 'Recent transactions retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting recent transactions:', error);
      sendError(res, error.message || 'Failed to retrieve transactions', 500);
    }
  };

  /**
   * Get transactions within a date range
   * @route GET /api/v1/plaid/transactions
   */
  getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      // TODO: Retrieve access token from database
      const accessToken = req.headers['x-plaid-access-token'] as string;
      
      if (!accessToken) {
        sendError(res, 'Bank account not connected', 400);
        return;
      }

      const { startDate, endDate } = req.query;
      const accountIds = req.query.accountIds as string[];

      if (!startDate || !endDate) {
        sendError(res, 'Start date and end date are required', 400);
        return;
      }

      const transactions = await plaidService.getTransactions(
        accessToken,
        startDate as string,
        endDate as string,
        accountIds
      );

      sendSuccess(res, { transactions }, 'Transactions retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting transactions:', error);
      sendError(res, error.message || 'Failed to retrieve transactions', 500);
    }
  };

  /**
   * Analyze spending patterns
   * @route GET /api/v1/plaid/analysis/spending
   */
  analyzeSpending = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      // TODO: Retrieve access token from database
      const accessToken = req.headers['x-plaid-access-token'] as string;
      
      if (!accessToken) {
        sendError(res, 'Bank account not connected', 400);
        return;
      }

      // Get recent transactions for analysis
      const transactions = await plaidService.getRecentTransactions(accessToken);
      const analysis = await plaidService.analyzeSpendingPatterns(transactions);

      sendSuccess(res, { analysis }, 'Spending analysis completed successfully');
    } catch (error: any) {
      logger.error('Error analyzing spending:', error);
      sendError(res, error.message || 'Failed to analyze spending', 500);
    }
  };

  /**
   * Get savings opportunities
   * @route GET /api/v1/plaid/analysis/savings
   */
  getSavingsOpportunities = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      // TODO: Retrieve access token from database
      const accessToken = req.headers['x-plaid-access-token'] as string;
      
      if (!accessToken) {
        sendError(res, 'Bank account not connected', 400);
        return;
      }

      // Get recent transactions for analysis
      const transactions = await plaidService.getRecentTransactions(accessToken);
      const opportunities = await plaidService.identifySavingsOpportunities(transactions);

      sendSuccess(res, { opportunities }, 'Savings opportunities identified successfully');
    } catch (error: any) {
      logger.error('Error identifying savings opportunities:', error);
      sendError(res, error.message || 'Failed to identify savings opportunities', 500);
    }
  };

  /**
   * Disconnect bank account
   * @route DELETE /api/v1/plaid/disconnect
   */
  disconnectAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      // TODO: Retrieve access token from database
      const accessToken = req.headers['x-plaid-access-token'] as string;
      
      if (!accessToken) {
        sendError(res, 'Bank account not connected', 400);
        return;
      }

      await plaidService.removeItem(accessToken);

      // TODO: Remove access token from database

      sendSuccess(res, { message: 'Bank account disconnected successfully' }, 'Account disconnected successfully');
    } catch (error: any) {
      logger.error('Error disconnecting account:', error);
      sendError(res, error.message || 'Failed to disconnect account', 500);
    }
  };
}

export default new PlaidController();