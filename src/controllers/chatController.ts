import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import ChatMessage from '../models/ChatMessage';
import { Op } from 'sequelize';

export const getChatMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const messages = await ChatMessage.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']],
      limit: Number(limit),
      offset,
    });

    const total = await ChatMessage.count({ where: { userId } });

    sendSuccess(res, {
      data: messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Chat messages retrieved successfully');
  } catch (error) {
    console.error('Error getting chat messages:', error);
    sendError(res, 'Failed to retrieve chat messages', 500);
  }
};

export const createChatMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { text, sender, isVoice = false } = req.body;

    if (!text || !sender) {
      sendError(res, 'Text and sender are required', 400);
      return;
    }

    if (!['user', 'lyra'].includes(sender)) {
      sendError(res, 'Sender must be either "user" or "lyra"', 400);
      return;
    }

    const message = await ChatMessage.create({
      userId,
      text,
      sender,
      isVoice,
    });

    sendSuccess(res, { data: message }, 'Chat message created successfully');
  } catch (error) {
    console.error('Error creating chat message:', error);
    sendError(res, 'Failed to create chat message', 500);
  }
};

export const deleteChatMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    await ChatMessage.destroy({
      where: { userId },
    });

    sendSuccess(res, {}, 'All chat messages deleted successfully');
  } catch (error) {
    console.error('Error deleting chat messages:', error);
    sendError(res, 'Failed to delete chat messages', 500);
  }
}; 