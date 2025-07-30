import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import logger from '../utils/logger';
import User from '../models/User';
import SavingsRecord from '../models/SavingsRecord';
import { Op } from 'sequelize';

interface SavingsEntryAttributes {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  category: 'prevented_purchase' | 'mood_intervention' | 'location_alert' | 'sleep_intervention' | 'weather_intervention';
  interventionType: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface SavingsEntryCreationAttributes extends Optional<SavingsEntryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SavingsEntry extends Model<SavingsEntryAttributes, SavingsEntryCreationAttributes> implements SavingsEntryAttributes {
  public id!: string;
  public userId!: string;
  public amount!: number;
  public currency!: string;
  public description!: string;
  public category!: 'prevented_purchase' | 'mood_intervention' | 'location_alert' | 'sleep_intervention' | 'weather_intervention';
  public interventionType!: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SavingsEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'EUR',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('prevented_purchase', 'mood_intervention', 'location_alert', 'sleep_intervention', 'weather_intervention'),
      allowNull: false,
    },
    interventionType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'intervention_type',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'SavingsEntry',
    tableName: 'savings_entries',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

interface SavingsStats {
  totalSaved: number;
  savingsThisMonth: number;
  savingsThisWeek: number;
  interventionCount: number;
  topCategories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

class SavingsCounterService {
  async recordSaving(
    userId: string,
    amount: number,
    description: string,
    category: SavingsEntryAttributes['category'],
    interventionType: string,
    metadata?: Record<string, any>
  ): Promise<SavingsEntry> {
    try {
      const savings = await SavingsEntry.create({
        userId,
        amount,
        currency: 'EUR',
        description,
        category,
        interventionType,
        metadata,
      });

      logger.info(`Recorded savings: €${amount} for user ${userId} - ${description}`);
      return savings;
    } catch (error) {
      logger.error('Error recording savings:', error);
      throw error;
    }
  }

  async getSavingsStats(userId: string, days?: number): Promise<SavingsStats> {
    try {
      const whereClause: any = { userId };
      
      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        whereClause.createdAt = { [Op.gte]: startDate };
      }

      const savings = await SavingsEntry.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
      });

      const totalSaved = savings.reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0);

      // This month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const savingsThisMonth = savings
        .filter(entry => entry.createdAt >= startOfMonth)
        .reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0);

      // This week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const savingsThisWeek = savings
        .filter(entry => entry.createdAt >= startOfWeek)
        .reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0);

      // Top categories
      const categoryMap = new Map<string, { amount: number; count: number }>();
      savings.forEach(entry => {
        const existing = categoryMap.get(entry.category) || { amount: 0, count: 0 };
        categoryMap.set(entry.category, {
          amount: existing.amount + parseFloat(entry.amount.toString()),
          count: existing.count + 1,
        });
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([category, stats]) => ({ category, ...stats }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Monthly breakdown (last 6 months)
      const monthlyBreakdown = this.getMonthlyBreakdown(savings);

      return {
        totalSaved,
        savingsThisMonth,
        savingsThisWeek,
        interventionCount: savings.length,
        topCategories,
        monthlyBreakdown,
      };
    } catch (error) {
      logger.error('Error getting savings stats:', error);
      throw error;
    }
  }

  private getMonthlyBreakdown(savings: SavingsEntry[]): Array<{
    month: string;
    amount: number;
    count: number;
  }> {
    const monthlyMap = new Map<string, { amount: number; count: number }>();
    
    savings.forEach(entry => {
      const monthKey = entry.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) || { amount: 0, count: 0 };
      monthlyMap.set(monthKey, {
        amount: existing.amount + parseFloat(entry.amount.toString()),
        count: existing.count + 1,
      });
    });

    return Array.from(monthlyMap.entries())
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);
  }

  async getUserSavingsHistory(userId: string, limit: number = 50): Promise<SavingsEntry[]> {
    try {
      return await SavingsEntry.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
      });
    } catch (error) {
      logger.error('Error getting user savings history:', error);
      throw error;
    }
  }

  // Helper methods for common intervention types
  async recordMoodIntervention(
    userId: string,
    amount: number,
    storeName: string,
    mood: number,
    weather?: any
  ): Promise<SavingsEntry> {
    return this.recordSaving(
      userId,
      amount,
      `Prevented impulse purchase at ${storeName} when mood was ${mood}/10`,
      'mood_intervention',
      'mood_spending_correlation',
      { storeName, mood, weather }
    );
  }

  async recordLocationAlert(
    userId: string,
    amount: number,
    storeName: string,
    distance: number,
    storeType: string
  ): Promise<SavingsEntry> {
    return this.recordSaving(
      userId,
      amount,
      `Avoided ${storeType} shopping at ${storeName} (${distance}m away)`,
      'location_alert',
      'expensive_store_detection',
      { storeName, distance, storeType }
    );
  }

  async recordSleepIntervention(
    userId: string,
    amount: number,
    reason: string,
    sleepHours: number
  ): Promise<SavingsEntry> {
    return this.recordSaving(
      userId,
      amount,
      `Prevented purchase when tired (${sleepHours}h sleep): ${reason}`,
      'sleep_intervention',
      'sleep_correlation',
      { sleepHours, reason }
    );
  }

  async recordWeatherIntervention(
    userId: string,
    amount: number,
    weather: string,
    mood: number
  ): Promise<SavingsEntry> {
    return this.recordSaving(
      userId,
      amount,
      `Prevented weather-triggered spending during ${weather} weather`,
      'weather_intervention',
      'weather_mood_correlation',
      { weather, mood }
    );
  }

  // Calculate potential savings based on interventions
  async calculatePotentialSavings(userId: string): Promise<{
    projectedMonthlySavings: number;
    projectedYearlySavings: number;
    averageInterventionValue: number;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSavings = await SavingsEntry.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: thirtyDaysAgo },
        },
      });

      const totalAmount = recentSavings.reduce((sum, entry) => sum + parseFloat(entry.amount.toString()), 0);
      const averageInterventionValue = recentSavings.length > 0 ? totalAmount / recentSavings.length : 0;
      
      // Project based on current trend
      const projectedMonthlySavings = totalAmount;
      const projectedYearlySavings = totalAmount * 12;

      return {
        projectedMonthlySavings,
        projectedYearlySavings,
        averageInterventionValue,
      };
    } catch (error) {
      logger.error('Error calculating potential savings:', error);
      throw error;
    }
  }

  // Confirm actual savings when user reports they avoided spending after an intervention
  async confirmRealSavings(
    userId: string,
    interventionId: string,
    actualAmount: number,
    originalAmount: number,
    category: string,
    triggerType: string,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<SavingsRecord> {
    try {
      const savedAmount = Math.max(0, originalAmount - actualAmount);
      
      if (savedAmount <= 0) {
        throw new Error('No savings to record - actual amount is greater than or equal to original amount');
      }

      const realSaving = await SavingsRecord.create({
        userId,
        amount: actualAmount,
        reason,
        category: this.mapCategoryToSavingsRecord(category),
        originalAmount,
        savedAmount,
        triggerType: this.mapTriggerTypeToSavingsRecord(triggerType),
        metadata: {
          ...metadata,
          interventionId,
          confirmedAt: new Date().toISOString(),
          actualSavings: true,
        },
      });

      logger.info(`Confirmed real savings: €${savedAmount} saved by user ${userId} - ${reason}`);
      return realSaving;
    } catch (error) {
      logger.error('Error confirming real savings:', error);
      throw error;
    }
  }

  private mapCategoryToSavingsRecord(category: string): 'food' | 'shopping' | 'entertainment' | 'transport' | 'subscription' | 'other' {
    const mapping: Record<string, any> = {
      'prevented_purchase': 'shopping',
      'mood_intervention': 'shopping',
      'location_alert': 'shopping',
      'sleep_intervention': 'other',
      'weather_intervention': 'shopping',
    };

    return mapping[category] || 'other';
  }

  private mapTriggerTypeToSavingsRecord(triggerType: string): 'mood_alert' | 'location_alert' | 'ai_suggestion' | 'manual' | 'time_based' | 'weather_based' {
    const mapping: Record<string, any> = {
      'mood_spending_correlation': 'mood_alert',
      'expensive_store_detection': 'location_alert',
      'sleep_correlation': 'mood_alert',
      'weather_mood_correlation': 'weather_based',
    };

    return mapping[triggerType] || 'manual';
  }
}

export { SavingsEntry };
export default new SavingsCounterService();