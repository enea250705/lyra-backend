import { Request, Response } from 'express';
import { google } from 'googleapis';
import { config } from '../config';
import { sendSuccess, sendError } from '../utils/response';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import User from '../models/User';
import googleCalendarService from '../services/googleCalendarService';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  'http://localhost:3000/auth/google/callback'
);

export const getGoogleAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true
    });

    sendSuccess(res, {
      authUrl,
      message: 'Redirect user to this URL for Google authentication'
    }, 'Google OAuth URL generated successfully');
  } catch (error) {
    logger.error('Google Auth URL generation error:', error);
    sendError(res, 'Failed to generate Google authentication URL', 500);
  }
};

export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Support both GET (query params) and POST (body) for mobile compatibility
    const code = req.method === 'POST' ? req.body.code : req.query.code;

    if (!code) {
      sendError(res, 'Authorization code not provided', 400);
      return;
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const googleUser = userInfo.data;

    if (!googleUser.email) {
      sendError(res, 'Unable to get user email from Google', 400);
      return;
    }

    // Check if user exists
    let user = await User.findOne({ where: { email: googleUser.email } });

    if (!user) {
      // Create new user
      user = await User.create({
        email: googleUser.email,
        firstName: googleUser.given_name || '',
        lastName: googleUser.family_name || '',
        googleId: googleUser.id || undefined,
        isVerified: true,
        passwordHash: '' // Google OAuth users don't need password
      });
    } else {
      // Update existing user with Google ID if not set
      if (!user.googleId && googleUser.id) {
        await user.update({ googleId: googleUser.id });
      }
    }

    // Generate tokens
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

    // Store calendar connection with actual tokens
    if (tokens.access_token && tokens.refresh_token && tokens.expiry_date) {
      try {
        const expiresIn = Math.floor((tokens.expiry_date - Date.now()) / 1000);
        await googleCalendarService.storeCalendarConnection(
          user.id,
          tokens.access_token,
          tokens.refresh_token,
          expiresIn
        );
        logger.info(`Calendar connection stored for user: ${user.email}`);
      } catch (error) {
        logger.error('Failed to store calendar connection:', error);
        // Don't fail the auth process if calendar storage fails
      }
    }

    logger.info(`Google OAuth login successful for user: ${user.email}`);

    // For mobile app, redirect to a deep link or return JSON
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
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      calendarConnected: !!tokens.access_token
    }, 'Google OAuth authentication successful');

  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    sendError(res, 'Google authentication failed', 500);
  }
};

export const connectCalendar = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Check if user already has a calendar connection
    const connection = await googleCalendarService.getCalendarConnection(userId);
    
    if (connection) {
      sendSuccess(res, {
        connected: true,
        provider: connection.provider,
        connectedAt: connection.createdAt,
        message: 'Calendar already connected'
      }, 'Calendar connection verified');
    } else {
      sendError(res, 'No calendar connection found. Please complete Google OAuth first.', 400);
    }
  } catch (error) {
    logger.error('Calendar connection error:', error);
    sendError(res, 'Failed to verify calendar connection', 500);
  }
};

export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { timeframe = 'week', maxResults = 50 } = req.query;

    // Get events using the real calendar service
    const events = await googleCalendarService.getEventsForTimeframe(
      userId,
      timeframe as 'today' | 'tomorrow' | 'week' | 'month'
    );

    // Format events for response
    const formattedEvents = events.map(event => ({
      id: event.id,
      externalId: event.externalId,
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      isAllDay: event.isAllDay,
      location: event.location,
      attendees: event.attendees,
      status: event.status,
      timeRange: event.formatTimeRange(),
      canReschedule: event.canBeRescheduled(),
      isToday: event.isToday(),
      isTomorrow: event.isTomorrow(),
      isUpcoming: event.isUpcoming()
    }));

    sendSuccess(res, {
      events: formattedEvents,
      count: formattedEvents.length,
      timeframe,
      message: `Retrieved ${formattedEvents.length} calendar events`
    }, 'Calendar events retrieved successfully');
  } catch (error) {
    logger.error('Calendar events error:', error);
    sendError(res, 'Failed to get calendar events', 500);
  }
}; 