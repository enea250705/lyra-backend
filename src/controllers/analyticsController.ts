import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import UsageAnalytics from '../models/UsageAnalytics';
import logger from '../utils/logger';

export const trackEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { featureName, action, metadata } = req.body;
    const userId = authReq.user!.id;

    const analytics = await UsageAnalytics.create({
      userId,
      featureName,
      action,
      metadata,
    });

    logger.info(`Analytics event tracked: ${featureName}/${action} for user: ${userId}`);

    sendSuccess(res, {
      id: analytics.id,
      featureName: analytics.featureName,
      action: analytics.action,
      metadata: analytics.metadata,
      createdAt: analytics.createdAt,
    }, 'Event tracked successfully', 201);
  } catch (error) {
    logger.error('Track event error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getUserAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { period = 'week', feature } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    const whereClause: any = {
      userId,
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (feature) {
      whereClause.featureName = feature;
    }

    const analytics = await UsageAnalytics.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    // Aggregate data by feature
    const featureUsage: { [key: string]: number } = {};
    const actionCounts: { [key: string]: number } = {};

    analytics.forEach(event => {
      featureUsage[event.featureName] = (featureUsage[event.featureName] || 0) + 1;
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    });

    const mostUsedFeature = Object.keys(featureUsage).reduce((a, b) => 
      featureUsage[a] > featureUsage[b] ? a : b, ''
    );

    sendSuccess(res, {
      period,
      totalEvents: analytics.length,
      featureUsage,
      actionCounts,
      mostUsedFeature,
      events: analytics.map(event => ({
        id: event.id,
        featureName: event.featureName,
        action: event.action,
        metadata: event.metadata,
        createdAt: event.createdAt,
      })),
    }, 'User analytics retrieved successfully');
  } catch (error) {
    logger.error('Get user analytics error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getFeatureAdoption = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const features = ['mood', 'energy', 'sleep', 'focus', 'journal', 'calendar', 'finance'];
    const adoption: { [key: string]: { used: boolean; lastUsed?: Date; usageCount: number } } = {};

    for (const feature of features) {
      const lastEvent = await UsageAnalytics.findOne({
        where: { userId, featureName: feature },
        order: [['createdAt', 'DESC']],
      });

      const usageCount = await UsageAnalytics.count({
        where: { userId, featureName: feature },
      });

      adoption[feature] = {
        used: !!lastEvent,
        lastUsed: lastEvent?.createdAt,
        usageCount,
      };
    }

    sendSuccess(res, {
      adoption,
      totalFeatures: features.length,
      featuresUsed: Object.values(adoption).filter(f => f.used).length,
    }, 'Feature adoption retrieved successfully');
  } catch (error) {
    logger.error('Get feature adoption error:', error);
    sendError(res, 'Internal server error', 500);
  }
};