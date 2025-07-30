import logger from '../utils/logger';
import User from '../models/User';
import MoodEntry from '../models/MoodEntry';
import Subscription from '../models/Subscription';
import weatherMoodService from './weatherMoodService';
import savingsCounterService from './savingsCounterService';
import { Op } from 'sequelize';

interface InterventionContext {
  userId: string;
  currentMood: number;
  location: {
    latitude: number;
    longitude: number;
  };
  weather?: any;
  nearbyStores?: any[];
  sleepData?: any;
  recentSpending?: any[];
  userProfile?: any;
}

interface InterventionResult {
  shouldIntervene: boolean;
  interventionType: string;
  riskLevel: 'low' | 'medium' | 'high';
  message: string;
  recommendations: string[];
  estimatedSavings?: number;
  metadata?: Record<string, any>;
}

interface InterventionRule {
  id: string;
  name: string;
  requiredPlan: 'free' | 'pro' | 'premium';
  priority: number;
  condition: (context: InterventionContext) => boolean;
  action: (context: InterventionContext) => InterventionResult;
}

class InterventionService {
  private rules: InterventionRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.rules = [
      // PRO PLAN RULES
      {
        id: 'mood_spending_correlation',
        name: 'Mood-Based Spending Intervention',
        requiredPlan: 'pro',
        priority: 1,
        condition: (context): boolean => {
          return !!(context.currentMood <= 4 && context.nearbyStores && context.nearbyStores.length > 0);
        },
        action: (context) => {
          const nearbyExpensiveStores = context.nearbyStores!.filter(store => 
            store.distance < 500 && ['expensive', 'very_expensive', 'luxury'].includes(store.priceLevel)
          );

          if (nearbyExpensiveStores.length > 0) {
            return {
              shouldIntervene: true,
              interventionType: 'mood_spending_correlation',
              riskLevel: 'high',
              message: `Your mood is low (${context.currentMood}/10) and you're near expensive stores. Consider waiting before making purchases.`,
              recommendations: [
                'Take a 10-minute walk to clear your head',
                'Call a friend or family member',
                'Practice deep breathing exercises',
                'Wait 24 hours before making any purchases',
                'Consider if this purchase aligns with your goals'
              ],
              estimatedSavings: 100,
              metadata: {
                nearbyStores: nearbyExpensiveStores,
                mood: context.currentMood,
                triggerType: 'low_mood_expensive_stores'
              }
            };
          }

          return {
            shouldIntervene: false,
            interventionType: 'mood_spending_correlation',
            riskLevel: 'low',
            message: '',
            recommendations: []
          };
        }
      },

      // PREMIUM PLAN RULES
      {
        id: 'location_based_intervention',
        name: 'Location-Based Spending Alert',
        requiredPlan: 'premium',
        priority: 2,
        condition: (context): boolean => {
          return !!(context.nearbyStores && context.nearbyStores.some(store => 
            store.distance < 200 && store.priceLevel === 'luxury'
          ));
        },
        action: (context) => {
          const luxuryStores = context.nearbyStores!.filter(store => 
            store.distance < 200 && store.priceLevel === 'luxury'
          );

          return {
            shouldIntervene: true,
            interventionType: 'location_based_intervention',
            riskLevel: 'high',
            message: `You're very close to luxury stores. High spending risk detected!`,
            recommendations: [
              'Set a strict budget before entering',
              'Make a list of what you actually need',
              'Consider if you can wait 48 hours',
              'Think about your financial goals',
              'Ask yourself: "Will this purchase matter in 6 months?"'
            ],
            estimatedSavings: 250,
            metadata: {
              luxuryStores,
              triggerType: 'luxury_store_proximity'
            }
          };
        }
      },

      {
        id: 'weather_mood_intervention',
        name: 'Weather-Mood Spending Intervention',
        requiredPlan: 'premium',
        priority: 3,
        condition: (context): boolean => {
          return !!(context.weather && 
                 context.weather.weatherType === 'Rain' && 
                 context.currentMood <= 5);
        },
        action: (context) => {
          return {
            shouldIntervene: true,
            interventionType: 'weather_mood_intervention',
            riskLevel: 'medium',
            message: `Rainy weather + low mood can trigger comfort spending. Be mindful of your purchases.`,
            recommendations: [
              'Try indoor activities instead of shopping',
              'Make a warm drink and relax at home',
              'Watch a favorite movie or read a book',
              'Consider if you\'re shopping to feel better',
              'Wait until the weather improves to make decisions'
            ],
            estimatedSavings: 75,
            metadata: {
              weather: context.weather,
              mood: context.currentMood,
              triggerType: 'weather_mood_correlation'
            }
          };
        }
      },

      {
        id: 'sleep_deprivation_intervention',
        name: 'Sleep-Based Decision Making Alert',
        requiredPlan: 'premium',
        priority: 4,
        condition: (context): boolean => {
          return !!(context.sleepData && 
                 context.sleepData.sleepDuration < 6 && 
                 context.nearbyStores && 
                 context.nearbyStores.length > 0);
        },
        action: (context) => {
          return {
            shouldIntervene: true,
            interventionType: 'sleep_deprivation_intervention',
            riskLevel: 'high',
            message: `You're sleep deprived (${context.sleepData.sleepDuration}h sleep). Poor sleep affects decision-making and can lead to impulsive purchases.`,
            recommendations: [
              'Avoid major purchase decisions when tired',
              'Get some rest before shopping',
              'Stick to your shopping list only',
              'Consider postponing non-essential purchases',
              'Prioritize sleep over shopping trips'
            ],
            estimatedSavings: 150,
            metadata: {
              sleepData: context.sleepData,
              triggerType: 'sleep_deprivation'
            }
          };
        }
      },

      {
        id: 'spending_pattern_intervention',
        name: 'Spending Pattern Alert',
        requiredPlan: 'pro',
        priority: 5,
        condition: (context): boolean => {
          return !!(context.recentSpending && 
                 context.recentSpending.length > 3); // More than 3 purchases in recent period
        },
        action: (context) => {
          const totalSpent = context.recentSpending!.reduce((sum, purchase) => sum + purchase.amount, 0);
          
          return {
            shouldIntervene: true,
            interventionType: 'spending_pattern_intervention',
            riskLevel: 'medium',
            message: `You've made ${context.recentSpending!.length} purchases recently (€${totalSpent.toFixed(2)}). Consider if this aligns with your budget.`,
            recommendations: [
              'Review your recent purchases',
              'Check if you\'re staying within budget',
              'Consider a spending freeze for 24 hours',
              'Focus on experiences over material items',
              'Ask yourself if these purchases bring lasting joy'
            ],
            estimatedSavings: 50,
            metadata: {
              recentSpending: context.recentSpending,
              totalSpent,
              triggerType: 'spending_pattern'
            }
          };
        }
      }
    ];

    // Sort rules by priority
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  async evaluateIntervention(context: InterventionContext): Promise<InterventionResult[]> {
    try {
      const user = await User.findByPk(context.userId);
      
      if (!user) {
        return [];
      }

      const subscription = await Subscription.findOne({
        where: { userId: context.userId }
      });

      if (!subscription) {
        return [];
      }
      const results: InterventionResult[] = [];

      // Check each rule
      for (const rule of this.rules) {
        // Check if user has access to this rule based on their plan
        if (!this.hasAccessToRule(subscription, rule)) {
          continue;
        }

        // Check if rule condition is met
        if (rule.condition(context)) {
          const result = rule.action(context);
          
          if (result.shouldIntervene) {
            results.push(result);
            
            // Record the intervention for savings tracking
            if (result.estimatedSavings && subscription.isPro()) {
              await this.recordIntervention(context.userId, result);
            }
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Error evaluating intervention:', error);
      return [];
    }
  }

  private hasAccessToRule(subscription: Subscription, rule: InterventionRule): boolean {
    if (rule.requiredPlan === 'free') return true;
    if (rule.requiredPlan === 'pro') return subscription.isPro();
    if (rule.requiredPlan === 'premium') return subscription.isPremium();
    return false;
  }

  private async recordIntervention(userId: string, result: InterventionResult) {
    try {
      if (result.estimatedSavings) {
        await savingsCounterService.recordSaving(
          userId,
          result.estimatedSavings,
          result.message,
          this.mapInterventionTypeToCategory(result.interventionType),
          result.interventionType,
          result.metadata
        );
      }
    } catch (error) {
      logger.error('Error recording intervention:', error);
    }
  }

  private mapInterventionTypeToCategory(interventionType: string): any {
    const mapping: Record<string, any> = {
      'mood_spending_correlation': 'mood_intervention',
      'location_based_intervention': 'location_alert',
      'weather_mood_intervention': 'weather_intervention',
      'sleep_deprivation_intervention': 'sleep_intervention',
      'spending_pattern_intervention': 'prevented_purchase',
    };

    return mapping[interventionType] || 'prevented_purchase';
  }

  // Get user's recent mood pattern to enhance interventions
  async getUserMoodPattern(userId: string): Promise<{
    averageMood: number;
    moodTrend: string;
    lowMoodTriggers: string[];
  }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const moodEntries = await MoodEntry.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: sevenDaysAgo },
        },
        order: [['createdAt', 'DESC']],
      });

      const moodValues = moodEntries.map(entry => entry.moodValue);
      const averageMood = moodValues.length > 0 ? 
        moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length : 5;

      // Calculate trend
      const firstHalf = moodValues.slice(0, Math.floor(moodValues.length / 2));
      const secondHalf = moodValues.slice(Math.floor(moodValues.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length;
      
      let moodTrend = 'stable';
      if (secondHalfAvg > firstHalfAvg + 0.5) {
        moodTrend = 'improving';
      } else if (secondHalfAvg < firstHalfAvg - 0.5) {
        moodTrend = 'declining';
      }

      // Get common triggers for low mood
      const lowMoodEntries = moodEntries.filter(entry => entry.moodValue <= 4);
      const lowMoodTriggers = lowMoodEntries
        .filter(entry => entry.notes)
        .map(entry => entry.notes!)
        .slice(0, 3);

      return {
        averageMood,
        moodTrend,
        lowMoodTriggers,
      };
    } catch (error) {
      logger.error('Error getting user mood pattern:', error);
      return {
        averageMood: 5,
        moodTrend: 'stable',
        lowMoodTriggers: [],
      };
    }
  }

  // Test intervention for a user
  async testIntervention(userId: string): Promise<InterventionResult[]> {
    const context: InterventionContext = {
      userId,
      currentMood: 3,
      location: { latitude: 40.7128, longitude: -74.0060 },
      weather: { weatherType: 'Rain', temperature: 10 },
      nearbyStores: [
        { name: 'Luxury Store', distance: 100, priceLevel: 'luxury' },
        { name: 'Expensive Store', distance: 200, priceLevel: 'expensive' },
      ],
      sleepData: { sleepDuration: 5 },
      recentSpending: [
        { amount: 50, date: new Date() },
        { amount: 75, date: new Date() },
        { amount: 100, date: new Date() },
        { amount: 25, date: new Date() },
      ],
    };

    return this.evaluateIntervention(context);
  }
}

export default new InterventionService();