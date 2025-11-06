import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { GoogleCalendarService } from '../services/googleCalendarService';

export const googleCalendarRouter = router({
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    const url = GoogleCalendarService.getAuthUrl(ctx.user.id);
    return { url };
  }),

  /**
   * Exchange authorization code for tokens
   */
  exchangeCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      return await GoogleCalendarService.getTokensFromCode(input.code);
    }),

  /**
   * Create deadline event in Google Calendar
   */
  createDeadlineEvent: protectedProcedure
    .input(z.object({
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      caseId: z.number(),
      caseNumber: z.string(),
      title: z.string(),
      deadline: z.date(),
      description: z.string().optional(),
      reminderMinutes: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return await GoogleCalendarService.createDeadlineEvent(input);
    }),

  /**
   * Update deadline event
   */
  updateDeadlineEvent: protectedProcedure
    .input(z.object({
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      eventId: z.string(),
      title: z.string().optional(),
      deadline: z.date().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await GoogleCalendarService.updateDeadlineEvent(input);
    }),

  /**
   * Delete deadline event
   */
  deleteDeadlineEvent: protectedProcedure
    .input(z.object({
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await GoogleCalendarService.deleteDeadlineEvent(input);
    }),

  /**
   * List case events
   */
  listCaseEvents: protectedProcedure
    .input(z.object({
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      caseId: z.number().optional(),
      timeMin: z.date().optional(),
      timeMax: z.date().optional(),
    }))
    .query(async ({ input }) => {
      return await GoogleCalendarService.listCaseEvents(input);
    }),
});
