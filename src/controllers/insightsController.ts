import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import EmotionInsight from '../models/EmotionInsight';
import MoodEntry from '../models/MoodEntry';
import EnergyEntry from '../models/EnergyEntry';
import SleepLog from '../models/SleepLog';
import FocusSession from '../models/FocusSession';
import logger from '../utils/logger';

const generateWeeklySummary = async (userId: string): Promise<any> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const now = new Date();

  const [moodEntries, energyEntries, sleepLogs, focusSessions] = await Promise.all([
    MoodEntry.findAll({
      where: { userId, createdAt: { [Op.between]: [weekAgo, now] } },
      order: [['createdAt', 'ASC']],
    }),
    EnergyEntry.findAll({
      where: { userId, createdAt: { [Op.between]: [weekAgo, now] } },
      order: [['createdAt', 'ASC']],
    }),
    SleepLog.findAll({
      where: { userId, createdAt: { [Op.between]: [weekAgo, now] } },
      order: [['createdAt', 'ASC']],
    }),
    FocusSession.findAll({
      where: { userId, createdAt: { [Op.between]: [weekAgo, now] } },
      order: [['createdAt', 'ASC']],
    }),
  ]);

  const avgMood = moodEntries.length > 0 
    ? moodEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / moodEntries.length
    : 0;

  const avgEnergy = energyEntries.length > 0 
    ? energyEntries.reduce((sum, entry) => sum + entry.energyLevel, 0) / energyEntries.length
    : 0;

  const avgSleep = sleepLogs.length > 0 
    ? sleepLogs.reduce((sum, log) => sum + log.getDuration(), 0) / sleepLogs.length
    : 0;

  const avgSleepQuality = sleepLogs.length > 0 
    ? sleepLogs.reduce((sum, log) => sum + log.qualityRating, 0) / sleepLogs.length
    : 0;

  const totalFocusTime = focusSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
  const completedSessions = focusSessions.filter(session => session.completed).length;

  const insights = [];

  if (avgMood > 7) {
    insights.push("You've had a great week emotionally! Your mood has been consistently high.");
  } else if (avgMood < 4) {
    insights.push("Your mood has been lower this week. Consider reaching out to someone or practicing self-care.");
  }

  if (avgEnergy > 7) {
    insights.push("Your energy levels have been excellent this week!");
  } else if (avgEnergy < 4) {
    insights.push("Your energy seems low. Consider reviewing your sleep and nutrition habits.");
  }

  if (avgSleep < 6) {
    insights.push("You might benefit from more sleep. Try to get 7-9 hours per night.");
  } else if (avgSleep > 9) {
    insights.push("You've been getting plenty of sleep this week!");
  }

  if (totalFocusTime > 300) {
    insights.push(`Great focus this week! You've logged ${Math.round(totalFocusTime / 60)} hours of focused work.`);
  }

  return {
    period: 'week',
    averages: {
      mood: Math.round(avgMood * 100) / 100,
      energy: Math.round(avgEnergy * 100) / 100,
      sleep: Math.round(avgSleep * 100) / 100,
      sleepQuality: Math.round(avgSleepQuality * 100) / 100,
    },
    totals: {
      focusTime: totalFocusTime,
      completedFocusSessions: completedSessions,
      totalFocusSessions: focusSessions.length,
    },
    insights,
    dataPoints: {
      mood: moodEntries.length,
      energy: energyEntries.length,
      sleep: sleepLogs.length,
      focus: focusSessions.length,
    },
  };
};

const findCorrelations = async (userId: string): Promise<any> => {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const now = new Date();

  const [moodEntries, energyEntries, sleepLogs] = await Promise.all([
    MoodEntry.findAll({
      where: { userId, createdAt: { [Op.between]: [monthAgo, now] } },
      order: [['createdAt', 'ASC']],
    }),
    EnergyEntry.findAll({
      where: { userId, createdAt: { [Op.between]: [monthAgo, now] } },
      order: [['createdAt', 'ASC']],
    }),
    SleepLog.findAll({
      where: { userId, createdAt: { [Op.between]: [monthAgo, now] } },
      order: [['createdAt', 'ASC']],
    }),
  ]);

  const correlations = [];

  // Simple correlation analysis
  if (sleepLogs.length > 5 && moodEntries.length > 5) {
    const avgSleepDuration = sleepLogs.reduce((sum, log) => sum + log.getDuration(), 0) / sleepLogs.length;
    const avgMood = moodEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / moodEntries.length;

    if (avgSleepDuration > 7.5 && avgMood > 6) {
      correlations.push({
        type: 'sleep_mood',
        strength: 'strong',
        description: 'Better sleep appears to correlate with improved mood',
        recommendation: 'Continue maintaining your sleep schedule for better emotional well-being',
      });
    } else if (avgSleepDuration < 6 && avgMood < 5) {
      correlations.push({
        type: 'sleep_mood',
        strength: 'moderate',
        description: 'Poor sleep may be affecting your mood',
        recommendation: 'Try to improve your sleep quality and duration',
      });
    }
  }

  if (energyEntries.length > 5 && moodEntries.length > 5) {
    const avgEnergy = energyEntries.reduce((sum, entry) => sum + entry.energyLevel, 0) / energyEntries.length;
    const avgMood = moodEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / moodEntries.length;

    if (avgEnergy > 7 && avgMood > 6) {
      correlations.push({
        type: 'energy_mood',
        strength: 'strong',
        description: 'High energy levels correlate with better mood',
        recommendation: 'Activities that boost energy may help improve your mood',
      });
    }
  }

  return correlations;
};

export const getEmotionInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { regenerate = false } = req.query;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const now = new Date();

    let existingInsight = await EmotionInsight.findOne({
      where: {
        userId,
        insightType: 'weekly_summary',
        periodStart: { [Op.gte]: weekAgo },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!existingInsight || regenerate === 'true') {
      const summaryData = await generateWeeklySummary(userId);

      if (existingInsight) {
        await existingInsight.update({
          data: summaryData,
          periodEnd: now,
        });
      } else {
        existingInsight = await EmotionInsight.create({
          userId,
          insightType: 'weekly_summary',
          data: summaryData,
          periodStart: weekAgo,
          periodEnd: now,
        });
      }
    }

    sendSuccess(res, {
      id: existingInsight.id,
      insightType: existingInsight.insightType,
      data: existingInsight.data,
      periodStart: existingInsight.periodStart,
      periodEnd: existingInsight.periodEnd,
      createdAt: existingInsight.createdAt,
    }, 'Emotion insights retrieved successfully');
  } catch (error) {
    logger.error('Get emotion insights error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getCorrelations = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const correlations = await findCorrelations(userId);

    sendSuccess(res, {
      correlations,
      analyzed: true,
      period: 'month',
    }, 'Correlations retrieved successfully');
  } catch (error) {
    logger.error('Get correlations error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getWeeklySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const summaryData = await generateWeeklySummary(userId);

    sendSuccess(res, summaryData, 'Weekly summary retrieved successfully');
  } catch (error) {
    logger.error('Get weekly summary error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { period = 'month' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const [moodEntries, energyEntries, sleepLogs, focusSessions] = await Promise.all([
      MoodEntry.findAll({
        where: { userId, createdAt: { [Op.between]: [startDate, endDate] } },
        order: [['createdAt', 'ASC']],
      }),
      EnergyEntry.findAll({
        where: { userId, createdAt: { [Op.between]: [startDate, endDate] } },
        order: [['createdAt', 'ASC']],
      }),
      SleepLog.findAll({
        where: { userId, createdAt: { [Op.between]: [startDate, endDate] } },
        order: [['createdAt', 'ASC']],
      }),
      FocusSession.findAll({
        where: { userId, createdAt: { [Op.between]: [startDate, endDate] } },
        order: [['createdAt', 'ASC']],
      }),
    ]);

    const trends = {
      mood: moodEntries.map(entry => ({
        value: entry.moodValue,
        date: entry.createdAt,
      })),
      energy: energyEntries.map(entry => ({
        value: entry.energyLevel,
        date: entry.createdAt,
      })),
      sleep: sleepLogs.map(log => ({
        duration: log.getDuration(),
        quality: log.qualityRating,
        date: log.createdAt,
      })),
      focus: focusSessions.map(session => ({
        duration: session.durationMinutes || 0,
        completed: session.completed,
        date: session.createdAt,
      })),
    };

    sendSuccess(res, {
      trends,
      period,
      dataPoints: {
        mood: moodEntries.length,
        energy: energyEntries.length,
        sleep: sleepLogs.length,
        focus: focusSessions.length,
      },
    }, 'Trends retrieved successfully');
  } catch (error) {
    logger.error('Get trends error:', error);
    sendError(res, 'Internal server error', 500);
  }
};