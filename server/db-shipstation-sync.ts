/**
 * ShipStation Order Sync Functions
 * Syncs orders from ShipStation API to local database
 */

import { getDb } from './db';
import { orders } from '../drizzle/schema';
import { createShipStationClient } from './integrations/shipstation';
import { eq } from 'drizzle-orm';

interface ShipStationOrder {
  orderId: number;
  orderNumber: string;
  orderKey: string;
  orderDate: string;
  orderStatus: string;
  customerUsername?: string;
  customerEmail?: string;
  billTo?: {
    name?: string;
    company?: string;
    street1?: string;
    street2?: string;
    street3?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  shipTo?: {
    name?: string;
    company?: string;
    street1?: string;
    street2?: string;
    street3?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  items?: Array<{
    orderItemId?: number;
    lineItemKey?: string;
    sku?: string;
    name?: string;
    imageUrl?: string;
    weight?: any;
    quantity?: number;
    unitPrice?: number;
    taxAmount?: number;
    shippingAmount?: number;
    warehouseLocation?: string;
    options?: any[];
    productId?: number;
    fulfillmentSku?: string;
    adjustment?: boolean;
    upc?: string;
    createDate?: string;
    modifyDate?: string;
  }>;
  orderTotal?: number;
  amountPaid?: number;
  taxAmount?: number;
  shippingAmount?: number;
  customerNotes?: string;
  internalNotes?: string;
  gift?: boolean;
  giftMessage?: string;
  paymentMethod?: string;
  requestedShippingService?: string;
  carrierCode?: string;
  serviceCode?: string;
  packageCode?: string;
  confirmation?: string;
  shipDate?: string;
  holdUntilDate?: string;
  weight?: any;
  dimensions?: any;
  insuranceOptions?: any;
  internationalOptions?: any;
  advancedOptions?: any;
  tagIds?: number[];
  userId?: string;
  externallyFulfilled?: boolean;
  externallyFulfilledBy?: string;
  labelMessages?: any;
}

/**
 * Sync orders from ShipStation
 * @param daysBack Number of days to look back for orders (default: 30)
 * @returns Summary of sync operation
 */
export async function syncOrdersFromShipStation(daysBack: number = 30): Promise<{
  success: boolean;
  ordersProcessed: number;
  ordersCreated: number;
  ordersUpdated: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const client = createShipStationClient();
  if (!client) {
    throw new Error('ShipStation client not configured');
  }

  const result = {
    success: true,
    ordersProcessed: 0,
    ordersCreated: 0,
    ordersUpdated: 0,
    errors: [] as string[],
  };

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log(`[ShipStation Sync] Fetching orders from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch orders from ShipStation
    const response = await client.getOrders({
      orderDateStart: startDate.toISOString(),
      orderDateEnd: endDate.toISOString(),
      pageSize: 500, // Max page size
    });

    const shipstationOrders: ShipStationOrder[] = response.orders || [];
    console.log(`[ShipStation Sync] Retrieved ${shipstationOrders.length} orders`);

    // Process each order
    for (const ssOrder of shipstationOrders) {
      try {
        result.ordersProcessed++;

        // Check if order already exists
        const existing = await db
          .select()
          .from(orders)
          .where(eq(orders.orderNumber, ssOrder.orderNumber))
          .limit(1);

        const orderData = {
          orderNumber: ssOrder.orderNumber,
          source: 'shipstation',
          channel: ssOrder.advancedOptions?.source || 'Unknown',
          externalId: ssOrder.orderId?.toString(),
          customerName: ssOrder.shipTo?.name || ssOrder.billTo?.name || 'Unknown',
          customerEmail: ssOrder.customerEmail || '',
          customerPhone: ssOrder.shipTo?.phone || ssOrder.billTo?.phone || null,
          shippingAddress: ssOrder.shipTo || null,
          orderDate: new Date(ssOrder.orderDate),
          shipDate: ssOrder.shipDate ? new Date(ssOrder.shipDate) : null,
          totalAmount: ssOrder.orderTotal?.toString() || '0',
          shippingCost: ssOrder.shippingAmount?.toString() || '0',
          taxAmount: ssOrder.taxAmount?.toString() || '0',
          status: ssOrder.orderStatus || 'unknown',
          orderItems: ssOrder.items || [],
          trackingNumber: null, // Will be filled when shipment is created
          carrierCode: ssOrder.carrierCode || null,
          serviceCode: ssOrder.serviceCode || null,
          shipmentId: null,
          orderData: ssOrder, // Store full ShipStation response
        };

        if (existing.length > 0) {
          // Update existing order
          await db
            .update(orders)
            .set({
              ...orderData,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, existing[0].id));
          result.ordersUpdated++;
        } else {
          // Create new order
          await db.insert(orders).values(orderData as any);
          result.ordersCreated++;
        }
      } catch (error) {
        console.error(`[ShipStation Sync] Error processing order ${ssOrder.orderNumber}:`, error);
        result.errors.push(`Order ${ssOrder.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`[ShipStation Sync] Complete: ${result.ordersCreated} created, ${result.ordersUpdated} updated`);
  } catch (error) {
    console.error('[ShipStation Sync] Fatal error:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Get sync status and statistics
 */
export async function getShipStationSyncStatus() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const allOrders = await db.select().from(orders).where(eq(orders.source, 'shipstation'));

  const stats = {
    totalOrders: allOrders.length,
    byStatus: {} as Record<string, number>,
    byChannel: {} as Record<string, number>,
    recentOrders: allOrders.slice(0, 10),
  };

  // Count by status
  allOrders.forEach(order => {
    const status = order.status || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  // Count by channel
  allOrders.forEach(order => {
    const channel = order.channel || 'Unknown';
    stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
  });

  return stats;
}
