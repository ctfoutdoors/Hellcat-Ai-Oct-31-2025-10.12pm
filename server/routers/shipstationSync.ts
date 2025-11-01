import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { ShipStationSyncService } from "../services/shipstationSync";

export const shipstationSyncRouter = router({
  /**
   * Detect potential dimensional weight adjustments
   */
  detectAdjustments: publicProcedure
    .input(z.object({ daysBack: z.number().default(7) }))
    .query(async ({ input }) => {
      const adjustments = await ShipStationSyncService.detectDimensionalWeightAdjustments(
        input.daysBack
      );
      
      return {
        success: true,
        count: adjustments.length,
        adjustments,
      };
    }),

  /**
   * Auto-create draft cases for detected adjustments
   */
  autoCreateCases: publicProcedure
    .input(z.object({ daysBack: z.number().default(7) }))
    .mutation(async ({ input }) => {
      const caseIds = await ShipStationSyncService.autoCreateDraftCases(input.daysBack);
      
      return {
        success: true,
        casesCreated: caseIds.length,
        caseIds,
      };
    }),

  /**
   * Run daily sync manually
   */
  runDailySync: publicProcedure.mutation(async () => {
    return await ShipStationSyncService.runDailySync();
  }),

  /**
   * Fetch recent shipments from ShipStation
   */
  fetchShipments: publicProcedure
    .input(z.object({ daysBack: z.number().default(7) }))
    .query(async ({ input }) => {
      const shipments = await ShipStationSyncService.fetchRecentShipments(input.daysBack);
      
      return {
        success: true,
        count: shipments.length,
        shipments,
      };
    }),

  /**
   * Get sync history
   */
  getSyncHistory: publicProcedure.query(async () => {
    return await ShipStationSyncService.getSyncHistory();
  }),

  /**
   * Get latest sync status
   */
  getLatestSync: publicProcedure.query(async () => {
    return await ShipStationSyncService.getLatestSync();
  }),

  /**
   * Manually trigger sync with history tracking
   */
  syncShipments: publicProcedure.mutation(async () => {
    return await ShipStationSyncService.runDailySync();
  }),
});
