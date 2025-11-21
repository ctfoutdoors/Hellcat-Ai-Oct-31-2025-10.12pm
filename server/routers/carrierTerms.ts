import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { carrierTerms } from "../../drizzle/schema";
import { desc, sql, eq, and } from "drizzle-orm";

export const carrierTermsRouter = router({
  /**
   * List all carrier terms
   * Optionally filter by carrier or term type
   */
  list: protectedProcedure
    .input(
      z.object({
        carrier: z.string().optional(),
        termType: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let conditions = [sql`${carrierTerms.isActive} = true`];

      if (input?.carrier) {
        conditions.push(sql`${carrierTerms.carrier} = ${input.carrier}`);
      }

      if (input?.termType) {
        conditions.push(sql`${carrierTerms.termType} = ${input.termType}`);
      }

      const results = await db
        .select()
        .from(carrierTerms)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(carrierTerms.carrier, carrierTerms.termType)
        .limit(input?.limit || 50);

      return results;
    }),

  /**
   * List carrier terms by specific carrier
   */
  listByCarrier: protectedProcedure
    .input(
      z.object({
        carrier: z.string(),
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
        .from(carrierTerms)
        .where(
          sql`${carrierTerms.isActive} = true AND ${carrierTerms.carrier} = ${input.carrier}`
        )
        .orderBy(carrierTerms.termType);

      // Filter by claim type if provided
      if (input.claimType) {
        return results.filter(term => {
          const applicableTypes = term.applicableClaimTypes as string[] | null;
          return applicableTypes && applicableTypes.includes(input.claimType!);
        });
      }

      return results;
    }),

  /**
   * Get carrier terms by type
   */
  getByType: protectedProcedure
    .input(
      z.object({
        termType: z.string(),
        carrier: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let conditions = [
        sql`${carrierTerms.isActive} = true`,
        sql`${carrierTerms.termType} = ${input.termType}`,
      ];

      if (input.carrier) {
        conditions.push(sql`${carrierTerms.carrier} = ${input.carrier}`);
      }

      const results = await db
        .select()
        .from(carrierTerms)
        .where(sql.join(conditions, sql` AND `))
        .orderBy(carrierTerms.carrier);

      return results;
    }),

  /**
   * Get a single carrier term by ID
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
        .from(carrierTerms)
        .where(sql`${carrierTerms.id} = ${input.id}`)
        .limit(1);

      return results[0] || null;
    }),

  /**
   * Get all available carriers
   */
  getCarriers: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const results = await db
      .selectDistinct({ carrier: carrierTerms.carrier })
      .from(carrierTerms)
      .where(sql`${carrierTerms.isActive} = true`)
      .orderBy(carrierTerms.carrier);

    return results.map(r => r.carrier);
  }),

  /**
   * Get all term types
   */
  getTermTypes: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const results = await db
      .selectDistinct({ termType: carrierTerms.termType })
      .from(carrierTerms)
      .where(sql`${carrierTerms.isActive} = true`)
      .orderBy(carrierTerms.termType);

    return results.map(r => r.termType);
  }),

  /**
   * Increment usage count for a carrier term
   */
  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(carrierTerms)
        .set({
          usageCount: sql`${carrierTerms.usageCount} + 1`,
        })
        .where(sql`${carrierTerms.id} = ${input.id}`);

      return { success: true };
    }),
});
