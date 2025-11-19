import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { activitiesAttachments } from "../../drizzle/schema";
import { storagePut } from "../storage";
import { eq, and, desc } from "drizzle-orm";

export const attachmentsRouter = router({
  // Upload file attachment
  upload: protectedProcedure
    .input(z.object({
      entityType: z.enum(["customer", "vendor", "lead", "contact"]),
      entityId: z.number(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      fileData: z.string(), // base64 encoded
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Decode base64 and upload to S3
      const fileBuffer = Buffer.from(input.fileData, 'base64');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `attachments/${input.entityType}/${input.entityId}/${timestamp}-${randomSuffix}-${input.fileName}`;
      
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

      // Detect if this is an email PDF
      const isEmailPDF = input.fileName.toLowerCase().includes('email') && 
                         input.mimeType === 'application/pdf';
      
      // Parse email metadata from filename if possible
      // Format: "Email - Subject - YYYY-MM-DD.pdf"
      let emailSubject: string | undefined;
      let emailDate: Date | undefined;
      let emailDirection: "sent" | "received" | undefined;
      
      if (isEmailPDF) {
        const match = input.fileName.match(/Email\s*-\s*(.+?)\s*-\s*(\d{4}-\d{2}-\d{2})/i);
        if (match) {
          emailSubject = match[1].trim();
          emailDate = new Date(match[2]);
        }
        
        // Try to detect direction from filename
        if (input.fileName.toLowerCase().includes('sent')) {
          emailDirection = 'sent';
        } else if (input.fileName.toLowerCase().includes('received')) {
          emailDirection = 'received';
        }
      }

      // Insert attachment record
      await db.insert(activitiesAttachments).values({
        entityType: input.entityType,
        entityId: input.entityId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        fileUrl: url,
        fileKey,
        activityType: isEmailPDF ? 'email' : 'document',
        isEmailAttachment: isEmailPDF,
        emailSubject,
        emailDate,
        emailDirection,
        uploadedBy: ctx.user.id,
      });

      return { success: true, url };
    }),

  // List attachments for an entity
  list: protectedProcedure
    .input(z.object({
      entityType: z.enum(["customer", "vendor", "lead", "contact"]),
      entityId: z.number(),
      activityType: z.enum(["email", "meeting", "note", "document", "other"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [
        eq(activitiesAttachments.entityType, input.entityType),
        eq(activitiesAttachments.entityId, input.entityId),
      ];

      if (input.activityType) {
        conditions.push(eq(activitiesAttachments.activityType, input.activityType));
      }

      const attachments = await db
        .select()
        .from(activitiesAttachments)
        .where(and(...conditions))
        .orderBy(desc(activitiesAttachments.createdAt));

      return attachments;
    }),

  // Delete attachment
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [attachment] = await db
        .select()
        .from(activitiesAttachments)
        .where(eq(activitiesAttachments.id, input.id))
        .limit(1);

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      if (attachment.uploadedBy !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error("Not authorized to delete this attachment");
      }

      // Delete from database
      await db.delete(activitiesAttachments).where(eq(activitiesAttachments.id, input.id));

      // Note: We don't delete from S3 to preserve data integrity
      // Files can be cleaned up separately via a maintenance job

      return { success: true };
    }),
});
