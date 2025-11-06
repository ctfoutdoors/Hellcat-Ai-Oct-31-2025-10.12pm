import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { ClipboardManager } from '../services/clipboardManager';

export const clipboardRouter = router({
  /**
   * Add item to clipboard history
   */
  addItem: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        type: z.enum(['text', 'tracking', 'case_number', 'amount', 'address']).optional(),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = ClipboardManager.addItem({
        userId: ctx.user.id,
        content: input.content,
        type: input.type,
        label: input.label,
      });

      return {
        success: true,
        item,
      };
    }),

  /**
   * Get clipboard history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const items = ClipboardManager.getHistory(ctx.user.id, input?.limit);

      return {
        success: true,
        items,
      };
    }),

  /**
   * Toggle pin status
   */
  togglePin: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const pinned = ClipboardManager.togglePin(ctx.user.id, input.itemId);

        return {
          success: true,
          pinned,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Delete item
   */
  deleteItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = ClipboardManager.deleteItem(ctx.user.id, input.itemId);

      return {
        success: deleted,
      };
    }),

  /**
   * Clear all unpinned items
   */
  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      const deletedCount = ClipboardManager.clearHistory(ctx.user.id);

      return {
        success: true,
        deletedCount,
      };
    }),

  /**
   * Search clipboard
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = ClipboardManager.search(ctx.user.id, input.query);

      return {
        success: true,
        items,
      };
    }),

  /**
   * Get items by type
   */
  getByType: protectedProcedure
    .input(
      z.object({
        type: z.enum(['text', 'tracking', 'case_number', 'amount', 'address']),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = ClipboardManager.getByType(ctx.user.id, input.type);

      return {
        success: true,
        items,
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = ClipboardManager.getStats(ctx.user.id);

      return {
        success: true,
        stats,
      };
    }),
});
