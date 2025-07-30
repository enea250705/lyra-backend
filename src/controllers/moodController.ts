import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import MoodEntry from '../models/MoodEntry';
import logger from '../utils/logger';

export const createMoodEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { moodValue, moodCategory, notes } = req.body;
    const userId = authReq.user!.id;

    const moodEntry = await MoodEntry.create({
      userId,
      moodValue,
      moodCategory,
      notes,
    });

    logger.info(`Mood entry created for user: ${userId}`);

    sendSuccess(res, {
      id: moodEntry.id,
      moodValue: moodEntry.moodValue,
      moodCategory: moodEntry.moodCategory,
      notes: moodEntry.notes,
      createdAt: moodEntry.createdAt,
    }, 'Mood entry created successfully', 201);
  } catch (error) {
    logger.error('Create mood entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getMoodEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { userId };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const { count, rows } = await MoodEntry.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const moodEntries = rows.map(entry => ({
      id: entry.id,
      moodValue: entry.moodValue,
      moodCategory: entry.moodCategory,
      notes: entry.notes,
      createdAt: entry.createdAt,
    }));

    sendPaginated(res, moodEntries, Number(page), Number(limit), count);
  } catch (error) {
    logger.error('Get mood entries error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getMoodEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const moodEntry = await MoodEntry.findOne({
      where: { id, userId },
    });

    if (!moodEntry) {
      sendError(res, 'Mood entry not found', 404);
      return;
    }

    sendSuccess(res, {
      id: moodEntry.id,
      moodValue: moodEntry.moodValue,
      moodCategory: moodEntry.moodCategory,
      notes: moodEntry.notes,
      createdAt: moodEntry.createdAt,
    }, 'Mood entry retrieved successfully');
  } catch (error) {
    logger.error('Get mood entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateMoodEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { moodValue, moodCategory, notes } = req.body;
    const userId = authReq.user!.id;

    const moodEntry = await MoodEntry.findOne({
      where: { id, userId },
    });

    if (!moodEntry) {
      sendError(res, 'Mood entry not found', 404);
      return;
    }

    await moodEntry.update({
      moodValue: moodValue || moodEntry.moodValue,
      moodCategory: moodCategory || moodEntry.moodCategory,
      notes: notes || moodEntry.notes,
    });

    sendSuccess(res, {
      id: moodEntry.id,
      moodValue: moodEntry.moodValue,
      moodCategory: moodEntry.moodCategory,
      notes: moodEntry.notes,
      createdAt: moodEntry.createdAt,
    }, 'Mood entry updated successfully');
  } catch (error) {
    logger.error('Update mood entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteMoodEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const moodEntry = await MoodEntry.findOne({
      where: { id, userId },
    });

    if (!moodEntry) {
      sendError(res, 'Mood entry not found', 404);
      return;
    }

    await moodEntry.destroy();

    sendSuccess(res, null, 'Mood entry deleted successfully');
  } catch (error) {
    logger.error('Delete mood entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getMoodTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { period = 'week' } = req.query;

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

    const moodEntries = await MoodEntry.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['createdAt', 'ASC']],
    });

    const trends = moodEntries.map(entry => ({
      moodValue: entry.moodValue,
      moodCategory: entry.moodCategory,
      date: entry.createdAt,
    }));

    const average = moodEntries.length > 0 
      ? moodEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / moodEntries.length
      : 0;

    sendSuccess(res, {
      trends,
      average: Math.round(average * 100) / 100,
      period,
      totalEntries: moodEntries.length,
    }, 'Mood trends retrieved successfully');
  } catch (error) {
    logger.error('Get mood trends error:', error);
    sendError(res, 'Internal server error', 500);
  }
};