import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import UserSettings from '../models/UserSettings';
import logger from '../utils/logger';

export const getUserSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    let settings = await UserSettings.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = await UserSettings.create({
        userId,
        theme: 'light',
        aiTone: 'friendly',
        timezone: 'UTC',
        language: 'en',
        featuresEnabled: {
          mood: true,
          energy: true,
          sleep: true,
          focus: true,
          journal: true,
          calendar: true,
          finance: true,
        },
      });
    }

    sendSuccess(res, {
      id: settings.id,
      theme: settings.theme,
      aiTone: settings.aiTone,
      timezone: settings.timezone,
      language: settings.language,
      featuresEnabled: settings.featuresEnabled,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }, 'User settings retrieved successfully');
  } catch (error) {
    logger.error('Get user settings error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateUserSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { theme, aiTone, timezone, language, featuresEnabled } = req.body;

    let settings = await UserSettings.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = await UserSettings.create({
        userId,
        theme: theme || 'light',
        aiTone: aiTone || 'friendly',
        timezone: timezone || 'UTC',
        language: language || 'en',
        featuresEnabled: featuresEnabled || {
          mood: true,
          energy: true,
          sleep: true,
          focus: true,
          journal: true,
          calendar: true,
          finance: true,
        },
      });
    } else {
      await settings.update({
        theme: theme || settings.theme,
        aiTone: aiTone || settings.aiTone,
        timezone: timezone || settings.timezone,
        language: language || settings.language,
        featuresEnabled: featuresEnabled || settings.featuresEnabled,
      });
    }

    logger.info(`User settings updated for user: ${userId}`);

    sendSuccess(res, {
      id: settings.id,
      theme: settings.theme,
      aiTone: settings.aiTone,
      timezone: settings.timezone,
      language: settings.language,
      featuresEnabled: settings.featuresEnabled,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }, 'User settings updated successfully');
  } catch (error) {
    logger.error('Update user settings error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const toggleFeature = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { feature } = req.params;
    const { enabled } = req.body;

    const validFeatures = ['mood', 'energy', 'sleep', 'focus', 'journal', 'calendar', 'finance'];
    
    if (!validFeatures.includes(feature)) {
      sendError(res, 'Invalid feature name', 400);
      return;
    }

    let settings = await UserSettings.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = await UserSettings.create({
        userId,
        theme: 'light',
        aiTone: 'friendly',
        timezone: 'UTC',
        language: 'en',
        featuresEnabled: {
          mood: true,
          energy: true,
          sleep: true,
          focus: true,
          journal: true,
          calendar: true,
          finance: true,
        },
      });
    }

    const updatedFeatures = {
      ...settings.featuresEnabled,
      [feature]: enabled,
    };

    await settings.update({
      featuresEnabled: updatedFeatures,
    });

    sendSuccess(res, {
      feature,
      enabled,
      featuresEnabled: settings.featuresEnabled,
    }, `Feature ${feature} ${enabled ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    logger.error('Toggle feature error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const resetSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const settings = await UserSettings.findOne({
      where: { userId },
    });

    if (!settings) {
      sendError(res, 'Settings not found', 404);
      return;
    }

    await settings.update({
      theme: 'light',
      aiTone: 'friendly',
      timezone: 'UTC',
      language: 'en',
      featuresEnabled: {
        mood: true,
        energy: true,
        sleep: true,
        focus: true,
        journal: true,
        calendar: true,
        finance: true,
      },
    });

    sendSuccess(res, {
      id: settings.id,
      theme: settings.theme,
      aiTone: settings.aiTone,
      timezone: settings.timezone,
      language: settings.language,
      featuresEnabled: settings.featuresEnabled,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    }, 'Settings reset to defaults successfully');
  } catch (error) {
    logger.error('Reset settings error:', error);
    sendError(res, 'Internal server error', 500);
  }
};