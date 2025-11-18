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

export const appRouter = router({
  integrations: integrationsRouter,
  stores: storesRouter,
  crm: crmRouter,
  intelligence: intelligenceRouter,
  po: poRouter,
  trackingAgent: trackingAgentRouter,
  orders: router({
    list: publicProcedure
      .input(z.object({
        source: z.string().optional(),
        status: z.string().optional(),
        searchTerm: z.string().optional(),
      }).optional())
      .query(({ input }) => db.listOrders(input || {})),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getOrderById(input.id)),
    
    syncFromShipStation: protectedProcedure
      .input(z.array(z.any()))
      .mutation(({ input }) => db.syncOrdersFromShipStation(input)),
    
    linkToCase: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        caseId: z.number(),
      }))
      .mutation(({ input }) => db.linkOrderToCase(input.orderId, input.caseId)),
  }),
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
  
  // Phase 3: Cases Module
  cases: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        caseType: z.string().optional(),
        carrier: z.string().optional(),
        searchTerm: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.listCases({
          ...input,
          userId: ctx.user.id,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        caseType: z.string(),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        claimAmount: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const caseNumber = `CASE-${Date.now()}`;
        return await db.createCase({
          ...input,
          caseNumber,
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        carrier: z.string().optional(),
        trackingNumber: z.string().optional(),
        claimAmount: z.number().optional(),
        priority: z.string().optional(),
        caseType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const dbUpdates: any = { ...updates };
        if (updates.claimAmount !== undefined) {
          dbUpdates.claimAmount = updates.claimAmount.toString();
        }
        return await db.updateCase(id, dbUpdates);
      }),

    flag: protectedProcedure
      .input(z.object({
        id: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.flagCase(input.id, input.reason);
      }),

    unflag: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.unflagCase(input.id);
      }),

    getFlagged: protectedProcedure
      .query(async () => {
        return await db.getFlaggedCases();
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addCaseActivity({
          caseId: input.id,
          activityType: "status_change",
          description: `Status changed to ${input.status}`,
          performedBy: ctx.user.id,
        });
        return await db.updateCase(input.id, { status: input.status as any });
      }),

    addNote: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addCaseNote({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    getNotes: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseNotes(input.caseId);
      }),



    getActivities: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseActivities(input.caseId);
      }),

    // Phase 4: AI Document Extraction
    extractFromDocument: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // base64 encoded
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.extractCaseDataFromDocument(input, ctx.user.id);
      }),

    // Complaint Management
    generateComplaint: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .mutation(async ({ input }) => {
        const caseData = await db.getCaseById(input.caseId);
        if (!caseData) throw new Error("Case not found");

        const { generateShipStationComplaint } = await import("./services/complaintGenerator");
        const complaint = await generateShipStationComplaint({
          caseNumber: caseData.caseNumber,
          title: caseData.title,
          description: caseData.description || "",
          carrier: caseData.carrier || "USPS",
          trackingNumber: caseData.trackingNumber,
          claimAmount: caseData.claimAmount ? parseFloat(caseData.claimAmount) : undefined,
          priority: caseData.priority,
        });

        return complaint;
      }),

    sendComplaint: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        recipient: z.string(),
        subject: z.string(),
        body: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Create complaint record
        const complaint = await db.createComplaintEmail({
          caseId: input.caseId,
          recipient: input.recipient,
          subject: input.subject,
          body: input.body,
          status: "sending",
        });

        try {
          // Get primary email account
          const primaryAccount = await db.getPrimaryEmailAccount();
          if (!primaryAccount) {
            throw new Error("No primary email account configured");
          }

          // Send email via Gmail MCP
          const { sendEmailViaGmail } = await import("./integrations/gmail");
          await sendEmailViaGmail({
            to: [input.recipient],
            subject: input.subject,
            content: input.body,
          });

          // Update status to sent
          await db.updateComplaintStatus(complaint.id, "sent", new Date());

          return { success: true, complaintId: complaint.id };
        } catch (error) {
          // Update status to failed
          await db.updateComplaintStatus(complaint.id, "failed");
          throw error;
        }
      }),

    getComplaints: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseComplaints(input.caseId);
      }),
  }),

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
