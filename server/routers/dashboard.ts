import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { sql, count, sum, eq, gte, and, lte } from "drizzle-orm";
import { z } from "zod";
import { getDateRange, type TimePeriod } from "@shared/dateRanges";

export const dashboardRouter = router({
  /**
   * Get dashboard metrics with real data from database
   * Supports date range filtering by time period
   */
  getMetrics: protectedProcedure
    .input(
      z
        .object({
          period: z.enum([
            "today",
            "yesterday",
            "last7days",
            "last30days",
            "thisMonth",
            "lastMonth",
            "thisQuarter",
            "yearToDate",
          ]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      // Return demo data if database is not available
      return {
        totalRevenue: 1200000,
        activeCases: 89,
        inventoryValue: 284000,
        ordersToday: 127,
        isDemo: true,
      };
    }

    try {
      // Get date range for filtering
      const period = input?.period || "today";
      const dateRange = getDateRange(period as TimePeriod);
      
      // Build date filter condition
      const dateFilter = and(
        gte(orders.orderDate, dateRange.start),
        lte(orders.orderDate, dateRange.end)
      );

      // Calculate total revenue from orders in date range
      const revenueResult = await db
        .select({
          total: sum(orders.totalAmount),
        })
        .from(orders)
        .where(dateFilter);

      const totalRevenue = parseFloat(revenueResult[0]?.total as string || "0");

      // Count active cases (you'll need to implement this based on your cases schema)
      const activeCases = 0; // TODO: Implement when cases schema is ready

      // Calculate inventory value (you'll need to implement this based on your products schema)
      const inventoryValue = 0; // TODO: Implement when products schema is ready

      // Count orders in date range
      const ordersCountResult = await db
        .select({
          count: count(),
        })
        .from(orders)
        .where(dateFilter);

      const ordersCount = ordersCountResult[0]?.count || 0;

      return {
        totalRevenue,
        activeCases,
        inventoryValue,
        ordersToday: ordersCount,
        period: dateRange.label,
        isDemo: false,
      };
    } catch (error) {
      console.error("[Dashboard] Failed to fetch metrics:", error);
      // Return demo data on error
      return {
        totalRevenue: 1200000,
        activeCases: 89,
        inventoryValue: 284000,
        ordersToday: 127,
        isDemo: true,
      };
    }
  }),

  /**
   * Get channel analytics - order count and revenue by channel
   * Supports date range filtering by time period
   */
  getChannelAnalytics: protectedProcedure
    .input(
      z
        .object({
          period: z.enum([
            "today",
            "yesterday",
            "last7days",
            "last30days",
            "thisMonth",
            "lastMonth",
            "thisQuarter",
            "yearToDate",
          ]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      // Return demo data if database is not available
      return {
        channels: [
          { channel: "eBay", orderCount: 45, revenue: 12500 },
          { channel: "Amazon", orderCount: 38, revenue: 9800 },
          { channel: "WooCommerce", orderCount: 22, revenue: 8200 },
          { channel: "Shopify", orderCount: 15, revenue: 5400 },
        ],
        isDemo: true,
      };
    }

    try {
      // Get date range for filtering
      const period = input?.period || "today";
      const dateRange = getDateRange(period as TimePeriod);
      
      // Build date filter condition
      const dateFilter = and(
        gte(orders.orderDate, dateRange.start),
        lte(orders.orderDate, dateRange.end)
      );

      // Get order count and revenue by channel for date range
      const channelStats = await db
        .select({
          channel: orders.channel,
          orderCount: count(),
          revenue: sum(orders.totalAmount),
        })
        .from(orders)
        .where(dateFilter)
        .groupBy(orders.channel);

      const channels = channelStats.map((stat) => ({
        channel: stat.channel || "Unknown",
        orderCount: stat.orderCount,
        revenue: parseFloat(stat.revenue as string || "0"),
      }));

      return {
        channels,
        period: dateRange.label,
        isDemo: false,
      };
    } catch (error) {
      console.error("[Dashboard] Failed to fetch channel analytics:", error);
      // Return demo data on error
      return {
        channels: [
          { channel: "eBay", orderCount: 45, revenue: 12500 },
          { channel: "Amazon", orderCount: 38, revenue: 9800 },
          { channel: "WooCommerce", orderCount: 22, revenue: 8200 },
          { channel: "Shopify", orderCount: 15, revenue: 5400 },
        ],
        isDemo: true,
      };
    }
  }),
});
