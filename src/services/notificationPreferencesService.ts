import NotificationSettings from '../models/NotificationSettings';
import Notification from '../models/Notification';
import User from '../models/User';
import logger from '../utils/logger';
import { Op } from 'sequelize';

export interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  category: 'reminder' | 'insight' | 'intervention' | 'achievement' | 'promotion' | 'support';
  enabled: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format
  conditions?: Record<string, any>;
}

export interface UserNotificationPreferences {
  userId: string;
  preferences: NotificationPreference[];
  globalSettings: {
    enabled: boolean;
    quietHours: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
    maxNotificationsPerDay: number;
    priorityLevel: 'low' | 'normal' | 'high';
  };
}

class NotificationPreferencesService {
  private defaultPreferences: NotificationPreference[] = [
    {
      id: 'mood_reminder',
      name: 'Mood Check-in Reminders',
      description: 'Daily reminders to log your mood',
      category: 'reminder',
      enabled: true,
      frequency: 'daily',
      time: '09:00',
      conditions: { minDaysSinceLastEntry: 1 }
    },
    {
      id: 'journal_reminder',
      name: 'Journal Reminders',
      description: 'Reminders to write in your journal',
      category: 'reminder',
      enabled: true,
      frequency: 'daily',
      time: '21:00',
      conditions: { minDaysSinceLastEntry: 1 }
    },
    {
      id: 'sleep_reminder',
      name: 'Sleep Reminders',
      description: 'Bedtime reminders for better sleep',
      category: 'reminder',
      enabled: true,
      frequency: 'daily',
      time: '22:00',
      conditions: {}
    },
    {
      id: 'savings_celebration',
      name: 'Savings Celebrations',
      description: 'Celebrate your savings achievements',
      category: 'achievement',
      enabled: true,
      frequency: 'weekly',
      conditions: { minSavingsAmount: 10 }
    },
    {
      id: 'mood_insight',
      name: 'Mood Insights',
      description: 'Personalized insights about your mood patterns',
      category: 'insight',
      enabled: true,
      frequency: 'weekly',
      conditions: { minDataPoints: 7 }
    },
    {
      id: 'location_alert',
      name: 'Location Spending Alerts',
      description: 'Alerts when near expensive stores with low mood',
      category: 'intervention',
      enabled: true,
      frequency: 'immediate',
      conditions: { moodThreshold: 4, maxDistance: 500 }
    },
    {
      id: 'weekly_summary',
      name: 'Weekly Summary',
      description: 'Weekly overview of your progress',
      category: 'insight',
      enabled: true,
      frequency: 'weekly',
      time: '10:00',
      conditions: {}
    },
    {
      id: 'goal_reminder',
      name: 'Goal Progress Reminders',
      description: 'Reminders to update your goal progress',
      category: 'reminder',
      enabled: true,
      frequency: 'weekly',
      time: '11:00',
      conditions: { hasActiveGoals: true }
    },
    {
      id: 'crisis_support',
      name: 'Crisis Support',
      description: 'Support notifications during difficult times',
      category: 'support',
      enabled: true,
      frequency: 'immediate',
      conditions: { moodThreshold: 2, consecutiveDays: 3 }
    },
    {
      id: 'subscription_upgrade',
      name: 'Subscription Promotions',
      description: 'Information about premium features',
      category: 'promotion',
      enabled: false, // Disabled by default
      frequency: 'monthly',
      conditions: { isFreeUser: true, minUsageDays: 7 }
    },
    {
      id: 'weather_mood_insight',
      name: 'Weather-Mood Insights',
      description: 'Insights about weather and mood correlation',
      category: 'insight',
      enabled: true,
      frequency: 'weekly',
      conditions: { hasWeatherData: true, minDataPoints: 14 }
    },
    {
      id: 'sleep_insight',
      name: 'Sleep Quality Insights',
      description: 'Insights about your sleep patterns',
      category: 'insight',
      enabled: true,
      frequency: 'weekly',
      conditions: { hasSleepData: true, minDataPoints: 7 }
    },
    {
      id: 'energy_insight',
      name: 'Energy Level Insights',
      description: 'Insights about your energy patterns',
      category: 'insight',
      enabled: true,
      frequency: 'weekly',
      conditions: { hasEnergyData: true, minDataPoints: 7 }
    },
    {
      id: 'focus_reminder',
      name: 'Focus Session Reminders',
      description: 'Reminders to start focus sessions',
      category: 'reminder',
      enabled: true,
      frequency: 'daily',
      time: '14:00',
      conditions: { hasFocusGoals: true }
    },
    {
      id: 'data_export_reminder',
      name: 'Data Export Reminders',
      description: 'Reminders to export your data',
      category: 'reminder',
      enabled: false, // Disabled by default
      frequency: 'monthly',
      conditions: { hasData: true, lastExportDays: 30 }
    }
  ];

  /**
   * Get user's notification preferences
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const settings = await NotificationSettings.findOne({
        where: { userId }
      });

      // Get user's custom preferences (stored in JSONB)
      const customPreferences = settings?.preferences || {};
      
      // Merge default preferences with user customizations
      const preferences = this.defaultPreferences.map(pref => ({
        ...pref,
        ...customPreferences[pref.id],
        enabled: customPreferences[pref.id]?.enabled ?? pref.enabled,
        time: customPreferences[pref.id]?.time ?? pref.time,
        frequency: customPreferences[pref.id]?.frequency ?? pref.frequency
      }));

      return {
        userId,
        preferences,
        globalSettings: {
          enabled: settings?.globalEnabled ?? true,
          quietHours: {
            start: settings?.quietHoursStart ?? '22:00',
            end: settings?.quietHoursEnd ?? '08:00'
          },
          maxNotificationsPerDay: settings?.maxNotificationsPerDay ?? 10,
          priorityLevel: (settings?.priorityLevel as 'low' | 'normal' | 'high') ?? 'normal'
        }
      };

    } catch (error) {
      logger.error('Error getting user notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update user's notification preferences
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let settings = await NotificationSettings.findOne({
        where: { userId }
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
          financeReminderFrequency: 'daily'
        });
      }

      // Update individual preferences
      if (preferences.preferences) {
        const customPreferences: Record<string, any> = {};
        
        preferences.preferences.forEach(pref => {
          customPreferences[pref.id] = {
            enabled: pref.enabled,
            time: pref.time,
            frequency: pref.frequency,
            conditions: pref.conditions
          };
        });

        await settings.update({
          preferences: customPreferences
        });
      }

      // Update global settings
      if (preferences.globalSettings) {
        const globalSettings = preferences.globalSettings;
        
        await settings.update({
          globalEnabled: globalSettings.enabled,
          quietHoursStart: globalSettings.quietHours.start,
          quietHoursEnd: globalSettings.quietHours.end,
          maxNotificationsPerDay: globalSettings.maxNotificationsPerDay,
          priorityLevel: globalSettings.priorityLevel
        });
      }

      // Return updated preferences
      return await this.getUserPreferences(userId);

    } catch (error) {
      logger.error('Error updating user notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update a specific notification preference
   */
  async updatePreference(
    userId: string,
    preferenceId: string,
    updates: Partial<NotificationPreference>
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const preference = preferences.preferences.find(p => p.id === preferenceId);
      
      if (!preference) {
        throw new Error(`Preference ${preferenceId} not found`);
      }

      // Update the specific preference
      const updatedPreferences = preferences.preferences.map(p => 
        p.id === preferenceId ? { ...p, ...updates } : p
      );

      await this.updateUserPreferences(userId, {
        preferences: updatedPreferences
      });

      logger.info(`Updated preference ${preferenceId} for user ${userId}`);

    } catch (error) {
      logger.error('Error updating notification preference:', error);
      throw error;
    }
  }

  /**
   * Enable/disable a notification preference
   */
  async togglePreference(userId: string, preferenceId: string, enabled: boolean): Promise<void> {
    await this.updatePreference(userId, preferenceId, { enabled });
  }

  /**
   * Set quiet hours for notifications
   */
  async setQuietHours(
    userId: string, 
    start: string, 
    end: string
  ): Promise<void> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      await this.updateUserPreferences(userId, {
        globalSettings: {
          ...preferences.globalSettings,
          quietHours: { start, end }
        }
      });

      logger.info(`Set quiet hours for user ${userId}: ${start} - ${end}`);

    } catch (error) {
      logger.error('Error setting quiet hours:', error);
      throw error;
    }
  }

  /**
   * Check if user should receive a notification based on their preferences
   */
  async shouldSendNotification(
    userId: string,
    notificationType: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      // Check if notifications are globally disabled
      if (!preferences.globalSettings.enabled) {
        return false;
      }

      // Check if we're in quiet hours
      if (this.isInQuietHours(preferences.globalSettings.quietHours)) {
        return false;
      }

      // Find the specific preference
      const preference = preferences.preferences.find(p => p.id === notificationType);
      if (!preference) {
        return false; // Unknown notification type
      }

      // Check if preference is enabled
      if (!preference.enabled) {
        return false;
      }

      // Check conditions
      if (preference.conditions && !this.checkConditions(preference.conditions, context)) {
        return false;
      }

      // Check daily notification limit
      const todayNotifications = await this.getTodayNotificationCount(userId);
      if (todayNotifications >= preferences.globalSettings.maxNotificationsPerDay) {
        return false;
      }

      return true;

    } catch (error) {
      logger.error('Error checking notification permission:', error);
      return false;
    }
  }

  /**
   * Get all available notification preferences
   */
  getAllPreferences(): NotificationPreference[] {
    return [...this.defaultPreferences];
  }

  /**
   * Get preferences by category
   */
  getPreferencesByCategory(category: string): NotificationPreference[] {
    return this.defaultPreferences.filter(p => p.category === category);
  }

  /**
   * Reset user preferences to defaults
   */
  async resetToDefaults(userId: string): Promise<UserNotificationPreferences> {
    try {
      const settings = await NotificationSettings.findOne({
        where: { userId }
      });

      if (settings) {
        await settings.update({
          preferences: {},
          globalEnabled: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          maxNotificationsPerDay: 10,
          priorityLevel: 'normal'
        });
      }

      return await this.getUserPreferences(userId);

    } catch (error) {
      logger.error('Error resetting preferences to defaults:', error);
      throw error;
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isInQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const startTime = quietHours.start;
    const endTime = quietHours.end;

    // Handle case where quiet hours span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Check if conditions are met for sending notification
   */
  private checkConditions(conditions: Record<string, any>, context?: Record<string, any>): boolean {
    if (!context) return true;

    for (const [key, value] of Object.entries(conditions)) {
      const contextValue = context[key];
      
      if (typeof value === 'number') {
        if (typeof contextValue !== 'number' || contextValue < value) {
          return false;
        }
      } else if (typeof value === 'boolean') {
        if (contextValue !== value) {
          return false;
        }
      } else if (typeof value === 'string') {
        if (contextValue !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get count of notifications sent to user today
   */
  private async getTodayNotificationCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await Notification.count({
      where: {
        userId,
        sentAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    return count;
  }
}

export default new NotificationPreferencesService();
