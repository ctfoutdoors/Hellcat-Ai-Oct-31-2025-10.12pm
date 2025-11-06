import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { WebhookService } from "../services/webhookService";

export const webhooksRouter = router({
  /**
   * Receive webhook from Typeform
   */
  receiveTypeform: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      const result = await WebhookService.processTypeformWebhook(input);
      return result;
    }),

  /**
   * Receive webhook from Google Sheets (via Zapier/Make)
   */
  receiveGoogleSheets: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      const result = await WebhookService.processGoogleSheetsWebhook(input);
      return result;
    }),

  /**
   * Register outgoing webhook
   */
  registerWebhook: protectedProcedure
    .input(z.object({
      url: z.string().url(),
      events: z.array(z.string()),
      secret: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const subscription = WebhookService.registerWebhook({
        url: input.url,
        events: input.events,
        active: true,
        secret: input.secret,
      });
      
      return {
        success: true,
        subscription,
      };
    }),

  /**
   * Get all webhook subscriptions
   */
  listWebhooks: protectedProcedure
    .query(async () => {
      const webhooks = WebhookService.getWebhooks();
      return { webhooks };
    }),

  /**
   * Delete webhook subscription
   */
  deleteWebhook: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const success = WebhookService.deleteWebhook(input.id);
      return { success };
    }),

  /**
   * Test webhook endpoint
   */
  testWebhook: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      const result = await WebhookService.testWebhook(input.url);
      return result;
    }),
});
