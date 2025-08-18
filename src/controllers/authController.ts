import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/encryption';
import User from '../models/User';
import { AuthenticatedRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import Notification from '../models/Notification';
import NotificationSettings from '../models/NotificationSettings';
import CalendarEvent from '../models/CalendarEvent';
import ChatMessage from '../models/ChatMessage';
import JournalEntry from '../models/JournalEntry';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      sendError(res, 'User already exists', 409);
      return;
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = uuidv4();

    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      verificationToken,
      isVerified: false,
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await user.update({ refreshToken });

    logger.info(`User registered: ${email}`);

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
      token,
      refreshToken,
    }, 'User registered successfully', 201);
  } catch (error) {
    logger.error('Registration error:', error);
    console.error('Registration error details:', error);
    sendError(res, `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await user.update({ refreshToken });

    logger.info(`User logged in: ${email}`);

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
      token,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    logger.error('Login error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendError(res, 'Refresh token required', 401);
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findOne({ 
      where: { 
        id: decoded.id,
        refreshToken: refreshToken 
      } 
    });

    if (!user) {
      sendError(res, 'Invalid refresh token', 401);
      return;
    }

    const newToken = generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await user.update({ refreshToken: newRefreshToken });

    sendSuccess(res, {
      token: newToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    logger.error('Token refresh error:', error);
    sendError(res, 'Invalid refresh token', 401);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await User.findByPk(authReq.user?.id);
    
    if (user) {
      await user.update({ refreshToken: undefined });
    }

    sendSuccess(res, null, 'Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await User.findByPk(authReq.user?.id);
    
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    }, 'Profile retrieved successfully');
  } catch (error) {
    logger.error('Get profile error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { firstName, lastName } = req.body;
    
    const user = await User.findByPk(authReq.user?.id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
    });

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
    }, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    await Promise.all([
      Notification.destroy({ where: { userId } }),
      NotificationSettings.destroy({ where: { userId } }),
      CalendarEvent.destroy({ where: { userId } }),
      ChatMessage.destroy({ where: { userId } }),
      JournalEntry.destroy({ where: { userId } }),
    ]);
    await User.destroy({ where: { id: userId } });
    sendSuccess(res, { deleted: true }, 'Account deleted successfully');
  } catch (error) {
    logger.error('Delete account error:', error);
    sendError(res, 'Failed to delete account', 500);
  }
};