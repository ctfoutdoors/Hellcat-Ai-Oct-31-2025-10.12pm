import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { legalReferences } from "../../drizzle/schema";
import { desc, sql, or, like } from "drizzle-orm";

export const legalReferencesRouter = router({
  /**
   * List all legal references
   * Optionally filter by claim type or carrier
   */
  list: protectedProcedure
    .input(
      z.object({
        claimType: z.string().optional(),
        carrier: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = db.select().from(legalReferences);

      // Filter by active status
      query = query.where(sql`${legalReferences.isActive} = true`);

      // Order by relevance score descending
      query = query.orderBy(desc(legalReferences.relevanceScore));

      // Apply limit
      if (input?.limit) {
        query = query.limit(input.limit);
      }

      const results = await query;

      // Client-side filtering for JSON fields (since Drizzle doesn't support JSON queries well)
      let filtered = results;
      
      if (input?.claimType) {
        filtered = filtered.filter(ref => {
          const applicableTypes = ref.applicableClaimTypes as string[] | null;
          return applicableTypes && applicableTypes.includes(input.claimType!);
        });
      }

      if (input?.carrier) {
        filtered = filtered.filter(ref => {
          const applicableCarriers = ref.applicableCarriers as string[] | null;
          return !applicableCarriers || applicableCarriers.length === 0 || applicableCarriers.includes(input.carrier!);
        });
      }

      return filtered;
    }),

  /**
   * Search legal references by keyword
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const searchTerm = `%${input.query}%`;

      const results = await db
        .select()
        .from(legalReferences)
        .where(
          sql`${legalReferences.isActive} = true AND (
            ${legalReferences.citation} LIKE ${searchTerm} OR
            ${legalReferences.title} LIKE ${searchTerm} OR
            ${legalReferences.summary} LIKE ${searchTerm}
          )`
        )
        .orderBy(desc(legalReferences.relevanceScore))
        .limit(input.limit);

      return results;
    }),

  /**
   * Get legal references by relevance threshold
   */
  getByRelevance: protectedProcedure
    .input(
      z.object({
        minRelevance: z.number().min(0).max(100).default(70),
        claimType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const results = await db
        .select()
        .from(legalReferences)
        .where(
          sql`${legalReferences.isActive} = true AND ${legalReferences.relevanceScore} >= ${input.minRelevance}`
        )
        .orderBy(desc(legalReferences.relevanceScore));

      // Filter by claim type if provided
      if (input.claimType) {
        return results.filter(ref => {
          const applicableTypes = ref.applicableClaimTypes as string[] | null;
          return applicableTypes && applicableTypes.includes(input.claimType!);
        });
      }

      return results;
    }),

  /**
   * Get a single legal reference by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const results = await db
        .select()
        .from(legalReferences)
        .where(sql`${legalReferences.id} = ${input.id}`)
        .limit(1);

      return results[0] || null;
    }),

  /**
   * Increment usage count for a legal reference
   */
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(legalReferences)
        .set({
          usageCount: sql`${legalReferences.usageCount} + 1`,
        })
        .where(sql`${legalReferences.id} = ${input.id}`);

      return { success: true };
    }),
});
