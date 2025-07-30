import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  body: any;
  params: any;
  query: any;
}

export interface RequestWithSubscription extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  userSubscription?: {
    plan: string;
    status: string;
    dataRetentionDays: number;
  };
  dataRetentionDate?: Date;
  body: any;
  params: any;
  query: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MoodEntry {
  id: string;
  userId: string;
  moodValue: number;
  moodCategory?: string;
  notes?: string;
  createdAt: Date;
}

export interface EnergyEntry {
  id: string;
  userId: string;
  energyLevel: number;
  energyEmoji?: string;
  notes?: string;
  createdAt: Date;
}

export interface SleepLog {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  qualityRating: number;
  notes?: string;
  createdAt: Date;
}

export interface FocusSession {
  id: string;
  userId: string;
  goal?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  completed: boolean;
  distractionCount: number;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content?: string;
  voiceUrl?: string;
  isEncrypted: boolean;
  pinProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyCheckin {
  id: string;
  userId: string;
  content?: string;
  moodEmoji?: string;
  voiceTranscriptionUrl?: string;
  aiReflection?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  bankConnectionId: string;
  externalId?: string;
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  transactionDate: Date;
  isDebit: boolean;
  createdAt: Date;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  moodReminder: boolean;
  moodReminderTime: string;
  journalReminder: boolean;
  journalReminderTime: string;
  sleepReminder: boolean;
  sleepReminderTime: string;
  financeReminder: boolean;
  financeReminderFrequency: string;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  aiTone: string;
  timezone: string;
  language: string;
  featuresEnabled: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmotionInsight {
  id: string;
  userId: string;
  insightType: string;
  data: any;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  externalId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  category?: string;
  createdAt: Date;
}

export interface BankConnection {
  id: string;
  userId: string;
  bankName: string;
  accountNumberMasked: string;
  nordigenToken?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SpendingLimit {
  id: string;
  userId: string;
  category?: string;
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  createdAt: Date;
}

export interface UsageAnalytics {
  id: string;
  userId: string;
  featureName: string;
  action: string;
  metadata?: any;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}