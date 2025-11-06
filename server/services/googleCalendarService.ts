import { google } from 'googleapis';
import { ENV } from '../_core/env';

/**
 * Google Calendar Integration Service
 * 
 * Syncs case deadlines and reminders with Google Calendar
 * Requires OAuth 2.0 credentials configured in environment
 */

export class GoogleCalendarService {
  private static calendar = google.calendar('v3');

  /**
   * Create OAuth2 client with user credentials
   */
  private static getOAuth2Client(accessToken: string, refreshToken?: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback'
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return oauth2Client;
  }

  /**
   * Create calendar event for case deadline
   */
  static async createDeadlineEvent(params: {
    accessToken: string;
    refreshToken?: string;
    caseId: number;
    caseNumber: string;
    title: string;
    deadline: Date;
    description?: string;
    reminderMinutes?: number;
  }) {
    try {
      const auth = this.getOAuth2Client(params.accessToken, params.refreshToken);

      const event = {
        summary: `[Case ${params.caseNumber}] ${params.title}`,
        description: params.description || `Deadline for dispute case #${params.caseNumber}`,
        start: {
          dateTime: params.deadline.toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(params.deadline.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
          timeZone: 'America/New_York',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: params.reminderMinutes || 1440 }, // 24 hours before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
        colorId: '11', // Red for deadlines
        extendedProperties: {
          private: {
            caseId: params.caseId.toString(),
            source: 'carrier-dispute-system',
          },
        },
      };

      const response = await this.calendar.events.insert({
        auth,
        calendarId: 'primary',
        requestBody: event,
      });

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error: any) {
      console.error('[GoogleCalendar] Failed to create event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update existing calendar event
   */
  static async updateDeadlineEvent(params: {
    accessToken: string;
    refreshToken?: string;
    eventId: string;
    title?: string;
    deadline?: Date;
    description?: string;
  }) {
    try {
      const auth = this.getOAuth2Client(params.accessToken, params.refreshToken);

      const updates: any = {};
      if (params.title) updates.summary = params.title;
      if (params.description) updates.description = params.description;
      if (params.deadline) {
        updates.start = {
          dateTime: params.deadline.toISOString(),
          timeZone: 'America/New_York',
        };
        updates.end = {
          dateTime: new Date(params.deadline.getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'America/New_York',
        };
      }

      const response = await this.calendar.events.patch({
        auth,
        calendarId: 'primary',
        eventId: params.eventId,
        requestBody: updates,
      });

      return {
        success: true,
        eventId: response.data.id,
      };
    } catch (error: any) {
      console.error('[GoogleCalendar] Failed to update event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete calendar event
   */
  static async deleteDeadlineEvent(params: {
    accessToken: string;
    refreshToken?: string;
    eventId: string;
  }) {
    try {
      const auth = this.getOAuth2Client(params.accessToken, params.refreshToken);

      await this.calendar.events.delete({
        auth,
        calendarId: 'primary',
        eventId: params.eventId,
      });

      return { success: true };
    } catch (error: any) {
      console.error('[GoogleCalendar] Failed to delete event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List all case-related events
   */
  static async listCaseEvents(params: {
    accessToken: string;
    refreshToken?: string;
    caseId?: number;
    timeMin?: Date;
    timeMax?: Date;
  }) {
    try {
      const auth = this.getOAuth2Client(params.accessToken, params.refreshToken);

      const response = await this.calendar.events.list({
        auth,
        calendarId: 'primary',
        timeMin: (params.timeMin || new Date()).toISOString(),
        timeMax: params.timeMax?.toISOString(),
        privateExtendedProperty: params.caseId 
          ? [`caseId=${params.caseId}`]
          : ['source=carrier-dispute-system'],
        singleEvents: true,
        orderBy: 'startTime',
      });

      return {
        success: true,
        events: response.data.items || [],
      };
    } catch (error: any) {
      console.error('[GoogleCalendar] Failed to list events:', error);
      return {
        success: false,
        error: error.message,
        events: [],
      };
    }
  }

  /**
   * Get OAuth authorization URL
   */
  static getAuthUrl(userId: number) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback'
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId.toString(),
      prompt: 'consent', // Force to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(code: string) {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback'
      );

      const { tokens } = await oauth2Client.getToken(code);

      return {
        success: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      };
    } catch (error: any) {
      console.error('[GoogleCalendar] Failed to exchange code:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
