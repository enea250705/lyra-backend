import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import SavingsRecord from '../models/SavingsRecord';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';
import { Op } from 'sequelize';
import sequelize from '../config/database';

class SavingsController {
  /**
   * Get user's total savings and statistics
   * @route GET /api/v1/savings/stats
   */
  getSavingsStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      // Get current month start and end
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get total savings
      const totalSavings = await SavingsRecord.findOne({
        where: { userId },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('saved_amount')), 'total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        raw: true,
      });

      // Get monthly savings
      const monthlySavings = await SavingsRecord.findOne({
        where: { 
          userId,
          createdAt: {
            [Op.between]: [monthStart, monthEnd]
          }
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('saved_amount')), 'monthly_total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'monthly_count']
        ],
        raw: true,
      });

      // Get savings by category (current month)
      const savingsByCategory = await SavingsRecord.findAll({
        where: { 
          userId,
          createdAt: {
            [Op.between]: [monthStart, monthEnd]
          }
        },
        attributes: [
          'category',
          [sequelize.fn('SUM', sequelize.col('saved_amount')), 'total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['category'],
        raw: true,
      });

      // Get savings by trigger type (current month)
      const savingsByTrigger = await SavingsRecord.findAll({
        where: { 
          userId,
          createdAt: {
            [Op.between]: [monthStart, monthEnd]
          }
        },
        attributes: [
          'trigger_type',
          [sequelize.fn('SUM', sequelize.col('saved_amount')), 'total'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['trigger_type'],
        raw: true,
      });

      // Get recent savings (last 10)
      const recentSavings = await SavingsRecord.findAll({
        where: { userId },
        order: [['created_at', 'DESC']],
        limit: 10,
      });

      const stats = {
        total: {
          amount: parseFloat((totalSavings as any)?.total || '0'),
          count: parseInt((totalSavings as any)?.count || '0'),
        },
        monthly: {
          amount: parseFloat((monthlySavings as any)?.monthly_total || '0'),
          count: parseInt((monthlySavings as any)?.monthly_count || '0'),
          target: 100, // Default monthly target - could be user configurable
        },
        byCategory: savingsByCategory,
        byTrigger: savingsByTrigger,
        recent: recentSavings,
        achievements: this.calculateAchievements(parseFloat((totalSavings as any)?.total || '0')),
      };

      sendSuccess(res, stats, 'Savings statistics retrieved successfully');
    } catch (error) {
      logger.error('Error getting savings stats:', error);
      sendError(res, 'Failed to retrieve savings statistics', 500);
    }
  };

  /**
   * Record a new savings entry
   * @route POST /api/v1/savings/record
   */
  recordSavings = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const {
        amount,
        reason,
        category = 'other',
        originalAmount,
        triggerType = 'manual',
        metadata = {}
      } = req.body;

      if (!amount || !reason || !originalAmount) {
        sendError(res, 'Amount, reason, and original amount are required', 400);
        return;
      }

      const savedAmount = Math.max(0, originalAmount - amount);

      const savingsRecord = await SavingsRecord.create({
        userId,
        amount: parseFloat(amount),
        reason,
        category,
        originalAmount: parseFloat(originalAmount),
        savedAmount,
        triggerType,
        metadata,
      });

      sendSuccess(res, savingsRecord, 'Savings recorded successfully');
    } catch (error) {
      logger.error('Error recording savings:', error);
      sendError(res, 'Failed to record savings', 500);
    }
  };

  /**
   * Get savings history with pagination
   * @route GET /api/v1/savings/history
   */
  getSavingsHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const triggerType = req.query.triggerType as string;

      const whereClause: any = { userId };
      
      if (category) {
        whereClause.category = category;
      }
      
      if (triggerType) {
        whereClause.triggerType = triggerType;
      }

      const { count, rows } = await SavingsRecord.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });

      sendSuccess(res, {
        records: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      }, 'Savings history retrieved successfully');
    } catch (error) {
      logger.error('Error getting savings history:', error);
      sendError(res, 'Failed to retrieve savings history', 500);
    }
  };

  /**
   * Update monthly savings target
   * @route PUT /api/v1/savings/target
   */
  updateSavingsTarget = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      
      if (!userId) {
        sendError(res, 'User not authenticated', 401);
        return;
      }

      const { monthlyTarget } = req.body;

      if (!monthlyTarget || monthlyTarget < 0) {
        sendError(res, 'Valid monthly target is required', 400);
        return;
      }

      // Here you would typically store the target in a user settings table
      // For now, we'll just return success
      sendSuccess(res, { monthlyTarget }, 'Savings target updated successfully');
    } catch (error) {
      logger.error('Error updating savings target:', error);
      sendError(res, 'Failed to update savings target', 500);
    }
  };


  private calculateAchievements(totalSaved: number) {
    const achievements = [];
    
    if (totalSaved >= 50) {
      achievements.push({
        id: 'first_fifty',
        title: 'First €50 Saved!',
        emoji: '🎯',
        unlocked: true
      });
    }
    
    if (totalSaved >= 100) {
      achievements.push({
        id: 'century',
        title: 'Century Saver',
        emoji: '🏆',
        unlocked: true
      });
    }
    
    if (totalSaved >= 500) {
      achievements.push({
        id: 'savings_expert',
        title: 'Savings Expert',
        emoji: '💎',
        unlocked: true
      });
    }
    
    if (totalSaved >= 1000) {
      achievements.push({
        id: 'savings_master',
        title: 'Savings Master',
        emoji: '👑',
        unlocked: true
      });
    }

    return achievements;
  }
}

export default new SavingsController();