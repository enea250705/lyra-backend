import { Expo, ExpoPushMessage, ExpoPushReceipt } from 'expo-server-sdk';
import PushDevice from '../models/PushDevice';
import Notification from '../models/Notification';
import NotificationSettings from '../models/NotificationSettings';
import User from '../models/User';
import logger from '../utils/logger';
import { Op } from 'sequelize';

const expo = new Expo();

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | 'none';
  priority?: 'default' | 'normal' | 'high';
  category?: string;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  templateId: string;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationContext {
  userName?: string;
  mood?: number;
  energy?: number;
  sleepHours?: number;
  savingsAmount?: number;
  weather?: string;
  location?: string;
  [key: string]: any;
}

class EnhancedPushNotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'mood_reminder',
        name: 'Mood Check-in Reminder',
        title: 'How are you feeling?',
        body: 'Take a moment to check in with your mood. It only takes 30 seconds!',
        data: { type: 'mood_reminder', action: 'check_mood' },
        sound: 'default',
        priority: 'normal',
        category: 'reminder'
      },
      {
        id: 'journal_reminder',
        name: 'Journal Reminder',
        title: 'Time to reflect',
        body: 'Capture your thoughts and feelings in your journal. What made today special?',
        data: { type: 'journal_reminder', action: 'open_journal' },
        sound: 'default',
        priority: 'normal',
        category: 'reminder'
      },
      {
        id: 'sleep_reminder',
        name: 'Sleep Reminder',
        title: 'Wind down time',
        body: 'Your optimal bedtime is approaching. Start your wind-down routine for better sleep.',
        data: { type: 'sleep_reminder', action: 'sleep_tracking' },
        sound: 'default',
        priority: 'normal',
        category: 'reminder'
      },
      {
        id: 'savings_celebration',
        name: 'Savings Celebration',
        title: 'Great job saving!',
        body: 'You\'ve saved ${savingsAmount} this week. Keep up the excellent work!',
        data: { type: 'savings_celebration', action: 'view_savings' },
        sound: 'default',
        priority: 'normal',
        category: 'achievement'
      },
      {
        id: 'mood_insight',
        name: 'Mood Insight',
        title: 'Your mood pattern',
        body: 'I noticed your mood tends to be higher on sunny days. Here\'s a personalized insight!',
        data: { type: 'mood_insight', action: 'view_insights' },
        sound: 'default',
        priority: 'normal',
        category: 'insight'
      },
      {
        id: 'location_alert',
        name: 'Location Spending Alert',
        title: 'Spending alert',
        body: 'You\'re near expensive stores and your mood is low. Consider waiting before making purchases.',
        data: { type: 'location_alert', action: 'view_intervention' },
        sound: 'default',
        priority: 'high',
        category: 'intervention'
      },
      {
        id: 'weekly_summary',
        name: 'Weekly Summary',
        title: 'Your week in review',
        body: 'Check out your weekly insights: ${mood} average mood, ${sleepHours}h sleep, ${savingsAmount} saved.',
        data: { type: 'weekly_summary', action: 'view_summary' },
        sound: 'default',
        priority: 'normal',
        category: 'summary'
      },
      {
        id: 'goal_reminder',
        name: 'Goal Reminder',
        title: 'Progress check',
        body: 'How are you progressing toward your goals? Take a moment to update your progress.',
        data: { type: 'goal_reminder', action: 'update_goals' },
        sound: 'default',
        priority: 'normal',
        category: 'goal'
      },
      {
        id: 'crisis_support',
        name: 'Crisis Support',
        title: 'I\'m here for you',
        body: 'I noticed you might be struggling. Remember, you\'re not alone. Here are some resources.',
        data: { type: 'crisis_support', action: 'crisis_help' },
        sound: 'default',
        priority: 'high',
        category: 'support'
      },
      {
        id: 'subscription_upgrade',
        name: 'Subscription Upgrade',
        title: 'Unlock more features',
        body: 'You\'ve been using Lyra for a while. Upgrade to Pro for advanced insights and features.',
        data: { type: 'subscription_upgrade', action: 'upgrade' },
        sound: 'default',
        priority: 'normal',
        category: 'promotion'
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info(`Initialized ${templates.length} notification templates`);
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(
    userId: string, 
    templateId: string, 
    context?: NotificationContext
  ): Promise<{ success: boolean; sent: number; failed: number; error?: string }> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Get user's push devices
      const devices = await PushDevice.findAll({ 
        where: { userId, isActive: true } 
      });

      if (devices.length === 0) {
        logger.info(`No active push devices found for user ${userId}`);
        return { success: true, sent: 0, failed: 0 };
      }

      // Get user data for context
      const user = await User.findByPk(userId);
      const userContext = {
        userName: user?.firstName || 'there',
        ...context
      };

      // Prepare messages
      const messages: ExpoPushMessage[] = devices
        .filter(device => Expo.isExpoPushToken(device.expoPushToken))
        .map(device => ({
          to: device.expoPushToken,
          sound: template.sound || 'default',
          title: this.interpolateTemplate(template.title, userContext),
          body: this.interpolateTemplate(template.body, userContext),
          data: {
            ...template.data,
            templateId,
            userId,
            timestamp: new Date().toISOString()
          },
          priority: template.priority || 'normal',
          category: template.category
        }));

      if (messages.length === 0) {
        logger.info(`No valid push tokens for user ${userId}`);
        return { success: true, sent: 0, failed: 0 };
      }

      // Send notifications
      const chunks = expo.chunkPushNotifications(messages);
      let sent = 0;
      let failed = 0;

      for (const chunk of chunks) {
        try {
          const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
          
          // Process tickets to count successes/failures
          for (const ticket of chunkTickets) {
            if (ticket.status === 'ok') {
              sent++;
            } else {
              failed++;
              logger.warn(`Push notification failed: ${ticket.message}`);
            }
          }
        } catch (error) {
          logger.error('Error sending push chunk:', error);
          failed += chunk.length;
        }
      }

      // Record notification in database
      await this.recordNotification(userId, templateId, sent > 0, userContext);

      logger.info(`Sent ${sent} notifications to user ${userId}, ${failed} failed`);
      return { success: true, sent, failed };

    } catch (error) {
      logger.error('Error sending push notification:', error);
      return { 
        success: false, 
        sent: 0, 
        failed: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(
    userIds: string[], 
    templateId: string, 
    context?: NotificationContext
  ): Promise<{ success: boolean; totalSent: number; totalFailed: number; results: any[] }> {
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, templateId, context);
      results.push({ userId, ...result });
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return {
      success: true,
      totalSent,
      totalFailed,
      results
    };
  }

  /**
   * Schedule a notification for later delivery
   */
  async scheduleNotification(
    userId: string,
    templateId: string,
    scheduledFor: Date,
    context?: NotificationContext
  ): Promise<ScheduledNotification> {
    try {
      const scheduledNotification: ScheduledNotification = {
        id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        templateId,
        scheduledFor,
        sent: false,
        metadata: context
      };

      // Store in database (you might want to create a ScheduledNotification model)
      // For now, we'll use a simple approach with the existing Notification model
      await Notification.create({
        userId,
        title: `Scheduled: ${templateId}`,
        body: `Scheduled for ${scheduledFor.toISOString()}`,
        type: 'scheduled',
        sentAt: scheduledFor
      });

      logger.info(`Scheduled notification ${scheduledNotification.id} for user ${userId} at ${scheduledFor.toISOString()}`);
      return scheduledNotification;

    } catch (error) {
      logger.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Process scheduled notifications (should be called by a cron job)
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date();
      const scheduledNotifications = await Notification.findAll({
        where: {
          type: 'scheduled',
          sentAt: {
            [Op.lte]: now
          }
        },
        limit: 100 // Process in batches
      });

      logger.info(`Processing ${scheduledNotifications.length} scheduled notifications`);

      for (const notification of scheduledNotifications) {
        try {
          // Extract template ID from title (this is a simple approach)
          const templateId = notification.title.replace('Scheduled: ', '');
          
          await this.sendToUser(notification.userId, templateId);
          
          // Mark as sent
          await notification.update({ 
            sentAt: new Date(),
            type: 'sent'
          });

        } catch (error) {
          logger.error(`Error processing scheduled notification ${notification.id}:`, error);
        }
      }

    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Send reminder notifications based on user settings
   */
  async sendReminderNotifications(): Promise<void> {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      // Get users with matching reminder times
      const notificationSettings = await NotificationSettings.findAll({
        where: {
          [Op.or]: [
            { moodReminder: true, moodReminderTime: currentTime },
            { journalReminder: true, journalReminderTime: currentTime },
            { sleepReminder: true, sleepReminderTime: currentTime }
          ]
        },
        include: [{ model: User, as: 'user' }]
      });

      logger.info(`Found ${notificationSettings.length} users with reminders at ${currentTime}`);

      for (const settings of notificationSettings) {
        try {
          // Check if user already received this reminder today
          const today = new Date().toISOString().split('T')[0];
          const existingNotification = await Notification.findOne({
            where: {
              userId: settings.userId,
              type: { [Op.like]: '%reminder%' },
              createdAt: {
                [Op.gte]: new Date(today)
              }
            }
          });

          if (existingNotification) {
            continue; // Skip if already sent today
          }

          // Send appropriate reminder
          if (settings.moodReminder && settings.moodReminderTime === currentTime) {
            await this.sendToUser(settings.userId, 'mood_reminder');
          }
          
          if (settings.journalReminder && settings.journalReminderTime === currentTime) {
            await this.sendToUser(settings.userId, 'journal_reminder');
          }
          
          if (settings.sleepReminder && settings.sleepReminderTime === currentTime) {
            await this.sendToUser(settings.userId, 'sleep_reminder');
          }

        } catch (error) {
          logger.error(`Error sending reminder to user ${settings.userId}:`, error);
        }
      }

    } catch (error) {
      logger.error('Error sending reminder notifications:', error);
    }
  }

  /**
   * Send contextual notifications based on user behavior
   */
  async sendContextualNotifications(): Promise<void> {
    try {
      // This would integrate with your existing intervention service
      // For now, we'll implement a simple example

      // Find users who haven't checked in today
      const today = new Date().toISOString().split('T')[0];
      const usersWithoutCheckin = await User.findAll({
        where: {
          id: {
            [Op.notIn]: await this.getUsersWithCheckinToday()
          }
        },
        limit: 50
      });

      for (const user of usersWithoutCheckin) {
        await this.sendToUser(user.id, 'mood_reminder', {
          userName: user.firstName || 'there'
        });
      }

    } catch (error) {
      logger.error('Error sending contextual notifications:', error);
    }
  }

  /**
   * Get notification template by ID
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Interpolate template with context variables
   */
  private interpolateTemplate(template: string, context: NotificationContext): string {
    return template.replace(/\$\{(\w+)\}/g, (match, key) => {
      return context[key]?.toString() || match;
    });
  }

  /**
   * Record notification in database
   */
  private async recordNotification(
    userId: string, 
    templateId: string, 
    sent: boolean, 
    context?: NotificationContext
  ): Promise<void> {
    try {
      const template = this.templates.get(templateId);
      if (!template) return;

      await Notification.create({
        userId,
        title: this.interpolateTemplate(template.title, context || {}),
        body: this.interpolateTemplate(template.body, context || {}),
        type: templateId,
        sentAt: sent ? new Date() : undefined
      });
    } catch (error) {
      logger.error('Error recording notification:', error);
    }
  }

  /**
   * Helper method to get users who have checked in today
   */
  private async getUsersWithCheckinToday(): Promise<string[]> {
    const today = new Date().toISOString().split('T')[0];
    const checkins = await Notification.findAll({
      where: {
        type: 'daily_checkin',
        createdAt: {
          [Op.gte]: new Date(today)
        }
      },
      attributes: ['userId']
    });
    
    return checkins.map(checkin => checkin.userId);
  }
}

export default new EnhancedPushNotificationService();

