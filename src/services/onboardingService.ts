import { Op } from 'sequelize';
import OnboardingStep from '../models/OnboardingStep';
import PermissionRequest from '../models/PermissionRequest';
import FeatureTutorial from '../models/FeatureTutorial';
import User from '../models/User';
import logger from '../utils/logger';

export interface OnboardingStepData {
  stepName: string;
  stepType: 'welcome' | 'profile_setup' | 'permissions' | 'feature_intro' | 'goal_setting' | 'preferences' | 'completion';
  stepOrder: number;
  title: string;
  description: string;
  content: any;
  isRequired: boolean;
  estimatedTime: number; // in minutes
}

export interface PermissionData {
  permissionType: 'notifications' | 'location' | 'camera' | 'microphone' | 'calendar' | 'health' | 'contacts' | 'storage';
  permissionName: string;
  description: string;
  requestReason: string;
  isRequired: boolean;
  icon: string;
}

export interface TutorialData {
  featureName: string;
  tutorialType: 'intro' | 'walkthrough' | 'tip' | 'advanced';
  title: string;
  description: string;
  content: any;
  estimatedTime: number;
}

export class OnboardingService {
  /**
   * Initialize onboarding flow for new user
   */
  static async initializeOnboarding(userId: string): Promise<OnboardingStep[]> {
    try {
      const defaultSteps: OnboardingStepData[] = [
        {
          stepName: 'welcome',
          stepType: 'welcome',
          stepOrder: 1,
          title: 'Welcome to Lyra AI',
          description: 'Your personal life operating system',
          content: {
            message: 'Welcome! Let\'s get you set up with Lyra AI.',
            features: ['Mood Tracking', 'Sleep Analysis', 'Journal Entries', 'AI Insights'],
            estimatedTime: 2,
          },
          isRequired: true,
          estimatedTime: 2,
        },
        {
          stepName: 'profile_setup',
          stepType: 'profile_setup',
          stepOrder: 2,
          title: 'Complete Your Profile',
          description: 'Tell us about yourself to personalize your experience',
          content: {
            fields: ['firstName', 'lastName', 'dateOfBirth', 'timezone', 'preferences'],
            isRequired: true,
          },
          isRequired: true,
          estimatedTime: 5,
        },
        {
          stepName: 'permissions',
          stepType: 'permissions',
          stepOrder: 3,
          title: 'Grant Permissions',
          description: 'Enable features by granting necessary permissions',
          content: {
            permissions: await this.getDefaultPermissions(),
            isRequired: true,
          },
          isRequired: true,
          estimatedTime: 3,
        },
        {
          stepName: 'feature_intro',
          stepType: 'feature_intro',
          stepOrder: 4,
          title: 'Explore Features',
          description: 'Learn about Lyra AI\'s powerful features',
          content: {
            features: await this.getDefaultFeatures(),
            isRequired: false,
          },
          isRequired: false,
          estimatedTime: 10,
        },
        {
          stepName: 'goal_setting',
          stepType: 'goal_setting',
          stepOrder: 5,
          title: 'Set Your Goals',
          description: 'Define what you want to achieve with Lyra AI',
          content: {
            categories: ['health', 'productivity', 'mindfulness', 'relationships'],
            isRequired: false,
          },
          isRequired: false,
          estimatedTime: 5,
        },
        {
          stepName: 'preferences',
          stepType: 'preferences',
          stepOrder: 6,
          title: 'Customize Settings',
          description: 'Configure your preferences and notifications',
          content: {
            settings: ['notifications', 'privacy', 'dataSharing', 'themes'],
            isRequired: false,
          },
          isRequired: false,
          estimatedTime: 3,
        },
        {
          stepName: 'completion',
          stepType: 'completion',
          stepOrder: 7,
          title: 'You\'re All Set!',
          description: 'Welcome to your personalized Lyra AI experience',
          content: {
            message: 'Congratulations! You\'re ready to start your journey with Lyra AI.',
            nextSteps: ['Start tracking your mood', 'Set up your first journal entry', 'Explore the dashboard'],
            isRequired: true,
          },
          isRequired: true,
          estimatedTime: 1,
        },
      ];

      const steps = await Promise.all(
        defaultSteps.map(async (stepData) => {
          return await OnboardingStep.create({
            userId,
            stepName: stepData.stepName,
            stepType: stepData.stepType,
            stepOrder: stepData.stepOrder,
            isCompleted: false,
            stepData: stepData.content,
          });
        })
      );

      logger.info(`Onboarding initialized for user: ${userId} with ${steps.length} steps`);
      return steps;
    } catch (error) {
      logger.error('Error initializing onboarding:', error);
      throw error;
    }
  }

  /**
   * Get onboarding progress for user
   */
  static async getOnboardingProgress(userId: string): Promise<{
    totalSteps: number;
    completedSteps: number;
    currentStep: OnboardingStep | null;
    progress: number;
    steps: OnboardingStep[];
  }> {
    try {
      const steps = await OnboardingStep.findAll({
        where: { userId },
        order: [['stepOrder', 'ASC']],
      });

      const completedSteps = steps.filter(step => step.isCompleted).length;
      const currentStep = steps.find(step => !step.isCompleted) || null;
      const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

      return {
        totalSteps: steps.length,
        completedSteps,
        currentStep,
        progress: Math.round(progress),
        steps,
      };
    } catch (error) {
      logger.error('Error getting onboarding progress:', error);
      throw error;
    }
  }

  /**
   * Complete onboarding step
   */
  static async completeStep(userId: string, stepName: string, stepData?: any): Promise<OnboardingStep> {
    try {
      const step = await OnboardingStep.findOne({
        where: { userId, stepName },
      });

      if (!step) {
        throw new Error(`Step ${stepName} not found for user ${userId}`);
      }

      step.isCompleted = true;
      step.completedAt = new Date();
      if (stepData) {
        step.stepData = { ...step.stepData, ...stepData };
      }
      await step.save();

      logger.info(`Step ${stepName} completed for user: ${userId}`);
      return step;
    } catch (error) {
      logger.error('Error completing onboarding step:', error);
      throw error;
    }
  }

  /**
   * Skip onboarding step
   */
  static async skipStep(userId: string, stepName: string): Promise<OnboardingStep> {
    try {
      const step = await OnboardingStep.findOne({
        where: { userId, stepName },
      });

      if (!step) {
        throw new Error(`Step ${stepName} not found for user ${userId}`);
      }

      step.isCompleted = true;
      step.completedAt = new Date();
      step.stepData = { ...step.stepData, skipped: true };
      await step.save();

      logger.info(`Step ${stepName} skipped for user: ${userId}`);
      return step;
    } catch (error) {
      logger.error('Error skipping onboarding step:', error);
      throw error;
    }
  }

  /**
   * Request permission
   */
  static async requestPermission(
    userId: string,
    permissionType: PermissionData['permissionType'],
    permissionName: string,
    description: string,
    requestReason: string
  ): Promise<PermissionRequest> {
    try {
      const permission = await PermissionRequest.create({
        userId,
        permissionType,
        permissionName,
        description,
        requestReason,
        isGranted: false,
      });

      logger.info(`Permission ${permissionType} requested for user: ${userId}`);
      return permission;
    } catch (error) {
      logger.error('Error requesting permission:', error);
      throw error;
    }
  }

  /**
   * Grant permission
   */
  static async grantPermission(userId: string, permissionType: PermissionData['permissionType']): Promise<PermissionRequest> {
    try {
      const permission = await PermissionRequest.findOne({
        where: { userId, permissionType },
      });

      if (!permission) {
        throw new Error(`Permission ${permissionType} not found for user ${userId}`);
      }

      permission.isGranted = true;
      permission.grantedAt = new Date();
      await permission.save();

      logger.info(`Permission ${permissionType} granted for user: ${userId}`);
      return permission;
    } catch (error) {
      logger.error('Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Deny permission
   */
  static async denyPermission(userId: string, permissionType: PermissionData['permissionType']): Promise<PermissionRequest> {
    try {
      const permission = await PermissionRequest.findOne({
        where: { userId, permissionType },
      });

      if (!permission) {
        throw new Error(`Permission ${permissionType} not found for user ${userId}`);
      }

      permission.isGranted = false;
      permission.deniedAt = new Date();
      await permission.save();

      logger.info(`Permission ${permissionType} denied for user: ${userId}`);
      return permission;
    } catch (error) {
      logger.error('Error denying permission:', error);
      throw error;
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<PermissionRequest[]> {
    try {
      return await PermissionRequest.findAll({
        where: { userId },
        order: [['createdAt', 'ASC']],
      });
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Create feature tutorial
   */
  static async createTutorial(
    userId: string,
    featureName: string,
    tutorialType: TutorialData['tutorialType'],
    title: string,
    description: string,
    content: any
  ): Promise<FeatureTutorial> {
    try {
      const tutorial = await FeatureTutorial.create({
        userId,
        featureName,
        tutorialType,
        title,
        description,
        content,
        isCompleted: false,
        progress: 0,
      });

      logger.info(`Tutorial created for feature ${featureName} for user: ${userId}`);
      return tutorial;
    } catch (error) {
      logger.error('Error creating tutorial:', error);
      throw error;
    }
  }

  /**
   * Update tutorial progress
   */
  static async updateTutorialProgress(
    userId: string,
    featureName: string,
    progress: number
  ): Promise<FeatureTutorial> {
    try {
      const tutorial = await FeatureTutorial.findOne({
        where: { userId, featureName },
      });

      if (!tutorial) {
        throw new Error(`Tutorial for feature ${featureName} not found for user ${userId}`);
      }

      tutorial.progress = Math.min(100, Math.max(0, progress));
      
      if (tutorial.progress === 100) {
        tutorial.isCompleted = true;
        tutorial.completedAt = new Date();
      }
      
      await tutorial.save();

      logger.info(`Tutorial progress updated for feature ${featureName}: ${progress}%`);
      return tutorial;
    } catch (error) {
      logger.error('Error updating tutorial progress:', error);
      throw error;
    }
  }

  /**
   * Complete tutorial
   */
  static async completeTutorial(userId: string, featureName: string): Promise<FeatureTutorial> {
    try {
      const tutorial = await FeatureTutorial.findOne({
        where: { userId, featureName },
      });

      if (!tutorial) {
        throw new Error(`Tutorial for feature ${featureName} not found for user ${userId}`);
      }

      tutorial.isCompleted = true;
      tutorial.completedAt = new Date();
      tutorial.progress = 100;
      await tutorial.save();

      logger.info(`Tutorial completed for feature ${featureName} for user: ${userId}`);
      return tutorial;
    } catch (error) {
      logger.error('Error completing tutorial:', error);
      throw error;
    }
  }

  /**
   * Skip tutorial
   */
  static async skipTutorial(userId: string, featureName: string): Promise<FeatureTutorial> {
    try {
      const tutorial = await FeatureTutorial.findOne({
        where: { userId, featureName },
      });

      if (!tutorial) {
        throw new Error(`Tutorial for feature ${featureName} not found for user ${userId}`);
      }

      tutorial.isCompleted = true;
      tutorial.skippedAt = new Date();
      tutorial.progress = 100;
      await tutorial.save();

      logger.info(`Tutorial skipped for feature ${featureName} for user: ${userId}`);
      return tutorial;
    } catch (error) {
      logger.error('Error skipping tutorial:', error);
      throw error;
    }
  }

  /**
   * Get user tutorials
   */
  static async getUserTutorials(userId: string): Promise<FeatureTutorial[]> {
    try {
      return await FeatureTutorial.findAll({
        where: { userId },
        order: [['createdAt', 'ASC']],
      });
    } catch (error) {
      logger.error('Error getting user tutorials:', error);
      throw error;
    }
  }

  /**
   * Get default permissions
   */
  private static async getDefaultPermissions(): Promise<PermissionData[]> {
    return [
      {
        permissionType: 'notifications',
        permissionName: 'Push Notifications',
        description: 'Receive reminders and insights about your mood, sleep, and goals',
        requestReason: 'To help you stay consistent with your wellness journey',
        isRequired: true,
        icon: 'bell',
      },
      {
        permissionType: 'health',
        permissionName: 'Health Data',
        description: 'Access your health data to provide better insights',
        requestReason: 'To analyze your sleep patterns and activity levels',
        isRequired: false,
        icon: 'heart',
      },
      {
        permissionType: 'calendar',
        permissionName: 'Calendar Access',
        description: 'Sync with your calendar to understand your schedule patterns',
        requestReason: 'To provide personalized recommendations based on your schedule',
        isRequired: false,
        icon: 'calendar',
      },
      {
        permissionType: 'location',
        permissionName: 'Location Access',
        description: 'Understand your location patterns for better insights',
        requestReason: 'To provide location-based wellness recommendations',
        isRequired: false,
        icon: 'map-pin',
      },
    ];
  }

  /**
   * Get default features
   */
  private static async getDefaultFeatures(): Promise<TutorialData[]> {
    return [
      {
        featureName: 'mood',
        tutorialType: 'intro',
        title: 'Mood Tracking',
        description: 'Track your daily mood and emotional patterns',
        content: {
          steps: [
            { title: 'Select Your Mood', description: 'Choose how you\'re feeling today' },
            { title: 'Add Context', description: 'Optionally add notes about what influenced your mood' },
            { title: 'View Patterns', description: 'See trends and patterns in your mood over time' },
          ],
        },
        estimatedTime: 3,
      },
      {
        featureName: 'sleep',
        tutorialType: 'intro',
        title: 'Sleep Analysis',
        description: 'Monitor your sleep patterns and quality',
        content: {
          steps: [
            { title: 'Log Sleep', description: 'Record your bedtime and wake time' },
            { title: 'Track Quality', description: 'Rate your sleep quality and add notes' },
            { title: 'View Insights', description: 'Get AI-powered insights about your sleep patterns' },
          ],
        },
        estimatedTime: 3,
      },
      {
        featureName: 'journal',
        tutorialType: 'intro',
        title: 'Journal Entries',
        description: 'Reflect on your day with AI-powered journaling',
        content: {
          steps: [
            { title: 'Start Writing', description: 'Begin your journal entry' },
            { title: 'AI Assistance', description: 'Get prompts and suggestions from AI' },
            { title: 'Review Insights', description: 'See patterns and themes in your writing' },
          ],
        },
        estimatedTime: 5,
      },
      {
        featureName: 'dashboard',
        tutorialType: 'intro',
        title: 'Personal Dashboard',
        description: 'Your central hub for all wellness data',
        content: {
          steps: [
            { title: 'Overview', description: 'See your wellness summary at a glance' },
            { title: 'Quick Actions', description: 'Access frequently used features' },
            { title: 'Customize', description: 'Personalize your dashboard layout' },
          ],
        },
        estimatedTime: 4,
      },
    ];
  }

  /**
   * Check if user has completed onboarding
   */
  static async isOnboardingComplete(userId: string): Promise<boolean> {
    try {
      const progress = await this.getOnboardingProgress(userId);
      return progress.completedSteps === progress.totalSteps;
    } catch (error) {
      logger.error('Error checking onboarding completion:', error);
      return false;
    }
  }

  /**
   * Reset onboarding for user
   */
  static async resetOnboarding(userId: string): Promise<void> {
    try {
      await OnboardingStep.destroy({ where: { userId } });
      await PermissionRequest.destroy({ where: { userId } });
      await FeatureTutorial.destroy({ where: { userId } });
      
      await this.initializeOnboarding(userId);
      
      logger.info(`Onboarding reset for user: ${userId}`);
    } catch (error) {
      logger.error('Error resetting onboarding:', error);
      throw error;
    }
  }
}

export default OnboardingService;

