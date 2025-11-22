import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

/**
 * HELLCAT AI V4 - CARRIER DISPUTE CLAIMS MANAGEMENT SYSTEM
 * tRPC API Routers
 * 
 * Routers will be added incrementally as we build each phase:
 * - Phase 3: Cases module routers
 * - Phase 4: Evidence upload & OCR routers
 * - Phase 5: AI dispute letter routers
 * - Phase 6: ShipStation integration routers
 * - Phase 7: Gmail monitoring routers
 * - Phase 8: Inventory & PO routers
 * - Phase 9: CRM routers
 * - Phase 10: AI predictions routers
 * - Phase 11: Voice commands routers
 * - Phase 12: Analytics & reporting routers
 */

import { createShipStationClient } from './integrations/shipstation';
import { monitorCarrierEmails, getGmailMonitoringStatus } from './integrations/gmail';
import { getStampsCredentials, getBalanceReportURL, authenticateStamps, getStampsURL } from './stampscom';
import type { URLType } from './stampscom';
import { integrationsRouter } from './routers/integrations';
import { storesRouter } from './routers/stores';
import { crmRouter } from './routers/crm';
import { intelligenceRouter } from './routers/intelligence';
import { poRouter } from './routers/po';
import { trackingAgentRouter } from './routers/trackingAgent';
import { crmComponentsRouter } from './routers/crmComponents';
import { calendarRouter } from "./routers/calendar";
import { attachmentsRouter } from "./routers/attachments";
import { emailTemplatesRouter } from "./routers/emailTemplates";
import { woocommerceRouter } from "./routers/woocommerce";
import { shipstationRouter } from "./routers/shipstation";
import { ordersRouter } from "./routers/orders";
import { productSyncRouter } from "./routers/productSync";
import { dashboardRouter } from "./routers/dashboard";
import { casesRouter } from "./routers/cases";
import { analyticsRouter } from "./routers/analytics";
import { legalReferencesRouter } from "./routers/legalReferences";
import { carrierTermsRouter } from "./routers/carrierTerms";
import { aiAgentsRouter } from "./routers/aiAgents";
import { woocommerceImportRouter } from "./routers/woocommerceImport";


export const appRouter = router({
  integrations: integrationsRouter,
  stores: storesRouter,
  crm: crmRouter,
  crmComponents: crmComponentsRouter,
  intelligence: intelligenceRouter,
  po: poRouter,
  trackingAgent: trackingAgentRouter,
  calendar: calendarRouter,
  attachments: attachmentsRouter,
  emailTemplates: emailTemplatesRouter,
  woocommerce: woocommerceRouter,
  shipstation: shipstationRouter,
  orders: ordersRouter,
  productSync: productSyncRouter,
  dashboard: dashboardRouter,
  cases: casesRouter,
  analytics: analyticsRouter,
  legalReferences: legalReferencesRouter,
  carrierTerms: carrierTermsRouter,
  aiAgents: aiAgentsRouter,
  woocommerceImport: woocommerceImportRouter,
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Email Accounts Management
  emailAccounts: router({
    list: protectedProcedure
      .query(async () => {
        return await db.listEmailAccounts();
      }),
    
    getPrimary: protectedProcedure
      .query(async () => {
        return await db.getPrimaryEmailAccount();
      }),
    
    create: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        displayName: z.string().optional(),
        provider: z.string(),
        isPrimary: z.boolean().optional(),
        mcpServerName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createEmailAccount({
          ...input,
          isActive: true,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        email: z.string().email().optional(),
        displayName: z.string().optional(),
        isPrimary: z.boolean().optional(),
        isActive: z.boolean().optional(),
        mcpServerName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return await db.updateEmailAccount(id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEmailAccount(input.id);
        return { success: true };
      }),
    
    setPrimary: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.setPrimaryEmailAccount(input.id);
        return { success: true };
      }),
  }),

  // Gmail Monitoring
  gmail: router({
    monitorEmails: protectedProcedure
      .mutation(async ({ ctx }) => {
        const exceptions = await monitorCarrierEmails(7);
        const created = await db.createCasesFromGmailExceptions(exceptions);
        
        return {
          success: true,
          casesCreated: created.length,
          exceptionsFound: exceptions.length,
        };
      }),
      
    getStatus: protectedProcedure
      .query(async () => {
        return await getGmailMonitoringStatus();
      }),
  }),
  
  // ShipStation Integration
  shipstation: router({
    testConnection: protectedProcedure
      .query(async () => {
        const { testShipStationConnection } = await import('./integrations/shipstation');
        return await testShipStationConnection();
      }),
      
    syncOrders: protectedProcedure
      .input(z.object({ daysBack: z.number().optional().default(30) }))
      .mutation(async ({ input }) => {
        const { syncOrdersFromShipStation } = await import('./db-shipstation-sync');
        return await syncOrdersFromShipStation(input.daysBack);
      }),
      
    syncShipments: protectedProcedure
      .input(z.object({ daysBack: z.number().optional().default(30) }))
      .mutation(async ({ input }) => {
        const { syncShipmentsFromShipStation } = await import('./db-shipment-sync');
        return await syncShipmentsFromShipStation(input.daysBack);
      }),
      
    getStatus: protectedProcedure
      .query(async () => {
        const { getShipStationSyncStatus } = await import('./db-shipstation-sync');
        return await getShipStationSyncStatus();
      }),
      
    getShipmentStats: protectedProcedure
      .query(async () => {
        const { getShipmentSyncStats } = await import('./db-shipment-sync');
        return await getShipmentSyncStats();
      }),
  }),
  
  // Stamps.com API Integration
  stampscom: router({
    // Get authenticated URL to Balance and Transaction Report
    getBalanceReportURL: protectedProcedure
      .query(async () => {
        try {
          const credentials = getStampsCredentials();
          const url = await getBalanceReportURL(credentials);
          return { success: true, url };
        } catch (error: any) {
          return { 
            success: false, 
            error: error.message || 'Failed to get Balance Report URL'
          };
        }
      }),
    
    // Get authenticated URL to any Stamps.com page
    getURL: protectedProcedure
      .input(z.object({
        urlType: z.enum([
          'HomePage',
          'AccountSettingsPage',
          'EditCostCodesPage',
          'OnlineReportsPage',
          'HelpPage',
          'OnlineReportingHistory',
          'OnlineReportingRefund',
          'OnlineReportingPickup',
          'OnlineReportingSCAN',
          'OnlineReportingClaim',
          'ReportsBalances',
          'ReportsExpenses',
          'ReportsPrints',
        ] as const),
      }))
      .query(async ({ input }) => {
        try {
          const credentials = getStampsCredentials();
          const { authenticator } = await authenticateStamps(credentials);
          const { url } = await getStampsURL(authenticator, input.urlType as URLType);
          return { success: true, url };
        } catch (error: any) {
          return { 
            success: false, 
            error: error.message || 'Failed to get Stamps.com URL'
          };
        }
      }),
    
    // Test authentication
    testAuth: protectedProcedure
      .query(async () => {
        try {
          const credentials = getStampsCredentials();
          const { accountInfo } = await authenticateStamps(credentials);
          return { 
            success: true, 
            accountInfo: {
              customerId: accountInfo.customerId,
              meterNumber: accountInfo.meterNumber,
              availablePostage: accountInfo.postageBalance.availablePostage,
            }
          };
        } catch (error: any) {
          return { 
            success: false, 
            error: error.message || 'Authentication failed'
          };
        }
      }),
  }),
  
  // Phase 3: Cases Module - moved to server/routers/cases.ts

  // ==================== INVENTORY MANAGEMENT ====================
  inventory: router({
    // Dashboard & Overview
    overview: protectedProcedure.query(async () => {
      const overview = await db.getInventoryOverview();
      const valuation = await db.calculateInventoryValuation();
      const lowStock = await db.getLowStockProducts();
      const topProducts = await db.getTopProductsByValue(10);
      return { overview, valuation, lowStock, topProducts };
    }),

    syncFromShipStation: protectedProcedure
      .mutation(async () => {
        const { syncInventoryFromShipStation } = await import('./db-inventory-sync');
        return await syncInventoryFromShipStation();
      }),

    getInventoryStats: protectedProcedure
      .query(async () => {
        const { getInventoryStats } = await import('./db-inventory-sync');
        return await getInventoryStats();
      }),

    byLocation: protectedProcedure
      .input(z.object({ locationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getInventoryByLocation(input.locationId);
      }),

    locations: protectedProcedure.query(async () => {
      return await db.getInventoryLocations();
    }),

    // Product Management
    products: protectedProcedure
      .input(
        z
          .object({
            page: z.number().optional(),
            limit: z.number().optional(),
            category: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await db.getProducts(input || {});
      }),

    productDetail: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductWithStock(input.productId);
      }),

    searchProducts: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.searchProducts(input.query, input.limit);
      }),

    upsertProduct: protectedProcedure
      .input(
        z.object({
          id: z.number().optional(),
          sku: z.string(),
          barcode: z.string().optional(),
          name: z.string(),
          description: z.string().optional(),
          category: z.string().optional(),
          cost: z.number(),
          price: z.number(),
          margin: z.number().optional(),
          supplier: z.string().optional(),
          leadTimeDays: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const productId = await db.upsertProduct(input);
        return { success: true, productId };
      }),

    // Stock Management
    adjustStock: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          locationId: z.number(),
          quantity: z.number(),
          movementType: z.string(),
          referenceType: z.string().optional(),
          referenceId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.adjustStock({
          ...input,
          performedBy: ctx.user!.id,
        });
      }),

    stockMovements: protectedProcedure
      .input(
        z
          .object({
            productId: z.number().optional(),
            locationId: z.number().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return await db.getStockMovements(input || {});
      }),
  }),
});

export type AppRouter = typeof appRouter;
