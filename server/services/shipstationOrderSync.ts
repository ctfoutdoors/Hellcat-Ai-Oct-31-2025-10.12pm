import { createShipStationClient } from '../integrations/shipstation';
import { getDb } from '../db';
import { orders } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * ShipStation Order Sync Service
 * 
 * Syncs orders from all ShipStation stores (eBay, Amazon, WooCommerce, etc.)
 * to the local database with proper channel identification.
 */

// Store IDs from ShipStation
const STORE_IDS = {
  EBAY: 2896008,
  AMAZON: 2895995,
  // Add more store IDs as needed
};

// Map store IDs to channel names
const STORE_TO_CHANNEL: Record<number, string> = {
  [STORE_IDS.EBAY]: 'eBay',
  [STORE_IDS.AMAZON]: 'Amazon',
};

interface SyncResult {
  success: boolean;
  ordersProcessed: number;
  ordersCreated: number;
  ordersUpdated: number;
  ordersSkipped: number;
  errors: string[];
}

/**
 * Sync orders from ShipStation for a specific store
 */
export async function syncOrdersFromStore(
  storeId: number,
  daysBack: number = 30
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    ordersProcessed: 0,
    ordersCreated: 0,
    ordersUpdated: 0,
    ordersSkipped: 0,
    errors: [],
  };

  try {
    const shipstation = createShipStationClient();
    if (!shipstation) {
      throw new Error('ShipStation client not configured');
    }

    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log(`[ShipStationSync] Syncing orders for store ${storeId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch orders from ShipStation
    const response = await shipstation.getOrders({
      storeId,
      createDateStart: startDate.toISOString(),
      createDateEnd: endDate.toISOString(),
      pageSize: 500, // Max page size
    });

    if (!response.orders || response.orders.length === 0) {
      console.log(`[ShipStationSync] No orders found for store ${storeId}`);
      return result;
    }

    const channelName = STORE_TO_CHANNEL[storeId] || 'Unknown';

    // Process each order
    for (const ssOrder of response.orders) {
      result.ordersProcessed++;

      try {
        // Check if order already exists
        const existing = await db
          .select()
          .from(orders)
          .where(eq(orders.externalId, ssOrder.orderId.toString()))
          .limit(1);

        const orderData = {
          orderNumber: ssOrder.orderNumber || `SS-${ssOrder.orderId}`,
          channelOrderNumber: ssOrder.orderKey || ssOrder.orderNumber,
          externalId: ssOrder.orderId.toString(),
          storeId: storeId,
          channel: channelName,
          orderDate: new Date(ssOrder.orderDate),
          orderStatus: ssOrder.orderStatus || 'pending',
          customerName: `${ssOrder.shipTo?.name || 'Unknown'}`,
          customerEmail: ssOrder.customerEmail || null,
          customerPhone: ssOrder.shipTo?.phone || null,
          shippingAddress: ssOrder.shipTo ? JSON.stringify(ssOrder.shipTo) : null,
          billingAddress: ssOrder.billTo ? JSON.stringify(ssOrder.billTo) : null,
          orderTotal: ssOrder.orderTotal || 0,
          shippingAmount: ssOrder.shippingAmount || 0,
          taxAmount: ssOrder.taxAmount || 0,
          carrierCode: ssOrder.carrierCode || null,
          serviceCode: ssOrder.serviceCode || null,
          trackingNumber: ssOrder.trackingNumber || null,
          shipDate: ssOrder.shipDate ? new Date(ssOrder.shipDate) : null,
          updatedAt: new Date(),
        };

        if (existing.length > 0) {
          // Update existing order
          await db
            .update(orders)
            .set(orderData)
            .where(eq(orders.id, existing[0].id));
          result.ordersUpdated++;
          console.log(`[ShipStationSync] Updated order ${orderData.orderNumber}`);
        } else {
          // Create new order
          await db.insert(orders).values({
            ...orderData,
            createdAt: new Date(),
          });
          result.ordersCreated++;
          console.log(`[ShipStationSync] Created order ${orderData.orderNumber}`);
        }
      } catch (error) {
        const errorMsg = `Failed to process order ${ssOrder.orderNumber}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`[ShipStationSync] ${errorMsg}`);
        result.errors.push(errorMsg);
        result.ordersSkipped++;
      }
    }

    console.log(`[ShipStationSync] Completed sync for store ${storeId}: ${result.ordersCreated} created, ${result.ordersUpdated} updated, ${result.ordersSkipped} skipped`);
  } catch (error) {
    result.success = false;
    const errorMsg = `Failed to sync orders from store ${storeId}: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[ShipStationSync] ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Sync orders from all configured stores
 */
export async function syncAllStoreOrders(daysBack: number = 30): Promise<Record<string, SyncResult>> {
  const results: Record<string, SyncResult> = {};

  for (const [channelName, storeId] of Object.entries(STORE_IDS)) {
    console.log(`[ShipStationSync] Starting sync for ${channelName} (Store ID: ${storeId})`);
    results[channelName] = await syncOrdersFromStore(storeId, daysBack);
  }

  return results;
}

/**
 * Get sync statistics
 */
export async function getSyncStats(): Promise<{
  totalOrders: number;
  ordersByChannel: Record<string, number>;
  lastSyncTime: Date | null;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Total orders
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders);
  const totalOrders = Number(totalResult[0]?.count || 0);

  // Orders by channel
  const channelResult = await db
    .select({
      channel: orders.channel,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(sql`${orders.channel} IS NOT NULL`)
    .groupBy(orders.channel);

  const ordersByChannel: Record<string, number> = {};
  channelResult.forEach((row) => {
    if (row.channel) {
      ordersByChannel[row.channel] = Number(row.count);
    }
  });

  // Last sync time (most recent updatedAt)
  const lastSyncResult = await db
    .select({ updatedAt: orders.updatedAt })
    .from(orders)
    .orderBy(sql`${orders.updatedAt} DESC`)
    .limit(1);
  const lastSyncTime = lastSyncResult[0]?.updatedAt || null;

  return {
    totalOrders,
    ordersByChannel,
    lastSyncTime,
  };
}
