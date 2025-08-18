import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import User from '../models/User';
import Notification from '../models/Notification';
import NotificationSettings from '../models/NotificationSettings';
import CalendarEvent from '../models/CalendarEvent';
import ChatMessage from '../models/ChatMessage';
import JournalEntry from '../models/JournalEntry';
import logger from '../utils/logger';

const router = Router();

// Export all user data as JSON
router.get('/export', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const [user, notifications, notificationSettings, calendarEvents, chatMessages, journalEntries] = await Promise.all([
      User.findByPk(userId),
      Notification.findAll({ where: { userId } }),
      NotificationSettings.findOne({ where: { userId } }),
      CalendarEvent.findAll({ where: { userId } }),
      ChatMessage.findAll({ where: { userId } }),
      JournalEntry.findAll({ where: { userId } })
    ]);

    const exportPayload = {
      user: user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, createdAt: user.createdAt } : null,
      notifications,
      notificationSettings,
      calendarEvents,
      chatMessages,
      journalEntries,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lyra_export_${userId}.json"`);
    res.status(200).send(JSON.stringify(exportPayload, null, 2));
  } catch (error) {
    logger.error('Data export error:', error);
    sendError(res, 'Failed to export data', 500);
  }
});

// Delete all user data (soft delete messages/entries, keep user account)
router.delete('/delete', authenticate, async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    await Promise.all([
      Notification.destroy({ where: { userId } }),
      NotificationSettings.destroy({ where: { userId } }),
      CalendarEvent.destroy({ where: { userId } }),
      ChatMessage.destroy({ where: { userId } }),
      JournalEntry.destroy({ where: { userId } }),
    ]);

    sendSuccess(res, { deleted: true }, 'All user data deleted');
  } catch (error) {
    logger.error('Data delete error:', error);
    sendError(res, 'Failed to delete data', 500);
  }
});

export default router;


