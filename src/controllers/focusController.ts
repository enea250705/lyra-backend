import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import FocusSession from '../models/FocusSession';
import logger from '../utils/logger';

export const startFocusSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { goal } = req.body;
    const userId = authReq.user!.id;

    // Check if user has an active session
    const activeSession = await FocusSession.findOne({
      where: {
        userId,
        endTime: { [Op.is]: null },
      } as any,
    });

    if (activeSession) {
      sendError(res, 'You already have an active focus session', 409);
      return;
    }

    const focusSession = await FocusSession.create({
      userId,
      goal,
      startTime: new Date(),
    });

    logger.info(`Focus session started for user: ${userId}`);

    sendSuccess(res, {
      id: focusSession.id,
      goal: focusSession.goal,
      startTime: focusSession.startTime,
      isActive: focusSession.isActive(),
      createdAt: focusSession.createdAt,
    }, 'Focus session started successfully', 201);
  } catch (error) {
    logger.error('Start focus session error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const endFocusSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { completed = false, distractionCount = 0 } = req.body;
    const userId = authReq.user!.id;

    const focusSession = await FocusSession.findOne({
      where: { id, userId, endTime: { [Op.is]: null } } as any,
    });

    if (!focusSession) {
      sendError(res, 'Active focus session not found', 404);
      return;
    }

    const endTime = new Date();
    const duration = focusSession.calculateDuration();

    await focusSession.update({
      endTime,
      durationMinutes: Math.round((endTime.getTime() - focusSession.startTime.getTime()) / (1000 * 60)),
      completed: Boolean(completed),
      distractionCount: Number(distractionCount),
    });

    logger.info(`Focus session ended for user: ${userId}`);

    sendSuccess(res, {
      id: focusSession.id,
      goal: focusSession.goal,
      startTime: focusSession.startTime,
      endTime: focusSession.endTime,
      durationMinutes: focusSession.durationMinutes,
      completed: focusSession.completed,
      distractionCount: focusSession.distractionCount,
      createdAt: focusSession.createdAt,
    }, 'Focus session ended successfully');
  } catch (error) {
    logger.error('End focus session error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getFocusSessions = async (req: Request, res: Response): Promise<void> => {
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

    const { count, rows } = await FocusSession.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const focusSessions = rows.map(session => ({
      id: session.id,
      goal: session.goal,
      startTime: session.startTime,
      endTime: session.endTime,
      durationMinutes: session.durationMinutes,
      completed: session.completed,
      distractionCount: session.distractionCount,
      isActive: session.isActive(),
      createdAt: session.createdAt,
    }));

    sendPaginated(res, focusSessions, Number(page), Number(limit), count);
  } catch (error) {
    logger.error('Get focus sessions error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getActiveFocusSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const activeSession = await FocusSession.findOne({
      where: {
        userId,
        endTime: { [Op.is]: null },
      } as any,
    });

    if (!activeSession) {
      sendError(res, 'No active focus session found', 404);
      return;
    }

    sendSuccess(res, {
      id: activeSession.id,
      goal: activeSession.goal,
      startTime: activeSession.startTime,
      isActive: activeSession.isActive(),
      createdAt: activeSession.createdAt,
    }, 'Active focus session retrieved successfully');
  } catch (error) {
    logger.error('Get active focus session error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getFocusStats = async (req: Request, res: Response): Promise<void> => {
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

    const focusSessions = await FocusSession.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
        endTime: { [Op.not]: { [Op.is]: null } },
      } as any,
      order: [['createdAt', 'ASC']],
    });

    const totalSessions = focusSessions.length;
    const completedSessions = focusSessions.filter(session => session.completed).length;
    const totalFocusTime = focusSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
    const totalDistractions = focusSessions.reduce((sum, session) => sum + session.distractionCount, 0);
    const averageSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    sendSuccess(res, {
      totalSessions,
      completedSessions,
      totalFocusTime,
      totalDistractions,
      averageSessionLength: Math.round(averageSessionLength * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      period,
      sessions: focusSessions.map(session => ({
        id: session.id,
        goal: session.goal,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes,
        completed: session.completed,
        distractionCount: session.distractionCount,
        createdAt: session.createdAt,
      })),
    }, 'Focus statistics retrieved successfully');
  } catch (error) {
    logger.error('Get focus stats error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteFocusSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const focusSession = await FocusSession.findOne({
      where: { id, userId },
    });

    if (!focusSession) {
      sendError(res, 'Focus session not found', 404);
      return;
    }

    await focusSession.destroy();

    sendSuccess(res, null, 'Focus session deleted successfully');
  } catch (error) {
    logger.error('Delete focus session error:', error);
    sendError(res, 'Internal server error', 500);
  }
};