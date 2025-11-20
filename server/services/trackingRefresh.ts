import { getDb } from '../db';
import { orders } from '../../drizzle/schema';
import { createShipStationClient } from '../integrations/shipstation';
import { eq, isNull, or } from 'drizzle-orm';
import { storagePut } from '../storage';

interface TrackingRefreshResult {
  success: boolean;
  orderId: number;
  orderNumber: string;
  trackingNumber?: string;
  carrierCode?: string;
  evidenceUrl?: string;
  error?: string;
}

/**
 * Refresh tracking information for a single order
 * Fetches latest data from ShipStation and stores JSON evidence
 */
export async function refreshOrderTracking(orderId: number): Promise<TrackingRefreshResult> {
  const db = await getDb();
  if (!db) {
    return {
      success: false,
      orderId,
      orderNumber: '',
      error: 'Database not available',
    };
  }

  const client = createShipStationClient();
  if (!client) {
    return {
      success: false,
      orderId,
      orderNumber: '',
      error: 'ShipStation client not configured',
    };
  }

  try {
    // Get the order from database
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      return {
        success: false,
        orderId,
        orderNumber: '',
        error: 'Order not found',
      };
    }

    console.log(`[TrackingRefresh] Refreshing tracking for order ${order.orderNumber}`);

    // Fetch fresh data from ShipStation
    let ssOrder: any = null;
    let evidenceData: any = {};

    // Try multiple methods to get tracking info
    try {
      // Method 1: Get order by order number
      if (order.orderNumber) {
        const orderResponse = await client.getOrders({
          orderNumber: order.orderNumber,
          pageSize: 1,
        });

        if (orderResponse.orders && orderResponse.orders.length > 0) {
          ssOrder = orderResponse.orders[0];
          evidenceData.orderResponse = orderResponse;
          console.log(`[TrackingRefresh] Found order via orderNumber: ${order.orderNumber}`);
        }
      }

      // Method 2: Get shipments for this order
      if (order.externalId || ssOrder?.orderId) {
        const shipmentResponse = await client.getShipments({
          orderId: order.externalId || ssOrder?.orderId,
        });

        evidenceData.shipmentResponse = shipmentResponse;

        if (shipmentResponse.shipments && shipmentResponse.shipments.length > 0) {
          const latestShipment = shipmentResponse.shipments[0];
          console.log(
            `[TrackingRefresh] Found shipment: ${latestShipment.trackingNumber} via ${latestShipment.carrierCode}`
          );

          // Update order with tracking from shipment
          if (latestShipment.trackingNumber) {
            const updateData: any = {
              trackingNumber: latestShipment.trackingNumber,
              carrierCode: latestShipment.carrierCode,
              serviceCode: latestShipment.serviceCode,
              shipDate: latestShipment.shipDate ? new Date(latestShipment.shipDate) : null,
              updatedAt: new Date(),
            };

            // Store the full shipment data in orderData
            if (ssOrder) {
              ssOrder.shipments = shipmentResponse.shipments;
              updateData.orderData = ssOrder;
            }

            await db.update(orders).set(updateData).where(eq(orders.id, orderId));

            // Store JSON evidence in S3
            const evidenceKey = `tracking-evidence/${order.orderNumber}-${Date.now()}.json`;
            const evidenceJson = JSON.stringify(evidenceData, null, 2);
            const { url: evidenceUrl } = await storagePut(
              evidenceKey,
              Buffer.from(evidenceJson),
              'application/json'
            );

            console.log(`[TrackingRefresh] ✅ Updated order ${order.orderNumber} with tracking ${latestShipment.trackingNumber}`);
            console.log(`[TrackingRefresh] Evidence stored at: ${evidenceUrl}`);

            return {
              success: true,
              orderId,
              orderNumber: order.orderNumber,
              trackingNumber: latestShipment.trackingNumber,
              carrierCode: latestShipment.carrierCode,
              evidenceUrl,
            };
          }
        }
      }

      // Method 3: Search by customer email and date range
      if (order.customerEmail && order.orderDate) {
        const orderDate = new Date(order.orderDate);
        const startDate = new Date(orderDate);
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date(orderDate);
        endDate.setDate(endDate.getDate() + 7);

        const searchResponse = await client.getOrders({
          customerEmail: order.customerEmail,
          createDateStart: startDate.toISOString(),
          createDateEnd: endDate.toISOString(),
        });

        evidenceData.searchResponse = searchResponse;

        if (searchResponse.orders && searchResponse.orders.length > 0) {
          // Find best match by comparing customer name, amount, etc.
          const bestMatch = searchResponse.orders.find((o: any) => {
            return (
              o.customerEmail?.toLowerCase() === order.customerEmail?.toLowerCase() &&
              Math.abs(parseFloat(o.orderTotal || '0') - parseFloat(order.totalAmount || '0')) < 1
            );
          });

          if (bestMatch && bestMatch.shipments && bestMatch.shipments.length > 0) {
            const shipment = bestMatch.shipments[0];
            const updateData: any = {
              trackingNumber: shipment.trackingNumber,
              carrierCode: shipment.carrierCode,
              serviceCode: shipment.serviceCode,
              externalId: bestMatch.orderId?.toString(),
              orderData: bestMatch,
              updatedAt: new Date(),
            };

            await db.update(orders).set(updateData).where(eq(orders.id, orderId));

            // Store evidence
            const evidenceKey = `tracking-evidence/${order.orderNumber}-${Date.now()}.json`;
            const evidenceJson = JSON.stringify(evidenceData, null, 2);
            const { url: evidenceUrl } = await storagePut(
              evidenceKey,
              Buffer.from(evidenceJson),
              'application/json'
            );

            console.log(`[TrackingRefresh] ✅ Found match via search for ${order.orderNumber}`);

            return {
              success: true,
              orderId,
              orderNumber: order.orderNumber,
              trackingNumber: shipment.trackingNumber,
              carrierCode: shipment.carrierCode,
              evidenceUrl,
            };
          }
        }
      }

      // If we got here, no tracking was found
      // Store evidence anyway for debugging
      if (Object.keys(evidenceData).length > 0) {
        const evidenceKey = `tracking-evidence/${order.orderNumber}-${Date.now()}-no-tracking.json`;
        const evidenceJson = JSON.stringify(evidenceData, null, 2);
        const { url: evidenceUrl } = await storagePut(
          evidenceKey,
          Buffer.from(evidenceJson),
          'application/json'
        );

        console.log(`[TrackingRefresh] ⚠️ No tracking found for ${order.orderNumber}, evidence stored`);

        return {
          success: false,
          orderId,
          orderNumber: order.orderNumber,
          evidenceUrl,
          error: 'No tracking information available from ShipStation',
        };
      }

      return {
        success: false,
        orderId,
        orderNumber: order.orderNumber,
        error: 'No tracking information found',
      };
    } catch (apiError: any) {
      console.error(`[TrackingRefresh] API Error for ${order.orderNumber}:`, apiError);

      // Store error evidence
      const errorEvidence = {
        error: apiError.message,
        stack: apiError.stack,
        attemptedMethods: Object.keys(evidenceData),
        timestamp: new Date().toISOString(),
      };

      const evidenceKey = `tracking-evidence/${order.orderNumber}-${Date.now()}-error.json`;
      const evidenceJson = JSON.stringify(errorEvidence, null, 2);
      const { url: evidenceUrl } = await storagePut(
        evidenceKey,
        Buffer.from(evidenceJson),
        'application/json'
      );

      return {
        success: false,
        orderId,
        orderNumber: order.orderNumber,
        evidenceUrl,
        error: `API Error: ${apiError.message}`,
      };
    }
  } catch (error: any) {
    console.error(`[TrackingRefresh] Error refreshing order ${orderId}:`, error);
    return {
      success: false,
      orderId,
      orderNumber: '',
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Batch refresh tracking for multiple orders
 */
export async function batchRefreshTracking(
  orderIds: number[]
): Promise<TrackingRefreshResult[]> {
  const results: TrackingRefreshResult[] = [];

  for (const orderId of orderIds) {
    const result = await refreshOrderTracking(orderId);
    results.push(result);

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Auto-refresh orders missing tracking numbers
 * Run this periodically (e.g., daily) to catch delayed tracking info
 */
export async function autoRefreshMissingTracking(
  limit: number = 50
): Promise<{
  processed: number;
  updated: number;
  failed: number;
  results: TrackingRefreshResult[];
}> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  console.log(`[AutoRefresh] Finding orders with missing tracking (limit: ${limit})`);

  // Get orders without tracking that were created in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ordersWithoutTracking = await db
    .select()
    .from(orders)
    .where(
      or(
        isNull(orders.trackingNumber),
        eq(orders.trackingNumber, ''),
        eq(orders.trackingNumber, '—')
      )
    )
    .limit(limit);

  console.log(`[AutoRefresh] Found ${ordersWithoutTracking.length} orders to refresh`);

  const results = await batchRefreshTracking(ordersWithoutTracking.map((o) => o.id));

  const summary = {
    processed: results.length,
    updated: results.filter((r) => r.success && r.trackingNumber).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };

  console.log(`[AutoRefresh] Summary: ${summary.updated} updated, ${summary.failed} failed`);

  return summary;
}
