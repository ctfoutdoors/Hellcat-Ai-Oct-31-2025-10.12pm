import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { sql, count, sum, eq, gte } from "drizzle-orm";

export const dashboardRouter = router({
  /**
   * Get dashboard metrics with real data from database
   */
  getMetrics: protectedProcedure.query(async () => {
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
      // Calculate total revenue from all orders
      const revenueResult = await db
        .select({
          total: sum(orders.totalAmount),
        })
        .from(orders);

      const totalRevenue = parseFloat(revenueResult[0]?.total as string || "0");

      // Count active cases (you'll need to implement this based on your cases schema)
      const activeCases = 0; // TODO: Implement when cases schema is ready

      // Calculate inventory value (you'll need to implement this based on your products schema)
      const inventoryValue = 0; // TODO: Implement when products schema is ready

      // Count orders from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const ordersTodayResult = await db
        .select({
          count: count(),
        })
        .from(orders)
        .where(gte(orders.orderDate, today));

      const ordersToday = ordersTodayResult[0]?.count || 0;

      return {
        totalRevenue,
        activeCases,
        inventoryValue,
        ordersToday,
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
   */
  getChannelAnalytics: protectedProcedure.query(async () => {
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
      // Get order count and revenue by channel
      const channelStats = await db
        .select({
          channel: orders.channel,
          orderCount: count(),
          revenue: sum(orders.totalAmount),
        })
        .from(orders)
        .groupBy(orders.channel);

      const channels = channelStats.map((stat) => ({
        channel: stat.channel || "Unknown",
        orderCount: stat.orderCount,
        revenue: parseFloat(stat.revenue as string || "0"),
      }));

      return {
        channels,
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
