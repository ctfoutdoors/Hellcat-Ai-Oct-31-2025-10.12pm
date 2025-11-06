import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { crmDocuments } from '../../drizzle/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';

export const crmDocumentsRouter = router({
  
  /**
   * List documents with filtering
   */
  list: protectedProcedure
    .input(z.object({
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      documentType: z.enum(['contract', 'proposal', 'invoice', 'receipt', 'presentation', 'report', 'other']).optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [];

      if (input.contactId) conditions.push(eq(crmDocuments.contactId, input.contactId));
      if (input.companyId) conditions.push(eq(crmDocuments.companyId, input.companyId));
      if (input.dealId) conditions.push(eq(crmDocuments.dealId, input.dealId));
      if (input.documentType) conditions.push(eq(crmDocuments.documentType, input.documentType));

      if (input.search) {
        conditions.push(
          or(
            like(crmDocuments.fileName, `%${input.search}%`),
            like(crmDocuments.description, `%${input.search}%`)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (input.page - 1) * input.pageSize;

      const documents = await db
        .select()
        .from(crmDocuments)
        .where(whereClause)
        .orderBy(desc(crmDocuments.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(crmDocuments)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);

      return {
        documents,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        },
      };
    }),

  /**
   * Get document by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const document = await db.query.crmDocuments.findFirst({
        where: eq(crmDocuments.id, input.id),
      });

      if (!document) throw new Error('Document not found');

      return { document };
    }),

  /**
   * Upload document
   */
  create: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileType: z.string(),
      fileSize: z.number(),
      fileUrl: z.string(),
      documentType: z.enum(['contract', 'proposal', 'invoice', 'receipt', 'presentation', 'report', 'other']),
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
      emailMessageId: z.number().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // At least one relationship required
      if (!input.contactId && !input.companyId && !input.dealId && !input.emailMessageId) {
        throw new Error('Document must be associated with at least one entity');
      }

      const [document] = await db.insert(crmDocuments).values({
        ...input,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        uploadedBy: ctx.user.id,
      }).returning();

      return { document };
    }),

  /**
   * Update document metadata
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      documentType: z.enum(['contract', 'proposal', 'invoice', 'receipt', 'presentation', 'report', 'other']).optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { id, tags, ...data } = input;

      await db
        .update(crmDocuments)
        .set({
          ...data,
          tags: tags ? JSON.stringify(tags) : undefined,
        })
        .where(eq(crmDocuments.id, id));

      return { success: true };
    }),

  /**
   * Delete document
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // TODO: Also delete from S3

      await db
        .delete(crmDocuments)
        .where(eq(crmDocuments.id, input.id));

      return { success: true };
    }),

  /**
   * Get document statistics
   */
  getStats: protectedProcedure
    .input(z.object({
      contactId: z.number().optional(),
      companyId: z.number().optional(),
      dealId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [];
      if (input?.contactId) conditions.push(eq(crmDocuments.contactId, input.contactId));
      if (input?.companyId) conditions.push(eq(crmDocuments.companyId, input.companyId));
      if (input?.dealId) conditions.push(eq(crmDocuments.dealId, input.dealId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(crmDocuments)
        .where(whereClause);

      const sizeResult = await db
        .select({ totalSize: sql<number>`sum(${crmDocuments.fileSize})` })
        .from(crmDocuments)
        .where(whereClause);

      const byTypeResult = await db
        .select({
          documentType: crmDocuments.documentType,
          count: sql<number>`count(*)`,
        })
        .from(crmDocuments)
        .where(whereClause)
        .groupBy(crmDocuments.documentType);

      return {
        total: Number(totalResult[0]?.count || 0),
        totalSize: Number(sizeResult[0]?.totalSize || 0),
        byType: byTypeResult.reduce((acc, row) => {
          acc[row.documentType] = Number(row.count);
          return acc;
        }, {} as Record<string, number>),
      };
    }),
});
