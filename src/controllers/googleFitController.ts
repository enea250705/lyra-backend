import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

// Google Fit Service and Models
import googleFitService from '../services/googleFitService';
import GoogleFitConnection from '../models/GoogleFitConnection';
import GoogleFitSteps from '../models/GoogleFitSteps';
import GoogleFitHeartRate from '../models/GoogleFitHeartRate';
import GoogleFitActivities from '../models/GoogleFitActivities';
import GoogleFitSleep from '../models/GoogleFitSleep';
import GoogleFitWeight from '../models/GoogleFitWeight';
import GoogleFitSyncStatus from '../models/GoogleFitSyncStatus';

class GoogleFitController {
  /**
   * Connect Google Fit account
   * @route POST /api/v1/google-fit/connect
   */
  connectGoogleFit = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { accessToken, refreshToken, expiresIn, scope } = req.body;
      const userId = authReq.user!.id;

      if (!accessToken) {
        sendError(res, 'Access token is required', 400);
        return;
      }

      // Verify the token with Google Fit API
      const isValid = await googleFitService.verifyAccessToken(accessToken);
      if (!isValid) {
        sendError(res, 'Invalid Google Fit access token', 400);
        return;
      }

      // Find or create connection
      let connection = await GoogleFitConnection.findOne({ where: { userId } });
      
      if (connection) {
        await connection.updateTokens(accessToken, refreshToken, expiresIn);
      } else {
        const expiresAt = new Date(Date.now() + (expiresIn || 3600) * 1000);
        connection = await GoogleFitConnection.create({
          userId,
          accessToken,
          refreshToken,
          tokenExpiresAt: expiresAt,
          scope: scope || 'fitness.activity.read fitness.body.read fitness.heart_rate.read fitness.sleep.read',
          isActive: true
        });
      }

      // Initialize sync statuses for this user
      await GoogleFitSyncStatus.initializeUserSyncStatuses(userId);

      logger.info(`Google Fit connected for user: ${userId}`);

      sendSuccess(res, {
        connected: true,
        connectionId: connection.id,
        scope: connection.scope,
        isActive: connection.isActive
      }, 'Google Fit connected successfully');

    } catch (error) {
      logger.error('Google Fit connection error:', error);
      sendError(res, 'Failed to connect Google Fit', 500);
    }
  };

  /**
   * Disconnect Google Fit account
   * @route POST /api/v1/google-fit/disconnect
   */
  disconnectGoogleFit = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const connection = await GoogleFitConnection.findOne({ where: { userId } });
      if (!connection) {
        sendError(res, 'No Google Fit connection found', 404);
        return;
      }

      await connection.deactivate();

      logger.info(`Google Fit disconnected for user: ${userId}`);

      sendSuccess(res, {
        connected: false
      }, 'Google Fit disconnected successfully');

    } catch (error) {
      logger.error('Google Fit disconnection error:', error);
      sendError(res, 'Failed to disconnect Google Fit', 500);
    }
  };

  /**
   * Get Google Fit connection status
   * @route GET /api/v1/google-fit/status
   */
  getConnectionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const connection = await GoogleFitConnection.findOne({ where: { userId } });
      const syncHealth = await GoogleFitSyncStatus.getOverallSyncHealth(userId);

      sendSuccess(res, {
        connected: !!connection && connection.isActive,
        tokenExpired: connection ? connection.isTokenExpired() : true,
        scope: connection?.scope,
        syncHealth
      }, 'Connection status retrieved successfully');

    } catch (error) {
      logger.error('Get connection status error:', error);
      sendError(res, 'Failed to get connection status', 500);
    }
  };

  /**
   * Sync all Google Fit data
   * @route POST /api/v1/google-fit/sync
   */
  syncAllData = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { days = 30 } = req.body;
      const userId = authReq.user!.id;

      const connection = await GoogleFitConnection.findOne({ where: { userId } });
      if (!connection || !connection.isActive || connection.isTokenExpired()) {
        sendError(res, 'Invalid or expired Google Fit connection', 401);
        return;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const syncResults = await this.performDataSync(userId, connection.accessToken, startDate, endDate);

      sendSuccess(res, {
        syncCompleted: true,
        syncResults,
        syncedPeriod: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }, 'Google Fit data synced successfully');

    } catch (error) {
      logger.error('Sync all data error:', error);
      sendError(res, 'Failed to sync Google Fit data', 500);
    }
  };

  /**
   * Get Google Fit steps data
   * @route GET /api/v1/google-fit/steps
   */
  getStepsData = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { startDate, endDate, page = 1, limit = 30 } = req.query;
      const userId = authReq.user!.id;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { userId };
      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [startDate, endDate]
        };
      }

      const steps = await GoogleFitSteps.findAndCountAll({
        where: whereClause,
        order: [['date', 'DESC']],
        limit: Number(limit),
        offset
      });

      // Calculate analytics
      const weeklyAverage = await GoogleFitSteps.getWeeklyAverage(userId, new Date());
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthlyTotal = await GoogleFitSteps.getMonthlyTotal(userId, currentYear, currentMonth);

      sendSuccess(res, {
        steps: steps.rows,
        pagination: {
          total: steps.count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(steps.count / Number(limit))
        },
        analytics: {
          weeklyAverage,
          monthlyTotal
        }
      }, 'Steps data retrieved successfully');

    } catch (error) {
      logger.error('Get steps data error:', error);
      sendError(res, 'Failed to retrieve steps data', 500);
    }
  };

  /**
   * Get Google Fit heart rate data
   * @route GET /api/v1/google-fit/heart-rate
   */
  getHeartRateData = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { date } = req.query;
      const userId = authReq.user!.id;

      const targetDate = date ? new Date(date as string) : new Date();
      
      const avgHeartRate = await GoogleFitHeartRate.getAverageForDay(userId, targetDate);
      const restingHeartRate = await GoogleFitHeartRate.getRestingHeartRate(userId, targetDate);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const heartRateData = await GoogleFitHeartRate.findAll({
        where: {
          userId,
          timestamp: {
            [Op.between]: [startOfDay, endOfDay]
          }
        },
        order: [['timestamp', 'ASC']]
      });

      sendSuccess(res, {
        heartRateData,
        analytics: {
          averageHeartRate: avgHeartRate,
          restingHeartRate,
          dataPoints: heartRateData.length
        }
      }, 'Heart rate data retrieved successfully');

    } catch (error) {
      logger.error('Get heart rate data error:', error);
      sendError(res, 'Failed to retrieve heart rate data', 500);
    }
  };

  /**
   * Get Google Fit activities data
   * @route GET /api/v1/google-fit/activities
   */
  getActivitiesData = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { startDate, endDate, page = 1, limit = 20 } = req.query;
      const userId = authReq.user!.id;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { userId };
      if (startDate && endDate) {
        whereClause.startTime = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      const activities = await GoogleFitActivities.findAndCountAll({
        where: whereClause,
        order: [['startTime', 'DESC']],
        limit: Number(limit),
        offset
      });

      // Get analytics
      const weeklyStats = await GoogleFitActivities.getWeeklyStats(userId, new Date());
      const workoutConsistency = await GoogleFitActivities.getWorkoutConsistency(userId, 30);

      sendSuccess(res, {
        activities: activities.rows,
        pagination: {
          total: activities.count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(activities.count / Number(limit))
        },
        analytics: {
          weeklyStats,
          workoutConsistency
        }
      }, 'Activities data retrieved successfully');

    } catch (error) {
      logger.error('Get activities data error:', error);
      sendError(res, 'Failed to retrieve activities data', 500);
    }
  };

  /**
   * Get Google Fit sleep data
   * @route GET /api/v1/google-fit/sleep
   */
  getSleepData = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { startDate, endDate, page = 1, limit = 30 } = req.query;
      const userId = authReq.user!.id;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { userId };
      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [startDate, endDate]
        };
      }

      const sleepData = await GoogleFitSleep.findAndCountAll({
        where: whereClause,
        order: [['date', 'DESC']],
        limit: Number(limit),
        offset
      });

      // Get analytics
      const weeklyAverage = await GoogleFitSleep.getWeeklyAverage(userId, new Date());
      const sleepTrends = await GoogleFitSleep.getSleepTrends(userId, 30);

      sendSuccess(res, {
        sleepData: sleepData.rows,
        pagination: {
          total: sleepData.count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(sleepData.count / Number(limit))
        },
        analytics: {
          weeklyAverage,
          sleepTrends
        }
      }, 'Sleep data retrieved successfully');

    } catch (error) {
      logger.error('Get sleep data error:', error);
      sendError(res, 'Failed to retrieve sleep data', 500);
    }
  };

  /**
   * Get Google Fit weight data
   * @route GET /api/v1/google-fit/weight
   */
  getWeightData = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { startDate, endDate, page = 1, limit = 30 } = req.query;
      const userId = authReq.user!.id;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { userId };
      if (startDate && endDate) {
        whereClause.timestamp = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      const weightData = await GoogleFitWeight.findAndCountAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit: Number(limit),
        offset
      });

      // Get analytics
      const weightTrend = await GoogleFitWeight.getWeightTrend(userId, 30);
      const bodyCompositionTrend = await GoogleFitWeight.getBodyCompositionTrend(userId, 30);
      const latestWeight = await GoogleFitWeight.getLatestWeight(userId);

      sendSuccess(res, {
        weightData: weightData.rows,
        pagination: {
          total: weightData.count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(weightData.count / Number(limit))
        },
        analytics: {
          weightTrend,
          bodyCompositionTrend,
          latestWeight
        }
      }, 'Weight data retrieved successfully');

    } catch (error) {
      logger.error('Get weight data error:', error);
      sendError(res, 'Failed to retrieve weight data', 500);
    }
  };

  /**
   * Get comprehensive Google Fit dashboard data
   * @route GET /api/v1/google-fit/dashboard
   */
  getDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user!.id;

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get today's data
      const [todaySteps, todayHeartRate, latestWeight, recentActivities] = await Promise.all([
        GoogleFitSteps.findOne({ where: { userId, date: todayStr } }),
        GoogleFitHeartRate.getAverageForDay(userId, today),
        GoogleFitWeight.getLatestWeight(userId),
        GoogleFitActivities.findAll({
          where: { userId },
          order: [['startTime', 'DESC']],
          limit: 5
        })
      ]);

      // Get analytics
      const [weeklyStepsAvg, weeklyActivityStats, syncHealth] = await Promise.all([
        GoogleFitSteps.getWeeklyAverage(userId, today),
        GoogleFitActivities.getWeeklyStats(userId, today),
        GoogleFitSyncStatus.getOverallSyncHealth(userId)
      ]);

      sendSuccess(res, {
        today: {
          steps: todaySteps?.steps || 0,
          stepsGoalProgress: todaySteps?.getStepsGoalProgress() || 0,
          averageHeartRate: todayHeartRate,
          distance: todaySteps?.getDistanceInKm() || 0,
          calories: todaySteps?.calories || 0
        },
        weekly: {
          averageSteps: weeklyStepsAvg,
          activityStats: weeklyActivityStats
        },
        latest: {
          weight: latestWeight,
          activities: recentActivities
        },
        syncHealth
      }, 'Dashboard data retrieved successfully');

    } catch (error) {
      logger.error('Get dashboard data error:', error);
      sendError(res, 'Failed to retrieve dashboard data', 500);
    }
  };

  /**
   * Perform data synchronization
   */
  private async performDataSync(userId: string, accessToken: string, startDate: Date, endDate: Date) {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const syncResults = {
      steps: { success: false, count: 0, error: null },
      heartRate: { success: false, count: 0, error: null },
      activities: { success: false, count: 0, error: null },
      sleep: { success: false, count: 0, error: null },
      weight: { success: false, count: 0, error: null }
    };

    // Sync Steps Data
    try {
      const stepsData = await googleFitService.getStepsData(accessToken, startDateStr, endDateStr);
      for (const daySteps of stepsData) {
        await GoogleFitSteps.upsert({
          userId,
          date: daySteps.date,
          steps: daySteps.steps,
          distance: daySteps.distance,
          calories: daySteps.calories,
          activeMinutes: daySteps.activeMinutes
        });
      }
      syncResults.steps = { success: true, count: stepsData.length, error: null };
      await this.updateSyncStatus(userId, 'steps', endDate, 'success');
    } catch (error: any) {
      syncResults.steps.error = error.message;
      await this.updateSyncStatus(userId, 'steps', endDate, 'failed', error.message);
    }

    // Sync Heart Rate Data
    try {
      const heartRateData = await googleFitService.getHeartRateData(accessToken, startDateStr, endDateStr);
      for (const hrData of heartRateData) {
        await GoogleFitHeartRate.upsert({
          userId,
          timestamp: new Date(hrData.timestamp),
          bpm: hrData.bpm,
          accuracy: hrData.accuracy
        });
      }
      syncResults.heartRate = { success: true, count: heartRateData.length, error: null };
      await this.updateSyncStatus(userId, 'heart_rate', endDate, 'success');
    } catch (error: any) {
      syncResults.heartRate.error = error.message;
      await this.updateSyncStatus(userId, 'heart_rate', endDate, 'failed', error.message);
    }

    // Sync Activities Data
    try {
      const activitiesData = await googleFitService.getActivityData(accessToken, startDateStr, endDateStr);
      for (const activity of activitiesData) {
        await GoogleFitActivities.upsert({
          userId,
          activityType: activity.activityType,
          startTime: new Date(activity.startTime),
          endTime: new Date(activity.endTime),
          durationMinutes: activity.duration,
          calories: activity.calories,
          distance: activity.distance,
          steps: activity.steps
        });
      }
      syncResults.activities = { success: true, count: activitiesData.length, error: null };
      await this.updateSyncStatus(userId, 'activities', endDate, 'success');
    } catch (error: any) {
      syncResults.activities.error = error.message;
      await this.updateSyncStatus(userId, 'activities', endDate, 'failed', error.message);
    }

    // Sync Sleep Data
    try {
      const sleepData = await googleFitService.getSleepData(accessToken, startDateStr, endDateStr);
      for (const sleep of sleepData) {
        await GoogleFitSleep.upsert({
          userId,
          date: sleep.date,
          bedtime: new Date(sleep.bedtime),
          wakeTime: new Date(sleep.wakeTime),
          durationHours: sleep.duration,
          sleepStages: sleep.sleepStages
        });
      }
      syncResults.sleep = { success: true, count: sleepData.length, error: null };
      await this.updateSyncStatus(userId, 'sleep', endDate, 'success');
    } catch (error: any) {
      syncResults.sleep.error = error.message;
      await this.updateSyncStatus(userId, 'sleep', endDate, 'failed', error.message);
    }

    // Sync Weight Data
    try {
      const weightData = await googleFitService.getWeightData(accessToken, startDateStr, endDateStr);
      for (const weight of weightData) {
        await GoogleFitWeight.upsert({
          userId,
          timestamp: new Date(weight.timestamp),
          weightKg: weight.weight,
          bodyFatPercentage: weight.bodyFat,
          muscleMassKg: 0 // Google Fit doesn't typically provide muscle mass
        });
      }
      syncResults.weight = { success: true, count: weightData.length, error: null };
      await this.updateSyncStatus(userId, 'weight', endDate, 'success');
    } catch (error: any) {
      syncResults.weight.error = error.message;
      await this.updateSyncStatus(userId, 'weight', endDate, 'failed', error.message);
    }

    return syncResults;
  }

  /**
   * Update sync status for a data type
   */
  private async updateSyncStatus(
    userId: string, 
    dataType: 'steps' | 'heart_rate' | 'activities' | 'sleep' | 'weight',
    syncDate: Date,
    status: 'success' | 'failed',
    errorMessage?: string
  ) {
    const syncStatus = await GoogleFitSyncStatus.findOne({
      where: { userId, dataType }
    });

    if (syncStatus) {
      if (status === 'success') {
        await syncStatus.updateSyncSuccess(syncDate);
      } else {
        await syncStatus.updateSyncFailure(errorMessage || 'Unknown error');
      }
    }
  }
}

export default new GoogleFitController(); 