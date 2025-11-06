import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { emailThreads, emailMessages, crmEmailTemplates } from '../../drizzle/schema';
import { eq, and, or, like, desc, asc, sql } from 'drizzle-orm';

export const crmEmailRouter = router({
  
  // ============================================================================
  // EMAIL THREADS
  // ============================================================================
  
  threads: router({
    /**
     * List email threads with filtering
     */
    list: protectedProcedure
      .input(z.object({
        contactId: z.number().optional(),
        companyId: z.number().optional(),
        dealId: z.number().optional(),
        status: z.enum(['active', 'archived', 'spam']).optional(),
        isRead: z.boolean().optional(),
        isStarred: z.boolean().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const conditions = [];

        if (input.contactId) conditions.push(eq(emailThreads.contactId, input.contactId));
        if (input.companyId) conditions.push(eq(emailThreads.companyId, input.companyId));
        if (input.dealId) conditions.push(eq(emailThreads.dealId, input.dealId));
        if (input.status) conditions.push(eq(emailThreads.status, input.status));
        if (input.isRead !== undefined) conditions.push(eq(emailThreads.isRead, input.isRead));
        if (input.isStarred !== undefined) conditions.push(eq(emailThreads.isStarred, input.isStarred));

        if (input.search) {
          conditions.push(like(emailThreads.subject, `%${input.search}%`));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const offset = (input.page - 1) * input.pageSize;

        const threads = await db
          .select()
          .from(emailThreads)
          .where(whereClause)
          .orderBy(desc(emailThreads.lastMessageAt))
          .limit(input.pageSize)
          .offset(offset);

        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(emailThreads)
          .where(whereClause);

        const total = Number(countResult[0]?.count || 0);

        return {
          threads,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages: Math.ceil(total / input.pageSize),
          },
        };
      }),

    /**
     * Get thread by ID with messages
     */
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const thread = await db.query.emailThreads.findFirst({
          where: eq(emailThreads.id, input.id),
        });

        if (!thread) throw new Error('Thread not found');

        const messages = await db
          .select()
          .from(emailMessages)
          .where(eq(emailMessages.threadId, input.id))
          .orderBy(asc(emailMessages.createdAt));

        return {
          thread,
          messages,
        };
      }),

    /**
     * Create new thread
     */
    create: protectedProcedure
      .input(z.object({
        subject: z.string(),
        contactId: z.number().optional(),
        companyId: z.number().optional(),
        dealId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const [thread] = await db.insert(emailThreads).values({
          ...input,
          messageCount: 0,
        }).returning();

        return { thread };
      }),

    /**
     * Update thread
     */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        isRead: z.boolean().optional(),
        isStarred: z.boolean().optional(),
        status: z.enum(['active', 'archived', 'spam']).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const { id, ...data } = input;

        await db
          .update(emailThreads)
          .set(data)
          .where(eq(emailThreads.id, id));

        return { success: true };
      }),
  }),

  // ============================================================================
  // EMAIL MESSAGES
  // ============================================================================

  messages: router({
    /**
     * Send email message
     */
    send: protectedProcedure
      .input(z.object({
        threadId: z.number().optional(),
        subject: z.string(),
        toEmails: z.array(z.string().email()),
        ccEmails: z.array(z.string().email()).optional(),
        bccEmails: z.array(z.string().email()).optional(),
        bodyHtml: z.string(),
        bodyText: z.string().optional(),
        contactId: z.number().optional(),
        companyId: z.number().optional(),
        dealId: z.number().optional(),
        attachmentUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        let threadId = input.threadId;

        // Create thread if doesn't exist
        if (!threadId) {
          const [thread] = await db.insert(emailThreads).values({
            subject: input.subject,
            contactId: input.contactId,
            companyId: input.companyId,
            dealId: input.dealId,
            messageCount: 0,
            participants: JSON.stringify([...input.toEmails, ctx.user.email]),
          }).returning();

          threadId = thread.id;
        }

        // Create message
        const [message] = await db.insert(emailMessages).values({
          threadId,
          subject: input.subject,
          fromEmail: ctx.user.email || 'unknown@example.com',
          fromName: ctx.user.name || 'Unknown',
          toEmails: JSON.stringify(input.toEmails),
          ccEmails: input.ccEmails ? JSON.stringify(input.ccEmails) : null,
          bccEmails: input.bccEmails ? JSON.stringify(input.bccEmails) : null,
          bodyHtml: input.bodyHtml,
          bodyText: input.bodyText,
          direction: 'outbound',
          userId: ctx.user.id,
          hasAttachments: (input.attachmentUrls?.length || 0) > 0,
          attachmentUrls: input.attachmentUrls ? JSON.stringify(input.attachmentUrls) : null,
          sentAt: new Date(),
        }).returning();

        // Update thread
        await db
          .update(emailThreads)
          .set({
            messageCount: sql`${emailThreads.messageCount} + 1`,
            lastMessageAt: new Date(),
          })
          .where(eq(emailThreads.id, threadId));

        // TODO: Actually send email via email service (SendGrid, AWS SES, etc.)

        return { message, threadId };
      }),

    /**
     * Mark message as read
     */
    markRead: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(emailMessages)
          .set({ isRead: true })
          .where(eq(emailMessages.id, input.id));

        return { success: true };
      }),
  }),

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  templates: router({
    /**
     * List templates
     */
    list: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const conditions = [];

        // Show user's templates + shared templates
        conditions.push(
          or(
            eq(crmEmailTemplates.createdBy, ctx.user.id),
            eq(crmEmailTemplates.isShared, true)
          )
        );

        if (input?.category) {
          conditions.push(eq(crmEmailTemplates.category, input.category));
        }

        if (input?.search) {
          conditions.push(
            or(
              like(crmEmailTemplates.name, `%${input.search}%`),
              like(crmEmailTemplates.subject, `%${input.search}%`)
            )
          );
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const templates = await db
          .select()
          .from(crmEmailTemplates)
          .where(whereClause)
          .orderBy(desc(crmEmailTemplates.lastUsedAt));

        return { templates };
      }),

    /**
     * Get template by ID
     */
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const template = await db.query.crmEmailTemplates.findFirst({
          where: eq(crmEmailTemplates.id, input.id),
        });

        if (!template) throw new Error('Template not found');

        return { template };
      }),

    /**
     * Create template
     */
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        subject: z.string(),
        bodyHtml: z.string(),
        bodyText: z.string().optional(),
        category: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isShared: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const [template] = await db.insert(crmEmailTemplates).values({
          ...input,
          variables: input.variables ? JSON.stringify(input.variables) : null,
          createdBy: ctx.user.id,
        }).returning();

        return { template };
      }),

    /**
     * Update template
     */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        bodyHtml: z.string().optional(),
        bodyText: z.string().optional(),
        category: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isShared: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const { id, variables, ...data } = input;

        await db
          .update(crmEmailTemplates)
          .set({
            ...data,
            variables: variables ? JSON.stringify(variables) : undefined,
          })
          .where(eq(crmEmailTemplates.id, id));

        return { success: true };
      }),

    /**
     * Delete template
     */
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Only allow deleting own templates
        await db
          .delete(crmEmailTemplates)
          .where(
            and(
              eq(crmEmailTemplates.id, input.id),
              eq(crmEmailTemplates.createdBy, ctx.user.id)
            )
          );

        return { success: true };
      }),

    /**
     * Use template (increment usage counter)
     */
    use: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        await db
          .update(crmEmailTemplates)
          .set({
            useCount: sql`${crmEmailTemplates.useCount} + 1`,
            lastUsedAt: new Date(),
          })
          .where(eq(crmEmailTemplates.id, input.id));

        return { success: true };
      }),
  }),
});
