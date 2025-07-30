import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  createNotification,
  deleteNotification,
  getUnreadCount,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { notificationSettingsSchemas, paginationSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get paginated notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/', authenticate, validateQuery(paginationSchema), getNotifications);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', authenticate, getUnreadCount);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', authenticate, markNotificationAsRead);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/mark-all-read', authenticate, markAllNotificationsAsRead);

/**
 * @swagger
 * /api/v1/notifications/settings:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 */
router.get('/settings', authenticate, getNotificationSettings);

/**
 * @swagger
 * /api/v1/notifications/settings:
 *   put:
 *     tags: [Notifications]
 *     summary: Update notification settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               moodReminder:
 *                 type: boolean
 *               moodReminderTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               journalReminder:
 *                 type: boolean
 *               journalReminderTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               sleepReminder:
 *                 type: boolean
 *               sleepReminderTime:
 *                 type: string
 *                 pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               financeReminder:
 *                 type: boolean
 *               financeReminderFrequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 */
router.put('/settings', authenticate, validateBody(notificationSettingsSchemas.update), updateNotificationSettings);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - body
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               body:
 *                 type: string
 *               type:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Notification created successfully
 */
router.post('/', authenticate, createNotification);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', authenticate, deleteNotification);

export default router;