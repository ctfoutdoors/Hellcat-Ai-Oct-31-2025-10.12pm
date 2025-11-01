/**
 * Calendar Integration Service
 * Generates iCal (.ics) files for reminders and events
 */

interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  reminder?: number; // minutes before event
  url?: string;
}

export class CalendarService {
  /**
   * Generate iCal format string from event data
   */
  static generateICalString(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Catch The Fever//Carrier Dispute System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startDate)}`,
    ];

    if (event.endDate) {
      lines.push(`DTEND:${formatDate(event.endDate)}`);
    } else {
      // Default to 1 hour duration if no end date
      const endDate = new Date(event.startDate.getTime() + 60 * 60 * 1000);
      lines.push(`DTEND:${formatDate(endDate)}`);
    }

    lines.push(`SUMMARY:${escapeText(event.title)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`);
    }

    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    // Add reminder/alarm
    if (event.reminder) {
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-PT' + event.reminder + 'M');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeText(event.title)}`);
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  /**
   * Generate iCal file for a case reminder
   */
  static generateCaseReminderICal(params: {
    caseId: number;
    caseNumber: string;
    title: string;
    dueDate: Date;
    description?: string;
    reminderMinutes?: number;
  }): string {
    const event: CalendarEvent = {
      uid: `case-${params.caseId}-reminder@catchthefever.com`,
      title: `[Case #${params.caseNumber}] ${params.title}`,
      description: params.description || `Reminder for case #${params.caseNumber}`,
      startDate: params.dueDate,
      reminder: params.reminderMinutes || 60, // Default 1 hour before
      url: `${process.env.VITE_APP_URL || 'https://app.catchthefever.com'}/cases/${params.caseId}`,
    };

    return this.generateICalString(event);
  }

  /**
   * Generate iCal file for a case deadline
   */
  static generateCaseDeadlineICal(params: {
    caseId: number;
    caseNumber: string;
    deadlineType: string; // e.g., "Response Deadline", "Filing Deadline"
    deadlineDate: Date;
    carrier?: string;
  }): string {
    const event: CalendarEvent = {
      uid: `case-${params.caseId}-deadline-${Date.now()}@catchthefever.com`,
      title: `${params.deadlineType}: Case #${params.caseNumber}`,
      description: `${params.deadlineType} for case #${params.caseNumber}${params.carrier ? ` (${params.carrier})` : ''}`,
      startDate: params.deadlineDate,
      reminder: 1440, // 24 hours before
      url: `${process.env.VITE_APP_URL || 'https://app.catchthefever.com'}/cases/${params.caseId}`,
    };

    return this.generateICalString(event);
  }

  /**
   * Generate iCal file for weekly report schedule
   */
  static generateWeeklyReportICal(params: {
    reportDay: number; // 0 = Sunday, 1 = Monday, etc.
    reportTime: string; // e.g., "09:00"
  }): string {
    // Calculate next occurrence
    const now = new Date();
    const nextDate = new Date(now);
    const currentDay = now.getDay();
    const daysUntilReport = (params.reportDay - currentDay + 7) % 7 || 7;
    nextDate.setDate(now.getDate() + daysUntilReport);
    
    const [hours, minutes] = params.reportTime.split(':').map(Number);
    nextDate.setHours(hours, minutes, 0, 0);

    const event: CalendarEvent = {
      uid: `weekly-report@catchthefever.com`,
      title: 'Weekly Dispute Report',
      description: 'Automated weekly carrier dispute report delivery',
      startDate: nextDate,
      reminder: 0, // No reminder needed for automated reports
    };

    return this.generateICalString(event);
  }

  /**
   * Generate Google Calendar URL for quick add
   */
  static generateGoogleCalendarUrl(params: {
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
  }): string {
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const baseUrl = 'https://calendar.google.com/calendar/render';
    const queryParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: params.title,
      dates: `${formatGoogleDate(params.startDate)}/${formatGoogleDate(params.endDate || new Date(params.startDate.getTime() + 60 * 60 * 1000))}`,
    });

    if (params.description) {
      queryParams.append('details', params.description);
    }

    if (params.location) {
      queryParams.append('location', params.location);
    }

    return `${baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Generate Outlook Calendar URL for quick add
   */
  static generateOutlookCalendarUrl(params: {
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
  }): string {
    const formatOutlookDate = (date: Date): string => {
      return date.toISOString();
    };

    const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const queryParams = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: params.title,
      startdt: formatOutlookDate(params.startDate),
      enddt: formatOutlookDate(params.endDate || new Date(params.startDate.getTime() + 60 * 60 * 1000)),
    });

    if (params.description) {
      queryParams.append('body', params.description);
    }

    if (params.location) {
      queryParams.append('location', params.location);
    }

    return `${baseUrl}?${queryParams.toString()}`;
  }
}
