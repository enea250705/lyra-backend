import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import Notification from '../models/Notification';
import NotificationSettings from '../models/NotificationSettings';
import logger from '../utils/logger';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = { userId };
    
    if (unreadOnly === 'true') {
      whereClause.readAt = { [Op.is]: null };
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    const notifications = rows.map(notification => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      isRead: notification.isRead(),
      isSent: notification.isSent(),
      createdAt: notification.createdAt,
    }));

    sendPaginated(res, notifications, Number(page), Number(limit), count);
  } catch (error) {
    logger.error('Get notifications error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      sendError(res, 'Notification not found', 404);
      return;
    }

    if (notification.isRead()) {
      sendError(res, 'Notification already marked as read', 400);
      return;
    }

    await notification.update({ readAt: new Date() });

    sendSuccess(res, {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      isRead: notification.isRead(),
      isSent: notification.isSent(),
      createdAt: notification.createdAt,
    }, 'Notification marked as read');
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    await Notification.update(
      { readAt: new Date() },
      { where: { userId, readAt: { [Op.is]: null } } as any }
    );

    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getNotificationSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    let settings = await NotificationSettings.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = await NotificationSettings.create({
        userId,
        moodReminder: true,
        moodReminderTime: '09:00',
        journalReminder: true,
        journalReminderTime: '21:00',
        sleepReminder: true,
        sleepReminderTime: '22:00',
        financeReminder: true,
        financeReminderFrequency: 'daily',
      });
    }

    sendSuccess(res, {
      id: settings.id,
      moodReminder: settings.moodReminder,
      moodReminderTime: settings.moodReminderTime,
      journalReminder: settings.journalReminder,
      journalReminderTime: settings.journalReminderTime,
      sleepReminder: settings.sleepReminder,
      sleepReminderTime: settings.sleepReminderTime,
      financeReminder: settings.financeReminder,
      financeReminderFrequency: settings.financeReminderFrequency,
      createdAt: settings.createdAt,
    }, 'Notification settings retrieved successfully');
  } catch (error) {
    logger.error('Get notification settings error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateNotificationSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const {
      moodReminder,
      moodReminderTime,
      journalReminder,
      journalReminderTime,
      sleepReminder,
      sleepReminderTime,
      financeReminder,
      financeReminderFrequency,
    } = req.body;

    let settings = await NotificationSettings.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = await NotificationSettings.create({
        userId,
        moodReminder: moodReminder ?? true,
        moodReminderTime: moodReminderTime ?? '09:00',
        journalReminder: journalReminder ?? true,
        journalReminderTime: journalReminderTime ?? '21:00',
        sleepReminder: sleepReminder ?? true,
        sleepReminderTime: sleepReminderTime ?? '22:00',
        financeReminder: financeReminder ?? true,
        financeReminderFrequency: financeReminderFrequency ?? 'daily',
      });
    } else {
      await settings.update({
        moodReminder: moodReminder ?? settings.moodReminder,
        moodReminderTime: moodReminderTime ?? settings.moodReminderTime,
        journalReminder: journalReminder ?? settings.journalReminder,
        journalReminderTime: journalReminderTime ?? settings.journalReminderTime,
        sleepReminder: sleepReminder ?? settings.sleepReminder,
        sleepReminderTime: sleepReminderTime ?? settings.sleepReminderTime,
        financeReminder: financeReminder ?? settings.financeReminder,
        financeReminderFrequency: financeReminderFrequency ?? settings.financeReminderFrequency,
      });
    }

    sendSuccess(res, {
      id: settings.id,
      moodReminder: settings.moodReminder,
      moodReminderTime: settings.moodReminderTime,
      journalReminder: settings.journalReminder,
      journalReminderTime: settings.journalReminderTime,
      sleepReminder: settings.sleepReminder,
      sleepReminderTime: settings.sleepReminderTime,
      financeReminder: settings.financeReminder,
      financeReminderFrequency: settings.financeReminderFrequency,
      createdAt: settings.createdAt,
    }, 'Notification settings updated successfully');
  } catch (error) {
    logger.error('Update notification settings error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { title, body, type } = req.body;
    const userId = authReq.user!.id;

    const notification = await Notification.create({
      userId,
      title,
      body,
      type,
    });

    logger.info(`Notification created for user: ${userId}`);

    sendSuccess(res, {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      sentAt: notification.sentAt,
      readAt: notification.readAt,
      isRead: notification.isRead(),
      isSent: notification.isSent(),
      createdAt: notification.createdAt,
    }, 'Notification created successfully', 201);
  } catch (error) {
    logger.error('Create notification error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      sendError(res, 'Notification not found', 404);
      return;
    }

    await notification.destroy();

    sendSuccess(res, null, 'Notification deleted successfully');
  } catch (error) {
    logger.error('Delete notification error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const count = await Notification.count({
      where: { userId, readAt: { [Op.is]: null } } as any,
    });

    sendSuccess(res, { count }, 'Unread notification count retrieved successfully');
  } catch (error) {
    logger.error('Get unread count error:', error);
    sendError(res, 'Internal server error', 500);
  }
};