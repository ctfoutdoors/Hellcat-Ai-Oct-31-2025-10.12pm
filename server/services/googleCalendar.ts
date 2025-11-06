import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start_time: string; // RFC3339 format
  end_time: string; // RFC3339 format
  attendees?: string[];
  reminders?: number[]; // Minutes before event
  calendar_id?: string;
}

interface UpdateEvent extends Partial<CalendarEvent> {
  event_id: string;
}

/**
 * Create a calendar event using Google Calendar MCP
 */
export async function createCalendarEvent(event: CalendarEvent): Promise<any> {
  const input = JSON.stringify({
    events: [
      {
        summary: event.summary,
        description: event.description || "",
        location: event.location || "",
        start_time: event.start_time,
        end_time: event.end_time,
        attendees: event.attendees || [],
        reminders: event.reminders || [15], // Default 15 min reminder
        calendar_id: event.calendar_id || "primary",
      },
    ],
  });

  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call google_calendar_create_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
    );
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error("Error creating calendar event:", error.message);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Search for upcoming calendar events
 */
export async function searchCalendarEvents(params: {
  calendar_id?: string;
  time_min?: string;
  time_max?: string;
  q?: string;
  max_results?: number;
}): Promise<any> {
  const input = JSON.stringify({
    calendar_id: params.calendar_id || "primary",
    time_min: params.time_min,
    time_max: params.time_max,
    q: params.q,
    max_results: params.max_results || 50,
  });

  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call google_calendar_search_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
    );
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error("Error searching calendar events:", error.message);
    throw new Error(`Failed to search calendar events: ${error.message}`);
  }
}

/**
 * Get a specific calendar event
 */
export async function getCalendarEvent(eventId: string, calendarId: string = "primary"): Promise<any> {
  const input = JSON.stringify({
    event_id: eventId,
    calendar_id: calendarId,
  });

  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call google_calendar_get_event --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
    );
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error("Error getting calendar event:", error.message);
    throw new Error(`Failed to get calendar event: ${error.message}`);
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(event: UpdateEvent): Promise<any> {
  const input = JSON.stringify({
    events: [
      {
        event_id: event.event_id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time,
        attendees: event.attendees,
        reminders: event.reminders,
        calendar_id: event.calendar_id || "primary",
      },
    ],
  });

  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call google_calendar_update_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
    );
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error("Error updating calendar event:", error.message);
    throw new Error(`Failed to update calendar event: ${error.message}`);
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string, calendarId: string = "primary"): Promise<any> {
  const input = JSON.stringify({
    events: [
      {
        event_id: eventId,
        calendar_id: calendarId,
      },
    ],
  });

  try {
    const { stdout } = await execAsync(
      `manus-mcp-cli tool call google_calendar_delete_events --server google-calendar --input '${input.replace(/'/g, "'\\''")}'`
    );
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error("Error deleting calendar event:", error.message);
    throw new Error(`Failed to delete calendar event: ${error.message}`);
  }
}

/**
 * Helper: Get upcoming meetings for a customer/lead
 */
export async function getUpcomingMeetings(searchQuery: string): Promise<any> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 3); // Next 3 months

  return searchCalendarEvents({
    time_min: now.toISOString(),
    time_max: futureDate.toISOString(),
    q: searchQuery,
    max_results: 20,
  });
}
