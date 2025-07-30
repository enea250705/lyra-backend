import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import CalendarConnection from '../models/CalendarConnection';
import CalendarEvent from '../models/CalendarEvent';
import logger from '../utils/logger';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

interface CalendarEventInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
}

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      'http://localhost:3000/auth/google/callback'
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Store or update Google Calendar connection for a user
   */
  async storeCalendarConnection(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<CalendarConnection> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    try {
      // Check if connection already exists
      const existingConnection = await CalendarConnection.findOne({
        where: { userId, provider: 'google' }
      });

      if (existingConnection) {
        // Update existing connection
        await existingConnection.update({
          accessToken,
          refreshToken,
          expiresAt
        });
        return existingConnection;
      } else {
        // Create new connection
        return await CalendarConnection.create({
          userId,
          provider: 'google',
          accessToken,
          refreshToken,
          expiresAt
        });
      }
    } catch (error) {
      logger.error('Error storing calendar connection:', error);
      throw new Error('Failed to store calendar connection');
    }
  }

  /**
   * Get and refresh Google Calendar connection for a user
   */
  async getCalendarConnection(userId: string): Promise<CalendarConnection | null> {
    try {
      const connection = await CalendarConnection.findOne({
        where: { userId, provider: 'google' }
      });

      if (!connection) {
        return null;
      }

      // Check if token needs refresh
      if (connection.needsRefresh()) {
        await this.refreshAccessToken(connection);
      }

      return connection;
    } catch (error) {
      logger.error('Error getting calendar connection:', error);
      return null;
    }
  }

  /**
   * Refresh expired access token
   */
  private async refreshAccessToken(connection: CalendarConnection): Promise<void> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: connection.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token && credentials.expiry_date) {
        await connection.update({
          accessToken: credentials.access_token,
          expiresAt: new Date(credentials.expiry_date)
        });
      }
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Initialize Google Calendar API client
   */
  private initializeCalendarClient(accessToken: string): calendar_v3.Calendar {
    this.oauth2Client.setCredentials({
      access_token: accessToken
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Fetch calendar events from Google Calendar
   */
  async fetchCalendarEvents(
    userId: string,
    timeMin?: Date,
    timeMax?: Date,
    maxResults = 50
  ): Promise<CalendarEvent[]> {
    try {
      const connection = await this.getCalendarConnection(userId);
      if (!connection) {
        throw new Error('No calendar connection found');
      }

      const calendar = this.initializeCalendarClient(connection.accessToken);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString() || new Date().toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      const calendarEvents: CalendarEvent[] = [];

      for (const event of events) {
        if (!event.start || !event.end) continue;

        const startTime = new Date(event.start.dateTime || event.start.date!);
        const endTime = new Date(event.end.dateTime || event.end.date!);
        const isAllDay = !event.start.dateTime;

        // Check if event already exists in our database
        let calendarEvent = await CalendarEvent.findOne({
          where: { 
            userId, 
            externalId: event.id || undefined 
          }
        });

        if (calendarEvent) {
          // Update existing event
          await calendarEvent.update({
            title: event.summary || 'Untitled Event',
            description: event.description || undefined,
            startTime,
            endTime,
            isAllDay,
            location: event.location || undefined,
            attendees: event.attendees?.map(a => a.email).filter((email): email is string => Boolean(email)) || [],
            status: event.status as 'confirmed' | 'tentative' | 'cancelled',
            calendarId: 'primary'
          });
        } else {
          // Create new event
          calendarEvent = await CalendarEvent.create({
            userId,
            externalId: event.id || undefined,
            title: event.summary || 'Untitled Event',
            description: event.description || undefined,
            startTime,
            endTime,
            isAllDay,
            location: event.location || undefined,
            attendees: event.attendees?.map(a => a.email).filter((email): email is string => Boolean(email)) || [],
            status: event.status as 'confirmed' | 'tentative' | 'cancelled' || 'confirmed',
            calendarId: 'primary'
          });
        }

        calendarEvents.push(calendarEvent);
      }

      logger.info(`Fetched ${calendarEvents.length} calendar events for user ${userId}`);
      return calendarEvents;

    } catch (error) {
      logger.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  /**
   * Create a new calendar event in Google Calendar
   */
  async createCalendarEvent(userId: string, eventData: CalendarEventInput): Promise<CalendarEvent> {
    try {
      const connection = await this.getCalendarConnection(userId);
      if (!connection) {
        throw new Error('No calendar connection found');
      }

      const calendar = this.initializeCalendarClient(connection.accessToken);

      const googleEvent: GoogleCalendarEvent = {
        summary: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.isAllDay ? {
          date: eventData.startTime.toISOString().split('T')[0]
        } : {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: eventData.isAllDay ? {
          date: eventData.endTime.toISOString().split('T')[0]
        } : {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'UTC'
        },
        attendees: eventData.attendees?.map(email => ({ email })),
        status: 'confirmed'
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: googleEvent,
      });

      if (!response.data.id) {
        throw new Error('Failed to create event in Google Calendar');
      }

      // Create event in our database
      const calendarEvent = await CalendarEvent.create({
        userId,
        externalId: response.data.id,
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        isAllDay: eventData.isAllDay || false,
        location: eventData.location,
        attendees: eventData.attendees || [],
        status: 'confirmed',
        calendarId: 'primary'
      });

      logger.info(`Created calendar event ${response.data.id} for user ${userId}`);
      return calendarEvent;

    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update an existing calendar event in Google Calendar
   */
  async updateCalendarEvent(
    userId: string, 
    eventId: string, 
    updateData: Partial<CalendarEventInput>
  ): Promise<CalendarEvent> {
    try {
      const connection = await this.getCalendarConnection(userId);
      if (!connection) {
        throw new Error('No calendar connection found');
      }

      // Find the event in our database
      const calendarEvent = await CalendarEvent.findOne({
        where: { userId, id: eventId }
      });

      if (!calendarEvent || !calendarEvent.externalId) {
        throw new Error('Calendar event not found');
      }

      const calendar = this.initializeCalendarClient(connection.accessToken);

      // Build update object
      const updateFields: Partial<GoogleCalendarEvent> = {};
      
      if (updateData.title) updateFields.summary = updateData.title;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.location !== undefined) updateFields.location = updateData.location;
      
      if (updateData.startTime && updateData.endTime) {
        updateFields.start = updateData.isAllDay ? {
          date: updateData.startTime.toISOString().split('T')[0]
        } : {
          dateTime: updateData.startTime.toISOString(),
          timeZone: 'UTC'
        };
        
        updateFields.end = updateData.isAllDay ? {
          date: updateData.endTime.toISOString().split('T')[0]
        } : {
          dateTime: updateData.endTime.toISOString(),
          timeZone: 'UTC'
        };
      }

      if (updateData.attendees) {
        updateFields.attendees = updateData.attendees.map(email => ({ email }));
      }

      const response = await calendar.events.patch({
        calendarId: 'primary',
        eventId: calendarEvent.externalId,
        requestBody: updateFields,
      });

      // Update event in our database
      const dbUpdateData: any = {};
      if (updateData.title) dbUpdateData.title = updateData.title;
      if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
      if (updateData.startTime) dbUpdateData.startTime = updateData.startTime;
      if (updateData.endTime) dbUpdateData.endTime = updateData.endTime;
      if (updateData.location !== undefined) dbUpdateData.location = updateData.location;
      if (updateData.attendees) dbUpdateData.attendees = updateData.attendees;
      if (updateData.isAllDay !== undefined) dbUpdateData.isAllDay = updateData.isAllDay;

      await calendarEvent.update(dbUpdateData);

      logger.info(`Updated calendar event ${calendarEvent.externalId} for user ${userId}`);
      return calendarEvent.reload();

    } catch (error) {
      logger.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete a calendar event from Google Calendar
   */
  async deleteCalendarEvent(userId: string, eventId: string): Promise<boolean> {
    try {
      const connection = await this.getCalendarConnection(userId);
      if (!connection) {
        throw new Error('No calendar connection found');
      }

      // Find the event in our database
      const calendarEvent = await CalendarEvent.findOne({
        where: { userId, id: eventId }
      });

      if (!calendarEvent || !calendarEvent.externalId) {
        throw new Error('Calendar event not found');
      }

      const calendar = this.initializeCalendarClient(connection.accessToken);

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: calendarEvent.externalId,
      });

      // Delete from our database
      await calendarEvent.destroy();

      logger.info(`Deleted calendar event ${calendarEvent.externalId} for user ${userId}`);
      return true;

    } catch (error) {
      logger.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Get events for a specific timeframe
   */
  async getEventsForTimeframe(
    userId: string,
    timeframe: 'today' | 'tomorrow' | 'week' | 'month'
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    let timeMin: Date;
    let timeMax: Date;

    switch (timeframe) {
      case 'today':
        timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'tomorrow':
        timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
        break;
      case 'week':
        timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        break;
      case 'month':
        timeMin = new Date(now.getFullYear(), now.getMonth(), 1);
        timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    try {
      // First, sync events from Google Calendar
      await this.fetchCalendarEvents(userId, timeMin, timeMax);

      // Then return events from our database
      return await CalendarEvent.findAll({
        where: {
          userId,
          startTime: {
            [require('sequelize').Op.gte]: timeMin,
            [require('sequelize').Op.lt]: timeMax
          },
          status: {
            [require('sequelize').Op.ne]: 'cancelled'
          }
        },
        order: [['startTime', 'ASC']]
      });
    } catch (error) {
      logger.error('Error getting events for timeframe:', error);
      throw new Error('Failed to get calendar events');
    }
  }

  /**
   * Find events that can be rescheduled based on mood/energy
   */
  async findReschedulableEvents(userId: string): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      return await CalendarEvent.findAll({
        where: {
          userId,
          startTime: {
            [require('sequelize').Op.gte]: now,
            [require('sequelize').Op.lte]: oneWeekFromNow
          },
          status: 'confirmed'
        },
        order: [['startTime', 'ASC']]
      });
    } catch (error) {
      logger.error('Error finding reschedulable events:', error);
      return [];
    }
  }
}

export default new GoogleCalendarService(); 