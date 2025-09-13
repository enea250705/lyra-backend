import sequelize from '../config/database';
import logger from '../utils/logger';

// Import all models
import User from './User';
import Subscription from './Subscription';
import MoodEntry from './MoodEntry';
import SleepLog from './SleepLog';
import EnergyEntry from './EnergyEntry';
import FocusSession from './FocusSession';
import JournalEntry from './JournalEntry';
import DailyCheckin from './DailyCheckin';
import ChatMessage from './ChatMessage';
import Notification from './Notification';
import NotificationSettings from './NotificationSettings';
import PushDevice from './PushDevice';
import UserSettings from './UserSettings';
import SavingsRecord from './SavingsRecord';
import CalendarConnection from './CalendarConnection';
import CalendarEvent from './CalendarEvent';
import GoogleFitConnection from './GoogleFitConnection';
import GoogleFitSteps from './GoogleFitSteps';
import GoogleFitHeartRate from './GoogleFitHeartRate';
import GoogleFitSleep from './GoogleFitSleep';
import GoogleFitWeight from './GoogleFitWeight';
import GoogleFitActivities from './GoogleFitActivities';
import GoogleFitSyncStatus from './GoogleFitSyncStatus';
import EmotionInsight from './EmotionInsight';
import UsageAnalytics from './UsageAnalytics';
import UserBehavior from './UserBehavior';
import AnalyticsReport from './AnalyticsReport';
import OnboardingStep from './OnboardingStep';
import PermissionRequest from './PermissionRequest';
import FeatureTutorial from './FeatureTutorial';

// Define all associations
const setupAssociations = () => {
  try {
    // User associations
    User.hasOne(Subscription, { foreignKey: 'userId', as: 'subscription', onDelete: 'CASCADE' });
    User.hasMany(MoodEntry, { foreignKey: 'userId', as: 'moodEntries', onDelete: 'CASCADE' });
    User.hasMany(SleepLog, { foreignKey: 'userId', as: 'sleepLogs', onDelete: 'CASCADE' });
    User.hasMany(EnergyEntry, { foreignKey: 'userId', as: 'energyEntries', onDelete: 'CASCADE' });
    User.hasMany(FocusSession, { foreignKey: 'userId', as: 'focusSessions', onDelete: 'CASCADE' });
    User.hasMany(JournalEntry, { foreignKey: 'userId', as: 'journalEntries', onDelete: 'CASCADE' });
    User.hasMany(DailyCheckin, { foreignKey: 'userId', as: 'dailyCheckins', onDelete: 'CASCADE' });
    User.hasMany(ChatMessage, { foreignKey: 'userId', as: 'chatMessages', onDelete: 'CASCADE' });
    User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
    User.hasOne(NotificationSettings, { foreignKey: 'userId', as: 'notificationSettings', onDelete: 'CASCADE' });
    User.hasMany(PushDevice, { foreignKey: 'userId', as: 'pushDevices', onDelete: 'CASCADE' });
    User.hasOne(UserSettings, { foreignKey: 'userId', as: 'userSettings', onDelete: 'CASCADE' });
    User.hasMany(SavingsRecord, { foreignKey: 'userId', as: 'savingsRecords', onDelete: 'CASCADE' });
    User.hasMany(CalendarConnection, { foreignKey: 'userId', as: 'calendarConnections', onDelete: 'CASCADE' });
    User.hasMany(CalendarEvent, { foreignKey: 'userId', as: 'calendarEvents', onDelete: 'CASCADE' });
    User.hasOne(GoogleFitConnection, { foreignKey: 'userId', as: 'googleFitConnection', onDelete: 'CASCADE' });
    User.hasMany(GoogleFitSteps, { foreignKey: 'userId', as: 'googleFitSteps', onDelete: 'CASCADE' });
    User.hasMany(GoogleFitHeartRate, { foreignKey: 'userId', as: 'googleFitHeartRate', onDelete: 'CASCADE' });
    User.hasMany(GoogleFitSleep, { foreignKey: 'userId', as: 'googleFitSleep', onDelete: 'CASCADE' });
    User.hasMany(GoogleFitWeight, { foreignKey: 'userId', as: 'googleFitWeight', onDelete: 'CASCADE' });
    User.hasMany(GoogleFitActivities, { foreignKey: 'userId', as: 'googleFitActivities', onDelete: 'CASCADE' });
    User.hasOne(GoogleFitSyncStatus, { foreignKey: 'userId', as: 'googleFitSyncStatus', onDelete: 'CASCADE' });
    User.hasMany(EmotionInsight, { foreignKey: 'userId', as: 'emotionInsights', onDelete: 'CASCADE' });
    User.hasMany(UsageAnalytics, { foreignKey: 'userId', as: 'usageAnalytics', onDelete: 'CASCADE' });
    User.hasMany(UserBehavior, { foreignKey: 'userId', as: 'userBehaviors', onDelete: 'CASCADE' });
    User.hasMany(AnalyticsReport, { foreignKey: 'userId', as: 'analyticsReports', onDelete: 'CASCADE' });
    User.hasMany(OnboardingStep, { foreignKey: 'userId', as: 'onboardingSteps', onDelete: 'CASCADE' });
    User.hasMany(PermissionRequest, { foreignKey: 'userId', as: 'permissionRequests', onDelete: 'CASCADE' });
    User.hasMany(FeatureTutorial, { foreignKey: 'userId', as: 'featureTutorials', onDelete: 'CASCADE' });

    // Reverse associations
    Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    MoodEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    SleepLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    EnergyEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    FocusSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    JournalEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    DailyCheckin.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    NotificationSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    PushDevice.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    SavingsRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    CalendarConnection.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    CalendarEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GoogleFitConnection.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GoogleFitSteps.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GoogleFitHeartRate.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GoogleFitSleep.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GoogleFitWeight.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GoogleFitActivities.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    GoogleFitSyncStatus.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    EmotionInsight.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    UsageAnalytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    UserBehavior.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    AnalyticsReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    OnboardingStep.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    PermissionRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    FeatureTutorial.belongsTo(User, { foreignKey: 'userId', as: 'user' });

    // Calendar associations
    CalendarEvent.belongsTo(CalendarConnection, { foreignKey: 'calendarConnectionId', as: 'calendarConnection' });
    CalendarConnection.hasMany(CalendarEvent, { foreignKey: 'calendarConnectionId', as: 'calendarEvents' });

    // Google Fit associations
    GoogleFitSteps.belongsTo(GoogleFitConnection, { foreignKey: 'googleFitConnectionId', as: 'googleFitConnection' });
    GoogleFitHeartRate.belongsTo(GoogleFitConnection, { foreignKey: 'googleFitConnectionId', as: 'googleFitConnection' });
    GoogleFitSleep.belongsTo(GoogleFitConnection, { foreignKey: 'googleFitConnectionId', as: 'googleFitConnection' });
    GoogleFitWeight.belongsTo(GoogleFitConnection, { foreignKey: 'googleFitConnectionId', as: 'googleFitConnection' });
    GoogleFitActivities.belongsTo(GoogleFitConnection, { foreignKey: 'googleFitConnectionId', as: 'googleFitConnection' });
    GoogleFitSyncStatus.belongsTo(GoogleFitConnection, { foreignKey: 'googleFitConnectionId', as: 'googleFitConnection' });

    GoogleFitConnection.hasMany(GoogleFitSteps, { foreignKey: 'googleFitConnectionId', as: 'googleFitSteps' });
    GoogleFitConnection.hasMany(GoogleFitHeartRate, { foreignKey: 'googleFitConnectionId', as: 'googleFitHeartRate' });
    GoogleFitConnection.hasMany(GoogleFitSleep, { foreignKey: 'googleFitConnectionId', as: 'googleFitSleep' });
    GoogleFitConnection.hasMany(GoogleFitWeight, { foreignKey: 'googleFitConnectionId', as: 'googleFitWeight' });
    GoogleFitConnection.hasMany(GoogleFitActivities, { foreignKey: 'googleFitConnectionId', as: 'googleFitActivities' });
    GoogleFitConnection.hasOne(GoogleFitSyncStatus, { foreignKey: 'googleFitConnectionId', as: 'googleFitSyncStatus' });

    logger.info('Database associations established successfully');
  } catch (error) {
    logger.error('Error setting up database associations:', error);
    throw error;
  }
};

// Initialize associations
setupAssociations();

// Export all models
export {
  User,
  Subscription,
  MoodEntry,
  SleepLog,
  EnergyEntry,
  FocusSession,
  JournalEntry,
  DailyCheckin,
  ChatMessage,
  Notification,
  NotificationSettings,
  PushDevice,
  UserSettings,
  SavingsRecord,
  CalendarConnection,
  CalendarEvent,
  GoogleFitConnection,
  GoogleFitSteps,
  GoogleFitHeartRate,
  GoogleFitSleep,
  GoogleFitWeight,
  GoogleFitActivities,
  GoogleFitSyncStatus,
  EmotionInsight,
  UsageAnalytics,
  UserBehavior,
  AnalyticsReport,
  OnboardingStep,
  PermissionRequest,
  FeatureTutorial,
  sequelize
};

export default {
  User,
  Subscription,
  MoodEntry,
  SleepLog,
  EnergyEntry,
  FocusSession,
  JournalEntry,
  DailyCheckin,
  ChatMessage,
  Notification,
  NotificationSettings,
  PushDevice,
  UserSettings,
  SavingsRecord,
  CalendarConnection,
  CalendarEvent,
  GoogleFitConnection,
  GoogleFitSteps,
  GoogleFitHeartRate,
  GoogleFitSleep,
  GoogleFitWeight,
  GoogleFitActivities,
  GoogleFitSyncStatus,
  EmotionInsight,
  UsageAnalytics,
  UserBehavior,
  AnalyticsReport,
  OnboardingStep,
  PermissionRequest,
  FeatureTutorial,
  sequelize
};
