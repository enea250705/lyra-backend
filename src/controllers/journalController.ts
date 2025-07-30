import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import JournalEntry from '../models/JournalEntry';
import { encrypt, decrypt } from '../utils/encryption';
import logger from '../utils/logger';

export const createJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, content, voiceUrl, pinProtected = false } = req.body;
    const userId = authReq.user!.id;

    let finalContent = content;
    let encryptedContent: Buffer | undefined;
    let isEncrypted = false;

    // Encrypt content if pin protected
    if (pinProtected && content) {
      encryptedContent = Buffer.from(encrypt(content));
      finalContent = undefined;
      isEncrypted = true;
    }

    const journalEntry = await JournalEntry.create({
      userId,
      title,
      content: finalContent,
      voiceUrl,
      encryptedContent,
      isEncrypted,
      pinProtected,
    });

    logger.info(`Journal entry created for user: ${userId}`);

    sendSuccess(res, {
      id: journalEntry.id,
      title: journalEntry.title,
      content: journalEntry.content,
      voiceUrl: journalEntry.voiceUrl,
      isEncrypted: journalEntry.isEncrypted,
      pinProtected: journalEntry.pinProtected,
      createdAt: journalEntry.createdAt,
      updatedAt: journalEntry.updatedAt,
    }, 'Journal entry created successfully', 201);
  } catch (error) {
    logger.error('Create journal entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getJournalEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { page = 1, limit = 20, startDate, endDate, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { userId };
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await JournalEntry.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const journalEntries = rows.map(entry => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      voiceUrl: entry.voiceUrl,
      isEncrypted: entry.isEncrypted,
      pinProtected: entry.pinProtected,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    sendPaginated(res, journalEntries, Number(page), Number(limit), count);
  } catch (error) {
    logger.error('Get journal entries error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { pin } = req.query;
    const userId = authReq.user!.id;

    const journalEntry = await JournalEntry.findOne({
      where: { id, userId },
    });

    if (!journalEntry) {
      sendError(res, 'Journal entry not found', 404);
      return;
    }

    let content = journalEntry.content;

    // Decrypt content if encrypted and pin provided
    if (journalEntry.isEncrypted && journalEntry.encryptedContent) {
      if (!pin) {
        sendError(res, 'PIN required for encrypted entry', 403);
        return;
      }
      
      try {
        content = decrypt(journalEntry.encryptedContent.toString());
      } catch (error) {
        sendError(res, 'Invalid PIN or corrupted data', 403);
        return;
      }
    }

    sendSuccess(res, {
      id: journalEntry.id,
      title: journalEntry.title,
      content,
      voiceUrl: journalEntry.voiceUrl,
      isEncrypted: journalEntry.isEncrypted,
      pinProtected: journalEntry.pinProtected,
      createdAt: journalEntry.createdAt,
      updatedAt: journalEntry.updatedAt,
    }, 'Journal entry retrieved successfully');
  } catch (error) {
    logger.error('Get journal entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { title, content, voiceUrl, pinProtected } = req.body;
    const userId = authReq.user!.id;

    const journalEntry = await JournalEntry.findOne({
      where: { id, userId },
    });

    if (!journalEntry) {
      sendError(res, 'Journal entry not found', 404);
      return;
    }

    let finalContent = content || journalEntry.content;
    let encryptedContent = journalEntry.encryptedContent;
    let isEncrypted = journalEntry.isEncrypted;

    // Handle encryption changes
    if (pinProtected !== undefined) {
      if (pinProtected && !journalEntry.isEncrypted && finalContent) {
        // Encrypt content
        encryptedContent = Buffer.from(encrypt(finalContent));
        finalContent = undefined;
        isEncrypted = true;
      } else if (!pinProtected && journalEntry.isEncrypted) {
        // Decrypt content
        if (journalEntry.encryptedContent) {
          finalContent = decrypt(journalEntry.encryptedContent.toString());
        }
        encryptedContent = undefined;
        isEncrypted = false;
      }
    }

    await journalEntry.update({
      title: title || journalEntry.title,
      content: finalContent,
      voiceUrl: voiceUrl || journalEntry.voiceUrl,
      encryptedContent,
      isEncrypted,
      pinProtected: pinProtected !== undefined ? pinProtected : journalEntry.pinProtected,
    });

    sendSuccess(res, {
      id: journalEntry.id,
      title: journalEntry.title,
      content: journalEntry.content,
      voiceUrl: journalEntry.voiceUrl,
      isEncrypted: journalEntry.isEncrypted,
      pinProtected: journalEntry.pinProtected,
      createdAt: journalEntry.createdAt,
      updatedAt: journalEntry.updatedAt,
    }, 'Journal entry updated successfully');
  } catch (error) {
    logger.error('Update journal entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const journalEntry = await JournalEntry.findOne({
      where: { id, userId },
    });

    if (!journalEntry) {
      sendError(res, 'Journal entry not found', 404);
      return;
    }

    await journalEntry.destroy();

    sendSuccess(res, null, 'Journal entry deleted successfully');
  } catch (error) {
    logger.error('Delete journal entry error:', error);
    sendError(res, 'Internal server error', 500);
  }
};