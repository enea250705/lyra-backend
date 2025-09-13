import * as cron from 'node-cron';
import logger from '../utils/logger';
import enhancedPushNotificationService from './enhancedPushNotificationService';
import notificationPreferencesService from './notificationPreferencesService';

class NotificationSchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeJobs();
  }

  /**
   * Initialize all scheduled jobs
   */
  private initializeJobs(): void {
    try {
      // Process scheduled notifications every minute
      this.scheduleJob('process-scheduled', '* * * * *', async () => {
        await enhancedPushNotificationService.processScheduledNotifications();
      });

      // Send reminder notifications every minute (checks user settings)
      this.scheduleJob('send-reminders', '* * * * *', async () => {
        await enhancedPushNotificationService.sendReminderNotifications();
      });

      // Send contextual notifications every 5 minutes
      this.scheduleJob('send-contextual', '*/5 * * * *', async () => {
        await enhancedPushNotificationService.sendContextualNotifications();
      });

      // Send weekly summaries every Monday at 10 AM
      this.scheduleJob('weekly-summary', '0 10 * * 1', async () => {
        await this.sendWeeklySummaries();
      });

      // Send monthly insights on the 1st of each month at 9 AM
      this.scheduleJob('monthly-insights', '0 9 1 * *', async () => {
        await this.sendMonthlyInsights();
      });

      // Clean up old notifications daily at 2 AM
      this.scheduleJob('cleanup-notifications', '0 2 * * *', async () => {
        await this.cleanupOldNotifications();
      });

      // Send subscription upgrade reminders weekly on Friday at 3 PM
      this.scheduleJob('subscription-reminders', '0 15 * * 5', async () => {
        await this.sendSubscriptionReminders();
      });

      // Send goal progress reminders every Tuesday at 11 AM
      this.scheduleJob('goal-reminders', '0 11 * * 2', async () => {
        await this.sendGoalReminders();
      });

      // Send crisis support check-ins daily at 6 PM
      this.scheduleJob('crisis-check', '0 18 * * *', async () => {
        await this.sendCrisisSupportCheck();
      });

      logger.info('Notification scheduler initialized with 9 jobs');
      this.isRunning = true;

    } catch (error) {
      logger.error('Error initializing notification scheduler:', error);
    }
  }

  /**
   * Schedule a new job
   */
  private scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    try {
      const job = cron.schedule(schedule, async () => {
        try {
          logger.debug(`Running scheduled job: ${name}`);
          await task();
        } catch (error) {
          logger.error(`Error in scheduled job ${name}:`, error);
        }
      }, {
        scheduled: false, // Don't start immediately
        timezone: 'UTC'
      });

      this.jobs.set(name, job);
      logger.info(`Scheduled job ${name} with pattern: ${schedule}`);

    } catch (error) {
      logger.error(`Error scheduling job ${name}:`, error);
    }
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    try {
      if (this.isRunning) {
        logger.warn('Notification scheduler is already running');
        return;
      }

      for (const [name, job] of this.jobs) {
        job.start();
        logger.info(`Started job: ${name}`);
      }

      this.isRunning = true;
      logger.info('Notification scheduler started successfully');

    } catch (error) {
      logger.error('Error starting notification scheduler:', error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    try {
      if (!this.isRunning) {
        logger.warn('Notification scheduler is not running');
        return;
      }

      for (const [name, job] of this.jobs) {
        job.stop();
        logger.info(`Stopped job: ${name}`);
      }

      this.isRunning = false;
      logger.info('Notification scheduler stopped successfully');

    } catch (error) {
      logger.error('Error stopping notification scheduler:', error);
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus(): { name: string; running: boolean; nextRun?: Date }[] {
    const status = [];
    
    for (const [name, job] of this.jobs) {
      status.push({
        name,
        running: false, // Cron jobs don't have a running property
        nextRun: undefined // Cron jobs don't have nextDate method
      });
    }

    return status;
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(name: string): Promise<void> {
    try {
      const job = this.jobs.get(name);
      if (!job) {
        throw new Error(`Job ${name} not found`);
      }

      logger.info(`Manually triggering job: ${name}`);
      
      // Execute the job's task
      switch (name) {
        case 'process-scheduled':
          await enhancedPushNotificationService.processScheduledNotifications();
          break;
        case 'send-reminders':
          await enhancedPushNotificationService.sendReminderNotifications();
          break;
        case 'send-contextual':
          await enhancedPushNotificationService.sendContextualNotifications();
          break;
        case 'weekly-summary':
          await this.sendWeeklySummaries();
          break;
        case 'monthly-insights':
          await this.sendMonthlyInsights();
          break;
        case 'cleanup-notifications':
          await this.cleanupOldNotifications();
          break;
        case 'subscription-reminders':
          await this.sendSubscriptionReminders();
          break;
        case 'goal-reminders':
          await this.sendGoalReminders();
          break;
        case 'crisis-check':
          await this.sendCrisisSupportCheck();
          break;
        default:
          throw new Error(`Unknown job: ${name}`);
      }

      logger.info(`Job ${name} executed successfully`);

    } catch (error) {
      logger.error(`Error triggering job ${name}:`, error);
      throw error;
    }
  }

  /**
   * Send weekly summaries to users
   */
  private async sendWeeklySummaries(): Promise<void> {
    try {
      logger.info('Sending weekly summaries...');
      
      // This would integrate with your user service to get all active users
      // For now, we'll use a placeholder
      const activeUsers = await this.getActiveUsers();
      
      for (const userId of activeUsers) {
        try {
          const shouldSend = await notificationPreferencesService.shouldSendNotification(
            userId, 
            'weekly_summary'
          );
          
          if (shouldSend) {
            await enhancedPushNotificationService.sendToUser(userId, 'weekly_summary', {
              userName: 'there' // Would get actual name from user service
            });
          }
        } catch (error) {
          logger.error(`Error sending weekly summary to user ${userId}:`, error);
        }
      }

      logger.info(`Weekly summaries sent to ${activeUsers.length} users`);

    } catch (error) {
      logger.error('Error sending weekly summaries:', error);
    }
  }

  /**
   * Send monthly insights to users
   */
  private async sendMonthlyInsights(): Promise<void> {
    try {
      logger.info('Sending monthly insights...');
      
      const activeUsers = await this.getActiveUsers();
      
      for (const userId of activeUsers) {
        try {
          const shouldSend = await notificationPreferencesService.shouldSendNotification(
            userId, 
            'mood_insight'
          );
          
          if (shouldSend) {
            await enhancedPushNotificationService.sendToUser(userId, 'mood_insight', {
              userName: 'there'
            });
          }
        } catch (error) {
          logger.error(`Error sending monthly insights to user ${userId}:`, error);
        }
      }

      logger.info(`Monthly insights sent to ${activeUsers.length} users`);

    } catch (error) {
      logger.error('Error sending monthly insights:', error);
    }
  }

  /**
   * Clean up old notifications
   */
  private async cleanupOldNotifications(): Promise<void> {
    try {
      logger.info('Cleaning up old notifications...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // This would delete old notifications from the database
      // await Notification.destroy({
      //   where: {
      //     createdAt: {
      //       [Op.lt]: thirtyDaysAgo
      //     }
      //   }
      // });

      logger.info('Old notifications cleanup completed');

    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
    }
  }

  /**
   * Send subscription upgrade reminders
   */
  private async sendSubscriptionReminders(): Promise<void> {
    try {
      logger.info('Sending subscription reminders...');
      
      const freeUsers = await this.getFreeUsers();
      
      for (const userId of freeUsers) {
        try {
          const shouldSend = await notificationPreferencesService.shouldSendNotification(
            userId, 
            'subscription_upgrade'
          );
          
          if (shouldSend) {
            await enhancedPushNotificationService.sendToUser(userId, 'subscription_upgrade', {
              userName: 'there'
            });
          }
        } catch (error) {
          logger.error(`Error sending subscription reminder to user ${userId}:`, error);
        }
      }

      logger.info(`Subscription reminders sent to ${freeUsers.length} users`);

    } catch (error) {
      logger.error('Error sending subscription reminders:', error);
    }
  }

  /**
   * Send goal progress reminders
   */
  private async sendGoalReminders(): Promise<void> {
    try {
      logger.info('Sending goal reminders...');
      
      const usersWithGoals = await this.getUsersWithGoals();
      
      for (const userId of usersWithGoals) {
        try {
          const shouldSend = await notificationPreferencesService.shouldSendNotification(
            userId, 
            'goal_reminder'
          );
          
          if (shouldSend) {
            await enhancedPushNotificationService.sendToUser(userId, 'goal_reminder', {
              userName: 'there'
            });
          }
        } catch (error) {
          logger.error(`Error sending goal reminder to user ${userId}:`, error);
        }
      }

      logger.info(`Goal reminders sent to ${usersWithGoals.length} users`);

    } catch (error) {
      logger.error('Error sending goal reminders:', error);
    }
  }

  /**
   * Send crisis support check-ins
   */
  private async sendCrisisSupportCheck(): Promise<void> {
    try {
      logger.info('Sending crisis support checks...');
      
      const usersNeedingSupport = await this.getUsersNeedingSupport();
      
      for (const userId of usersNeedingSupport) {
        try {
          const shouldSend = await notificationPreferencesService.shouldSendNotification(
            userId, 
            'crisis_support'
          );
          
          if (shouldSend) {
            await enhancedPushNotificationService.sendToUser(userId, 'crisis_support', {
              userName: 'there'
            });
          }
        } catch (error) {
          logger.error(`Error sending crisis support to user ${userId}:`, error);
        }
      }

      logger.info(`Crisis support checks sent to ${usersNeedingSupport.length} users`);

    } catch (error) {
      logger.error('Error sending crisis support checks:', error);
    }
  }

  /**
   * Get active users (placeholder implementation)
   */
  private async getActiveUsers(): Promise<string[]> {
    // This would integrate with your user service
    // For now, return empty array
    return [];
  }

  /**
   * Get free users (placeholder implementation)
   */
  private async getFreeUsers(): Promise<string[]> {
    // This would integrate with your subscription service
    return [];
  }

  /**
   * Get users with goals (placeholder implementation)
   */
  private async getUsersWithGoals(): Promise<string[]> {
    // This would integrate with your goals service
    return [];
  }

  /**
   * Get users needing support (placeholder implementation)
   */
  private async getUsersNeedingSupport(): Promise<string[]> {
    // This would integrate with your mood/wellbeing service
    return [];
  }
}

export default new NotificationSchedulerService();
