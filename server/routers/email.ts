import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

export const emailRouter = router({
  // Log an email conversation
  logEmail: protectedProcedure
    .input(z.object({
      entityType: z.enum(["customer", "vendor", "lead", "contact"]),
      entityId: z.number(),
      subject: z.string().min(1),
      body: z.string().optional(),
      direction: z.enum(["sent", "received"]),
      visibility: z.enum(["private", "public", "shared"]),
      sharedWithUserIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Insert email log
      const result = await db.execute(`
        INSERT INTO email_logs (
          user_id, entity_type, entity_id, subject, body,
          direction, visibility, shared_with_user_ids
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ctx.user.id,
        input.entityType,
        input.entityId,
        input.subject,
        input.body || null,
        input.direction,
        input.visibility,
        input.sharedWithUserIds ? JSON.stringify(input.sharedWithUserIds) : null,
      ]);

      return { success: true, emailId: result.insertId };
    }),

  // Get email logs for a specific entity
  getEntityEmails: protectedProcedure
    .input(z.object({
      entityType: z.enum(["customer", "vendor", "lead", "contact"]),
      entityId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get emails that the current user can see:
      // 1. Emails they created (regardless of visibility)
      // 2. Public emails
      // 3. Emails shared with them
      const result = await db.execute(`
        SELECT 
          el.*,
          u.name as user_name,
          u.email as user_email
        FROM email_logs el
        JOIN users u ON el.user_id = u.id
        WHERE el.entity_type = ? AND el.entity_id = ?
        AND (
          el.user_id = ? OR
          el.visibility = 'public' OR
          (el.visibility = 'shared' AND JSON_CONTAINS(el.shared_with_user_ids, ?))
        )
        ORDER BY el.created_at DESC
      `, [
        input.entityType,
        input.entityId,
        ctx.user.id,
        JSON.stringify(ctx.user.id),
      ]);

      return result.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        subject: row.subject,
        body: row.body,
        direction: row.direction,
        visibility: row.visibility,
        sharedWithUserIds: row.shared_with_user_ids ? JSON.parse(row.shared_with_user_ids) : [],
        createdAt: row.created_at,
      }));
    }),

  // Update email visibility
  updateVisibility: protectedProcedure
    .input(z.object({
      emailId: z.number(),
      visibility: z.enum(["private", "public", "shared"]),
      sharedWithUserIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const checkResult = await db.execute(`
        SELECT user_id FROM email_logs WHERE id = ?
      `, [input.emailId]);

      if (checkResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Email not found" });
      }

      if (checkResult.rows[0].user_id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only modify your own emails" });
      }

      // Update visibility
      await db.execute(`
        UPDATE email_logs 
        SET visibility = ?, shared_with_user_ids = ?
        WHERE id = ?
      `, [
        input.visibility,
        input.sharedWithUserIds ? JSON.stringify(input.sharedWithUserIds) : null,
        input.emailId,
      ]);

      return { success: true };
    }),

  // Delete an email log
  deleteEmail: protectedProcedure
    .input(z.object({ emailId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const checkResult = await db.execute(`
        SELECT user_id FROM email_logs WHERE id = ?
      `, [input.emailId]);

      if (checkResult.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Email not found" });
      }

      if (checkResult.rows[0].user_id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own emails" });
      }

      // Delete email
      await db.execute(`
        DELETE FROM email_logs WHERE id = ?
      `, [input.emailId]);

      return { success: true };
    }),
});
