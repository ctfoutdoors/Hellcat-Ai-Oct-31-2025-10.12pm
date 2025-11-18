import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { syncTrackingData, syncMultipleShipments } from "../services/trackingAgent";
import { getDb } from "../db";
import { trackingScreenshots } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Tracking Agent Router
 * Endpoints for AI-powered tracking data extraction
 */
export const trackingAgentRouter = router({
  /**
   * Manually sync tracking data for a single shipment
   */
  syncSingle: protectedProcedure
    .input(
      z.object({
        shipmentId: z.number().optional(),
        trackingNumber: z.string(),
        carrier: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await syncTrackingData(input);
      return result;
    }),

  /**
   * Batch sync multiple shipments
   */
  syncBatch: protectedProcedure
    .input(
      z.object({
        shipments: z.array(
          z.object({
            shipmentId: z.number().optional(),
            trackingNumber: z.string(),
            carrier: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const results = await syncMultipleShipments(input.shipments);
      return { results };
    }),

  /**
   * Get tracking screenshot history for a shipment
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        shipmentId: z.number().optional(),
        trackingNumber: z.string().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = db.select().from(trackingScreenshots);

      if (input.shipmentId) {
        query = query.where(eq(trackingScreenshots.shipmentId, input.shipmentId)) as any;
      } else if (input.trackingNumber) {
        query = query.where(eq(trackingScreenshots.trackingNumber, input.trackingNumber)) as any;
      }

      const screenshots = await query
        .orderBy(desc(trackingScreenshots.createdAt))
        .limit(input.limit);

      return screenshots.map(screenshot => ({
        ...screenshot,
        extractedDetails: screenshot.extractedDetails
          ? JSON.parse(screenshot.extractedDetails)
          : null,
      }));
    }),

  /**
   * Get latest tracking data
   */
  getLatest: protectedProcedure
    .input(
      z.object({
        trackingNumber: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [latest] = await db
        .select()
        .from(trackingScreenshots)
        .where(eq(trackingScreenshots.trackingNumber, input.trackingNumber))
        .orderBy(desc(trackingScreenshots.createdAt))
        .limit(1);

      if (!latest) {
        return null;
      }

      return {
        ...latest,
        extractedDetails: latest.extractedDetails ? JSON.parse(latest.extractedDetails) : null,
      };
    }),

  /**
   * Get all tracking screenshots (admin view)
   */
  listAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = db.select().from(trackingScreenshots);

      if (input.status) {
        query = query.where(eq(trackingScreenshots.processingStatus, input.status)) as any;
      }

      const screenshots = await query
        .orderBy(desc(trackingScreenshots.createdAt))
        .limit(input.limit);

      return screenshots.map(screenshot => ({
        ...screenshot,
        extractedDetails: screenshot.extractedDetails
          ? JSON.parse(screenshot.extractedDetails)
          : null,
      }));
    }),
});
