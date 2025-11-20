import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getOverallMetrics, getCarrierMetrics, getCaseTypeMetrics } from "../services/caseAnalytics";

export const analyticsRouter = router({
  /**
   * Get overall analytics metrics
   */
  getOverallMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      carrier: z.string().optional(),
      caseType: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const filters = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        carrier: input.carrier,
        caseType: input.caseType,
        status: input.status,
      };

      return await getOverallMetrics(filters);
    }),

  /**
   * Get metrics by carrier
   */
  getCarrierMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      caseType: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const filters = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        caseType: input.caseType,
      };

      return await getCarrierMetrics(filters);
    }),

  /**
   * Get metrics by case type
   */
  getCaseTypeMetrics: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      carrier: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const filters = {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        carrier: input.carrier,
      };

      return await getCaseTypeMetrics(filters);
    }),
});
