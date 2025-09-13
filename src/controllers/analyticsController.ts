import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import UsageAnalytics from '../models/UsageAnalytics';
import UserBehavior from '../models/UserBehavior';
import AnalyticsReport from '../models/AnalyticsReport';
import AnalyticsService from '../services/analyticsService';
import DataVisualizationService from '../services/dataVisualizationService';
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

/**
 * Track user behavior event
 */
export const trackBehavior = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { sessionId, eventType, eventName, metadata } = req.body;

    await AnalyticsService.trackBehavior(userId, sessionId, eventType, eventName, metadata);

    logger.info(`Behavior event tracked: ${eventType}/${eventName} for user: ${userId}`);
    sendSuccess(res, { message: 'Behavior event tracked successfully' }, 'Event tracked successfully', 201);
  } catch (error) {
    logger.error('Track behavior error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get user engagement metrics
 */
export const getUserEngagement = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { days = 30 } = req.query;

    const engagement = await AnalyticsService.getUserEngagementMetrics(userId, parseInt(days as string));

    sendSuccess(res, engagement, 'User engagement metrics retrieved successfully');
  } catch (error) {
    logger.error('Get user engagement error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get feature usage metrics
 */
export const getFeatureUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { featureName, days = 30 } = req.query;

    const metrics = await AnalyticsService.getFeatureUsageMetrics(
      featureName as string,
      parseInt(days as string)
    );

    sendSuccess(res, metrics, 'Feature usage metrics retrieved successfully');
  } catch (error) {
    logger.error('Get feature usage error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get behavior insights
 */
export const getBehaviorInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { days = 30 } = req.query;

    const insights = await AnalyticsService.getBehaviorInsights(userId, parseInt(days as string));

    sendSuccess(res, insights, 'Behavior insights retrieved successfully');
  } catch (error) {
    logger.error('Get behavior insights error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Generate analytics report
 */
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { reportType, dateRange, filters } = req.body;

    const report = await AnalyticsService.generateReport(
      reportType,
      userId,
      dateRange,
      filters
    );

    sendSuccess(res, report, 'Analytics report generated successfully', 201);
  } catch (error) {
    logger.error('Generate report error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get chart data for visualization
 */
export const getChartData = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { chartType, metric, days = 30, filters } = req.query;

    const chartData = await DataVisualizationService.generateChartData(
      userId,
      chartType as any,
      metric as any,
      filters ? JSON.parse(filters as string) : undefined
    );

    sendSuccess(res, chartData, 'Chart data retrieved successfully');
  } catch (error) {
    logger.error('Get chart data error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get dashboard configuration
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { days = 30, customWidgets } = req.query;

    const dashboard = await DataVisualizationService.generateDashboard(
      userId,
      days as string
    );

    sendSuccess(res, dashboard, 'Dashboard configuration retrieved successfully');
  } catch (error) {
    logger.error('Get dashboard error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get saved reports
 */
export const getSavedReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { reportType, limit = 10, offset = 0 } = req.query;

    const whereClause: any = { userId };
    if (reportType) {
      whereClause.reportType = reportType;
    }

    const reports = await AnalyticsReport.findAll({
      where: whereClause,
      order: [['generatedAt', 'DESC']],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const totalCount = await AnalyticsReport.count({ where: whereClause });

    sendSuccess(res, {
      reports: reports.map(report => ({
        id: report.id,
        reportType: report.reportType,
        reportName: report.reportName,
        dateRange: report.dateRange,
        generatedAt: report.generatedAt,
        createdAt: report.createdAt,
      })),
      totalCount,
      hasMore: parseInt(offset as string) + reports.length < totalCount,
    }, 'Saved reports retrieved successfully');
  } catch (error) {
    logger.error('Get saved reports error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get specific report by ID
 */
export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { id } = req.params;

    const report = await AnalyticsReport.findOne({
      where: { id, userId },
    });

    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }

    sendSuccess(res, {
      id: report.id,
      reportType: report.reportType,
      reportName: report.reportName,
      reportData: report.reportData,
      dateRange: report.dateRange,
      filters: report.filters,
      generatedAt: report.generatedAt,
      createdAt: report.createdAt,
    }, 'Report retrieved successfully');
  } catch (error) {
    logger.error('Get report by ID error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Delete report
 */
export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { id } = req.params;

    const report = await AnalyticsReport.findOne({
      where: { id, userId },
    });

    if (!report) {
      sendError(res, 'Report not found', 404);
      return;
    }

    await report.destroy();

    sendSuccess(res, { message: 'Report deleted successfully' }, 'Report deleted successfully');
  } catch (error) {
    logger.error('Delete report error:', error);
    sendError(res, 'Internal server error', 500);
  }
};