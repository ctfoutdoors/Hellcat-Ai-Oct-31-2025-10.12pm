import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { CustomerIdentityResolver } from "../services/CustomerIdentityResolver";
import { ReamazeService } from "../services/ReamazeService";
import { KlaviyoService } from "../services/KlaviyoService";
import { OrderSourceService } from "../services/OrderSourceService";
import { CustomerRiskScoring } from "../services/CustomerRiskScoring";
import { getDb } from "../db";
import { dataEnrichmentLogs, InsertDataEnrichmentLog } from "../../drizzle/schema";

/**
 * Data Enrichment tRPC Router
 * 
 * Orchestrates multi-source data fetching for dynamic case creation
 */

export const dataEnrichmentRouter = router({
  /**
   * Enrich case data by tracking number
   * This is the main orchestration endpoint
   */
  enrichByTracking: protectedProcedure
    .input(
      z.object({
        trackingNumber: z.string(),
        skipSteps: z.array(z.enum(["shipstation", "order_source", "customer", "reamaze", "klaviyo", "risk_score"])).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const startTime = Date.now();
      const enrichmentData: any = {
        trackingNumber: input.trackingNumber,
        steps: {},
        errors: {},
      };

      try {
        // Step 1: Fetch from ShipStation
        if (!input.skipSteps?.includes("shipstation")) {
          try {
            enrichmentData.steps.shipstation = { status: "loading" };
            
            // TODO: Integrate with existing ShipStation service
            const shipstationData = await this.fetchShipStationData(input.trackingNumber);
            
            enrichmentData.steps.shipstation = {
              status: "success",
              data: shipstationData,
            };
          } catch (error: any) {
            enrichmentData.steps.shipstation = {
              status: "error",
              error: error.message,
            };
            enrichmentData.errors.shipstation = error.message;
          }
        }

        // Step 2: Fetch order source (WooCommerce, Amazon, etc.)
        if (!input.skipSteps?.includes("order_source")) {
          try {
            enrichmentData.steps.order_source = { status: "loading" };
            
            const orderData = await OrderSourceService.fetchOrderByTracking(input.trackingNumber);
            
            enrichmentData.steps.order_source = {
              status: orderData ? "success" : "not_found",
              data: orderData,
            };
          } catch (error: any) {
            enrichmentData.steps.order_source = {
              status: "error",
              error: error.message,
            };
            enrichmentData.errors.order_source = error.message;
          }
        }

        // Extract customer email from available data
        const customerEmail =
          enrichmentData.steps.order_source?.data?.customerEmail ||
          enrichmentData.steps.shipstation?.data?.customerEmail;

        if (!customerEmail) {
          throw new Error("Could not determine customer email from tracking data");
        }

        // Step 3: Resolve customer identity
        if (!input.skipSteps?.includes("customer")) {
          try {
            enrichmentData.steps.customer = { status: "loading" };
            
            const identityResult = await CustomerIdentityResolver.findOrCreate(
              {
                email: customerEmail,
                name: enrichmentData.steps.order_source?.data?.customerName,
                phone: enrichmentData.steps.order_source?.data?.customerPhone,
                address: enrichmentData.steps.order_source?.data?.shippingAddress,
              },
              ctx.user.id
            );
            
            enrichmentData.steps.customer = {
              status: "success",
              data: {
                identity: identityResult.identity,
                isNew: identityResult.isNew,
                matches: identityResult.matches,
              },
            };
          } catch (error: any) {
            enrichmentData.steps.customer = {
              status: "error",
              error: error.message,
            };
            enrichmentData.errors.customer = error.message;
          }
        }

        const customerIdentityId = enrichmentData.steps.customer?.data?.identity?.id;

        // Step 4: Fetch Reamaze support tickets
        if (!input.skipSteps?.includes("reamaze") && customerEmail) {
          try {
            enrichmentData.steps.reamaze = { status: "loading" };
            
            const reamazeData = await ReamazeService.fetchCustomerTickets(customerEmail);
            
            enrichmentData.steps.reamaze = {
              status: "success",
              data: {
                tickets: reamazeData.tickets,
                stats: reamazeData.stats,
              },
            };
          } catch (error: any) {
            enrichmentData.steps.reamaze = {
              status: "error",
              error: error.message,
            };
            enrichmentData.errors.reamaze = error.message;
          }
        }

        // Step 5: Fetch Klaviyo profile and reviews
        if (!input.skipSteps?.includes("klaviyo") && customerEmail) {
          try {
            enrichmentData.steps.klaviyo = { status: "loading" };
            
            const klaviyoData = await KlaviyoService.fetchCustomerProfile(customerEmail);
            
            enrichmentData.steps.klaviyo = {
              status: klaviyoData.profile ? "success" : "not_found",
              data: {
                profile: klaviyoData.profile,
                reviews: klaviyoData.reviews,
                stats: klaviyoData.stats,
              },
            };
          } catch (error: any) {
            enrichmentData.steps.klaviyo = {
              status: "error",
              error: error.message,
            };
            enrichmentData.errors.klaviyo = error.message;
          }
        }

        // Step 6: Calculate risk score
        if (!input.skipSteps?.includes("risk_score") && customerIdentityId && customerEmail) {
          try {
            enrichmentData.steps.risk_score = { status: "loading" };
            
            const riskScore = await CustomerRiskScoring.calculateRiskScore(
              customerIdentityId,
              customerEmail
            );
            
            enrichmentData.steps.risk_score = {
              status: "success",
              data: riskScore,
            };
          } catch (error: any) {
            enrichmentData.steps.risk_score = {
              status: "error",
              error: error.message,
            };
            enrichmentData.errors.risk_score = error.message;
          }
        }

        // Log enrichment
        const duration = Date.now() - startTime;
        await this.logEnrichment({
          operation: "enrich_by_tracking",
          source: "multi",
          status: Object.keys(enrichmentData.errors).length === 0 ? "success" : "partial",
          dataFetched: JSON.stringify(enrichmentData),
          durationMs: duration,
          triggeredBy: ctx.user.id,
          customerIdentityId,
        });

        return {
          success: true,
          data: enrichmentData,
          duration,
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        await this.logEnrichment({
          operation: "enrich_by_tracking",
          source: "multi",
          status: "failed",
          errorMessage: error.message,
          durationMs: duration,
          triggeredBy: ctx.user.id,
        });

        throw error;
      }
    }),

  /**
   * Get customer profile with all enriched data
   */
  getCustomerProfile: protectedProcedure
    .input(z.object({ customerEmail: z.string().email() }))
    .query(async ({ input }) => {
      // Find customer identity
      const identityResult = await CustomerIdentityResolver.findOrCreate(
        { email: input.customerEmail },
        1 // System user
      );

      if (!identityResult.identity) {
        return null;
      }

      // Fetch all data sources
      const [reamazeData, klaviyoData, riskScore] = await Promise.all([
        ReamazeService.getCachedTickets(input.customerEmail),
        KlaviyoService.getCachedProfile(input.customerEmail),
        CustomerRiskScoring.getCachedRiskScore(identityResult.identity.id),
      ]);

      return {
        identity: identityResult.identity,
        reamaze: reamazeData,
        klaviyo: klaviyoData,
        riskScore,
      };
    }),

  /**
   * Fetch ShipStation data helper
   */
  fetchShipStationData: async (trackingNumber: string) => {
    // TODO: Integrate with existing ShipStation service
    // For now, return placeholder
    return {
      trackingNumber,
      carrier: "FedEx",
      serviceCode: "fedex_2day",
      shipDate: new Date(),
      estimatedDelivery: new Date(),
    };
  },

  /**
   * Log enrichment operation
   */
  logEnrichment: async (data: Omit<InsertDataEnrichmentLog, "id" | "createdAt">) => {
    const db = await getDb();
    if (!db) return;

    await db.insert(dataEnrichmentLogs).values({
      ...data,
      createdAt: new Date(),
    });
  },
});
