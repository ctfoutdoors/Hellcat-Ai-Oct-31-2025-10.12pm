/**
 * Google Calendar Integration Service using MCP
 * 
 * Manages deadlines, reminders, and follow-ups for carrier disputes
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CalendarEvent {
  summary: string;
  description?: string;
  startTime: string; // RFC3339 timestamp
  endTime: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

/**
 * Create calendar event
 */
export async function createEvent(event: CalendarEvent): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const input = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startTime,
      },
      end: {
        dateTime: event.endTime,
      },
      reminders: event.reminders || {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const { stdout, stderr } = await execAsync(
      `manus-mcp-cli tool call google_calendar_create_events --server google-calendar --input '${JSON.stringify(input).replace(/'/g, "\\'")}'`
    );

    if (stderr) {
      console.error('Calendar create error:', stderr);
      return { success: false, error: stderr };
    }

    const result = JSON.parse(stdout);
    return { success: true, eventId: result.id };
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Search calendar events
 */
export async function searchEvents(query?: string, maxResults: number = 50): Promise<any[]> {
  try {
    const input = {
      q: query,
      max_results: maxResults,
    };

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call google_calendar_search_events --server google-calendar --input '${JSON.stringify(input).replace(/'/g, "\\'")}'`
    );

    const result = JSON.parse(stdout);
    return result.items || [];
  } catch (error) {
    console.error('Failed to search calendar events:', error);
    return [];
  }
}

/**
 * Create deadline reminder for case
 */
export async function createCaseDeadline(
  caseNumber: string,
  carrier: string,
  deadlineDate: Date,
  description?: string
): Promise<{ success: boolean; eventId?: string }> {
  const carrierNames: Record<string, string> = {
    FEDEX: 'FedEx',
    UPS: 'UPS',
    USPS: 'USPS',
    DHL: 'DHL',
    OTHER: 'Carrier',
  };

  const summary = `Dispute Deadline - ${caseNumber} (${carrierNames[carrier] || carrier})`;
  const eventDescription = description || `Deadline for carrier dispute case ${caseNumber}. Ensure all documentation is submitted and follow up on response.`;

  // Set event for all day on deadline date
  const startTime = new Date(deadlineDate);
  startTime.setHours(9, 0, 0, 0);
  
  const endTime = new Date(deadlineDate);
  endTime.setHours(17, 0, 0, 0);

  return await createEvent({
    summary,
    description: eventDescription,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 7 * 24 * 60 }, // 7 days before
        { method: 'email', minutes: 3 * 24 * 60 }, // 3 days before
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  });
}

/**
 * Create follow-up reminder
 */
export async function createFollowUpReminder(
  caseNumber: string,
  followUpDate: Date,
  notes?: string
): Promise<{ success: boolean; eventId?: string }> {
  const summary = `Follow Up - Case ${caseNumber}`;
  const description = notes || `Follow up on carrier dispute case ${caseNumber}. Check for response and take next action.`;

  const startTime = new Date(followUpDate);
  startTime.setHours(10, 0, 0, 0);
  
  const endTime = new Date(followUpDate);
  endTime.setHours(10, 30, 0, 0);

  return await createEvent({
    summary,
    description,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  });
}

/**
 * Get upcoming deadlines
 */
export async function getUpcomingDeadlines(daysAhead: number = 30): Promise<any[]> {
  const events = await searchEvents('Dispute Deadline', 100);
  
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return events.filter(event => {
    const eventDate = new Date(event.start?.dateTime || event.start?.date);
    return eventDate >= now && eventDate <= futureDate;
  });
}

/**
 * Calculate deadline based on carrier policies
 */
export function calculateDeadline(carrier: string, filedDate: Date = new Date()): Date {
  // Most carriers have 30-day dispute filing deadline
  const deadlineDate = new Date(filedDate);
  
  const carrierDeadlineDays: Record<string, number> = {
    FEDEX: 30,
    UPS: 30,
    USPS: 30,
    DHL: 30,
    OTHER: 30,
  };

  const days = carrierDeadlineDays[carrier] || 30;
  deadlineDate.setDate(deadlineDate.getDate() + days);
  
  return deadlineDate;
}
