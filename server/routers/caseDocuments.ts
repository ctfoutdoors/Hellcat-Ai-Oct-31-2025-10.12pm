import { z } from "zod";
import { eq, and, desc, isNull } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { caseDocuments, documentVersions, documentAccessLog } from "../../drizzle/schema";
import { storagePut } from "../storage";

export const caseDocumentsRouter = router({
  // List documents for a case
  list: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        category: z.enum([
          "damage_photo",
          "packaging_photo",
          "receipt",
          "invoice",
          "correspondence",
          "tracking_info",
          "other"
        ]).optional(),
        isEvidence: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [
        eq(caseDocuments.caseId, input.caseId),
        isNull(caseDocuments.deletedAt),
      ];

      if (input.category) {
        conditions.push(eq(caseDocuments.category, input.category));
      }
      if (input.isEvidence !== undefined) {
        conditions.push(eq(caseDocuments.isEvidence, input.isEvidence));
      }

      const documents = await db
        .select()
        .from(caseDocuments)
        .where(and(...conditions))
        .orderBy(desc(caseDocuments.uploadedAt));

      // Log access
      for (const doc of documents) {
        await db.insert(documentAccessLog).values({
          documentId: doc.id,
          userId: ctx.user.id,
          action: "viewed",
        });
      }

      return documents;
    }),

  // Get document by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [document] = await db
        .select()
        .from(caseDocuments)
        .where(
          and(
            eq(caseDocuments.id, input.id),
            isNull(caseDocuments.deletedAt)
          )
        )
        .limit(1);

      if (!document) {
        throw new Error("Document not found");
      }

      // Log access
      await db.insert(documentAccessLog).values({
        documentId: document.id,
        userId: ctx.user.id,
        action: "viewed",
      });

      return document;
    }),

  // Upload document
  upload: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // base64
        category: z.enum([
          "damage_photo",
          "packaging_photo",
          "receipt",
          "invoice",
          "correspondence",
          "tracking_info",
          "other"
        ]),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isEvidence: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Decode base64
      const buffer = Buffer.from(input.fileData, 'base64');
      const fileSize = buffer.length;

      // Validate file size (max 50MB)
      if (fileSize > 50 * 1024 * 1024) {
        throw new Error("File size exceeds 50MB limit");
      }

      // Generate unique file key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `case-${input.caseId}/documents/${timestamp}-${randomSuffix}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.fileType);

      // Save to database
      const [result] = await db.insert(caseDocuments).values({
        caseId: input.caseId,
        fileName: input.fileName,
        originalFileName: input.fileName,
        fileSize,
        fileType: input.fileType,
        fileUrl: url,
        fileKey,
        category: input.category,
        description: input.description || null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        isEvidence: input.isEvidence,
        uploadedBy: ctx.user.id,
      });

      // Log upload
      await db.insert(documentAccessLog).values({
        documentId: result.insertId,
        userId: ctx.user.id,
        action: "uploaded",
      });

      return { id: result.insertId, url, fileKey };
    }),

  // Batch upload
  batchUpload: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        files: z.array(
          z.object({
            fileName: z.string(),
            fileType: z.string(),
            fileData: z.string(),
            category: z.enum([
              "damage_photo",
              "packaging_photo",
              "receipt",
              "invoice",
              "correspondence",
              "tracking_info",
              "other"
            ]),
            description: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = [];

      for (const file of input.files) {
        const buffer = Buffer.from(file.fileData, 'base64');
        const fileSize = buffer.length;

        if (fileSize > 50 * 1024 * 1024) {
          results.push({ fileName: file.fileName, error: "File too large" });
          continue;
        }

        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `case-${input.caseId}/documents/${timestamp}-${randomSuffix}-${file.fileName}`;

        try {
          const { url } = await storagePut(fileKey, buffer, file.fileType);

          const [result] = await db.insert(caseDocuments).values({
            caseId: input.caseId,
            fileName: file.fileName,
            originalFileName: file.fileName,
            fileSize,
            fileType: file.fileType,
            fileUrl: url,
            fileKey,
            category: file.category,
            description: file.description || null,
            isEvidence: true,
            uploadedBy: ctx.user.id,
          });

          await db.insert(documentAccessLog).values({
            documentId: result.insertId,
            userId: ctx.user.id,
            action: "uploaded",
          });

          results.push({ fileName: file.fileName, id: result.insertId, url });
        } catch (error) {
          results.push({ fileName: file.fileName, error: "Upload failed" });
        }
      }

      return results;
    }),

  // Update document
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        fileName: z.string().optional(),
        category: z.enum([
          "damage_photo",
          "packaging_photo",
          "receipt",
          "invoice",
          "correspondence",
          "tracking_info",
          "other"
        ]).optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isEvidence: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      const updateData: any = {};
      if (updates.fileName) updateData.fileName = updates.fileName;
      if (updates.category) updateData.category = updates.category;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.tags) updateData.tags = JSON.stringify(updates.tags);
      if (updates.isEvidence !== undefined) updateData.isEvidence = updates.isEvidence;

      await db
        .update(caseDocuments)
        .set(updateData)
        .where(eq(caseDocuments.id, id));

      // Log update
      await db.insert(documentAccessLog).values({
        documentId: id,
        userId: ctx.user.id,
        action: "updated",
      });

      return { success: true };
    }),

  // Delete document (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(caseDocuments)
        .set({ deletedAt: new Date() })
        .where(eq(caseDocuments.id, input.id));

      // Log deletion
      await db.insert(documentAccessLog).values({
        documentId: input.id,
        userId: ctx.user.id,
        action: "deleted",
      });

      return { success: true };
    }),

  // Batch delete
  batchDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      for (const id of input.ids) {
        await db
          .update(caseDocuments)
          .set({ deletedAt: new Date() })
          .where(eq(caseDocuments.id, id));

        await db.insert(documentAccessLog).values({
          documentId: id,
          userId: ctx.user.id,
          action: "deleted",
        });
      }

      return { success: true, count: input.ids.length };
    }),

  // Get document versions
  getVersions: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const versions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, input.documentId))
        .orderBy(desc(documentVersions.version));

      return versions;
    }),

  // Get access log
  getAccessLog: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db
        .select()
        .from(documentAccessLog)
        .where(eq(documentAccessLog.documentId, input.documentId))
        .orderBy(desc(documentAccessLog.createdAt))
        .limit(50);

      return logs;
    }),

  // Get document statistics for a case
  getStats: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const documents = await db
        .select()
        .from(caseDocuments)
        .where(
          and(
            eq(caseDocuments.caseId, input.caseId),
            isNull(caseDocuments.deletedAt)
          )
        );

      const stats = {
        total: documents.length,
        byCategory: {} as Record<string, number>,
        totalSize: 0,
        evidenceCount: 0,
      };

      documents.forEach((doc) => {
        stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
        stats.totalSize += doc.fileSize;
        if (doc.isEvidence) stats.evidenceCount++;
      });

      return stats;
    }),
});
