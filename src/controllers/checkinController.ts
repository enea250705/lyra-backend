import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import DailyCheckin from '../models/DailyCheckin';
import logger from '../utils/logger';

const generateAIReflection = (content?: string, moodEmoji?: string): string => {
  const reflections = [
    "Thank you for sharing your thoughts with me today. Remember, each day is a new opportunity to grow.",
    "I appreciate your openness in today's check-in. Your awareness of your emotions is a strength.",
    "Your daily reflection shows great self-awareness. Keep nurturing this mindful practice.",
    "I notice you're taking time to reflect on your day. This mindfulness will serve you well.",
    "Thank you for this honest check-in. Your journey of self-discovery is inspiring.",
  ];
  
  const moodReflections: { [key: string]: string } = {
    '😊': "I'm glad to sense positivity in your check-in today. Keep embracing these good moments.",
    '😔': "I hear that you're having a challenging day. Remember, difficult days help us appreciate the good ones.",
    '😴': "It sounds like you might be feeling tired. Rest is important for your well-being.",
    '😤': "I sense some frustration in your check-in. These feelings are valid and part of being human.",
    '😌': "You seem to be in a peaceful state today. This inner calm is wonderful to witness.",
  };
  
  if (moodEmoji && moodReflections[moodEmoji]) {
    return moodReflections[moodEmoji];
  }
  
  return reflections[Math.floor(Math.random() * reflections.length)];
};

export const createCheckin = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { content, moodEmoji, voiceTranscriptionUrl } = req.body;
    const userId = authReq.user!.id;

    // Check if user already has a check-in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckin = await DailyCheckin.findOne({
      where: {
        userId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (existingCheckin) {
      sendError(res, 'You have already checked in today', 409);
      return;
    }

    // Generate AI reflection
    const aiReflection = generateAIReflection(content, moodEmoji);

    const checkin = await DailyCheckin.create({
      userId,
      content,
      moodEmoji,
      voiceTranscriptionUrl,
      aiReflection,
    });

    logger.info(`Daily check-in created for user: ${userId}`);

    sendSuccess(res, {
      id: checkin.id,
      content: checkin.content,
      moodEmoji: checkin.moodEmoji,
      voiceTranscriptionUrl: checkin.voiceTranscriptionUrl,
      aiReflection: checkin.aiReflection,
      createdAt: checkin.createdAt,
    }, 'Daily check-in created successfully', 201);
  } catch (error) {
    logger.error('Create check-in error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getCheckins = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await DailyCheckin.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const checkins = rows.map(checkin => ({
      id: checkin.id,
      content: checkin.content,
      moodEmoji: checkin.moodEmoji,
      voiceTranscriptionUrl: checkin.voiceTranscriptionUrl,
      aiReflection: checkin.aiReflection,
      createdAt: checkin.createdAt,
    }));

    sendPaginated(res, checkins, Number(page), Number(limit), count);
  } catch (error) {
    logger.error('Get check-ins error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getTodayCheckin = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkin = await DailyCheckin.findOne({
      where: {
        userId,
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    if (!checkin) {
      sendError(res, 'No check-in found for today', 404);
      return;
    }

    sendSuccess(res, {
      id: checkin.id,
      content: checkin.content,
      moodEmoji: checkin.moodEmoji,
      voiceTranscriptionUrl: checkin.voiceTranscriptionUrl,
      aiReflection: checkin.aiReflection,
      createdAt: checkin.createdAt,
    }, 'Today\'s check-in retrieved successfully');
  } catch (error) {
    logger.error('Get today check-in error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getCheckinById = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const checkin = await DailyCheckin.findOne({
      where: { id, userId },
    });

    if (!checkin) {
      sendError(res, 'Check-in not found', 404);
      return;
    }

    sendSuccess(res, {
      id: checkin.id,
      content: checkin.content,
      moodEmoji: checkin.moodEmoji,
      voiceTranscriptionUrl: checkin.voiceTranscriptionUrl,
      aiReflection: checkin.aiReflection,
      createdAt: checkin.createdAt,
    }, 'Check-in retrieved successfully');
  } catch (error) {
    logger.error('Get check-in by ID error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateCheckin = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { content, moodEmoji, voiceTranscriptionUrl } = req.body;
    const userId = authReq.user!.id;

    const checkin = await DailyCheckin.findOne({
      where: { id, userId },
    });

    if (!checkin) {
      sendError(res, 'Check-in not found', 404);
      return;
    }

    // Generate new AI reflection if content or mood changed
    const aiReflection = generateAIReflection(content || checkin.content, moodEmoji || checkin.moodEmoji);

    await checkin.update({
      content: content || checkin.content,
      moodEmoji: moodEmoji || checkin.moodEmoji,
      voiceTranscriptionUrl: voiceTranscriptionUrl || checkin.voiceTranscriptionUrl,
      aiReflection,
    });

    sendSuccess(res, {
      id: checkin.id,
      content: checkin.content,
      moodEmoji: checkin.moodEmoji,
      voiceTranscriptionUrl: checkin.voiceTranscriptionUrl,
      aiReflection: checkin.aiReflection,
      createdAt: checkin.createdAt,
    }, 'Check-in updated successfully');
  } catch (error) {
    logger.error('Update check-in error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteCheckin = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const checkin = await DailyCheckin.findOne({
      where: { id, userId },
    });

    if (!checkin) {
      sendError(res, 'Check-in not found', 404);
      return;
    }

    await checkin.destroy();

    sendSuccess(res, null, 'Check-in deleted successfully');
  } catch (error) {
    logger.error('Delete check-in error:', error);
    sendError(res, 'Internal server error', 500);
  }
};