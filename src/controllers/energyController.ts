import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import EnergyEntry from '../models/EnergyEntry';
import logger from '../utils/logger';

export const createEnergyEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { energyLevel, energyEmoji, notes } = req.body;
    const userId = authReq.user!.id;

    const energyEntry = await EnergyEntry.create({
      userId,
      energyLevel,
      energyEmoji,
      notes,
    });

    logger.info(`Energy entry created for user: ${userId}`);

    sendSuccess(res, {
      id: energyEntry.id,
      energyLevel: energyEntry.energyLevel,
      energyEmoji: energyEntry.energyEmoji,
      notes: energyEntry.notes,
      createdAt: energyEntry.createdAt,
    }, 'Energy entry created successfully', 201);
  } catch (error) {
    logger.error('Create energy entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getEnergyEntries = async (req: Request, res: Response): Promise<void> => {
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

    const { count, rows } = await EnergyEntry.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const energyEntries = rows.map(entry => ({
      id: entry.id,
      energyLevel: entry.energyLevel,
      energyEmoji: entry.energyEmoji,
      notes: entry.notes,
      createdAt: entry.createdAt,
    }));

    sendPaginated(res, energyEntries, Number(page), Number(limit), count);
  } catch (error) {
    logger.error('Get energy entries error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getEnergyEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const energyEntry = await EnergyEntry.findOne({
      where: { id, userId },
    });

    if (!energyEntry) {
      sendError(res, 'Energy entry not found', 404);
      return;
    }

    sendSuccess(res, {
      id: energyEntry.id,
      energyLevel: energyEntry.energyLevel,
      energyEmoji: energyEntry.energyEmoji,
      notes: energyEntry.notes,
      createdAt: energyEntry.createdAt,
    }, 'Energy entry retrieved successfully');
  } catch (error) {
    logger.error('Get energy entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateEnergyEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { energyLevel, energyEmoji, notes } = req.body;
    const userId = authReq.user!.id;

    const energyEntry = await EnergyEntry.findOne({
      where: { id, userId },
    });

    if (!energyEntry) {
      sendError(res, 'Energy entry not found', 404);
      return;
    }

    await energyEntry.update({
      energyLevel: energyLevel || energyEntry.energyLevel,
      energyEmoji: energyEmoji || energyEntry.energyEmoji,
      notes: notes || energyEntry.notes,
    });

    sendSuccess(res, {
      id: energyEntry.id,
      energyLevel: energyEntry.energyLevel,
      energyEmoji: energyEntry.energyEmoji,
      notes: energyEntry.notes,
      createdAt: energyEntry.createdAt,
    }, 'Energy entry updated successfully');
  } catch (error) {
    logger.error('Update energy entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteEnergyEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const energyEntry = await EnergyEntry.findOne({
      where: { id, userId },
    });

    if (!energyEntry) {
      sendError(res, 'Energy entry not found', 404);
      return;
    }

    await energyEntry.destroy();

    sendSuccess(res, null, 'Energy entry deleted successfully');
  } catch (error) {
    logger.error('Delete energy entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getEnergyTrends = async (req: Request, res: Response): Promise<void> => {
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

    const energyEntries = await EnergyEntry.findAll({
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['createdAt', 'ASC']],
    });

    const trends = energyEntries.map(entry => ({
      energyLevel: entry.energyLevel,
      energyEmoji: entry.energyEmoji,
      date: entry.createdAt,
    }));

    const average = energyEntries.length > 0 
      ? energyEntries.reduce((sum, entry) => sum + entry.energyLevel, 0) / energyEntries.length
      : 0;

    sendSuccess(res, {
      trends,
      average: Math.round(average * 100) / 100,
      period,
      totalEntries: energyEntries.length,
    }, 'Energy trends retrieved successfully');
  } catch (error) {
    logger.error('Get energy trends error:', error);
    sendError(res, 'Internal server error', 500);
  }
};