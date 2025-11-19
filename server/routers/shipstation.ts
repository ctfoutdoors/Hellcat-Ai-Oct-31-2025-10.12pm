import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createShipStationClient } from "../integrations/shipstation";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const shipstationRouter = router({
  /**
   * List all warehouses with their inventory
   */
  listWarehouses: protectedProcedure.query(async () => {
    const shipstation = createShipStationClient();

    // Fetch warehouses
    const warehousesResponse = await shipstation.getWarehouses();
    const warehouses = warehousesResponse || [];

    // For each warehouse, fetch inventory/products
    const warehousesWithInventory = await Promise.all(
      warehouses.map(async (warehouse: any) => {
        try {
          // Fetch products for this warehouse
          const productsResponse = await shipstation.getProducts({
            warehouseId: warehouse.warehouseId,
          });

          const skus = (productsResponse?.products || []).map((product: any) => ({
            sku: product.sku,
            productName: product.name,
            quantity: product.warehouseLocation?.onHand || 0,
            available: product.warehouseLocation?.available || 0,
            onHold: product.warehouseLocation?.onHold || 0,
            binLocation: product.warehouseLocation?.binLocation || null,
          }));

          return {
            warehouseId: warehouse.warehouseId,
            warehouseName: warehouse.warehouseName,
            originAddress: warehouse.originAddress,
            returnAddress: warehouse.returnAddress,
            city: warehouse.originAddress?.city || "",
            state: warehouse.originAddress?.state || "",
            postalCode: warehouse.originAddress?.postalCode || "",
            country: warehouse.originAddress?.country || "",
            skus,
          };
        } catch (error) {
          console.error(`[ShipStation] Error fetching inventory for warehouse ${warehouse.warehouseId}:`, error);
          return {
            warehouseId: warehouse.warehouseId,
            warehouseName: warehouse.warehouseName,
            originAddress: warehouse.originAddress,
            returnAddress: warehouse.returnAddress,
            city: warehouse.originAddress?.city || "",
            state: warehouse.originAddress?.state || "",
            postalCode: warehouse.originAddress?.postalCode || "",
            country: warehouse.originAddress?.country || "",
            skus: [],
          };
        }
      })
    );

    return warehousesWithInventory;
  }),

  /**
   * Import today's orders from ShipStation
   */
  importTodaysOrders: protectedProcedure.mutation(async () => {
    const shipstation = createShipStationClient();
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch orders from ShipStation for today
    const ordersResponse = await shipstation.getOrders({
      createDateStart: today.toISOString(),
      createDateEnd: tomorrow.toISOString(),
      pageSize: 500,
    });

    const shipstationOrders = ordersResponse?.orders || [];

    // Import orders to database
    let imported = 0;
    let skipped = 0;

    for (const ssOrder of shipstationOrders) {
      try {
        // Check if order already exists
        const existing = await db
          .select()
          .from(orders)
          .where(eq(orders.orderNumber, ssOrder.orderNumber))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Insert order
        await db.insert(orders).values({
          orderNumber: ssOrder.orderNumber,
          orderKey: ssOrder.orderKey || "",
          source: "shipstation",
          status: ssOrder.orderStatus,
          customerName: `${ssOrder.shipTo?.name || ""}`,
          customerEmail: ssOrder.customerEmail || null,
          total: String(ssOrder.orderTotal || 0),
          shippingCost: String(ssOrder.shippingAmount || 0),
          tax: String(ssOrder.taxAmount || 0),
          shippingAddress: JSON.stringify(ssOrder.shipTo),
          billingAddress: JSON.stringify(ssOrder.billTo),
          items: JSON.stringify(ssOrder.items),
          orderDate: new Date(ssOrder.orderDate),
          shipByDate: ssOrder.shipByDate ? new Date(ssOrder.shipByDate) : null,
          carrierCode: ssOrder.carrierCode || null,
          serviceCode: ssOrder.serviceCode || null,
          trackingNumber: ssOrder.trackingNumber || null,
        });

        imported++;
      } catch (error) {
        console.error(`[ShipStation] Error importing order ${ssOrder.orderNumber}:`, error);
        skipped++;
      }
    }

    return {
      success: true,
      total: shipstationOrders.length,
      imported,
      skipped,
    };
  }),
});
