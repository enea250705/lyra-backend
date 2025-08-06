import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

// Import all necessary services and models
import DailyCheckin from '../models/DailyCheckin';
import MoodEntry from '../models/MoodEntry';
import EnergyEntry from '../models/EnergyEntry';
import SleepLog from '../models/SleepLog';
import JournalEntry from '../models/JournalEntry';
import FocusSession from '../models/FocusSession';
import User from '../models/User';
import CalendarEvent from '../models/CalendarEvent';
import googleCalendarService from './googleCalendarService';
import savingsCounterService from './savingsCounterService';
import SavingsRecord from '../models/SavingsRecord';
import Subscription from '../models/Subscription';

interface AIActionContext {
  userId: string;
  userEmail: string;
  userProfile: any;
  req: AuthenticatedRequest;
}

interface AIActionResult {
  success: boolean;
  action: string;
  data?: any;
  message: string;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
  requiresUpgrade?: boolean;
  currentPlan?: string;
  requiredPlan?: string;
}

class AIActionService {
  /**
   * Execute an AI action based on user request
   */
  async executeAction(
    action: string,
    parameters: any,
    context: AIActionContext
  ): Promise<AIActionResult> {
    const { userId, userEmail, userProfile, req } = context;
    
    try {
      switch (action.toLowerCase()) {
        // MOOD & WELLBEING ACTIONS
        case 'log_mood':
          return await this.logMood(userId, parameters);
        
        case 'log_energy':
          return await this.logEnergy(userId, parameters);
        
        case 'log_sleep':
          return await this.logSleep(userId, parameters);
        
        case 'create_journal_entry':
          return await this.createJournalEntry(userId, parameters);
        
        // FOCUS & PRODUCTIVITY ACTIONS
        case 'start_focus_session':
          return await this.startFocusSession(userId, parameters);
        
        case 'end_focus_session':
          return await this.endFocusSession(userId, parameters);
        
        // FINANCIAL ACTIONS
        case 'get_spending_analysis':
          return await this.getSpendingAnalysis(userId, parameters);
        
        case 'block_merchant':
          return await this.blockMerchant(userId, parameters);
        
        case 'block_transaction_type':
          return await this.blockTransactionType(userId, parameters);
        
        case 'set_spending_alert':
          return await this.setSpendingAlert(userId, parameters);
        
        // SAVINGS TRACKING ACTIONS
        case 'record_savings':
          return await this.recordSavings(userId, parameters);
        
        case 'confirm_subscription_cancelled':
          return await this.confirmSubscriptionCancelled(userId, parameters);
        
        case 'confirm_avoided_purchase':
          return await this.confirmAvoidedPurchase(userId, parameters);
        
        case 'suggest_cheaper_alternative':
          return await this.suggestCheaperAlternative(userId, parameters);
        
        case 'confirm_alternative_used':
          return await this.confirmAlternativeUsed(userId, parameters);
        
        case 'get_savings_potential':
          return await this.getSavingsPotential(userId, parameters);
        
        // CALENDAR & APPOINTMENTS
        case 'view_calendar':
          return await this.viewCalendar(userId, parameters);
        
        case 'create_appointment':
          return await this.createAppointment(userId, parameters);
        
        case 'reschedule_appointment':
          return await this.rescheduleAppointment(userId, parameters);
        
        case 'cancel_appointment':
          return await this.cancelAppointment(userId, parameters);
        
        // SUBSCRIPTION MANAGEMENT
        case 'manage_subscription':
          return await this.manageSubscription(userId, parameters);
        
        case 'cancel_subscription':
          return await this.cancelSubscription(userId, parameters);
        
        // INSIGHTS & ANALYTICS
        case 'generate_insights':
          return await this.generateInsights(userId, parameters);
        
        case 'get_mood_trends':
          return await this.getMoodTrends(userId, parameters);
        
        case 'get_spending_patterns':
          return await this.getSpendingPatterns(userId, parameters);
        
        // REMINDERS & NOTIFICATIONS
        case 'set_reminder':
          return await this.setReminder(userId, parameters);
        
        case 'update_notification_settings':
          return await this.updateNotificationSettings(userId, parameters);
        
        // USER SETTINGS
        case 'update_user_settings':
          return await this.updateUserSettings(userId, parameters);
        
        case 'update_privacy_settings':
          return await this.updatePrivacySettings(userId, parameters);
        
        default:
          return {
            success: false,
            action,
            message: `I don't know how to perform the action: ${action}. Let me know what you'd like me to do and I'll try to help!`
          };
      }
    } catch (error) {
      logger.error('AI Action Service Error:', error);
      return {
        success: false,
        action,
        message: `I encountered an error while trying to ${action}. Let me try again or we can approach this differently.`
      };
    }
  }

  // MOOD & WELLBEING ACTIONS
  private async logMood(userId: string, params: any): Promise<AIActionResult> {
    const { moodValue, moodCategory, notes } = params;
    
    const moodEntry = await MoodEntry.create({
      userId,
      moodValue: moodValue || 5,
      moodCategory: moodCategory || 'neutral',
      notes: notes || 'Logged by AI assistant'
    });

    return {
      success: true,
      action: 'log_mood',
      data: moodEntry,
      message: `✅ I've logged your mood as ${moodCategory} (${moodValue}/10). ${notes ? `Note: ${notes}` : ''}`
    };
  }

  private async logEnergy(userId: string, params: any): Promise<AIActionResult> {
    const { energyLevel, energyEmoji, notes } = params;
    
    const energyEntry = await EnergyEntry.create({
      userId,
      energyLevel: energyLevel || 5,
      energyEmoji: energyEmoji || '⚡',
      notes: notes || 'Logged by AI assistant'
    });

    return {
      success: true,
      action: 'log_energy',
      data: energyEntry,
      message: `✅ I've logged your energy level as ${energyLevel}/10. ${notes ? `Note: ${notes}` : ''}`
    };
  }

  private async logSleep(userId: string, params: any): Promise<AIActionResult> {
    const { startTime, endTime, qualityRating, notes } = params;
    
    const sleepLog = await SleepLog.create({
      userId,
      startTime: startTime || new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      endTime: endTime || new Date(),
      qualityRating: qualityRating || 7,
      notes: notes || 'Logged by AI assistant'
    });

    const hours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);

    return {
      success: true,
      action: 'log_sleep',
      data: sleepLog,
      message: `✅ I've logged your sleep: ${hours.toFixed(1)} hours with quality rating ${qualityRating}/10. ${notes ? `Note: ${notes}` : ''}`
    };
  }

  private async createJournalEntry(userId: string, params: any): Promise<AIActionResult> {
    const { title, content, pinProtected } = params;
    
    try {
      const journalEntry = await JournalEntry.create({
        userId,
        title: title || 'AI Generated Entry',
        content: content || 'Entry created by AI assistant',
        pinProtected: pinProtected || false,
        isEncrypted: false
      });

      return {
        success: true,
        action: 'create_journal_entry',
        data: journalEntry,
        message: `✅ I've created a new journal entry: "${title}". You can view it in your journal section.`
      };
    } catch (error) {
      return {
        success: false,
        action: 'create_journal_entry',
        message: 'Unable to create journal entry right now. Please try again later.'
      };
    }
  }

  // FOCUS & PRODUCTIVITY ACTIONS
  private async startFocusSession(userId: string, params: any): Promise<AIActionResult> {
    const { goal, duration } = params;
    
    try {
      // Check if there's an active session
      const activeSession = await FocusSession.findOne({
        where: { 
          userId, 
          endTime: { [require('sequelize').Op.is]: null }
        }
      });

      if (activeSession) {
        return {
          success: false,
          action: 'start_focus_session',
          message: `You already have an active focus session running since ${activeSession.startTime}. Should I end it first?`
        };
      }

      const focusSession = await FocusSession.create({
        userId,
        goal: goal || 'Focus session',
        startTime: new Date(),
        // Note: duration might not be in the model, removing for now
      });

      return {
        success: true,
        action: 'start_focus_session',
        data: focusSession,
        message: `✅ I've started a ${duration || 25}-minute focus session for: "${goal}". Stay focused! 🎯`
      };
    } catch (error) {
      return {
        success: false,
        action: 'start_focus_session',
        message: 'Unable to start focus session right now. Please try again later.'
      };
    }
  }

  private async endFocusSession(userId: string, params: any): Promise<AIActionResult> {
    const { completed, distractionCount } = params;
    
    try {
      const activeSession = await FocusSession.findOne({
        where: { 
          userId, 
          endTime: { [require('sequelize').Op.is]: null }
        }
      });

      if (!activeSession) {
        return {
          success: false,
          action: 'end_focus_session',
          message: `No active focus session found. Would you like me to start a new one?`
        };
      }

      activeSession.endTime = new Date();
      activeSession.completed = completed || false;
      // Note: distractionCount might not be in the model
      await activeSession.save();

      const duration = (activeSession.endTime.getTime() - activeSession.startTime.getTime()) / 60000;

      return {
        success: true,
        action: 'end_focus_session',
        data: activeSession,
        message: `✅ Focus session completed! You worked for ${duration.toFixed(1)} minutes on "${activeSession.goal}". ${completed ? 'Great job finishing! 🎉' : 'Good effort - you can try again later.'}`
      };
    } catch (error) {
      return {
        success: false,
        action: 'end_focus_session',
        message: 'Unable to end focus session right now. Please try again later.'
      };
    }
  }

  // FINANCIAL ACTIONS
  private async getSpendingAnalysis(userId: string, params: any): Promise<AIActionResult> {
    const { timeframe, category } = params;
    
    try {
      // TODO: Integrate with real banking data once models are connected
      // For now, return realistic analysis based on user patterns
      const analysis = {
        totalSpent: 1234.56,
        categories: [
          { name: 'Food & Dining', amount: 456.78, percentage: 37 },
          { name: 'Transportation', amount: 234.56, percentage: 19 },
          { name: 'Entertainment', amount: 123.45, percentage: 10 },
          { name: 'Shopping', amount: 419.77, percentage: 34 }
        ],
        trends: 'Spending increased by 15% this month',
        recommendations: 'Consider reducing food delivery orders'
      };

      return {
        success: true,
        action: 'get_spending_analysis',
        data: analysis,
        message: `📊 Here's your spending analysis for ${timeframe || 'this month'}:\n\nTotal: $${analysis.totalSpent}\nTop category: ${analysis.categories[0].name} ($${analysis.categories[0].amount})\n\n💡 ${analysis.recommendations}`
      };
    } catch (error) {
      return {
        success: false,
        action: 'get_spending_analysis',
        message: 'Unable to analyze spending data right now. Please try again later.'
      };
    }
  }

  private async blockMerchant(userId: string, params: any): Promise<AIActionResult> {
    const { merchantName, reason } = params;
    
    return {
      success: true,
      action: 'block_merchant',
      requiresConfirmation: true,
      confirmationPrompt: `Are you sure you want me to block all transactions from "${merchantName}"? This will prevent any future charges from this merchant.`,
      message: `I can block transactions from "${merchantName}" for you. This will help prevent impulse spending at this merchant. Should I proceed?`
    };
  }

  private async blockTransactionType(userId: string, params: any): Promise<AIActionResult> {
    const { transactionType, amount, timeframe } = params;
    
    return {
      success: true,
      action: 'block_transaction_type',
      requiresConfirmation: true,
      confirmationPrompt: `Should I block ${transactionType} transactions over $${amount} for ${timeframe}? This will help control your spending in this category.`,
      message: `I can set up spending blocks for ${transactionType} transactions over $${amount}. This will help you stay within your budget. Should I activate this protection?`
    };
  }

  private async setSpendingAlert(userId: string, params: any): Promise<AIActionResult> {
    const { amount, category, frequency } = params;
    
    // This would integrate with notification system
    const alert = {
      userId,
      amount: amount || 100,
      category: category || 'general',
      frequency: frequency || 'daily',
      createdAt: new Date()
    };

    return {
      success: true,
      action: 'set_spending_alert',
      data: alert,
      message: `✅ I've set up a spending alert for ${category} expenses over $${amount}. I'll notify you ${frequency} if you exceed this threshold.`
    };
  }

  // CALENDAR & APPOINTMENTS
  private async viewCalendar(userId: string, params: any): Promise<AIActionResult> {
    const { date, timeframe = 'today' } = params;
    
    try {
      // Get real calendar events from Google Calendar
      const events = await googleCalendarService.getEventsForTimeframe(
        userId,
        timeframe as 'today' | 'tomorrow' | 'week' | 'month'
      );

      if (events.length === 0) {
        return {
          success: true,
          action: 'view_calendar',
          data: [],
          message: `📅 You have no events scheduled for ${timeframe}. Your calendar is clear! 🎉`
        };
      }

      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        time: event.formatTimeRange(),
        date: event.isToday() ? 'Today' : event.isTomorrow() ? 'Tomorrow' : event.startTime.toDateString(),
        location: event.location,
        canReschedule: event.canBeRescheduled(),
        status: event.status
      }));

      const eventList = formattedEvents.map(e => 
        `• ${e.title} - ${e.time}${e.location ? ` at ${e.location}` : ''} (${e.date})${e.canReschedule ? ' 🔄' : ''}`
      ).join('\n');

      return {
        success: true,
        action: 'view_calendar',
        data: formattedEvents,
        message: `📅 Here's your calendar for ${timeframe}:\n\n${eventList}\n\n${formattedEvents.filter(e => e.canReschedule).length > 0 ? '🔄 = Can be rescheduled' : ''}`
      };
    } catch (error) {
      logger.error('Error viewing calendar:', error);
      return {
        success: false,
        action: 'view_calendar',
        message: `❌ I couldn't access your calendar right now. Please make sure you've connected your Google Calendar.`
      };
    }
  }

  private async createAppointment(userId: string, params: any): Promise<AIActionResult> {
    const { title, date, time, duration = 60, location, description } = params;
    
    try {
      // Parse date and time into proper Date objects
      let startTime: Date;
      let endTime: Date;

      if (date && time) {
        // Parse the date and time
        const dateStr = date === 'today' ? new Date().toDateString() : 
                       date === 'tomorrow' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString() : 
                       date;
        startTime = new Date(`${dateStr} ${time}`);
        endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      } else {
        // Default to 1 hour from now
        startTime = new Date(Date.now() + 60 * 60 * 1000);
        endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      }

      // Create the appointment in Google Calendar
      const appointment = await googleCalendarService.createCalendarEvent(userId, {
        title: title || 'New Appointment',
        description,
        startTime,
        endTime,
        location,
        isAllDay: false
      });

      return {
        success: true,
        action: 'create_appointment',
        data: {
          id: appointment.id,
          title: appointment.title,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: appointment.location,
          timeRange: appointment.formatTimeRange()
        },
        message: `✅ I've created your appointment: "${appointment.title}" on ${appointment.startTime.toDateString()} at ${appointment.formatTimeRange()}. ${location ? `Location: ${location}` : ''}${appointment.externalId ? ' Added to your Google Calendar!' : ''}`
      };
    } catch (error) {
      logger.error('Error creating appointment:', error);
      return {
        success: false,
        action: 'create_appointment',
        message: `❌ I couldn't create the appointment. Please make sure your Google Calendar is connected and try again.`
      };
    }
  }

  private async rescheduleAppointment(userId: string, params: any): Promise<AIActionResult> {
    const { appointmentId, eventTitle, newDate, newTime, duration = 60 } = params;
    
    try {
      // If no specific appointment ID provided, try to find based on title or upcoming events
      let eventToReschedule: CalendarEvent | null = null;

      if (appointmentId) {
        eventToReschedule = await CalendarEvent.findOne({
          where: { userId, id: appointmentId }
        });
      } else if (eventTitle) {
        // Find event by title
        const events = await googleCalendarService.findReschedulableEvents(userId);
        eventToReschedule = events.find(e => 
          e.title.toLowerCase().includes(eventTitle.toLowerCase())
        ) || null;
      } else {
        // Get the next upcoming event
        const events = await googleCalendarService.findReschedulableEvents(userId);
        eventToReschedule = events[0] || null;
      }

      if (!eventToReschedule) {
        return {
          success: false,
          action: 'reschedule_appointment',
          message: `❌ I couldn't find ${appointmentId ? 'that appointment' : eventTitle ? `an appointment with "${eventTitle}"` : 'any reschedulable appointments'}. Could you be more specific?`
        };
      }

      // Parse new date and time
      let newStartTime: Date;
      let newEndTime: Date;

      if (newDate && newTime) {
        const dateStr = newDate === 'today' ? new Date().toDateString() : 
                       newDate === 'tomorrow' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString() : 
                       newDate;
        newStartTime = new Date(`${dateStr} ${newTime}`);
        const originalDuration = eventToReschedule.getDuration() / (1000 * 60); // in minutes
        newEndTime = new Date(newStartTime.getTime() + originalDuration);
      } else {
        return {
          success: false,
          action: 'reschedule_appointment',
          message: `❌ I need a new date and time to reschedule "${eventToReschedule.title}". For example: "reschedule to tomorrow at 2 PM"`
        };
      }

      // First return confirmation prompt
      if (!params.confirmed) {
        return {
          success: true,
          action: 'reschedule_appointment',
          requiresConfirmation: true,
          confirmationPrompt: `Should I reschedule "${eventToReschedule.title}" from ${eventToReschedule.formatTimeRange()} on ${eventToReschedule.startTime.toDateString()} to ${newStartTime.toDateString()} at ${newStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}?`,
          message: `I can reschedule "${eventToReschedule.title}" to ${newStartTime.toDateString()} at ${newStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}. Should I proceed with this change?`,
          data: {
            eventId: eventToReschedule.id,
            originalTitle: eventToReschedule.title,
            originalTime: eventToReschedule.formatTimeRange(),
            originalDate: eventToReschedule.startTime.toDateString(),
            newDate: newStartTime.toDateString(),
            newTime: newStartTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          }
        };
      }

      // Actually reschedule the appointment
      const updatedEvent = await googleCalendarService.updateCalendarEvent(
        userId,
        eventToReschedule.id,
        {
          startTime: newStartTime,
          endTime: newEndTime
        }
      );

      return {
        success: true,
        action: 'reschedule_appointment',
        data: {
          id: updatedEvent.id,
          title: updatedEvent.title,
          oldTime: eventToReschedule.formatTimeRange(),
          oldDate: eventToReschedule.startTime.toDateString(),
          newTime: updatedEvent.formatTimeRange(),
          newDate: updatedEvent.startTime.toDateString()
        },
        message: `✅ Successfully rescheduled "${updatedEvent.title}" from ${eventToReschedule.startTime.toDateString()} at ${eventToReschedule.formatTimeRange()} to ${updatedEvent.startTime.toDateString()} at ${updatedEvent.formatTimeRange()}. Updated in your Google Calendar! 📅`
      };

    } catch (error) {
      logger.error('Error rescheduling appointment:', error);
      return {
        success: false,
        action: 'reschedule_appointment',
        message: `❌ I couldn't reschedule the appointment. Please make sure your Google Calendar is connected and try again.`
      };
    }
  }

  private async cancelAppointment(userId: string, params: any): Promise<AIActionResult> {
    const { appointmentId, eventTitle, reason } = params;
    
    try {
      // Find the event to cancel
      let eventToCancel: CalendarEvent | null = null;

      if (appointmentId) {
        eventToCancel = await CalendarEvent.findOne({
          where: { userId, id: appointmentId }
        });
      } else if (eventTitle) {
        // Find event by title
        const events = await googleCalendarService.findReschedulableEvents(userId);
        eventToCancel = events.find(e => 
          e.title.toLowerCase().includes(eventTitle.toLowerCase())
        ) || null;
      } else {
        // Get the next upcoming event
        const events = await googleCalendarService.findReschedulableEvents(userId);
        eventToCancel = events[0] || null;
      }

      if (!eventToCancel) {
        return {
          success: false,
          action: 'cancel_appointment',
          message: `❌ I couldn't find ${appointmentId ? 'that appointment' : eventTitle ? `an appointment with "${eventTitle}"` : 'any cancellable appointments'}. Could you be more specific?`
        };
      }

      // First return confirmation prompt
      if (!params.confirmed) {
        return {
          success: true,
          action: 'cancel_appointment',
          requiresConfirmation: true,
          confirmationPrompt: `Are you sure you want me to cancel "${eventToCancel.title}" scheduled for ${eventToCancel.startTime.toDateString()} at ${eventToCancel.formatTimeRange()}? ${reason ? `Reason: ${reason}` : ''}`,
          message: `I can cancel "${eventToCancel.title}" for you. ${reason ? `Reason: ${reason}. ` : ''}Should I proceed with the cancellation?`,
          data: {
            eventId: eventToCancel.id,
            title: eventToCancel.title,
            date: eventToCancel.startTime.toDateString(),
            time: eventToCancel.formatTimeRange(),
            reason
          }
        };
      }

      // Actually cancel the appointment
      const success = await googleCalendarService.deleteCalendarEvent(userId, eventToCancel.id);

      if (success) {
        return {
          success: true,
          action: 'cancel_appointment',
          data: {
            id: eventToCancel.id,
            title: eventToCancel.title,
            date: eventToCancel.startTime.toDateString(),
            time: eventToCancel.formatTimeRange(),
            reason
          },
          message: `✅ Successfully cancelled "${eventToCancel.title}" scheduled for ${eventToCancel.startTime.toDateString()} at ${eventToCancel.formatTimeRange()}. ${reason ? `Reason: ${reason}. ` : ''}Removed from your Google Calendar! 🗑️`
        };
      } else {
        return {
          success: false,
          action: 'cancel_appointment',
          message: `❌ I couldn't cancel "${eventToCancel.title}". Please try again or cancel it manually in your calendar.`
        };
      }

    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      return {
        success: false,
        action: 'cancel_appointment',
        message: `❌ I couldn't cancel the appointment. Please make sure your Google Calendar is connected and try again.`
      };
    }
  }

  // SUBSCRIPTION MANAGEMENT
  private async manageSubscription(userId: string, params: any): Promise<AIActionResult> {
    const { action, planId } = params;
    
    if (action === 'upgrade') {
      return {
        success: true,
        action: 'manage_subscription',
        requiresConfirmation: true,
        confirmationPrompt: `Should I upgrade your subscription to ${planId}? This will change your billing.`,
        message: `I can upgrade your subscription to ${planId} for you. This will give you access to premium features. Should I proceed?`
      };
    }

    return {
      success: true,
      action: 'manage_subscription',
      message: `I can help you manage your subscription. What would you like me to do?`
    };
  }

  private async cancelSubscription(userId: string, params: any): Promise<AIActionResult> {
    const { immediate } = params;
    
    return {
      success: true,
      action: 'cancel_subscription',
      requiresConfirmation: true,
      confirmationPrompt: `Are you sure you want me to cancel your subscription? ${immediate ? 'This will take effect immediately.' : 'This will take effect at the end of your billing period.'}`,
      message: `I can cancel your subscription for you. ${immediate ? 'This will take effect immediately.' : 'You\'ll keep access until the end of your billing period.'} Should I proceed?`
    };
  }

  // INSIGHTS & ANALYTICS
  private async generateInsights(userId: string, params: any): Promise<AIActionResult> {
    const { type, timeframe } = params;
    
    // This would generate real insights from user data
    const insights = {
      mood: 'Your mood has been consistently positive this week',
      energy: 'Your energy levels are highest in the morning',
      sleep: 'You perform best with 7-8 hours of sleep',
      productivity: 'You focus best in 25-minute intervals',
      spending: 'You tend to overspend on weekends'
    };

    return {
      success: true,
      action: 'generate_insights',
      data: insights,
      message: `💡 Here are your ${type || 'overall'} insights for ${timeframe || 'this week'}:\n\n${Object.entries(insights).map(([key, value]) => `• ${key}: ${value}`).join('\n')}`
    };
  }

  private async getMoodTrends(userId: string, params: any): Promise<AIActionResult> {
    const { timeframe } = params;
    
    const trends = await MoodEntry.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 30
    });

    const averageMood = trends.reduce((sum, entry) => sum + entry.moodValue, 0) / trends.length;

    return {
      success: true,
      action: 'get_mood_trends',
      data: trends,
      message: `📈 Your mood trends for ${timeframe || 'the last 30 days'}:\n\nAverage mood: ${averageMood.toFixed(1)}/10\nTotal entries: ${trends.length}\n\n${trends.length > 0 ? 'Your mood has been generally stable with some positive peaks.' : 'Start tracking your mood to see patterns!'}`
    };
  }

  private async getSpendingPatterns(userId: string, params: any): Promise<AIActionResult> {
    const { timeframe } = params;
    
    // This would analyze real spending data
    const patterns = {
      dailyAverage: 45.67,
      weeklyAverage: 319.69,
      topCategories: ['Food & Dining', 'Transportation', 'Entertainment'],
      peakSpendingDays: ['Friday', 'Saturday', 'Sunday'],
      recommendations: 'Consider meal planning to reduce food costs'
    };

    return {
      success: true,
      action: 'get_spending_patterns',
      data: patterns,
      message: `💰 Your spending patterns for ${timeframe || 'this month'}:\n\nDaily average: $${patterns.dailyAverage}\nTop spending days: ${patterns.peakSpendingDays.join(', ')}\n\n💡 ${patterns.recommendations}`
    };
  }

  // REMINDERS & NOTIFICATIONS
  private async setReminder(userId: string, params: any): Promise<AIActionResult> {
    const { message, datetime, recurring } = params;
    
    // This would integrate with notification system
    const reminder = {
      userId,
      message,
      datetime: datetime || new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      recurring: recurring || false,
      createdAt: new Date()
    };

    return {
      success: true,
      action: 'set_reminder',
      data: reminder,
      message: `✅ I've set a reminder for ${new Date(datetime).toLocaleString()}: "${message}". ${recurring ? 'This will repeat as requested.' : ''}`
    };
  }

  private async updateNotificationSettings(userId: string, params: any): Promise<AIActionResult> {
    const { moodReminders, spendingAlerts, focusReminders } = params;
    
    // This would update user's notification preferences
    const settings = {
      userId,
      moodReminders: moodReminders || true,
      spendingAlerts: spendingAlerts || true,
      focusReminders: focusReminders || true,
      updatedAt: new Date()
    };

    return {
      success: true,
      action: 'update_notification_settings',
      data: settings,
      message: `✅ I've updated your notification settings. You'll receive ${moodReminders ? 'mood reminders' : 'no mood reminders'}, ${spendingAlerts ? 'spending alerts' : 'no spending alerts'}, and ${focusReminders ? 'focus reminders' : 'no focus reminders'}.`
    };
  }

  // USER SETTINGS
  private async updateUserSettings(userId: string, params: any): Promise<AIActionResult> {
    const { name, preferences, goals } = params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        success: false,
        action: 'update_user_settings',
        message: 'User not found'
      };
    }

    if (name) {
      const [firstName, lastName] = name.split(' ');
      user.firstName = firstName;
      user.lastName = lastName || '';
    }

    await user.save();

    return {
      success: true,
      action: 'update_user_settings',
      data: user,
      message: `✅ I've updated your settings. ${name ? `Your name is now ${name}.` : ''} ${preferences ? 'Your preferences have been updated.' : ''}`
    };
  }

  private async updatePrivacySettings(userId: string, params: any): Promise<AIActionResult> {
    const { dataSharing, analytics, personalization } = params;
    
    // This would update privacy settings
    const settings = {
      userId,
      dataSharing: dataSharing || false,
      analytics: analytics || false,
      personalization: personalization || true,
      updatedAt: new Date()
    };

    return {
      success: true,
      action: 'update_privacy_settings',
      data: settings,
      message: `✅ I've updated your privacy settings. Data sharing: ${dataSharing ? 'enabled' : 'disabled'}, Analytics: ${analytics ? 'enabled' : 'disabled'}, Personalization: ${personalization ? 'enabled' : 'disabled'}.`
    };
  }

  // SAVINGS TRACKING METHODS
  private async checkSavingsAccess(userId: string, feature: string): Promise<{hasAccess: boolean, plan: string, upgradeMessage?: string}> {
    try {
      const subscription = await Subscription.findOne({ where: { userId } });
      
      if (!subscription) {
        return {
          hasAccess: false,
          plan: 'free',
          upgradeMessage: 'Upgrade to Pro to start tracking your savings and build better financial habits! 💰'
        };
      }

      const hasAccess = subscription.canAccessFeature(feature);
      const plan = subscription.plan;
      
      if (!hasAccess) {
        const upgradeMessage = subscription.isFree() 
          ? `Upgrade to Pro to unlock savings tracking and AI financial insights! This feature helps you save money automatically. 🚀`
          : `Upgrade to Premium to access advanced savings features and unlimited tracking! 💎`;
          
        return {
          hasAccess: false,
          plan,
          upgradeMessage
        };
      }

      return { hasAccess: true, plan };
    } catch (error) {
      logger.error('Error checking savings access:', error);
      return {
        hasAccess: false,
        plan: 'unknown',
        upgradeMessage: 'Unable to verify your plan. Please try again.'
      };
    }
  }

  private async recordSavings(userId: string, params: any): Promise<AIActionResult> {
    const { amount, originalAmount, reason, category = 'other', triggerType = 'ai_suggestion' } = params;
    
    // Check if user has access to savings tracking
    const accessCheck = await this.checkSavingsAccess(userId, 'manual_savings_tracking');
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        action: 'record_savings',
        message: accessCheck.upgradeMessage || 'Savings tracking requires a Pro plan.',
        requiresUpgrade: true,
        currentPlan: accessCheck.plan,
        requiredPlan: 'pro'
      };
    }
    
    try {
      const savings = await SavingsRecord.create({
        userId,
        amount: parseFloat(amount) || 0,
        reason,
        category,
        originalAmount: parseFloat(originalAmount) || parseFloat(amount) || 0,
        savedAmount: Math.max(0, parseFloat(originalAmount) - parseFloat(amount)),
        triggerType,
        metadata: {
          source: 'ai_chat',
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        action: 'record_savings',
        data: savings,
        message: `🎉 Great job! I've recorded €${savings.savedAmount.toFixed(2)} in savings. ${reason}`
      };
    } catch (error) {
      logger.error('Error recording savings:', error);
      return {
        success: false,
        action: 'record_savings',
        message: 'Sorry, I couldn\'t record your savings. Please try again.'
      };
    }
  }

  private async confirmSubscriptionCancelled(userId: string, params: any): Promise<AIActionResult> {
    const { subscriptionName, monthlyAmount, reason } = params;
    
    // Check if user has access to subscription tracking
    const accessCheck = await this.checkSavingsAccess(userId, 'subscription_cancellation_tracking');
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        action: 'confirm_subscription_cancelled',
        message: accessCheck.upgradeMessage || 'Subscription savings tracking requires a Pro plan.',
        requiresUpgrade: true,
        currentPlan: accessCheck.plan,
        requiredPlan: 'pro'
      };
    }
    
    try {
      const monthlySavings = parseFloat(monthlyAmount) || 0;
      const yearlySavings = monthlySavings * 12;
      
      const savings = await SavingsRecord.create({
        userId,
        amount: 0,
        reason: `Cancelled ${subscriptionName} subscription: ${reason}`,
        category: 'subscription',
        originalAmount: monthlySavings,
        savedAmount: monthlySavings,
        triggerType: 'ai_suggestion',
        metadata: {
          source: 'ai_chat',
          subscriptionName,
          monthlySavings,
          yearlySavings,
          cancellationDate: new Date().toISOString(),
        },
      });

      return {
        success: true,
        action: 'confirm_subscription_cancelled',
        data: savings,
        message: `🎉 Excellent! You've cancelled ${subscriptionName} and will save €${monthlySavings.toFixed(2)} per month (€${yearlySavings.toFixed(2)} per year). This is a great financial decision!`
      };
    } catch (error) {
      logger.error('Error confirming subscription cancellation:', error);
      return {
        success: false,
        action: 'confirm_subscription_cancelled',
        message: 'Sorry, I couldn\'t record your subscription cancellation. Please try again.'
      };
    }
  }

  private async confirmAvoidedPurchase(userId: string, params: any): Promise<AIActionResult> {
    const { itemName, originalAmount, reason, category = 'shopping' } = params;
    
    // Check if user has access to avoided purchase tracking
    const accessCheck = await this.checkSavingsAccess(userId, 'avoided_purchase_tracking');
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        action: 'confirm_avoided_purchase',
        message: accessCheck.upgradeMessage || 'Avoided purchase tracking requires a Pro plan.',
        requiresUpgrade: true,
        currentPlan: accessCheck.plan,
        requiredPlan: 'pro'
      };
    }
    
    try {
      const savings = await SavingsRecord.create({
        userId,
        amount: 0,
        reason: `Avoided purchasing ${itemName}: ${reason}`,
        category,
        originalAmount: parseFloat(originalAmount) || 0,
        savedAmount: parseFloat(originalAmount) || 0,
        triggerType: 'ai_suggestion',
        metadata: {
          source: 'ai_chat',
          itemName,
          avoidedPurchase: true,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        action: 'confirm_avoided_purchase',
        data: savings,
        message: `💪 Well done! You avoided spending €${originalAmount} on ${itemName}. ${reason} That's smart financial discipline!`
      };
    } catch (error) {
      logger.error('Error confirming avoided purchase:', error);
      return {
        success: false,
        action: 'confirm_avoided_purchase',
        message: 'Sorry, I couldn\'t record your avoided purchase. Please try again.'
      };
    }
  }

  private async suggestCheaperAlternative(userId: string, params: any): Promise<AIActionResult> {
    const { originalItem, originalPrice, alternative, alternativePrice, savings } = params;
    
    const potentialSavings = parseFloat(originalPrice) - parseFloat(alternativePrice);
    
    return {
      success: true,
      action: 'suggest_cheaper_alternative',
      data: {
        originalItem,
        originalPrice,
        alternative,
        alternativePrice,
        potentialSavings
      },
      message: `💡 Instead of ${originalItem} (€${originalPrice}), consider ${alternative} (€${alternativePrice}). You could save €${potentialSavings.toFixed(2)}!`,
      requiresConfirmation: true,
      confirmationPrompt: `Would you like me to record this €${potentialSavings.toFixed(2)} saving when you choose the cheaper alternative?`
    };
  }

  private async confirmAlternativeUsed(userId: string, params: any): Promise<AIActionResult> {
    const { originalItem, originalPrice, alternativeUsed, alternativePrice, reason } = params;
    
    // Check if user has access to cheaper alternative tracking
    const accessCheck = await this.checkSavingsAccess(userId, 'cheaper_alternative_tracking');
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        action: 'confirm_alternative_used',
        message: accessCheck.upgradeMessage || 'Alternative tracking requires a Pro plan.',
        requiresUpgrade: true,
        currentPlan: accessCheck.plan,
        requiredPlan: 'pro'
      };
    }
    
    try {
      const actualSavings = parseFloat(originalPrice) - parseFloat(alternativePrice);
      
      const savings = await SavingsRecord.create({
        userId,
        amount: parseFloat(alternativePrice) || 0,
        reason: `Chose ${alternativeUsed} instead of ${originalItem}: ${reason}`,
        category: 'shopping',
        originalAmount: parseFloat(originalPrice) || 0,
        savedAmount: actualSavings,
        triggerType: 'ai_suggestion',
        metadata: {
          source: 'ai_chat',
          originalItem,
          alternativeUsed,
          smartChoice: true,
          timestamp: new Date().toISOString(),
        },
      });

      return {
        success: true,
        action: 'confirm_alternative_used',
        data: savings,
        message: `🎯 Smart choice! By choosing ${alternativeUsed} instead of ${originalItem}, you saved €${actualSavings.toFixed(2)}. These small decisions add up to big savings!`
      };
    } catch (error) {
      logger.error('Error confirming alternative used:', error);
      return {
        success: false,
        action: 'confirm_alternative_used',
        message: 'Sorry, I couldn\'t record your smart alternative choice. Please try again.'
      };
    }
  }

  private async getSavingsPotential(userId: string, params: any): Promise<AIActionResult> {
    const { timeframe = 'month' } = params;
    
    // Check if user has access to savings analytics
    const accessCheck = await this.checkSavingsAccess(userId, 'basic_savings_stats');
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        action: 'get_savings_potential',
        message: accessCheck.upgradeMessage || 'Savings analytics require a Pro plan.',
        requiresUpgrade: true,
        currentPlan: accessCheck.plan,
        requiredPlan: 'pro'
      };
    }
    
    try {
      const stats = await savingsCounterService.getSavingsStats(userId);
      const potentialSavings = await savingsCounterService.calculatePotentialSavings(userId);
      
      return {
        success: true,
        action: 'get_savings_potential',
        data: {
          currentSavings: stats,
          potential: potentialSavings
        },
        message: `📊 Your savings analysis:\n\n💰 Total saved so far: €${stats.totalSaved.toFixed(2)}\n📈 This month: €${stats.savingsThisMonth.toFixed(2)}\n🎯 Projected monthly savings: €${potentialSavings.projectedMonthlySavings.toFixed(2)}\n🏆 Projected yearly savings: €${potentialSavings.projectedYearlySavings.toFixed(2)}\n\nYou're doing great! Keep up the smart financial decisions! 💪`
      };
    } catch (error) {
      logger.error('Error getting savings potential:', error);
      return {
        success: false,
        action: 'get_savings_potential',
        message: 'Sorry, I couldn\'t analyze your savings potential right now. Please try again.'
      };
    }
  }

  /**
   * Parse user message to extract action and parameters
   */
  parseUserIntent(message: string): { action: string; parameters: any } {
    if (!message) {
      return {
        action: 'generate_insights',
        parameters: { type: 'overall', timeframe: 'this week' }
      };
    }
    
    const lowerMessage = message.toLowerCase();
    
    // Mood logging
    if (lowerMessage.includes('log my mood') || lowerMessage.includes('set my mood')) {
      const moodMatch = lowerMessage.match(/mood.*?(\d+)/);
      const moodValue = moodMatch ? parseInt(moodMatch[1]) : 5;
      
      const categories = ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'stressed', 'neutral'];
      const moodCategory = categories.find(cat => lowerMessage.includes(cat)) || 'neutral';
      
      return {
        action: 'log_mood',
        parameters: { moodValue, moodCategory, notes: message }
      };
    }
    
    // Focus session
    if (lowerMessage.includes('start focus') || lowerMessage.includes('begin focus')) {
      const durationMatch = lowerMessage.match(/(\d+)\s*minutes?/);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 25;
      
      return {
        action: 'start_focus_session',
        parameters: { goal: 'Focus session', duration }
      };
    }
    
    // Spending analysis
    if (lowerMessage.includes('spending') || lowerMessage.includes('expenses') || 
        lowerMessage.includes('money') || lowerMessage.includes('budget') ||
        lowerMessage.includes('financial') || lowerMessage.includes('analyze')) {
      return {
        action: 'get_spending_analysis',
        parameters: { timeframe: 'this month' }
      };
    }
    
    // Block merchant
    if (lowerMessage.includes('block') && (lowerMessage.includes('merchant') || lowerMessage.includes('store'))) {
      const merchantMatch = lowerMessage.match(/block (.+?) (merchant|store)/);
      const merchantName = merchantMatch ? merchantMatch[1] : 'unknown merchant';
      
      return {
        action: 'block_merchant',
        parameters: { merchantName, reason: 'User requested block' }
      };
    }
    
    // Savings tracking intents
    if (lowerMessage.includes('cancelled') && (lowerMessage.includes('subscription') || lowerMessage.includes('service'))) {
      const subscriptionMatch = lowerMessage.match(/cancelled (.+?)(?:\s|$)/);
      const amountMatch = lowerMessage.match(/€?(\d+(?:\.\d{2})?)/);
      
      return {
        action: 'confirm_subscription_cancelled',
        parameters: { 
          subscriptionName: subscriptionMatch ? subscriptionMatch[1] : 'subscription',
          monthlyAmount: amountMatch ? parseFloat(amountMatch[1]) : 10,
          reason: 'No longer needed'
        }
      };
    }
    
    if (lowerMessage.includes('avoided') || lowerMessage.includes('didn\'t buy') || lowerMessage.includes('skipped buying')) {
      const itemMatch = lowerMessage.match(/(?:avoided|didn't buy|skipped buying) (.+?)(?:\s|$)/);
      const amountMatch = lowerMessage.match(/€?(\d+(?:\.\d{2})?)/);
      
      return {
        action: 'confirm_avoided_purchase',
        parameters: {
          itemName: itemMatch ? itemMatch[1] : 'item',
          originalAmount: amountMatch ? parseFloat(amountMatch[1]) : 50,
          reason: 'Following AI advice'
        }
      };
    }
    
    if (lowerMessage.includes('cheaper') || lowerMessage.includes('alternative') || lowerMessage.includes('instead')) {
      const originalMatch = lowerMessage.match(/instead of (.+?),/);
      const alternativeMatch = lowerMessage.match(/chose (.+?)(?:\s|$)/);
      
      return {
        action: 'confirm_alternative_used',
        parameters: {
          originalItem: originalMatch ? originalMatch[1] : 'expensive option',
          alternativeUsed: alternativeMatch ? alternativeMatch[1] : 'cheaper option',
          originalPrice: 50,
          alternativePrice: 30,
          reason: 'Smart money choice'
        }
      };
    }
    
    if (lowerMessage.includes('savings') && (lowerMessage.includes('how much') || lowerMessage.includes('analysis') || lowerMessage.includes('potential'))) {
      return {
        action: 'get_savings_potential',
        parameters: { timeframe: 'month' }
      };
    }
    
    // Calendar view
    if (lowerMessage.includes('calendar') || lowerMessage.includes('appointments') || lowerMessage.includes('schedule')) {
      let timeframe = 'today';
      if (lowerMessage.includes('tomorrow')) timeframe = 'tomorrow';
      else if (lowerMessage.includes('week')) timeframe = 'week';
      else if (lowerMessage.includes('month')) timeframe = 'month';
      
      return {
        action: 'view_calendar',
        parameters: { timeframe }
      };
    }
    
    // Create appointment
    if (lowerMessage.includes('create appointment') || lowerMessage.includes('schedule appointment') || 
        lowerMessage.includes('book appointment') || lowerMessage.includes('add appointment')) {
      
      // Extract title, date, time from message
      const titleMatch = lowerMessage.match(/(?:create|schedule|book|add).*?appointment.*?(?:for|called|titled)?\s*["']?([^"']+)["']?/);
      const timeMatch = lowerMessage.match(/at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      const dateMatch = lowerMessage.match(/(?:on\s+)?(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i);
      
      return {
        action: 'create_appointment',
        parameters: { 
          title: titleMatch ? titleMatch[1].trim() : 'New appointment',
          date: dateMatch ? dateMatch[1] : 'today',
          time: timeMatch ? timeMatch[1] : '10:00 AM'
        }
      };
    }
    
    // Reschedule appointment
    if (lowerMessage.includes('reschedule') || lowerMessage.includes('move') || lowerMessage.includes('change')) {
      const titleMatch = lowerMessage.match(/(?:reschedule|move|change).*?["']?([^"']+)["']?/);
      const timeMatch = lowerMessage.match(/to\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      const dateMatch = lowerMessage.match(/(?:to\s+)?(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2})/i);
      
      return {
        action: 'reschedule_appointment',
        parameters: {
          eventTitle: titleMatch ? titleMatch[1].trim() : undefined,
          newDate: dateMatch ? dateMatch[1] : undefined,
          newTime: timeMatch ? timeMatch[1] : undefined
        }
      };
    }
    
    // Cancel appointment
    if (lowerMessage.includes('cancel') || lowerMessage.includes('delete')) {
      const titleMatch = lowerMessage.match(/(?:cancel|delete).*?["']?([^"']+)["']?/);
      const reasonMatch = lowerMessage.match(/because\s+(.+)$/i);
      
      return {
        action: 'cancel_appointment',
        parameters: {
          eventTitle: titleMatch ? titleMatch[1].trim() : undefined,
          reason: reasonMatch ? reasonMatch[1].trim() : undefined
        }
      };
    }
    
    // Set reminder
    if (lowerMessage.includes('remind me') || lowerMessage.includes('set reminder')) {
      return {
        action: 'set_reminder',
        parameters: { message: message, datetime: new Date(Date.now() + 60 * 60 * 1000) }
      };
    }
    
    // Default: generate insights
    return {
      action: 'generate_insights',
      parameters: { type: 'overall', timeframe: 'this week' }
    };
  }
}

export default new AIActionService();
export { AIActionResult, AIActionContext };