import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import interventionService from '../services/interventionService';
import savingsCounterService from '../services/savingsCounterService';
import weatherMoodService from '../services/weatherMoodService';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

class InterventionController {
  /**
   * Evaluate intervention for current user context
   * @route POST /api/v1/intervention/evaluate
   */
  evaluateIntervention = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { 
        currentMood, 
        location, 
        weather, 
        nearbyStores, 
        sleepData, 
        recentSpending 
      } = req.body;

      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      if (!currentMood || !location) {
        sendError(res, 'Current mood and location are required', 400);
        return;
      }

      const context = {
        userId,
        currentMood,
        location,
        weather,
        nearbyStores,
        sleepData,
        recentSpending,
      };

      const interventions = await interventionService.evaluateIntervention(context);

      sendSuccess(res, {
        interventions,
        hasInterventions: interventions.length > 0,
        riskLevel: interventions.length > 0 ? 
          Math.max(...interventions.map(i => 
            i.riskLevel === 'high' ? 3 : i.riskLevel === 'medium' ? 2 : 1
          )) : 0,
      }, 'Intervention evaluation completed');
    } catch (error) {
      logger.error('Error evaluating intervention:', error);
      sendError(res, 'Failed to evaluate intervention', 500);
    }
  };

  /**
   * Get user's savings statistics
   * @route GET /api/v1/intervention/savings
   */
  getSavingsStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { days } = req.query;

      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const daysNumber = days ? parseInt(days as string) : undefined;
      const savingsStats = await savingsCounterService.getSavingsStats(userId, daysNumber);
      const potentialSavings = await savingsCounterService.calculatePotentialSavings(userId);

      sendSuccess(res, {
        ...savingsStats,
        potentialSavings,
      }, 'Savings statistics retrieved successfully');
    } catch (error) {
      logger.error('Error getting savings stats:', error);
      sendError(res, 'Failed to retrieve savings statistics', 500);
    }
  };

  /**
   * Get user's savings history
   * @route GET /api/v1/intervention/savings/history
   */
  getSavingsHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { limit = 50 } = req.query;

      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const history = await savingsCounterService.getUserSavingsHistory(
        userId, 
        parseInt(limit as string)
      );

      sendSuccess(res, { history }, 'Savings history retrieved successfully');
    } catch (error) {
      logger.error('Error getting savings history:', error);
      sendError(res, 'Failed to retrieve savings history', 500);
    }
  };

  /**
   * Record a manual savings entry
   * @route POST /api/v1/intervention/savings/record
   */
  recordSaving = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { amount, description, category, interventionType, metadata } = req.body;

      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      if (!amount || !description || !category || !interventionType) {
        sendError(res, 'Amount, description, category, and intervention type are required', 400);
        return;
      }

      const savingsEntry = await savingsCounterService.recordSaving(
        userId,
        amount,
        description,
        category,
        interventionType,
        metadata
      );

      sendSuccess(res, { savingsEntry }, 'Savings recorded successfully');
    } catch (error) {
      logger.error('Error recording savings:', error);
      sendError(res, 'Failed to record savings', 500);
    }
  };

  /**
   * Get comprehensive intervention context
   * @route POST /api/v1/intervention/context
   */
  getInterventionContext = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { latitude, longitude, currentMood } = req.body;

      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      if (!latitude || !longitude || !currentMood) {
        sendError(res, 'Latitude, longitude, and current mood are required', 400);
        return;
      }

      // Get comprehensive location data
      const weatherService = new weatherMoodService();
      const locationData = await weatherService.getComprehensiveLocationMoodData(
        userId,
        latitude,
        longitude,
        currentMood
      );

      // Get user mood pattern
      const moodPattern = await interventionService.getUserMoodPattern(userId);

      // Evaluate interventions
      const context = {
        userId,
        currentMood,
        location: { latitude, longitude },
        weather: locationData.weather,
        nearbyStores: locationData.nearbyStores,
        sleepData: locationData.sleepAdjustment,
      };

      const interventions = await interventionService.evaluateIntervention(context);

      sendSuccess(res, {
        locationData,
        moodPattern,
        interventions,
        context,
        hasInterventions: interventions.length > 0,
      }, 'Intervention context retrieved successfully');
    } catch (error) {
      logger.error('Error getting intervention context:', error);
      sendError(res, 'Failed to retrieve intervention context', 500);
    }
  };

  /**
   * Confirm real savings after an intervention
   * @route POST /api/v1/intervention/confirm-savings
   */
  confirmSavings = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const { 
        interventionId,
        actualAmount,
        originalAmount,
        category,
        triggerType,
        reason,
        metadata 
      } = req.body;

      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      if (!interventionId || actualAmount === undefined || !originalAmount || !category || !triggerType || !reason) {
        sendError(res, 'All fields are required: interventionId, actualAmount, originalAmount, category, triggerType, reason', 400);
        return;
      }

      const realSaving = await savingsCounterService.confirmRealSavings(
        userId,
        interventionId,
        actualAmount,
        originalAmount,
        category,
        triggerType,
        reason,
        metadata
      );

      sendSuccess(res, { realSaving }, 'Real savings confirmed successfully');
    } catch (error) {
      logger.error('Error confirming real savings:', error);
      const message = error instanceof Error ? error.message : 'Failed to confirm real savings';
      sendError(res, message, 500);
    }
  };

  /**
   * Test intervention system
   * @route POST /api/v1/intervention/test
   */
  testIntervention = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const interventions = await interventionService.testIntervention(userId);

      sendSuccess(res, {
        interventions,
        message: 'This is a test intervention with sample data',
      }, 'Test intervention completed');
    } catch (error) {
      logger.error('Error testing intervention:', error);
      sendError(res, 'Failed to test intervention', 500);
    }
  };
}

export default InterventionController;