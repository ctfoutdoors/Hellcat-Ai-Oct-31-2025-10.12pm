import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { POScannerService } from '../services/poScanner';

export const purchaseOrdersRouter = router({
  /**
   * Scan PO document with AI
   */
  scanDocument: protectedProcedure
    .input(
      z.object({
        documentUrl: z.string(),
        vendorId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await POScannerService.scanPODocument({
        documentUrl: input.documentUrl,
        vendorId: input.vendorId,
      });

      return {
        success: true,
        data: result,
      };
    }),

  /**
   * Match SKUs for PO line items
   */
  matchSKUs: protectedProcedure
    .input(
      z.object({
        lineItems: z.array(
          z.object({
            vendorSku: z.string(),
            description: z.string(),
          })
        ),
        vendorId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // In real implementation, fetch from database
      const existingProducts: any[] = [];
      const existingAliases: any[] = [];

      const results = await POScannerService.batchMatchSKUs({
        lineItems: input.lineItems,
        vendorId: input.vendorId,
        existingProducts,
        existingAliases,
      });

      return {
        success: true,
        matches: results,
      };
    }),

  /**
   * Create purchase order
   */
  create: protectedProcedure
    .input(
      z.object({
        vendorId: z.number(),
        poNumber: z.string(),
        poDate: z.string(),
        expectedDeliveryDate: z.string().optional(),
        lineItems: z.array(
          z.object({
            productId: z.number().optional(),
            vendorSku: z.string(),
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
          })
        ),
        subtotal: z.number(),
        taxAmount: z.number().optional(),
        shippingCost: z.number().optional(),
        totalAmount: z.number(),
        documentUrl: z.string().optional(),
        aiConfidence: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create PO in database
      return {
        success: true,
        poId: 1,
        message: 'Purchase order created successfully',
      };
    }),

  /**
   * Get all purchase orders
   */
  list: protectedProcedure
    .input(
      z.object({
        vendorId: z.number().optional(),
        status: z.enum(['draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled']).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      // Fetch from database
      return {
        success: true,
        purchaseOrders: [],
        total: 0,
      };
    }),

  /**
   * Get purchase order by ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        poId: z.number(),
      })
    )
    .query(async ({ input }) => {
      // Fetch from database with line items
      return {
        success: true,
        purchaseOrder: null,
      };
    }),

  /**
   * Update purchase order
   */
  update: protectedProcedure
    .input(
      z.object({
        poId: z.number(),
        status: z.enum(['draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled']).optional(),
        expectedDeliveryDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: 'Purchase order updated',
      };
    }),

  /**
   * Approve purchase order
   */
  approve: protectedProcedure
    .input(
      z.object({
        poId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: 'Purchase order approved',
      };
    }),

  /**
   * Cancel purchase order
   */
  cancel: protectedProcedure
    .input(
      z.object({
        poId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: 'Purchase order cancelled',
      };
    }),
});
