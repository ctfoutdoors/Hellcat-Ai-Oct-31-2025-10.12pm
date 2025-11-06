import { z } from "zod";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { letterTemplates, templateVersions, templateShares } from "../../drizzle/schema";

export const templatesRouter = router({
  // List templates with filters
  list: protectedProcedure
    .input(
      z.object({
        category: z.enum(["initial_dispute", "follow_up", "escalation", "final_demand", "resolution"]).optional(),
        carrier: z.enum(["FEDEX", "UPS", "USPS", "DHL", "ALL"]).optional(),
        isPublic: z.boolean().optional(),
        isFavorite: z.boolean().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [
        isNull(letterTemplates.deletedAt),
        // User can see their own templates or public templates
        sql`(${letterTemplates.createdBy} = ${ctx.user.id} OR ${letterTemplates.isPublic} = true)`,
      ];

      if (input?.category) {
        conditions.push(eq(letterTemplates.category, input.category));
      }
      if (input?.carrier) {
        conditions.push(eq(letterTemplates.carrier, input.carrier));
      }
      if (input?.isFavorite !== undefined) {
        conditions.push(eq(letterTemplates.isFavorite, input.isFavorite));
      }
      if (input?.search) {
        conditions.push(
          sql`(${letterTemplates.name} LIKE ${`%${input.search}%`} OR ${letterTemplates.description} LIKE ${`%${input.search}%`})`
        );
      }

      const templates = await db
        .select()
        .from(letterTemplates)
        .where(and(...conditions))
        .orderBy(desc(letterTemplates.updatedAt));

      return templates;
    }),

  // Get template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(letterTemplates)
        .where(
          and(
            eq(letterTemplates.id, input.id),
            isNull(letterTemplates.deletedAt)
          )
        )
        .limit(1);

      if (!template) {
        throw new Error("Template not found");
      }

      // Check permissions
      if (template.createdBy !== ctx.user.id && !template.isPublic) {
        throw new Error("Access denied");
      }

      return template;
    }),

  // Create new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        content: z.string().min(1),
        category: z.enum(["initial_dispute", "follow_up", "escalation", "final_demand", "resolution"]),
        carrier: z.enum(["FEDEX", "UPS", "USPS", "DHL", "ALL"]).optional(),
        caseType: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().default(false),
        isFavorite: z.boolean().default(false),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db.insert(letterTemplates).values({
        ...input,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        createdBy: ctx.user.id,
        version: 1,
      });

      return { id: template.insertId };
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        content: z.string().min(1).optional(),
        category: z.enum(["initial_dispute", "follow_up", "escalation", "final_demand", "resolution"]).optional(),
        carrier: z.enum(["FEDEX", "UPS", "USPS", "DHL", "ALL"]).optional(),
        caseType: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
        isFavorite: z.boolean().optional(),
        isDefault: z.boolean().optional(),
        saveAsVersion: z.boolean().default(false),
        versionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [existing] = await db
        .select()
        .from(letterTemplates)
        .where(eq(letterTemplates.id, input.id))
        .limit(1);

      if (!existing || existing.createdBy !== ctx.user.id) {
        throw new Error("Access denied");
      }

      // Save version if requested
      if (input.saveAsVersion && input.content) {
        await db.insert(templateVersions).values({
          templateId: input.id,
          version: existing.version,
          content: existing.content,
          changeNotes: input.versionNotes || null,
          createdBy: ctx.user.id,
        });
      }

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.content) {
        updateData.content = input.content;
        if (input.saveAsVersion) {
          updateData.version = existing.version + 1;
        }
      }
      if (input.category) updateData.category = input.category;
      if (input.carrier !== undefined) updateData.carrier = input.carrier;
      if (input.caseType !== undefined) updateData.caseType = input.caseType;
      if (input.tags) updateData.tags = JSON.stringify(input.tags);
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
      if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;
      if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

      await db
        .update(letterTemplates)
        .set(updateData)
        .where(eq(letterTemplates.id, input.id));

      return { success: true };
    }),

  // Delete template (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [existing] = await db
        .select()
        .from(letterTemplates)
        .where(eq(letterTemplates.id, input.id))
        .limit(1);

      if (!existing || existing.createdBy !== ctx.user.id) {
        throw new Error("Access denied");
      }

      await db
        .update(letterTemplates)
        .set({ deletedAt: new Date() })
        .where(eq(letterTemplates.id, input.id));

      return { success: true };
    }),

  // Duplicate template
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db
        .select()
        .from(letterTemplates)
        .where(eq(letterTemplates.id, input.id))
        .limit(1);

      if (!existing) {
        throw new Error("Template not found");
      }

      // Check permissions
      if (existing.createdBy !== ctx.user.id && !existing.isPublic) {
        throw new Error("Access denied");
      }

      const [newTemplate] = await db.insert(letterTemplates).values({
        name: `${existing.name} (Copy)`,
        description: existing.description,
        content: existing.content,
        category: existing.category,
        carrier: existing.carrier,
        caseType: existing.caseType,
        tags: existing.tags,
        isPublic: false, // Copies are always private
        isFavorite: false,
        isDefault: false,
        version: 1,
        createdBy: ctx.user.id,
      });

      return { id: newTemplate.insertId };
    }),

  // Get template versions
  getVersions: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check access
      const [template] = await db
        .select()
        .from(letterTemplates)
        .where(eq(letterTemplates.id, input.templateId))
        .limit(1);

      if (!template || (template.createdBy !== ctx.user.id && !template.isPublic)) {
        throw new Error("Access denied");
      }

      const versions = await db
        .select()
        .from(templateVersions)
        .where(eq(templateVersions.templateId, input.templateId))
        .orderBy(desc(templateVersions.version));

      return versions;
    }),

  // Restore version
  restoreVersion: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        versionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [template] = await db
        .select()
        .from(letterTemplates)
        .where(eq(letterTemplates.id, input.templateId))
        .limit(1);

      if (!template || template.createdBy !== ctx.user.id) {
        throw new Error("Access denied");
      }

      const [version] = await db
        .select()
        .from(templateVersions)
        .where(eq(templateVersions.id, input.versionId))
        .limit(1);

      if (!version) {
        throw new Error("Version not found");
      }

      // Save current version before restoring
      await db.insert(templateVersions).values({
        templateId: input.templateId,
        version: template.version,
        content: template.content,
        changeNotes: "Auto-saved before restore",
        createdBy: ctx.user.id,
      });

      // Restore version
      await db
        .update(letterTemplates)
        .set({
          content: version.content,
          version: template.version + 1,
        })
        .where(eq(letterTemplates.id, input.templateId));

      return { success: true };
    }),

  // Toggle favorite
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(letterTemplates)
        .where(eq(letterTemplates.id, input.id))
        .limit(1);

      if (!template || template.createdBy !== ctx.user.id) {
        throw new Error("Access denied");
      }

      await db
        .update(letterTemplates)
        .set({ isFavorite: !template.isFavorite })
        .where(eq(letterTemplates.id, input.id));

      return { isFavorite: !template.isFavorite };
    }),

  // Increment usage count
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(letterTemplates)
        .set({ usageCount: sql`${letterTemplates.usageCount} + 1` })
        .where(eq(letterTemplates.id, input.id));

      return { success: true };
    }),
});
