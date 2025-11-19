import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { emailTemplates } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const emailTemplatesRouter = router({
  // List all templates
  list: protectedProcedure
    .input(z.object({
      category: z.enum([
        "follow_up",
        "quote",
        "order_confirmation",
        "shipping_update",
        "payment_reminder",
        "thank_you",
        "general"
      ]).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];
      if (input.category) {
        conditions.push(eq(emailTemplates.category, input.category));
      }
      if (input.isActive !== undefined) {
        conditions.push(eq(emailTemplates.isActive, input.isActive));
      }

      const templates = await db
        .select()
        .from(emailTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(emailTemplates.createdAt));

      return templates;
    }),

  // Get single template
  get: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      return template || null;
    }),

  // Create template
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      category: z.enum([
        "follow_up",
        "quote",
        "order_confirmation",
        "shipping_update",
        "payment_reminder",
        "thank_you",
        "general"
      ]),
      subject: z.string(),
      body: z.string(),
      variables: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(emailTemplates).values({
        name: input.name,
        description: input.description,
        category: input.category,
        subject: input.subject,
        body: input.body,
        variables: input.variables || [],
        createdBy: ctx.user.id,
      });

      return { success: true, id: result.insertId };
    }),

  // Update template
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.enum([
        "follow_up",
        "quote",
        "order_confirmation",
        "shipping_update",
        "payment_reminder",
        "thank_you",
        "general"
      ]).optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
      variables: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category) updateData.category = input.category;
      if (input.subject) updateData.subject = input.subject;
      if (input.body) updateData.body = input.body;
      if (input.variables) updateData.variables = input.variables;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      await db
        .update(emailTemplates)
        .set(updateData)
        .where(eq(emailTemplates.id, input.id));

      return { success: true };
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user is admin or template creator
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      if (template.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
        throw new Error("Not authorized to delete this template");
      }

      await db.delete(emailTemplates).where(eq(emailTemplates.id, input.id));

      return { success: true };
    }),

  // Use template (increment usage count)
  use: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(emailTemplates)
        .set({
          usageCount: emailTemplates.usageCount + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(emailTemplates.id, input.id));

      return { success: true };
    }),
});
