import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";
import { createShipStationClient } from "../integrations/shipstation";

export const ordersRouter = router({
  /**
   * Get orders with filters
   */
  getOrders: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        carrier: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];

      if (input.status && input.status !== "all") {
        conditions.push(eq(orders.status, input.status));
      }

      if (input.carrier && input.carrier !== "all") {
        conditions.push(eq(orders.carrierCode, input.carrier));
      }

      if (input.startDate) {
        conditions.push(gte(orders.orderDate, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(orders.orderDate, new Date(input.endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause);
      const total = Number(countResult[0]?.count || 0);

      // Get paginated orders
      const offset = (input.page - 1) * input.limit;
      const ordersList = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.orderDate))
        .limit(input.limit)
        .offset(offset);

      return {
        orders: ordersList,
        total,
        page: input.page,
        limit: input.limit,
        pages: Math.ceil(total / input.limit),
      };
    }),

  /**
   * Get order statistics
   */
  getOrderStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total orders
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    const total = Number(totalResult[0]?.count || 0);

    // Today's orders
    const todayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(gte(orders.orderDate, today));
    const todayCount = Number(todayResult[0]?.count || 0);

    // Orders by status
    const statusResult = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.status);

    const statusCounts: Record<string, number> = {};
    statusResult.forEach((row) => {
      if (row.status) {
        statusCounts[row.status] = Number(row.count);
      }
    });

    // Orders by carrier
    const carrierResult = await db
      .select({
        carrier: orders.carrierCode,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(sql`${orders.carrierCode} IS NOT NULL`)
      .groupBy(orders.carrierCode);

    const carrierCounts: Record<string, number> = {};
    carrierResult.forEach((row) => {
      if (row.carrier) {
        carrierCounts[row.carrier] = Number(row.count);
      }
    });

    return {
      total,
      today: todayCount,
      byStatus: statusCounts,
      byCarrier: carrierCounts,
    };
  }),

  /**
   * Sync order status from ShipStation
   */
  syncOrderStatus: protectedProcedure
    .input(z.object({ orderIds: z.array(z.number()).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const shipstation = createShipStationClient();
      if (!shipstation) {
        throw new Error("ShipStation not configured");
      }

      let ordersToSync: Array<{ id: number; externalId: string | null }>;

      if (input.orderIds && input.orderIds.length > 0) {
        // Sync specific orders
        ordersToSync = await db
          .select({ id: orders.id, externalId: orders.externalId })
          .from(orders)
          .where(
            and(
              sql`${orders.id} IN (${sql.join(input.orderIds.map((id) => sql`${id}`), sql`, `)})`,
              sql`${orders.externalId} IS NOT NULL`
            )
          );
      } else {
        // Sync all recent orders (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        ordersToSync = await db
          .select({ id: orders.id, externalId: orders.externalId })
          .from(orders)
          .where(
            and(
              gte(orders.orderDate, sevenDaysAgo),
              sql`${orders.externalId} IS NOT NULL`
            )
          );
      }

      const results = {
        total: ordersToSync.length,
        updated: 0,
        failed: 0,
        errors: [] as Array<{ orderId: number; error: string }>,
      };

      for (const order of ordersToSync) {
        if (!order.externalId) continue;

        try {
          // Fetch order from ShipStation
          const ssOrder = await shipstation.request(`/orders/${order.externalId}`);

          // Update order in database
          await db
            .update(orders)
            .set({
              status: ssOrder.orderStatus,
              shipDate: ssOrder.shipDate ? new Date(ssOrder.shipDate) : null,
              trackingNumber: ssOrder.shipments?.[0]?.trackingNumber || null,
              carrierCode: ssOrder.shipments?.[0]?.carrierCode || null,
              serviceCode: ssOrder.shipments?.[0]?.serviceCode || null,
              orderData: ssOrder,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          results.updated++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            orderId: order.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),
});
