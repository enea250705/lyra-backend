import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import OnboardingService from '../services/onboardingService';
import DataVisualizationService from '../services/dataVisualizationService';
import logger from '../utils/logger';

/**
 * Initialize onboarding for new user
 */
export const initializeOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const steps = await OnboardingService.initializeOnboarding(userId);

    sendSuccess(res, {
      steps: steps.map(step => ({
        id: step.id,
        stepName: step.stepName,
        stepType: step.stepType,
        stepOrder: step.stepOrder,
        isCompleted: step.isCompleted,
        stepData: step.stepData,
        createdAt: step.createdAt,
      })),
    }, 'Onboarding initialized successfully', 201);
  } catch (error) {
    logger.error('Initialize onboarding error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get onboarding progress
 */
export const getOnboardingProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const progress = await OnboardingService.getOnboardingProgress(userId);

    sendSuccess(res, {
      totalSteps: progress.totalSteps,
      completedSteps: progress.completedSteps,
      progress: progress.progress,
      currentStep: progress.currentStep ? {
        id: progress.currentStep.id,
        stepName: progress.currentStep.stepName,
        stepType: progress.currentStep.stepType,
        stepOrder: progress.currentStep.stepOrder,
        stepData: progress.currentStep.stepData,
      } : null,
      steps: progress.steps.map(step => ({
        id: step.id,
        stepName: step.stepName,
        stepType: step.stepType,
        stepOrder: step.stepOrder,
        isCompleted: step.isCompleted,
        completedAt: step.completedAt,
        stepData: step.stepData,
      })),
    }, 'Onboarding progress retrieved successfully');
  } catch (error) {
    logger.error('Get onboarding progress error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Complete onboarding step
 */
export const completeStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { stepName, stepData } = req.body;

    const step = await OnboardingService.completeStep(userId, stepName, stepData);

    sendSuccess(res, {
      id: step.id,
      stepName: step.stepName,
      stepType: step.stepType,
      isCompleted: step.isCompleted,
      completedAt: step.completedAt,
      stepData: step.stepData,
    }, 'Step completed successfully');
  } catch (error) {
    logger.error('Complete step error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Skip onboarding step
 */
export const skipStep = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { stepName } = req.body;

    const step = await OnboardingService.skipStep(userId, stepName);

    sendSuccess(res, {
      id: step.id,
      stepName: step.stepName,
      stepType: step.stepType,
      isCompleted: step.isCompleted,
      completedAt: step.completedAt,
      stepData: step.stepData,
    }, 'Step skipped successfully');
  } catch (error) {
    logger.error('Skip step error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Request permission
 */
export const requestPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { permissionType, permissionName, description, requestReason } = req.body;

    const permission = await OnboardingService.requestPermission(
      userId,
      permissionType,
      permissionName,
      description,
      requestReason
    );

    sendSuccess(res, {
      id: permission.id,
      permissionType: permission.permissionType,
      permissionName: permission.permissionName,
      description: permission.description,
      requestReason: permission.requestReason,
      isGranted: permission.isGranted,
      createdAt: permission.createdAt,
    }, 'Permission requested successfully', 201);
  } catch (error) {
    logger.error('Request permission error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Grant permission
 */
export const grantPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { permissionType } = req.body;

    const permission = await OnboardingService.grantPermission(userId, permissionType);

    sendSuccess(res, {
      id: permission.id,
      permissionType: permission.permissionType,
      permissionName: permission.permissionName,
      isGranted: permission.isGranted,
      grantedAt: permission.grantedAt,
    }, 'Permission granted successfully');
  } catch (error) {
    logger.error('Grant permission error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Deny permission
 */
export const denyPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { permissionType } = req.body;

    const permission = await OnboardingService.denyPermission(userId, permissionType);

    sendSuccess(res, {
      id: permission.id,
      permissionType: permission.permissionType,
      permissionName: permission.permissionName,
      isGranted: permission.isGranted,
      deniedAt: permission.deniedAt,
    }, 'Permission denied successfully');
  } catch (error) {
    logger.error('Deny permission error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get user permissions
 */
export const getUserPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const permissions = await OnboardingService.getUserPermissions(userId);

    sendSuccess(res, {
      permissions: permissions.map(permission => ({
        id: permission.id,
        permissionType: permission.permissionType,
        permissionName: permission.permissionName,
        description: permission.description,
        isGranted: permission.isGranted,
        grantedAt: permission.grantedAt,
        deniedAt: permission.deniedAt,
        createdAt: permission.createdAt,
      })),
    }, 'User permissions retrieved successfully');
  } catch (error) {
    logger.error('Get user permissions error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Create feature tutorial
 */
export const createTutorial = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { featureName, tutorialType, title, description, content } = req.body;

    const tutorial = await OnboardingService.createTutorial(
      userId,
      featureName,
      tutorialType,
      title,
      description,
      content
    );

    sendSuccess(res, {
      id: tutorial.id,
      featureName: tutorial.featureName,
      tutorialType: tutorial.tutorialType,
      title: tutorial.title,
      description: tutorial.description,
      content: tutorial.content,
      isCompleted: tutorial.isCompleted,
      progress: tutorial.progress,
      createdAt: tutorial.createdAt,
    }, 'Tutorial created successfully', 201);
  } catch (error) {
    logger.error('Create tutorial error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Update tutorial progress
 */
export const updateTutorialProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { featureName, progress } = req.body;

    const tutorial = await OnboardingService.updateTutorialProgress(userId, featureName, progress);

    sendSuccess(res, {
      id: tutorial.id,
      featureName: tutorial.featureName,
      progress: tutorial.progress,
      isCompleted: tutorial.isCompleted,
      completedAt: tutorial.completedAt,
    }, 'Tutorial progress updated successfully');
  } catch (error) {
    logger.error('Update tutorial progress error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Complete tutorial
 */
export const completeTutorial = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { featureName } = req.body;

    const tutorial = await OnboardingService.completeTutorial(userId, featureName);

    sendSuccess(res, {
      id: tutorial.id,
      featureName: tutorial.featureName,
      isCompleted: tutorial.isCompleted,
      completedAt: tutorial.completedAt,
      progress: tutorial.progress,
    }, 'Tutorial completed successfully');
  } catch (error) {
    logger.error('Complete tutorial error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Skip tutorial
 */
export const skipTutorial = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { featureName } = req.body;

    const tutorial = await OnboardingService.skipTutorial(userId, featureName);

    sendSuccess(res, {
      id: tutorial.id,
      featureName: tutorial.featureName,
      isCompleted: tutorial.isCompleted,
      skippedAt: tutorial.skippedAt,
      progress: tutorial.progress,
    }, 'Tutorial skipped successfully');
  } catch (error) {
    logger.error('Skip tutorial error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get user tutorials
 */
export const getUserTutorials = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const tutorials = await OnboardingService.getUserTutorials(userId);

    sendSuccess(res, {
      tutorials: tutorials.map(tutorial => ({
        id: tutorial.id,
        featureName: tutorial.featureName,
        tutorialType: tutorial.tutorialType,
        title: tutorial.title,
        description: tutorial.description,
        content: tutorial.content,
        isCompleted: tutorial.isCompleted,
        completedAt: tutorial.completedAt,
        skippedAt: tutorial.skippedAt,
        progress: tutorial.progress,
        createdAt: tutorial.createdAt,
      })),
    }, 'User tutorials retrieved successfully');
  } catch (error) {
    logger.error('Get user tutorials error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get data visualization charts
 */
export const getCharts = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { chartType, days = 30 } = req.query;

    let chartData;

    switch (chartType) {
      case 'mood-trend':
        chartData = await DataVisualizationService.getMoodTrendChart(userId, parseInt(days as string));
        break;
      case 'sleep-quality':
        chartData = await DataVisualizationService.getSleepQualityChart(userId, parseInt(days as string));
        break;
      case 'mood-distribution':
        chartData = await DataVisualizationService.getMoodDistributionChart(userId, parseInt(days as string));
        break;
      default:
        sendError(res, 'Invalid chart type', 400);
        return;
    }

    sendSuccess(res, {
      chartType,
      data: chartData,
    }, 'Chart data retrieved successfully');
  } catch (error) {
    logger.error('Get charts error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get trend analysis
 */
export const getTrendAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { metric, days = 30 } = req.query;

    const trends = await DataVisualizationService.getTrendAnalysis(
      userId,
      metric as string,
      parseInt(days as string)
    );

    sendSuccess(res, {
      metric,
      trends,
    }, 'Trend analysis retrieved successfully');
  } catch (error) {
    logger.error('Get trend analysis error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Get progress tracking
 */
export const getProgressTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const progress = await DataVisualizationService.getProgressTracking(userId);

    sendSuccess(res, {
      progress,
    }, 'Progress tracking retrieved successfully');
  } catch (error) {
    logger.error('Get progress tracking error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Check if onboarding is complete
 */
export const isOnboardingComplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const isComplete = await OnboardingService.isOnboardingComplete(userId);

    sendSuccess(res, {
      isComplete,
    }, 'Onboarding completion status retrieved successfully');
  } catch (error) {
    logger.error('Check onboarding completion error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

/**
 * Reset onboarding
 */
export const resetOnboarding = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    await OnboardingService.resetOnboarding(userId);

    sendSuccess(res, {
      message: 'Onboarding reset successfully',
    }, 'Onboarding reset successfully');
  } catch (error) {
    logger.error('Reset onboarding error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

