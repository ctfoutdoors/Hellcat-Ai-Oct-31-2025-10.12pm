/**
 * Date range utility functions for dashboard analytics
 */

export type TimePeriod = 
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "yearToDate";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Calculate date range for a given time period
 */
export function getDateRange(period: TimePeriod): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case "today": {
      const start = new Date(today);
      const end = new Date(now);
      return { start, end, label: "Today" };
    }
    
    case "yesterday": {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      const end = new Date(today);
      end.setMilliseconds(-1); // End of yesterday
      return { start, end, label: "Yesterday" };
    }
    
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const end = new Date(now);
      return { start, end, label: "Last 7 Days" };
    }
    
    case "last30days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      const end = new Date(now);
      return { start, end, label: "Last 30 Days" };
    }
    
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now);
      return { start, end, label: "This Month" };
    }
    
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, label: "Last Month" };
    }
    
    case "thisQuarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      const end = new Date(now);
      return { start, end, label: "This Quarter" };
    }
    
    case "yearToDate": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now);
      return { start, end, label: "Year to Date" };
    }
    
    default:
      return getDateRange("today");
  }
}

/**
 * Get all available time period options
 */
export function getTimePeriodOptions(): Array<{ value: TimePeriod; label: string }> {
  return [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "thisQuarter", label: "This Quarter" },
    { value: "yearToDate", label: "Year to Date" },
  ];
}
