import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import SleepLog from '../models/SleepLog';
import logger from '../utils/logger';

export const createSleepLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { startTime, endTime, qualityRating, notes } = req.body;
    const userId = authReq.user!.id;

    // Validate that endTime is after startTime
    if (new Date(endTime) <= new Date(startTime)) {
      sendError(res, 'End time must be after start time', 400);
      return;
    }

    const sleepLog = await SleepLog.create({
      userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      qualityRating,
      notes,
    });

    logger.info(`Sleep log created for user: ${userId}`);

    sendSuccess(res, {
      id: sleepLog.id,
      startTime: sleepLog.startTime,
      endTime: sleepLog.endTime,
      duration: sleepLog.getDuration(),
      qualityRating: sleepLog.qualityRating,
      notes: sleepLog.notes,
      createdAt: sleepLog.createdAt,
    }, 'Sleep log created successfully', 201);
  } catch (error) {
    logger.error('Create sleep log error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getSleepLogs = async (req: Request, res: Response): Promise<void> => {
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

    const { count, rows } = await SleepLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const sleepLogs = rows.map(log => ({
      id: log.id,
      startTime: log.startTime,
      endTime: log.endTime,
      duration: log.getDuration(),
      qualityRating: log.qualityRating,
      notes: log.notes,
      createdAt: log.createdAt,
    }));

    sendPaginated(res, sleepLogs, Number(page), Number(limit), count);
  } catch (error) {
    logger.error('Get sleep logs error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getSleepTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { period = 'week' } = req.query;

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
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
    }

    const sleepLogs = await SleepLog.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['createdAt', 'ASC']],
    });

    const trends = sleepLogs.map(log => ({
      duration: log.getDuration(),
      qualityRating: log.qualityRating,
      date: log.createdAt,
    }));

    const averageDuration = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum, log) => sum + log.getDuration(), 0) / sleepLogs.length
      : 0;

    const averageQuality = sleepLogs.length > 0 
      ? sleepLogs.reduce((sum, log) => sum + log.qualityRating, 0) / sleepLogs.length
      : 0;

    sendSuccess(res, {
      trends,
      averageDuration: Math.round(averageDuration * 100) / 100,
      averageQuality: Math.round(averageQuality * 100) / 100,
      period,
      totalLogs: sleepLogs.length,
    }, 'Sleep trends retrieved successfully');
  } catch (error) {
    logger.error('Get sleep trends error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateSleepLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { startTime, endTime, qualityRating, notes } = req.body;
    const userId = authReq.user!.id;

    const sleepLog = await SleepLog.findOne({
      where: { id, userId },
    });

    if (!sleepLog) {
      sendError(res, 'Sleep log not found', 404);
      return;
    }

    // Validate times if provided
    const newStartTime = startTime ? new Date(startTime) : sleepLog.startTime;
    const newEndTime = endTime ? new Date(endTime) : sleepLog.endTime;

    if (newEndTime <= newStartTime) {
      sendError(res, 'End time must be after start time', 400);
      return;
    }

    await sleepLog.update({
      startTime: newStartTime,
      endTime: newEndTime,
      qualityRating: qualityRating || sleepLog.qualityRating,
      notes: notes || sleepLog.notes,
    });

    sendSuccess(res, {
      id: sleepLog.id,
      startTime: sleepLog.startTime,
      endTime: sleepLog.endTime,
      duration: sleepLog.getDuration(),
      qualityRating: sleepLog.qualityRating,
      notes: sleepLog.notes,
      createdAt: sleepLog.createdAt,
    }, 'Sleep log updated successfully');
  } catch (error) {
    logger.error('Update sleep log error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteSleepLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const sleepLog = await SleepLog.findOne({
      where: { id, userId },
    });

    if (!sleepLog) {
      sendError(res, 'Sleep log not found', 404);
      return;
    }

    await sleepLog.destroy();

    sendSuccess(res, null, 'Sleep log deleted successfully');
  } catch (error) {
    logger.error('Delete sleep log error:', error);
    sendError(res, 'Internal server error', 500);
  }
};