import { Op, Sequelize } from 'sequelize';
import UserBehavior from '../models/UserBehavior';
import UsageAnalytics from '../models/UsageAnalytics';
import AnalyticsReport from '../models/AnalyticsReport';
import User from '../models/User';
import MoodEntry from '../models/MoodEntry';
import SleepLog from '../models/SleepLog';
import JournalEntry from '../models/JournalEntry';
import SavingsRecord from '../models/SavingsRecord';
import logger from '../utils/logger';

export interface AnalyticsFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  reportType?: string;
}

export interface UserEngagementMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  returnUserRate: number;
  featureAdoptionRate: number;
}

export interface FeatureUsageMetrics {
  eventType: string;
  totalUsers: number;
  activeUsers: number;
  usageCount: number;
  averageUsagePerUser: number;
  retentionRate: number;
  lastUsed: Date;
}

export interface BehaviorInsights {
  mostVisitedPages: Array<{ page: string; visits: number; avgTimeOnPage: number }>;
  topClickedElements: Array<{ element: string; clicks: number; type: string }>;
  userJourney: Array<{ step: number; page: string; users: number; dropoffRate: number }>;
  scrollBehavior: {
    averageScrollDepth: number;
    scrollDepthDistribution: Array<{ range: string; percentage: number }>;
  };
}

export class AnalyticsService {
  /**
   * Track user behavior event
   */
  static async trackBehavior(
    userId: string,
    sessionId: string,
    eventType: 'page_view' | 'click' | 'scroll' | 'focus' | 'blur' | 'form_submit' | 'api_call',
    eventName: string,
    metadata?: any
  ): Promise<void> {
    try {
      await UserBehavior.create({
        userId,
        sessionId,
        eventType,
        eventName,
        ...metadata,
      });
    } catch (error) {
      logger.error('Error tracking behavior:', error);
    }
  }

  /**
   * Get user engagement metrics
   */
  static async getUserEngagementMetrics(userId: string, days: number = 30): Promise<UserEngagementMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get session data
    const sessions = await UserBehavior.findAll({
      where: {
        userId,
        eventType: 'page_view',
        createdAt: { [Op.gte]: startDate },
      },
      attributes: [
        'sessionId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'pageViews'],
        [Sequelize.fn('MIN', Sequelize.col('createdAt')), 'sessionStart'],
        [Sequelize.fn('MAX', Sequelize.col('createdAt')), 'sessionEnd'],
      ],
      group: ['sessionId'],
    });

    // Calculate metrics
    const totalSessions = sessions.length;
    const averageSessionDuration = sessions.reduce((acc, session) => {
      const sessionData = session.toJSON() as any;
      const duration = new Date(sessionData.sessionEnd).getTime() - 
                      new Date(sessionData.sessionStart).getTime();
      return acc + duration;
    }, 0) / (totalSessions * 1000 * 60); // Convert to minutes

    const pagesPerSession = sessions.reduce((acc, session) => {
      const sessionData = session.toJSON() as any;
      return acc + parseInt(sessionData.pageViews);
    }, 0) / totalSessions;

    // Calculate bounce rate (sessions with only 1 page view)
    const bounceRate = sessions.filter(session => {
      const sessionData = session.toJSON() as any;
      return parseInt(sessionData.pageViews) === 1;
    }).length / totalSessions * 100;

    // Calculate return user rate
    const uniqueDays = new Set(
      sessions.map(session => {
        const sessionData = session.toJSON() as any;
        return new Date(sessionData.sessionStart).toDateString();
      })
    ).size;
    const returnUserRate = uniqueDays / days * 100;

    // Calculate feature adoption rate
    const features = ['mood', 'energy', 'sleep', 'focus', 'journal', 'calendar', 'finance'];
    const usedFeatures = await UsageAnalytics.findAll({
      where: {
        userId,
        eventType: { [Op.in]: features },
        createdAt: { [Op.gte]: startDate },
      },
      attributes: ['eventType'],
      group: ['eventType'],
    });
    const featureAdoptionRate = usedFeatures.length / features.length * 100;

    return {
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      pagesPerSession: Math.round(pagesPerSession * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      returnUserRate: Math.round(returnUserRate * 100) / 100,
      featureAdoptionRate: Math.round(featureAdoptionRate * 100) / 100,
    };
  }

  /**
   * Get feature usage metrics
   */
  static async getFeatureUsageMetrics(eventType?: string, days: number = 30): Promise<FeatureUsageMetrics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const features = eventType ? [eventType] : 
      ['mood', 'energy', 'sleep', 'focus', 'journal', 'calendar', 'finance'];

    const metrics: FeatureUsageMetrics[] = [];

    for (const feature of features) {
      // Get total users who used this feature
      const totalUsers = await UsageAnalytics.count({
        where: { eventType: feature },
        distinct: true,
        col: 'userId',
      });

      // Get active users (used in last period)
      const activeUsers = await UsageAnalytics.count({
        where: {
          eventType: feature,
          createdAt: { [Op.gte]: startDate },
        },
        distinct: true,
        col: 'userId',
      });

      // Get usage count
      const usageCount = await UsageAnalytics.count({
        where: {
          eventType: feature,
          createdAt: { [Op.gte]: startDate },
        },
      });

      // Get last used date
      const lastUsed = await UsageAnalytics.findOne({
        where: { eventType: feature },
        order: [['createdAt', 'DESC']],
        attributes: ['createdAt'],
      });

      // Calculate retention rate (users who used feature in both periods)
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
      
      const previousPeriodUsers = await UsageAnalytics.count({
        where: {
          eventType: feature,
          createdAt: { 
            [Op.between]: [previousPeriodStart, startDate]
          },
        },
        distinct: true,
        col: 'userId',
      });

      // Get users who used feature in previous period
      const previousUsers = await UsageAnalytics.findAll({
        where: {
          eventType: feature,
          createdAt: { 
            [Op.between]: [previousPeriodStart, startDate]
          },
        },
        attributes: ['userId'],
        group: ['userId'],
      });

      // Get users who used feature in current period
      const currentUsers = await UsageAnalytics.findAll({
        where: {
          eventType: feature,
          createdAt: { [Op.gte]: startDate },
        },
        attributes: ['userId'],
        group: ['userId'],
      });

      // Calculate retention
      const previousUserIds = new Set(previousUsers.map(u => u.userId));
      const currentUserIds = new Set(currentUsers.map(u => u.userId));
      const retainedUsers = [...previousUserIds].filter(id => currentUserIds.has(id)).length;

      const retentionRate = previousPeriodUsers > 0 ? 
        (retainedUsers / previousPeriodUsers) * 100 : 0;

      metrics.push({
        eventType: feature,
        totalUsers,
        activeUsers,
        usageCount,
        averageUsagePerUser: activeUsers > 0 ? Math.round((usageCount / activeUsers) * 100) / 100 : 0,
        retentionRate: Math.round(retentionRate * 100) / 100,
        lastUsed: lastUsed?.createdAt || new Date(0),
      });
    }

    return metrics;
  }

  /**
   * Get behavior insights
   */
  static async getBehaviorInsights(userId?: string, days: number = 30): Promise<BehaviorInsights> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause: any = {
      createdAt: { [Op.gte]: startDate },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    // Most visited pages
    const mostVisitedPages = await UserBehavior.findAll({
      where: {
        ...whereClause,
        eventType: 'page_view',
      },
      attributes: [
        'pageUrl',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'visits'],
        [Sequelize.fn('AVG', Sequelize.col('timeOnPage')), 'avgTimeOnPage'],
      ],
      group: ['pageUrl'],
      order: [[Sequelize.literal('visits'), 'DESC']],
      limit: 10,
    });

    // Top clicked elements
    const topClickedElements = await UserBehavior.findAll({
      where: {
        ...whereClause,
        eventType: 'click',
      },
      attributes: [
        'elementId',
        'elementType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'clicks'],
      ],
      group: ['elementId', 'elementType'],
      order: [[Sequelize.literal('clicks'), 'DESC']],
      limit: 10,
    });

    // User journey analysis
    const userJourney = await UserBehavior.findAll({
      where: {
        ...whereClause,
        eventType: 'page_view',
      },
      attributes: [
        'pageUrl',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'users'],
      ],
      group: ['pageUrl'],
      order: [[Sequelize.literal('users'), 'DESC']],
    });

    // Calculate dropoff rates
    const journeyWithDropoff = userJourney.map((page, index) => {
      const pageData = page.toJSON() as any;
      return {
        step: index + 1,
        page: pageData.pageUrl || 'Unknown',
        users: parseInt(pageData.users),
        dropoffRate: index === 0 ? 0 : 
          ((userJourney[0].toJSON() as any).users - pageData.users) / 
          (userJourney[0].toJSON() as any).users * 100,
      };
    });

    // Scroll behavior
    const scrollData = await UserBehavior.findAll({
      where: {
        ...whereClause,
        eventType: 'scroll',
        scrollDepth: { [Op.ne]: null },
      },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('scrollDepth')), 'averageScrollDepth'],
      ],
    });

    const scrollDepthDistribution = await UserBehavior.findAll({
      where: {
        ...whereClause,
        eventType: 'scroll',
        scrollDepth: { [Op.ne]: null },
      },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.literal(`
          CASE 
            WHEN "scrollDepth" < 25 THEN '0-25%'
            WHEN "scrollDepth" < 50 THEN '25-50%'
            WHEN "scrollDepth" < 75 THEN '50-75%'
            WHEN "scrollDepth" < 90 THEN '75-90%'
            ELSE '90-100%'
          END
        `), 'range'],
      ],
      group: [
        Sequelize.literal(`
          CASE 
            WHEN "scrollDepth" < 25 THEN '0-25%'
            WHEN "scrollDepth" < 50 THEN '25-50%'
            WHEN "scrollDepth" < 75 THEN '50-75%'
            WHEN "scrollDepth" < 90 THEN '75-90%'
            ELSE '90-100%'
          END
        `) as any,
      ],
    });

    const totalScrollEvents = scrollDepthDistribution.reduce((sum, item) => {
      const itemData = item.toJSON() as any;
      return sum + parseInt(itemData.count);
    }, 0);

    return {
      mostVisitedPages: mostVisitedPages.map(page => {
        const pageData = page.toJSON() as any;
        return {
          page: pageData.pageUrl || 'Unknown',
          visits: parseInt(pageData.visits),
          avgTimeOnPage: Math.round(parseFloat(pageData.avgTimeOnPage || '0') * 100) / 100,
        };
      }),
      topClickedElements: topClickedElements.map(element => {
        const elementData = element.toJSON() as any;
        return {
          element: elementData.elementId || 'Unknown',
          clicks: parseInt(elementData.clicks),
          type: elementData.elementType || 'Unknown',
        };
      }),
      userJourney: journeyWithDropoff.slice(0, 10),
      scrollBehavior: {
        averageScrollDepth: Math.round(parseFloat((scrollData[0]?.toJSON() as any)?.averageScrollDepth || '0') * 100) / 100,
        scrollDepthDistribution: scrollDepthDistribution.map(item => {
          const itemData = item.toJSON() as any;
          return {
            range: itemData.range || 'Unknown',
            percentage: Math.round((parseInt(itemData.count) / totalScrollEvents) * 100 * 100) / 100,
          };
        }),
      },
    };
  }

  /**
   * Generate comprehensive analytics report
   */
  static async generateReport(
    reportType: 'user_summary' | 'feature_usage' | 'behavior_analysis' | 'retention' | 'conversion' | 'engagement',
    userId?: string,
    dateRange?: { start: Date; end: Date },
    filters?: any
  ): Promise<AnalyticsReport> {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.end || new Date();

    let reportData: any = {};

    switch (reportType) {
      case 'user_summary':
        if (userId) {
          reportData = await this.getUserEngagementMetrics(userId, 30);
        } else {
          // Global user summary
          const totalUsers = await User.count();
          const activeUsers = await UserBehavior.count({
            where: {
              createdAt: { [Op.gte]: startDate },
            },
            distinct: true,
            col: 'userId',
          });
          reportData = { totalUsers, activeUsers };
        }
        break;

      case 'feature_usage':
        reportData = await this.getFeatureUsageMetrics(undefined, 30);
        break;

      case 'behavior_analysis':
        reportData = await this.getBehaviorInsights(userId, 30);
        break;

      case 'engagement':
        if (userId) {
          reportData = await this.getUserEngagementMetrics(userId, 30);
        } else {
          reportData = await this.getFeatureUsageMetrics(undefined, 30);
        }
        break;

      default:
        reportData = { message: 'Report type not implemented yet' };
    }

    const report = await AnalyticsReport.create({
      userId,
      reportType,
      reportName: `${reportType}_report_${new Date().toISOString().split('T')[0]}`,
      reportData,
      dateRange: { start: startDate, end: endDate },
      filters,
      generatedAt: new Date(),
    });

    logger.info(`Analytics report generated: ${reportType} for user: ${userId || 'global'}`);
    return report;
  }

  /**
   * Get data visualization data for charts
   */
  static async getVisualizationData(
    chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter',
    metric: 'usage' | 'engagement' | 'retention' | 'conversion',
    userId?: string,
    days: number = 30
  ): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause: any = {
      createdAt: { [Op.gte]: startDate },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    switch (chartType) {
      case 'line':
        // Daily usage over time
        const dailyUsage = await UsageAnalytics.findAll({
          where: whereClause,
          attributes: [
            [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          ],
          group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
          order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
        });

        return {
          type: 'line',
          data: dailyUsage.map(item => {
            const itemData = item.toJSON() as any;
            return {
              x: itemData.date,
              y: parseInt(itemData.count),
            };
          }),
        };

      case 'bar':
        // Feature usage comparison
        const featureUsage = await this.getFeatureUsageMetrics(undefined, days);
        return {
          type: 'bar',
          data: featureUsage.map(feature => ({
            x: feature.eventType,
            y: feature.activeUsers,
          })),
        };

      case 'pie':
        // Event type distribution
        const eventDistribution = await UserBehavior.findAll({
          where: whereClause,
          attributes: [
            'eventType',
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
          ],
          group: ['eventType'],
        });

        return {
          type: 'pie',
          data: eventDistribution.map(item => {
            const itemData = item.toJSON() as any;
            return {
              label: itemData.eventType,
              value: parseInt(itemData.count),
            };
          }),
        };

      default:
        return { type: chartType, data: [] };
    }
  }
}

export default AnalyticsService;
