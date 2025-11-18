import { getDb } from "../db";

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
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
  attendees?: Array<{ email: string; responseStatus?: string }>;
  organizer?: { email: string };
  status?: string;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get valid access token for a calendar connection
 */
async function getValidAccessToken(connectionId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.execute(`
    SELECT access_token, refresh_token, token_expires_at 
    FROM calendar_connections 
    WHERE id = ?
  `, [connectionId]);

  if (result.rows.length === 0) {
    throw new Error("Calendar connection not found");
  }

  const connection = result.rows[0];
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = connection.token_expires_at 
    ? Math.floor(new Date(connection.token_expires_at).getTime() / 1000)
    : 0;

  // If token is still valid (with 5 min buffer), return it
  if (expiresAt > now + 300) {
    return connection.access_token;
  }

  // Token expired, refresh it
  if (!connection.refresh_token) {
    throw new Error("No refresh token available");
  }

  const { accessToken, expiresIn } = await refreshAccessToken(connection.refresh_token);

  // Update database with new token
  await db.execute(`
    UPDATE calendar_connections 
    SET access_token = ?, token_expires_at = FROM_UNIXTIME(?)
    WHERE id = ?
  `, [accessToken, now + expiresIn, connectionId]);

  return accessToken;
}

/**
 * Fetch events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(connectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get connection details
  const connResult = await db.execute(`
    SELECT * FROM calendar_connections WHERE id = ?
  `, [connectionId]);

  if (connResult.rows.length === 0) {
    throw new Error("Calendar connection not found");
  }

  const connection = connResult.rows[0];
  const accessToken = await getValidAccessToken(connectionId);

  // Fetch events from the past 30 days and future 90 days
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 30);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 90);

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events?` +
    `timeMin=${timeMin.toISOString()}&` +
    `timeMax=${timeMax.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  const events: GoogleCalendarEvent[] = data.items || [];

  // Store/update events in database
  for (const event of events) {
    const startTime = event.start.dateTime || event.start.date;
    const endTime = event.end.dateTime || event.end.date;
    const allDay = !event.start.dateTime; // If no time, it's all-day

    await db.execute(`
      INSERT INTO calendar_events (
        calendar_connection_id, external_event_id, title, description,
        location, start_time, end_time, all_day, attendees,
        organizer_email, status, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description),
        location = VALUES(location),
        start_time = VALUES(start_time),
        end_time = VALUES(end_time),
        all_day = VALUES(all_day),
        attendees = VALUES(attendees),
        organizer_email = VALUES(organizer_email),
        status = VALUES(status),
        last_synced_at = CURRENT_TIMESTAMP
    `, [
      connectionId,
      event.id,
      event.summary || "Untitled Event",
      event.description || null,
      event.location || null,
      startTime,
      endTime,
      allDay ? 1 : 0,
      event.attendees ? JSON.stringify(event.attendees.map(a => a.email)) : null,
      event.organizer?.email || null,
      event.status || "confirmed",
    ]);
  }

  // Update last sync timestamp
  await db.execute(`
    UPDATE calendar_connections 
    SET last_sync_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [connectionId]);
}

/**
 * Push a CRM event to Google Calendar
 */
export async function pushEventToGoogleCalendar(
  connectionId: number,
  event: {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
  }
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get connection details
  const connResult = await db.execute(`
    SELECT * FROM calendar_connections WHERE id = ?
  `, [connectionId]);

  if (connResult.rows.length === 0) {
    throw new Error("Calendar connection not found");
  }

  const connection = connResult.rows[0];
  const accessToken = await getValidAccessToken(connectionId);

  // Create event in Google Calendar
  const googleEvent = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: "UTC",
    },
    attendees: event.attendees?.map(email => ({ email })),
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendar_id)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create calendar event: ${response.statusText}`);
  }

  const createdEvent = await response.json();
  return createdEvent.id;
}

/**
 * Sync all enabled calendar connections for a user
 */
export async function syncUserCalendars(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.execute(`
    SELECT id FROM calendar_connections 
    WHERE user_id = ? AND sync_enabled = 1
  `, [userId]);

  for (const row of result.rows) {
    try {
      await fetchGoogleCalendarEvents(row.id);
    } catch (error) {
      console.error(`Failed to sync calendar ${row.id}:`, error);
    }
  }
}
