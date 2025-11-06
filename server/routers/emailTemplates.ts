import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { emailTemplateSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const emailTemplatesRouter = router({
  /**
   * Get email template settings
   */
  getSettings: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get default settings
    const settings = await db.query.emailTemplateSettings.findFirst({
      where: eq(emailTemplateSettings.isDefault, 1),
    });

    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(emailTemplateSettings).values({
        companyName: "Catch The Fever",
        primaryColor: "#2c5f2d",
        secondaryColor: "#10b981",
        headerText: "New Draft Case Created",
        headerIcon: "🚨",
        ctaButtonText: "Review Case",
        ctaButtonColor: "#2c5f2d",
        isDefault: 1,
        enableNewCaseNotifications: 1,
        enableBulkNotifications: 1,
        enableStatusChangeNotifications: 0,
      }).returning();

      return newSettings;
    }

    return settings;
  }),

  /**
   * Update email template settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        logoUrl: z.string().url().optional().nullable(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        headerText: z.string().optional(),
        headerIcon: z.string().max(10).optional(),
        footerText: z.string().optional().nullable(),
        introText: z.string().optional().nullable(),
        ctaButtonText: z.string().optional(),
        ctaButtonColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        fromName: z.string().optional().nullable(),
        fromEmail: z.string().email().optional().nullable(),
        replyToEmail: z.string().email().optional().nullable(),
        enableNewCaseNotifications: z.boolean().optional(),
        enableBulkNotifications: z.boolean().optional(),
        enableStatusChangeNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get existing default settings
      const existing = await db.query.emailTemplateSettings.findFirst({
        where: eq(emailTemplateSettings.isDefault, 1),
      });

      if (existing) {
        // Update existing settings
        const [updated] = await db
          .update(emailTemplateSettings)
          .set({
            ...input,
            enableNewCaseNotifications: input.enableNewCaseNotifications ? 1 : 0,
            enableBulkNotifications: input.enableBulkNotifications ? 1 : 0,
            enableStatusChangeNotifications: input.enableStatusChangeNotifications ? 1 : 0,
            updatedAt: new Date(),
          })
          .where(eq(emailTemplateSettings.id, existing.id))
          .returning();

        return updated;
      } else {
        // Create new settings
        const [newSettings] = await db
          .insert(emailTemplateSettings)
          .values({
            ...input,
            isDefault: 1,
            enableNewCaseNotifications: input.enableNewCaseNotifications ? 1 : 0,
            enableBulkNotifications: input.enableBulkNotifications ? 1 : 0,
            enableStatusChangeNotifications: input.enableStatusChangeNotifications ? 1 : 0,
          })
          .returning();

        return newSettings;
      }
    }),

  /**
   * Reset to default settings
   */
  resetToDefaults: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existing = await db.query.emailTemplateSettings.findFirst({
      where: eq(emailTemplateSettings.isDefault, 1),
    });

    if (existing) {
      const [updated] = await db
        .update(emailTemplateSettings)
        .set({
          companyName: "Catch The Fever",
          logoUrl: null,
          primaryColor: "#2c5f2d",
          secondaryColor: "#10b981",
          headerText: "New Draft Case Created",
          headerIcon: "🚨",
          footerText: null,
          introText: null,
          ctaButtonText: "Review Case",
          ctaButtonColor: "#2c5f2d",
          fromName: null,
          fromEmail: null,
          replyToEmail: null,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplateSettings.id, existing.id))
        .returning();

      return updated;
    }

    return null;
  }),

  /**
   * Send test email
   */
  sendTestEmail: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const { sendNewDraftCaseNotification } = await import("../services/emailServiceCustomizable");

      const testCaseData = {
        caseNumber: "TEST-" + Date.now(),
        trackingNumber: "1234567890",
        carrier: "FEDEX",
        disputeAmount: "25.50",
        priority: "MEDIUM",
        status: "DRAFT",
        recipientName: "Test Customer",
        shipDate: new Date(),
        source: "Test Email System",
        caseUrl: process.env.VITE_APP_URL + "/cases/1",
      };

      const success = await sendNewDraftCaseNotification(testCaseData);

      return { success };
    }),
});
