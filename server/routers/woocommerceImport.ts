/**
 * WooCommerce Import tRPC Router
 * Provides API endpoints for order import with real-time progress streaming
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { WooCommerceImportService } from '../services/woocommerceImport';
import { observable } from '@trpc/server/observable';
import type { ImportProgress } from '../services/woocommerceImport';

export const woocommerceImportRouter = router({
  /**
   * Start import with real-time progress streaming
   */
  startImport: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        orderIds: z.array(z.number()).optional(),
        statuses: z.array(z.string()).optional(),
      })
    )
    .subscription(async ({ input, ctx }) => {
      return observable<ImportProgress>((emit) => {
        const importService = new WooCommerceImportService();

        // Set up progress callback
        importService.onProgress((progress) => {
          emit.next(progress);
        });

        // Start import
        importService
          .importOrders({
            ...input,
            userId: ctx.user.id,
          })
          .then((result) => {
            // Send final progress
            emit.next({
              totalOrders: result.totalProcessed,
              processedOrders: result.totalProcessed,
              currentBatch: 0,
              totalBatches: 0,
              batchProgress: 0,
              conflicts: result.conflicts.length,
              errors: result.errors.length,
              created: result.created,
              updated: result.updated,
              skipped: result.skipped,
            });
            emit.complete();
          })
          .catch((error) => {
            emit.error(error);
          });

        return () => {
          // Cleanup if subscription is cancelled
        };
      });
    }),

  /**
   * Import orders (non-streaming version for simple use cases)
   */
  import: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        orderIds: z.array(z.number()).optional(),
        statuses: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const importService = new WooCommerceImportService();
      const result = await importService.importOrders({
        ...input,
        userId: ctx.user.id,
      });
      return result;
    }),

  /**
   * Get import history
   */
  getImportHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      // TODO: Implement import history tracking
      return {
        imports: [],
        total: 0,
      };
    }),

  /**
   * Resolve conflict (user chooses which data to keep)
   */
  resolveConflict: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        woocommerceId: z.number(),
        resolution: z.enum(['keep_local', 'use_woocommerce', 'selective']),
        selectedFields: z.record(z.enum(['local', 'woocommerce'])).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement conflict resolution
      return { success: true };
    }),

  /**
   * Get order changelog
   */
  getOrderChangelog: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .query(async ({ input }) => {
      // TODO: Implement changelog retrieval
      return {
        changes: [],
      };
    }),

  /**
   * Rollback last import
   */
  rollbackImport: protectedProcedure
    .input(
      z.object({
        importId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Implement rollback
      return { success: true };
    }),
});
