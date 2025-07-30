import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  UNPAID = 'unpaid'
}

interface SubscriptionAttributes {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  // Legacy Adapty fields (keep for migration)
  adaptyCustomerUserId?: string;
  adaptyProfileId?: string;
  adaptyProductId?: string;
  adaptyTransactionId?: string;
  adaptyOriginalTransactionId?: string;
  // Native IAP fields
  originalTransactionId?: string;
  latestReceipt?: string;
  environment?: string;
  platform?: 'ios' | 'android';
  // Common fields
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: string;
  public userId!: string;
  public plan!: SubscriptionPlan;
  public status!: SubscriptionStatus;
  public adaptyCustomerUserId?: string;
  public adaptyProfileId?: string;
  public adaptyProductId?: string;
  public adaptyTransactionId?: string;
  public adaptyOriginalTransactionId?: string;
  // Native IAP fields
  public originalTransactionId?: string;
  public latestReceipt?: string;
  public environment?: string;
  public platform?: 'ios' | 'android';
  // Common fields
  public currentPeriodStart?: Date;
  public currentPeriodEnd?: Date;
  public cancelAtPeriodEnd!: boolean;
  public trialStart?: Date;
  public trialEnd?: Date;
  public canceledAt?: Date;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Helper methods
  public isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE || this.status === SubscriptionStatus.TRIALING;
  }

  public isPremium(): boolean {
    return this.plan === SubscriptionPlan.PREMIUM && this.isActive();
  }

  public isPro(): boolean {
    return (this.plan === SubscriptionPlan.PRO || this.plan === SubscriptionPlan.PREMIUM) && this.isActive();
  }

  public isFree(): boolean {
    return this.plan === SubscriptionPlan.FREE || !this.isActive();
  }

  public getDataRetentionDays(): number {
    if (this.isPremium()) return -1; // Unlimited
    if (this.isPro()) return 180; // 6 months
    return 30; // 30 days for free
  }

  public canAccessFeature(feature: string): boolean {
    const premiumFeatures = [
      'location_alerts',
      'sleep_correlation',
      'weather_mood_insights',
      'advanced_pattern_recognition',
      'sms_alerts',
      'custom_intervention_rules',
      'unlimited_data',
      'priority_support',
      // Advanced Savings Features
      'ai_savings_recommendations',
      'automatic_savings_detection',
      'savings_goal_setting',
      'savings_analytics',
      'expense_forecasting',
      'unlimited_savings_history'
    ];

    const proFeatures = [
      'ai_spending_intervention',
      'advanced_goal_tracking',
      'mood_spending_correlation',
      'calendar_management',
      'push_notifications',
      'savings_counter',
      'extended_data_history',
      // Basic Savings Features
      'manual_savings_tracking',
      'subscription_cancellation_tracking',
      'avoided_purchase_tracking',
      'cheaper_alternative_tracking',
      'basic_savings_stats'
    ];

    // Free features (no restrictions)
    const freeFeatures = [
      'basic_mood_tracking',
      'daily_checkins',
      'basic_chat',
      'limited_savings_view'
    ];

    if (premiumFeatures.includes(feature)) {
      return this.isPremium();
    }

    if (proFeatures.includes(feature)) {
      return this.isPro();
    }

    return freeFeatures.includes(feature) || this.isPro(); // Free features or fallback for Pro users
  }

  public getSavingsLimits(): {
    maxSavingsRecords: number;
    maxSavingsPerMonth: number;
    canUseAISuggestions: boolean;
    canExportData: boolean;
    dataRetentionDays: number;
  } {
    if (this.isPremium()) {
      return {
        maxSavingsRecords: -1, // Unlimited
        maxSavingsPerMonth: -1, // Unlimited
        canUseAISuggestions: true,
        canExportData: true,
        dataRetentionDays: -1, // Unlimited
      };
    }

    if (this.isPro()) {
      return {
        maxSavingsRecords: 500,
        maxSavingsPerMonth: 50,
        canUseAISuggestions: true,
        canExportData: true,
        dataRetentionDays: 180,
      };
    }

    // Free plan limits
    return {
      maxSavingsRecords: 10,
      maxSavingsPerMonth: 5,
      canUseAISuggestions: false,
      canExportData: false,
      dataRetentionDays: 30,
    };
  }
}

Subscription.init(
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
      onDelete: 'CASCADE',
    },
    plan: {
      type: DataTypes.ENUM(...Object.values(SubscriptionPlan)),
      allowNull: false,
      defaultValue: SubscriptionPlan.FREE,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SubscriptionStatus)),
      allowNull: false,
      defaultValue: SubscriptionStatus.ACTIVE,
    },
    adaptyCustomerUserId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'adapty_customer_user_id',
    },
    adaptyProfileId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'adapty_profile_id',
    },
    adaptyProductId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'adapty_product_id',
    },
    adaptyTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'adapty_transaction_id',
    },
    adaptyOriginalTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'adapty_original_transaction_id',
    },
    // Native IAP fields
    originalTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'original_transaction_id',
    },
    latestReceipt: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'latest_receipt',
    },
    environment: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'environment',
    },
    platform: {
      type: DataTypes.ENUM('ios', 'android'),
      allowNull: true,
      field: 'platform',
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'current_period_start',
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'current_period_end',
    },
    cancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'cancel_at_period_end',
    },
    trialStart: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'trial_start',
    },
    trialEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'trial_end',
    },
    canceledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'canceled_at',
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
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id'],
      },
      {
        fields: ['adapty_customer_user_id'],
      },
      {
        fields: ['adapty_profile_id'],
      },
      {
        fields: ['adapty_transaction_id'],
      },
      {
        fields: ['plan'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['original_transaction_id'],
      },
      {
        fields: ['platform'],
      },
    ],
  }
);

export default Subscription;