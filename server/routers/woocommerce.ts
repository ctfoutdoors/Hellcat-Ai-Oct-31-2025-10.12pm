/**
 * WooCommerce tRPC Router
 * Handles WooCommerce integration endpoints
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import {
  getWooCommerceOrders,
  getWooCommerceOrder,
  getWooCommerceProducts,
  getWooCommerceProduct,
  getWooCommerceOrderNotes,
  testWooCommerceConnection,
  importWooCommerceOrders,
  parseTrackingFromNotes,
} from '../services/woocommerceService';

export const woocommerceRouter = router({
  /**
   * Test WooCommerce connection
   */
  testConnection: publicProcedure.query(async () => {
    const isConnected = await testWooCommerceConnection();
    return { connected: isConnected };
  }),

  /**
   * Get WooCommerce orders
   */
  getOrders: publicProcedure
    .input(
      z.object({
        page: z.number().optional(),
        perPage: z.number().optional(),
        status: z.string().optional(),
        after: z.string().optional(),
        before: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const orders = await getWooCommerceOrders(input);
      return { orders };
    }),

  /**
   * Get single WooCommerce order
   */
  getOrder: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const order = await getWooCommerceOrder(input.orderId);
      return { order };
    }),

  /**
   * Get order notes
   */
  getOrderNotes: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const notes = await getWooCommerceOrderNotes(input.orderId);
      return { notes };
    }),

  /**
   * Get WooCommerce products
   */
  getProducts: publicProcedure
    .input(
      z.object({
        page: z.number().optional(),
        perPage: z.number().optional(),
        search: z.string().optional(),
        sku: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const products = await getWooCommerceProducts(input);
      return { products };
    }),

  /**
   * Get single WooCommerce product
   */
  getProduct: publicProcedure
    .input(
      z.object({
        productId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const product = await getWooCommerceProduct(input.productId);
      return { product };
    }),

  /**
   * Import WooCommerce orders
   */
  importOrders: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        after: z.string().optional(),
        before: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id || 1; // Default to user 1 if not authenticated
      const result = await importWooCommerceOrders(userId, input);
      return result;
    }),

  /**
   * Parse tracking numbers from text
   */
  parseTracking: publicProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query(async ({ input }) => {
      const trackingNumbers = parseTrackingFromNotes(input.text);
      return { trackingNumbers };
    }),

  /**
   * Get import statistics
   */
  getImportStats: publicProcedure.query(async () => {
    const { getDb } = await import('../db');
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const { orders, channels } = await import('../../drizzle/schema');
    const { eq, and, gte } = await import('drizzle-orm');

    // Get WooCommerce channel
    const channel = await db
      .select()
      .from(channels)
      .where(eq(channels.channelName, 'WooCommerce'))
      .limit(1);

    if (channel.length === 0) {
      return {
        totalOrders: 0,
        lastSyncAt: null,
        recentOrders: 0,
      };
    }

    const channelId = channel[0].id;

    // Get total orders
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.channelId, channelId));

    // Get orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.channelId, channelId),
          gte(orders.orderDate, thirtyDaysAgo)
        )
      );

    return {
      totalOrders: allOrders.length,
      lastSyncAt: channel[0].lastSyncAt,
      recentOrders: recentOrders.length,
    };
  }),
});
