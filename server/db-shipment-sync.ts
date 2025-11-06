/**
 * ShipStation Shipment Sync with Intelligent Order Matching
 * Matches shipments to orders using multiple strategies
 */

import { getDb } from './db';
import { orders } from '../drizzle/schema';
import { createShipStationClient } from './integrations/shipstation';
import { eq, and, gte, lte, or, like } from 'drizzle-orm';

interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  orderNumber: string;
  orderKey: string;
  userId: string;
  customerEmail: string;
  orderDate: string;
  createDate: string;
  shipDate: string;
  shipTo: {
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
  weight: any;
  dimensions: any;
  insurance: any;
  shipmentCost: number;
  trackingNumber: string;
  isReturnLabel: boolean;
  batchNumber: string;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation: string;
  warehouseId: number;
  voided: boolean;
  voidDate: string | null;
  marketplaceNotified: boolean;
  notifyErrorMessage: string | null;
  shipmentItems: Array<{
    orderItemId: number;
    lineItemKey: string;
    sku: string;
    name: string;
    imageUrl: string;
    weight: any;
    quantity: number;
    unitPrice: number;
    warehouseLocation: string;
    options: any[];
    productId: number;
    fulfillmentSku: string;
  }>;
  labelData: string | null;
  formData: string | null;
  advancedOptions: any;
}

/**
 * Intelligent order matching using multiple strategies
 */
async function findMatchingOrder(
  db: any,
  shipment: ShipStationShipment,
  allOrders: any[]
): Promise<any | null> {
  console.log(`[Matching] Attempting to match shipment ${shipment.trackingNumber} for order ${shipment.orderNumber}`);

  // Strategy 1: Direct order number match
  let match = allOrders.find(o => o.orderNumber === shipment.orderNumber);
  if (match) {
    console.log(`[Matching] ✓ Matched by order number: ${shipment.orderNumber}`);
    return { order: match, strategy: 'order_number' };
  }

  // Strategy 2: External ID match (ShipStation orderId)
  match = allOrders.find(o => o.externalId === shipment.orderId?.toString());
  if (match) {
    console.log(`[Matching] ✓ Matched by external ID: ${shipment.orderId}`);
    return { order: match, strategy: 'external_id' };
  }

  // Strategy 3: Order key match
  match = allOrders.find(o => {
    const orderData = o.orderData as any;
    return orderData?.orderKey === shipment.orderKey;
  });
  if (match) {
    console.log(`[Matching] ✓ Matched by order key: ${shipment.orderKey}`);
    return { order: match, strategy: 'order_key' };
  }

  // Strategy 4: Search in order notes for order number
  match = allOrders.find(o => {
    const orderData = o.orderData as any;
    const customerNotes = orderData?.customerNotes || '';
    const internalNotes = orderData?.internalNotes || '';
    const allNotes = `${customerNotes} ${internalNotes}`.toLowerCase();
    
    // Check if shipment's order number appears in notes
    return allNotes.includes(shipment.orderNumber.toLowerCase());
  });
  if (match) {
    console.log(`[Matching] ✓ Matched by order number in notes: ${shipment.orderNumber}`);
    return { order: match, strategy: 'notes_order_number' };
  }

  // Strategy 5: Customer email + date range (±3 days)
  if (shipment.customerEmail) {
    const shipDate = new Date(shipment.shipDate);
    const startDate = new Date(shipDate);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(shipDate);
    endDate.setDate(endDate.getDate() + 3);

    match = allOrders.find(o => {
      const orderDate = new Date(o.orderDate);
      return (
        o.customerEmail?.toLowerCase() === shipment.customerEmail.toLowerCase() &&
        orderDate >= startDate &&
        orderDate <= endDate
      );
    });
    
    if (match) {
      console.log(`[Matching] ✓ Matched by customer email + date: ${shipment.customerEmail}`);
      return { order: match, strategy: 'customer_email_date' };
    }
  }

  // Strategy 6: Customer name + ship date (same day)
  if (shipment.shipTo?.name) {
    const shipDate = new Date(shipment.shipDate).toDateString();
    
    match = allOrders.find(o => {
      const orderDate = new Date(o.orderDate).toDateString();
      const shippingAddr = o.shippingAddress as any;
      return (
        shippingAddr?.name?.toLowerCase() === shipment.shipTo.name?.toLowerCase() &&
        orderDate === shipDate
      );
    });
    
    if (match) {
      console.log(`[Matching] ✓ Matched by customer name + date: ${shipment.shipTo.name}`);
      return { order: match, strategy: 'customer_name_date' };
    }
  }

  // Strategy 7: Tracking number already exists in order
  match = allOrders.find(o => o.trackingNumber === shipment.trackingNumber);
  if (match) {
    console.log(`[Matching] ✓ Matched by existing tracking number: ${shipment.trackingNumber}`);
    return { order: match, strategy: 'tracking_number' };
  }

  console.log(`[Matching] ✗ No match found for shipment ${shipment.trackingNumber}`);
  return null;
}

/**
 * Sync shipments from ShipStation and match to orders
 */
export async function syncShipmentsFromShipStation(daysBack: number = 30): Promise<{
  success: boolean;
  shipmentsProcessed: number;
  ordersMatched: number;
  ordersUnmatched: number;
  matchStrategies: Record<string, number>;
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
    shipmentsProcessed: 0,
    ordersMatched: 0,
    ordersUnmatched: 0,
    matchStrategies: {} as Record<string, number>,
    errors: [] as string[],
  };

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    console.log(`[Shipment Sync] Fetching shipments from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch shipments from ShipStation
    const response = await client.getShipments({
      shipDateStart: startDate.toISOString(),
      shipDateEnd: endDate.toISOString(),
      pageSize: 500,
    });

    const shipments: ShipStationShipment[] = response.shipments || [];
    console.log(`[Shipment Sync] Retrieved ${shipments.length} shipments`);

    // Fetch all orders from database for matching
    const allOrders = await db.select().from(orders);
    console.log(`[Shipment Sync] Loaded ${allOrders.length} orders for matching`);

    // Process each shipment
    for (const shipment of shipments) {
      try {
        result.shipmentsProcessed++;

        // Skip voided shipments
        if (shipment.voided) {
          console.log(`[Shipment Sync] Skipping voided shipment: ${shipment.trackingNumber}`);
          continue;
        }

        // Try to match shipment to order
        const matchResult = await findMatchingOrder(db, shipment, allOrders);

        if (matchResult) {
          const { order, strategy } = matchResult;
          
          // Update order with shipment details
          await db
            .update(orders)
            .set({
              trackingNumber: shipment.trackingNumber,
              carrierCode: shipment.carrierCode,
              serviceCode: shipment.serviceCode,
              shipDate: new Date(shipment.shipDate),
              status: 'shipped', // Update status to shipped
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id));

          result.ordersMatched++;
          result.matchStrategies[strategy] = (result.matchStrategies[strategy] || 0) + 1;
          
          console.log(`[Shipment Sync] ✓ Matched and updated order ${order.orderNumber} with tracking ${shipment.trackingNumber}`);
        } else {
          result.ordersUnmatched++;
          console.log(`[Shipment Sync] ✗ Could not match shipment ${shipment.trackingNumber} to any order`);
        }
      } catch (error) {
        console.error(`[Shipment Sync] Error processing shipment ${shipment.trackingNumber}:`, error);
        result.errors.push(`Shipment ${shipment.trackingNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`[Shipment Sync] Complete: ${result.ordersMatched} matched, ${result.ordersUnmatched} unmatched`);
    console.log(`[Shipment Sync] Match strategies used:`, result.matchStrategies);
  } catch (error) {
    console.error('[Shipment Sync] Fatal error:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Get shipment sync statistics
 */
export async function getShipmentSyncStats() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const allOrders = await db.select().from(orders);

  const stats = {
    totalOrders: allOrders.length,
    withTracking: allOrders.filter(o => o.trackingNumber).length,
    withoutTracking: allOrders.filter(o => !o.trackingNumber).length,
    byCarrier: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  };

  // Count by carrier
  allOrders.forEach(order => {
    if (order.carrierCode) {
      stats.byCarrier[order.carrierCode] = (stats.byCarrier[order.carrierCode] || 0) + 1;
    }
  });

  // Count by status
  allOrders.forEach(order => {
    const status = order.status || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
  });

  return stats;
}
