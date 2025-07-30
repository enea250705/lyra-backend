import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import googleCalendarService from '../services/googleCalendarService';
import { Request, Response } from 'express';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/calendar/connect:
 *   post:
 *     summary: Verify calendar connection status
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar connection status
 *       401:
 *         description: Unauthorized
 */
router.post('/connect', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const connection = await googleCalendarService.getCalendarConnection(userId);
    
    if (connection) {
      sendSuccess(res, {
        connected: true,
        provider: connection.provider,
        connectedAt: connection.createdAt,
        message: 'Calendar connected and ready'
      }, 'Calendar connection verified');
    } else {
      sendError(res, 'No calendar connection found. Please complete Google OAuth first.', 400);
    }
  } catch (error) {
    logger.error('Calendar connection verification error:', error);
    sendError(res, 'Failed to verify calendar connection', 500);
  }
});

/**
 * @swagger
 * /api/v1/calendar/events:
 *   get:
 *     summary: Get calendar events
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, tomorrow, week, month]
 *           default: week
 *         description: Timeframe to fetch events for
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: Calendar events retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/events', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { timeframe = 'week', maxResults = 50 } = req.query;

    const events = await googleCalendarService.getEventsForTimeframe(
      userId,
      timeframe as 'today' | 'tomorrow' | 'week' | 'month'
    );

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
    logger.error('Get calendar events error:', error);
    sendError(res, 'Failed to get calendar events', 500);
  }
});

/**
 * @swagger
 * /api/v1/calendar/events:
 *   post:
 *     summary: Create a new calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *               isAllDay:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Calendar event created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/events', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { title, description, startTime, endTime, location, attendees, isAllDay } = req.body;

    if (!title || !startTime || !endTime) {
      sendError(res, 'Title, startTime, and endTime are required', 400);
      return;
    }

    const event = await googleCalendarService.createCalendarEvent(userId, {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      attendees,
      isAllDay: isAllDay || false
    });

    sendSuccess(res, {
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
      message: `Created "${event.title}" for ${event.startTime.toDateString()}`
    }, 'Calendar event created successfully', 201);
  } catch (error) {
    logger.error('Create calendar event error:', error);
    sendError(res, 'Failed to create calendar event', 500);
  }
});

/**
 * @swagger
 * /api/v1/calendar/events/{eventId}:
 *   put:
 *     summary: Update a calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Calendar event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *               isAllDay:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Calendar event updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.put('/events/:eventId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { eventId } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const updateData = req.body;
    
    // Convert date strings to Date objects if provided
    if (updateData.startTime) updateData.startTime = new Date(updateData.startTime);
    if (updateData.endTime) updateData.endTime = new Date(updateData.endTime);

    const event = await googleCalendarService.updateCalendarEvent(userId, eventId, updateData);

    sendSuccess(res, {
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
      message: `Updated "${event.title}"`
    }, 'Calendar event updated successfully');
  } catch (error) {
    logger.error('Update calendar event error:', error);
    sendError(res, 'Failed to update calendar event', 500);
  }
});

/**
 * @swagger
 * /api/v1/calendar/events/{eventId}:
 *   delete:
 *     summary: Delete a calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Calendar event ID
 *     responses:
 *       200:
 *         description: Calendar event deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.delete('/events/:eventId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { eventId } = req.params;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const success = await googleCalendarService.deleteCalendarEvent(userId, eventId);

    if (success) {
      sendSuccess(res, {
        eventId,
        deleted: true,
        message: 'Event deleted successfully'
      }, 'Calendar event deleted successfully');
    } else {
      sendError(res, 'Failed to delete calendar event', 500);
    }
  } catch (error) {
    logger.error('Delete calendar event error:', error);
    sendError(res, 'Failed to delete calendar event', 500);
  }
});

/**
 * @swagger
 * /api/v1/calendar/sync:
 *   post:
 *     summary: Sync calendar events from Google Calendar
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar synced successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/sync', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // Sync events from the past week to next month
    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month from now

    const events = await googleCalendarService.fetchCalendarEvents(userId, timeMin, timeMax);

    sendSuccess(res, {
      syncedEvents: events.length,
      timeRange: {
        from: timeMin.toISOString(),
        to: timeMax.toISOString()
      },
      message: `Synced ${events.length} events from Google Calendar`
    }, 'Calendar synced successfully');
  } catch (error) {
    logger.error('Calendar sync error:', error);
    sendError(res, 'Failed to sync calendar', 500);
  }
});

export default router; 