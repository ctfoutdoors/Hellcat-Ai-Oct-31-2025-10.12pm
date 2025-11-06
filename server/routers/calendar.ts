import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { CalendarService } from "../services/calendar.service";
import { TRPCError } from "@trpc/server";

export const calendarRouter = router({
  // Generate iCal for case reminder
  generateCaseReminderICal: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        caseNumber: z.string(),
        title: z.string(),
        dueDate: z.date(),
        description: z.string().optional(),
        reminderMinutes: z.number().optional(),
      })
    )
    .mutation(({ input }) => {
      const icalString = CalendarService.generateCaseReminderICal(input);
      return {
        icalString,
        filename: `case-${input.caseNumber}-reminder.ics`,
      };
    }),

  // Generate iCal for case deadline
  generateCaseDeadlineICal: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        caseNumber: z.string(),
        deadlineType: z.string(),
        deadlineDate: z.date(),
        carrier: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const icalString = CalendarService.generateCaseDeadlineICal(input);
      return {
        icalString,
        filename: `case-${input.caseNumber}-deadline.ics`,
      };
    }),

  // Generate Google Calendar URL
  generateGoogleCalendarUrl: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        location: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const url = CalendarService.generateGoogleCalendarUrl(input);
      return { url };
    }),

  // Generate Outlook Calendar URL
  generateOutlookCalendarUrl: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        location: z.string().optional(),
      })
    )
    .query(({ input }) => {
      const url = CalendarService.generateOutlookCalendarUrl(input);
      return { url };
    }),
});
