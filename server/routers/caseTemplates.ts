import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { caseTemplates } from "../../drizzle/schema";
import { eq, desc, and, or, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const caseTemplatesRouter = router({
  // List all templates (user's own + public templates)
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        searchQuery: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let conditions = [
        or(
          eq(caseTemplates.createdBy, ctx.user.id),
          eq(caseTemplates.isPublic, true)
        )
      ];

      if (input?.category) {
        conditions.push(eq(caseTemplates.category, input.category));
      }

      if (input?.searchQuery) {
        conditions.push(
          or(
            like(caseTemplates.name, `%${input.searchQuery}%`),
            like(caseTemplates.description, `%${input.searchQuery}%`)
          )!
        );
      }

      const templates = await db
        .select()
        .from(caseTemplates)
        .where(and(...conditions))
        .orderBy(desc(caseTemplates.usageCount), desc(caseTemplates.createdAt));

      return templates;
    }),

  // Get template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [template] = await db
        .select()
        .from(caseTemplates)
        .where(eq(caseTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      // Check permissions
      if (!template.isPublic && template.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this template" });
      }

      return template;
    }),

  // Create new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Template name is required"),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        carrier: z.enum(["FEDEX", "UPS", "USPS", "DHL", "OTHER"]).optional(),
        caseType: z.enum(["DAMAGE", "ADJUSTMENT", "SLA"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        serviceType: z.string().optional(),
        damageType: z.enum(["TUBE", "ROD", "TIP", "BENT_EYE", "STRUCTURAL", "PACKAGING", "OTHER"]).optional(),
        damageSeverity: z.enum(["MINOR", "MODERATE", "SEVERE", "TOTAL_LOSS"]).optional(),
        templateNotes: z.string().optional(),
        disputeReasonTemplate: z.string().optional(),
        insuranceProvider: z.string().optional(),
        carrierGuarantee: z.boolean().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const tagsJson = input.tags ? JSON.stringify(input.tags) : null;

      const [newTemplate] = await db.insert(caseTemplates).values({
        ...input,
        tags: tagsJson,
        createdBy: ctx.user.id,
      });

      return { id: newTemplate.insertId, success: true };
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        carrier: z.enum(["FEDEX", "UPS", "USPS", "DHL", "OTHER"]).optional(),
        caseType: z.enum(["DAMAGE", "ADJUSTMENT", "SLA"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        serviceType: z.string().optional(),
        damageType: z.enum(["TUBE", "ROD", "TIP", "BENT_EYE", "STRUCTURAL", "PACKAGING", "OTHER"]).optional(),
        damageSeverity: z.enum(["MINOR", "MODERATE", "SEVERE", "TOTAL_LOSS"]).optional(),
        templateNotes: z.string().optional(),
        disputeReasonTemplate: z.string().optional(),
        insuranceProvider: z.string().optional(),
        carrierGuarantee: z.boolean().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check ownership
      const [template] = await db
        .select()
        .from(caseTemplates)
        .where(eq(caseTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      if (template.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own templates" });
      }

      const { id, tags, ...updateData } = input;
      const tagsJson = tags ? JSON.stringify(tags) : undefined;

      await db
        .update(caseTemplates)
        .set({
          ...updateData,
          tags: tagsJson,
          updatedAt: new Date(),
        })
        .where(eq(caseTemplates.id, id));

      return { success: true };
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check ownership
      const [template] = await db
        .select()
        .from(caseTemplates)
        .where(eq(caseTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      if (template.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own templates" });
      }

      await db.delete(caseTemplates).where(eq(caseTemplates.id, input.id));

      return { success: true };
    }),

  // Increment usage count when template is used
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [template] = await db
        .select()
        .from(caseTemplates)
        .where(eq(caseTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      await db
        .update(caseTemplates)
        .set({
          usageCount: (template.usageCount || 0) + 1,
          lastUsedAt: new Date(),
        })
        .where(eq(caseTemplates.id, input.id));

      return { success: true };
    }),

  // Get template statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const userTemplates = await db
      .select()
      .from(caseTemplates)
      .where(eq(caseTemplates.createdBy, ctx.user.id));

    const publicTemplates = await db
      .select()
      .from(caseTemplates)
      .where(eq(caseTemplates.isPublic, true));

    const totalUsage = userTemplates.reduce((sum, t) => sum + (t.usageCount || 0), 0);

    return {
      totalTemplates: userTemplates.length,
      publicTemplates: publicTemplates.length,
      totalUsage,
      mostUsed: userTemplates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0] || null,
    };
  }),
});
