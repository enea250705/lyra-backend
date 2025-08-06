import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import UserSettings from '../models/UserSettings';
import logger from '../utils/logger';
import User from '../models/User'; // Added import for User model

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
        enabledModules: {
          finances: false,
          sleep: true,
          mood: true,
          decisions: true,
        },
        connectedApis: {
          googleCalendar: false,
          appleHealth: false,
          plaid: false,
        },
        voiceStyle: 'calm',
        name: 'User',
      });
    }

    sendSuccess(res, {
      id: settings.id,
      theme: settings.theme,
      aiTone: settings.aiTone,
      timezone: settings.timezone,
      language: settings.language,
      featuresEnabled: settings.featuresEnabled,
      enabledModules: settings.enabledModules || {
        finances: false,
        sleep: true,
        mood: true,
        decisions: true,
      },
      connectedApis: settings.connectedApis || {
        googleCalendar: false,
        appleHealth: false,
        plaid: false,
      },
      voiceStyle: settings.voiceStyle || 'calm',
      name: settings.name || 'User',
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
    const { 
      theme, 
      aiTone, 
      timezone, 
      language, 
      featuresEnabled,
      // Frontend field names
      enabledModules,
      connectedApis,
      voiceStyle,
      name
    } = req.body;

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
      // Handle both old and new field names
      const updateData: any = {};
      
      if (theme !== undefined) updateData.theme = theme;
      if (aiTone !== undefined) updateData.aiTone = aiTone;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (language !== undefined) updateData.language = language;
      if (featuresEnabled !== undefined) updateData.featuresEnabled = featuresEnabled;
      
      // Handle frontend field names
      if (enabledModules !== undefined) {
        // Convert enabledModules to featuresEnabled format
        updateData.featuresEnabled = {
          ...settings.featuresEnabled,
          mood: enabledModules.mood ?? settings.featuresEnabled?.mood ?? true,
          energy: enabledModules.energy ?? settings.featuresEnabled?.energy ?? true,
          sleep: enabledModules.sleep ?? settings.featuresEnabled?.sleep ?? true,
          focus: enabledModules.focus ?? settings.featuresEnabled?.focus ?? true,
          journal: enabledModules.journal ?? settings.featuresEnabled?.journal ?? true,
          calendar: enabledModules.calendar ?? settings.featuresEnabled?.calendar ?? true,
          finance: enabledModules.finances ?? settings.featuresEnabled?.finance ?? true,
        };
      }
      
      if (connectedApis !== undefined) {
        // Store connectedApis in a separate field or merge with existing data
        updateData.connectedApis = connectedApis;
      }
      
      if (voiceStyle !== undefined) {
        updateData.voiceStyle = voiceStyle;
      }
      
      if (name !== undefined) {
        // Update user's name in the User table
        const user = await User.findByPk(userId);
        if (user) {
          const [firstName, lastName] = name.split(' ');
          user.firstName = firstName;
          user.lastName = lastName || '';
          await user.save();
        }
      }
      
      await settings.update(updateData);
    }

    logger.info(`User settings updated for user: ${userId}`);

    sendSuccess(res, {
      id: settings.id,
      theme: settings.theme,
      aiTone: settings.aiTone,
      timezone: settings.timezone,
      language: settings.language,
      featuresEnabled: settings.featuresEnabled,
      connectedApis: settings.connectedApis || {},
      voiceStyle: settings.voiceStyle || 'calm',
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