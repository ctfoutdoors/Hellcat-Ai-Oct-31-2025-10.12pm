import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createShipStationClient } from "../integrations/shipstation";
import { getDb } from "../db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const shipstationRouter = router({
  /**
   * Get ShipStation account balance
   * This fetches the overall ShipStation wallet balance, not carrier-specific balances
   */
  getAccountBalance: protectedProcedure.query(async () => {
    const shipstation = createShipStationClient();
    
    try {
      // Try multiple endpoints to get the account balance
      let balance = 0;
      let carrierName = 'ShipStation';
      let accountNumber = null;
      
      try {
        // Method 1: Try to get account info from /account endpoint
        const accountInfo = await shipstation.request('/account', 'GET');
        if (accountInfo && typeof accountInfo.balance !== 'undefined') {
          balance = parseFloat(accountInfo.balance) || 0;
          carrierName = accountInfo.companyName || 'ShipStation';
          accountNumber = accountInfo.accountNumber || null;
        }
      } catch (accountError) {
        console.log('[ShipStation] /account endpoint not available, trying carriers');
        
        // Method 2: Get list of carriers and sum their balances
        try {
          const carriers = await shipstation.request('/carriers', 'GET');
          
          // Try to get balance from each carrier
          for (const carrier of carriers) {
            try {
              const carrierDetails = await shipstation.request(`/carriers/getcarrier?carrierCode=${carrier.code}`, 'GET');
              if (carrierDetails && typeof carrierDetails.balance !== 'undefined') {
                const carrierBalance = parseFloat(carrierDetails.balance) || 0;
                balance += carrierBalance;
                console.log(`[ShipStation] ${carrier.name}: $${carrierBalance}`);
              }
            } catch (carrierError) {
              console.log(`[ShipStation] Could not get balance for ${carrier.code}`);
            }
          }
        } catch (carriersError) {
          console.error('[ShipStation] Could not fetch carriers:', carriersError);
        }
      }
      
      return {
        balance,
        carrierName,
        accountNumber,
        currency: 'USD',
        isNegative: balance < 0,
      };
    } catch (error) {
      console.error('[ShipStation] Error fetching account balance:', error);
      throw new Error('Failed to fetch ShipStation account balance');
    }
  }),

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
