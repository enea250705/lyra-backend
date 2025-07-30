export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface PlanLimits {
  dataRetentionDays: number;
  maxGoals: number;
  maxNotifications: number;
  maxInterventions: number;
}

export interface PlanDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  adaptyProductId?: string;
  adaptyAccessLevelId?: string;
  features: PlanFeature[];
  limits: PlanLimits;
  popular?: boolean;
}

export const PLAN_FEATURES = {
  // FREE PLAN FEATURES
  BASIC_SPENDING_TRACKING: {
    id: 'basic_spending_tracking',
    name: 'Basic Spending Tracking',
    description: 'View transactions and simple categorization',
  },
  DAILY_MOOD_CHECKINS: {
    id: 'daily_mood_checkins',
    name: 'Daily Mood Check-ins',
    description: 'Track mood patterns over time',
  },
  BASIC_SPENDING_ALERTS: {
    id: 'basic_spending_alerts',
    name: 'Basic Spending Alerts',
    description: 'Simple daily spending notifications',
  },
  SIMPLE_GOAL_SETTING: {
    id: 'simple_goal_setting',
    name: 'Simple Goal Setting',
    description: 'Set monthly spending limits',
  },
  WEEKLY_EMAIL_REPORTS: {
    id: 'weekly_email_reports',
    name: 'Weekly Email Reports',
    description: 'Basic savings summary via email',
  },
  CALENDAR_READONLY: {
    id: 'calendar_readonly',
    name: 'Calendar Read-Only',
    description: 'View appointments and events',
  },

  // PRO PLAN FEATURES
  AI_SPENDING_INTERVENTION: {
    id: 'ai_spending_intervention',
    name: 'AI Spending Intervention',
    description: 'Smart alerts when mood + location = overspending risk',
  },
  ADVANCED_GOAL_TRACKING: {
    id: 'advanced_goal_tracking',
    name: 'Advanced Goal Tracking',
    description: 'Complex goals like "No shopping for 3 days"',
  },
  MOOD_SPENDING_CORRELATION: {
    id: 'mood_spending_correlation',
    name: 'Mood-Spending Correlation',
    description: 'Understand when emotions trigger overspending',
  },
  CALENDAR_MANAGEMENT: {
    id: 'calendar_management',
    name: 'Calendar Management',
    description: 'Reschedule when tired/overwhelmed',
  },
  PUSH_NOTIFICATIONS: {
    id: 'push_notifications',
    name: 'Push Notifications',
    description: 'Real-time intervention alerts',
  },
  SAVINGS_COUNTER: {
    id: 'savings_counter',
    name: 'Savings Counter',
    description: 'Track exactly how much Lyra saved you',
  },

  // PREMIUM PLAN FEATURES
  LOCATION_ALERTS: {
    id: 'location_alerts',
    name: 'Location-Based Alerts',
    description: 'Intervention when near expensive stores',
  },
  SLEEP_CORRELATION: {
    id: 'sleep_correlation',
    name: 'Sleep Correlation',
    description: 'Reschedule expensive meetings when tired',
  },
  WEATHER_MOOD_INSIGHTS: {
    id: 'weather_mood_insights',
    name: 'Weather-Mood Insights',
    description: 'Understand how weather affects spending',
  },
  ADVANCED_PATTERN_RECOGNITION: {
    id: 'advanced_pattern_recognition',
    name: 'Advanced Pattern Recognition',
    description: 'Deep behavioral insights and predictions',
  },
  SMS_ALERTS: {
    id: 'sms_alerts',
    name: 'SMS Alerts',
    description: 'Urgent spending warnings via text',
  },
  CUSTOM_INTERVENTION_RULES: {
    id: 'custom_intervention_rules',
    name: 'Custom Intervention Rules',
    description: 'Personalized protection settings',
  },
  UNLIMITED_DATA: {
    id: 'unlimited_data',
    name: 'Unlimited Data History',
    description: 'Access to all historical data',
  },
  PRIORITY_SUPPORT: {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Get help faster with priority support',
  },
};

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: [
      { ...PLAN_FEATURES.BASIC_SPENDING_TRACKING, enabled: true },
      { ...PLAN_FEATURES.DAILY_MOOD_CHECKINS, enabled: true },
      { ...PLAN_FEATURES.BASIC_SPENDING_ALERTS, enabled: true },
      { ...PLAN_FEATURES.SIMPLE_GOAL_SETTING, enabled: true },
      { ...PLAN_FEATURES.WEEKLY_EMAIL_REPORTS, enabled: true },
      { ...PLAN_FEATURES.CALENDAR_READONLY, enabled: true },
    ],
    limits: {
      dataRetentionDays: 30,
      maxGoals: 3,
      maxNotifications: 5,
      maxInterventions: 0,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Core AI-powered spending protection',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    adaptyProductId: process.env.ADAPTY_PRO_PRODUCT_ID || 'lyra_pro_monthly',
    adaptyAccessLevelId: process.env.ADAPTY_PRO_ACCESS_LEVEL_ID || 'pro',
    popular: true,
    features: [
      { ...PLAN_FEATURES.BASIC_SPENDING_TRACKING, enabled: true },
      { ...PLAN_FEATURES.DAILY_MOOD_CHECKINS, enabled: true },
      { ...PLAN_FEATURES.BASIC_SPENDING_ALERTS, enabled: true },
      { ...PLAN_FEATURES.SIMPLE_GOAL_SETTING, enabled: true },
      { ...PLAN_FEATURES.WEEKLY_EMAIL_REPORTS, enabled: true },
      { ...PLAN_FEATURES.CALENDAR_READONLY, enabled: true },
      { ...PLAN_FEATURES.AI_SPENDING_INTERVENTION, enabled: true },
      { ...PLAN_FEATURES.ADVANCED_GOAL_TRACKING, enabled: true },
      { ...PLAN_FEATURES.MOOD_SPENDING_CORRELATION, enabled: true },
      { ...PLAN_FEATURES.CALENDAR_MANAGEMENT, enabled: true },
      { ...PLAN_FEATURES.PUSH_NOTIFICATIONS, enabled: true },
      { ...PLAN_FEATURES.SAVINGS_COUNTER, enabled: true },
    ],
    limits: {
      dataRetentionDays: 180,
      maxGoals: 10,
      maxNotifications: 50,
      maxInterventions: 100,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Advanced insights and unlimited protection',
    price: 19.99,
    currency: 'EUR',
    interval: 'month',
    adaptyProductId: process.env.ADAPTY_PREMIUM_PRODUCT_ID || 'lyra_premium_monthly',
    adaptyAccessLevelId: process.env.ADAPTY_PREMIUM_ACCESS_LEVEL_ID || 'premium',
    features: [
      { ...PLAN_FEATURES.BASIC_SPENDING_TRACKING, enabled: true },
      { ...PLAN_FEATURES.DAILY_MOOD_CHECKINS, enabled: true },
      { ...PLAN_FEATURES.BASIC_SPENDING_ALERTS, enabled: true },
      { ...PLAN_FEATURES.SIMPLE_GOAL_SETTING, enabled: true },
      { ...PLAN_FEATURES.WEEKLY_EMAIL_REPORTS, enabled: true },
      { ...PLAN_FEATURES.CALENDAR_READONLY, enabled: true },
      { ...PLAN_FEATURES.AI_SPENDING_INTERVENTION, enabled: true },
      { ...PLAN_FEATURES.ADVANCED_GOAL_TRACKING, enabled: true },
      { ...PLAN_FEATURES.MOOD_SPENDING_CORRELATION, enabled: true },
      { ...PLAN_FEATURES.CALENDAR_MANAGEMENT, enabled: true },
      { ...PLAN_FEATURES.PUSH_NOTIFICATIONS, enabled: true },
      { ...PLAN_FEATURES.SAVINGS_COUNTER, enabled: true },
      { ...PLAN_FEATURES.LOCATION_ALERTS, enabled: true },
      { ...PLAN_FEATURES.SLEEP_CORRELATION, enabled: true },
      { ...PLAN_FEATURES.WEATHER_MOOD_INSIGHTS, enabled: true },
      { ...PLAN_FEATURES.ADVANCED_PATTERN_RECOGNITION, enabled: true },
      { ...PLAN_FEATURES.SMS_ALERTS, enabled: true },
      { ...PLAN_FEATURES.CUSTOM_INTERVENTION_RULES, enabled: true },
      { ...PLAN_FEATURES.UNLIMITED_DATA, enabled: true },
      { ...PLAN_FEATURES.PRIORITY_SUPPORT, enabled: true },
    ],
    limits: {
      dataRetentionDays: -1, // Unlimited
      maxGoals: -1, // Unlimited
      maxNotifications: -1, // Unlimited
      maxInterventions: -1, // Unlimited
    },
  },
];

export const getPlanById = (planId: string): PlanDefinition | undefined => {
  return PLANS.find(plan => plan.id === planId);
};

export const getFeaturesByPlan = (planId: string): PlanFeature[] => {
  const plan = getPlanById(planId);
  return plan?.features || [];
};

export const getLimitsByPlan = (planId: string): PlanLimits => {
  const plan = getPlanById(planId);
  return plan?.limits || PLANS[0].limits;
};