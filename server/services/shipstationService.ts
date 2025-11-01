/**
 * ShipStation API Service
 * Handles all ShipStation API interactions
 */

import { getServiceCredentials } from "./apiService";

const SHIPSTATION_API_BASE = "https://ssapi.shipstation.com";

interface ShipStationOrder {
  orderId: number;
  orderNumber: string;
  orderKey: string;
  orderDate: string;
  orderStatus: string;
  customerUsername: string;
  customerEmail: string;
  billTo: any;
  shipTo: any;
  items: any[];
  orderTotal: number;
  amountPaid: number;
  shippingAmount: number;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  weight: any;
  dimensions: any;
  shipDate: string;
  trackingNumber: string;
}

interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  orderKey: string;
  userId: string;
  orderNumber: string;
  createDate: string;
  shipDate: string;
  shipmentCost: number;
  insuranceCost: number;
  trackingNumber: string;
  isReturnLabel: boolean;
  batchNumber: string;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation: string;
  warehouseId: number;
  voided: boolean;
  voidDate: string;
  marketplaceNotified: boolean;
  notifyErrorMessage: string;
}

/**
 * Get ShipStation API headers
 */
async function getShipStationHeaders(accountName?: string): Promise<HeadersInit> {
  const credentials = await getServiceCredentials("SHIPSTATION", accountName);
  const { api_key, api_secret } = credentials;

  if (!api_key || !api_secret) {
    throw new Error("ShipStation credentials not configured");
  }

  const auth = Buffer.from(`${api_key}:${api_secret}`).toString("base64");

  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };
}

/**
 * List orders from ShipStation
 */
export async function listShipStationOrders(params: {
  accountName?: string;
  orderStatus?: string;
  orderDateStart?: string;
  orderDateEnd?: string;
  modifyDateStart?: string;
  modifyDateEnd?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ orders: ShipStationOrder[]; total: number; pages: number }> {
  const headers = await getShipStationHeaders(params.accountName);

  const queryParams = new URLSearchParams();
  if (params.orderStatus) queryParams.append("orderStatus", params.orderStatus);
  if (params.orderDateStart) queryParams.append("orderDateStart", params.orderDateStart);
  if (params.orderDateEnd) queryParams.append("orderDateEnd", params.orderDateEnd);
  if (params.modifyDateStart) queryParams.append("modifyDateStart", params.modifyDateStart);
  if (params.modifyDateEnd) queryParams.append("modifyDateEnd", params.modifyDateEnd);
  queryParams.append("page", String(params.page || 1));
  queryParams.append("pageSize", String(params.pageSize || 100));

  const response = await fetch(`${SHIPSTATION_API_BASE}/orders?${queryParams}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    orders: data.orders || [],
    total: data.total || 0,
    pages: data.pages || 0,
  };
}

/**
 * Get single order from ShipStation
 */
export async function getShipStationOrder(
  orderId: number,
  accountName?: string
): Promise<ShipStationOrder> {
  const headers = await getShipStationHeaders(accountName);

  const response = await fetch(`${SHIPSTATION_API_BASE}/orders/${orderId}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List shipments from ShipStation
 */
export async function listShipStationShipments(params: {
  accountName?: string;
  shipDateStart?: string;
  shipDateEnd?: string;
  createDateStart?: string;
  createDateEnd?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ shipments: ShipStationShipment[]; total: number; pages: number }> {
  const headers = await getShipStationHeaders(params.accountName);

  const queryParams = new URLSearchParams();
  if (params.shipDateStart) queryParams.append("shipDateStart", params.shipDateStart);
  if (params.shipDateEnd) queryParams.append("shipDateEnd", params.shipDateEnd);
  if (params.createDateStart) queryParams.append("createDateStart", params.createDateStart);
  if (params.createDateEnd) queryParams.append("createDateEnd", params.createDateEnd);
  queryParams.append("page", String(params.page || 1));
  queryParams.append("pageSize", String(params.pageSize || 100));

  const response = await fetch(`${SHIPSTATION_API_BASE}/shipments?${queryParams}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    shipments: data.shipments || [],
    total: data.total || 0,
    pages: data.pages || 0,
  };
}

/**
 * Get shipping rates for an order
 */
export async function getShipStationRates(params: {
  accountName?: string;
  carrierCode: string;
  serviceCode?: string;
  packageCode: string;
  fromPostalCode: string;
  toState: string;
  toCountry: string;
  toPostalCode: string;
  toCity: string;
  weight: {
    value: number;
    units: "pounds" | "ounces" | "grams";
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    units: "inches" | "centimeters";
  };
  confirmation?: string;
  residential?: boolean;
}): Promise<any[]> {
  const headers = await getShipStationHeaders(params.accountName);

  const response = await fetch(`${SHIPSTATION_API_BASE}/shipments/getrates`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List carriers from ShipStation
 */
export async function listShipStationCarriers(
  accountName?: string
): Promise<any[]> {
  const headers = await getShipStationHeaders(accountName);

  const response = await fetch(`${SHIPSTATION_API_BASE}/carriers`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List stores/channels from ShipStation
 */
export async function listShipStationStores(
  accountName?: string
): Promise<any[]> {
  const headers = await getShipStationHeaders(accountName);

  const response = await fetch(`${SHIPSTATION_API_BASE}/stores`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Create label for order
 */
export async function createShipStationLabel(params: {
  accountName?: string;
  orderId: number;
  carrierCode: string;
  serviceCode: string;
  packageCode: string;
  confirmation?: string;
  shipDate: string;
  weight: any;
  dimensions?: any;
  testLabel?: boolean;
}): Promise<any> {
  const headers = await getShipStationHeaders(params.accountName);

  const response = await fetch(`${SHIPSTATION_API_BASE}/orders/createlabelfororder`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.statusText}`);
  }

  return await response.json();
}


/**
 * Sync orders to database in real-time
 */
export async function syncOrdersToDatabase(
  orders: ShipStationOrder[],
  saveToDatabase: (orders: any[]) => Promise<void>
): Promise<{ synced: number; errors: number }> {
  try {
    const ordersToSave = orders.map(order => ({
      orderNumber: order.orderNumber,
      orderKey: order.orderKey,
      orderDate: new Date(order.orderDate),
      orderStatus: order.orderStatus,
      customerEmail: order.customerEmail,
      customerName: order.customerUsername,
      shippingAmount: Math.round(order.shippingAmount * 100), // Convert to cents
      orderTotal: Math.round(order.orderTotal * 100),
      carrierCode: order.carrierCode,
      serviceCode: order.serviceCode,
      trackingNumber: order.trackingNumber,
      shipDate: order.shipDate ? new Date(order.shipDate) : null,
      weight: order.weight,
      dimensions: order.dimensions,
      source: 'SHIPSTATION',
    }));

    await saveToDatabase(ordersToSave);

    return {
      synced: ordersToSave.length,
      errors: 0,
    };
  } catch (error) {
    console.error('Failed to sync orders:', error);
    return {
      synced: 0,
      errors: orders.length,
    };
  }
}

/**
 * Monitor shipments for rate changes
 */
export async function monitorShipmentRates(
  shipments: ShipStationShipment[]
): Promise<Array<{ trackingNumber: string; quotedRate: number; actualRate: number; difference: number }>> {
  const discrepancies: Array<{ trackingNumber: string; quotedRate: number; actualRate: number; difference: number }> = [];

  for (const shipment of shipments) {
    // In a real implementation, this would:
    // 1. Get the original quote from the order
    // 2. Compare with actual shipment cost
    // 3. Flag discrepancies for review
    
    // For now, return empty array
  }

  return discrepancies;
}

/**
 * Get recent shipments for auditing
 */
export async function getRecentShipmentsForAudit(
  daysBack: number = 30,
  accountName?: string
): Promise<ShipStationShipment[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { shipments } = await listShipStationShipments({
    accountName,
    shipDateStart: startDate.toISOString(),
    shipDateEnd: endDate.toISOString(),
    pageSize: 500,
  });

  return shipments;
}

/**
 * Auto-sync orders on schedule
 */
export async function autoSyncOrders(
  accountName?: string,
  saveToDatabase?: (orders: any[]) => Promise<void>
): Promise<{ success: boolean; synced: number; errors: number }> {
  try {
    // Get orders modified in last 24 hours
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const { orders } = await listShipStationOrders({
      accountName,
      modifyDateStart: startDate.toISOString(),
      modifyDateEnd: endDate.toISOString(),
      pageSize: 500,
    });

    if (saveToDatabase) {
      const result = await syncOrdersToDatabase(orders, saveToDatabase);
      return {
        success: true,
        synced: result.synced,
        errors: result.errors,
      };
    }

    return {
      success: true,
      synced: orders.length,
      errors: 0,
    };
  } catch (error) {
    console.error('Auto-sync failed:', error);
    return {
      success: false,
      synced: 0,
      errors: 1,
    };
  }
}


/**
 * Get shipment by tracking number
 */
export async function getShipmentByTracking(trackingNumber: string): Promise<ShipStationShipment | null> {
  try {
    // Use environment variables directly
    const apiKey = process.env.SHIPSTATION_API_KEY;
    const apiSecret = process.env.SHIPSTATION_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      throw new Error('ShipStation credentials not configured in environment variables');
    }
    
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    const url = `${SHIPSTATION_API_BASE}/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`;
    
    console.log('ShipStation API Request:', {
      url,
      trackingNumber,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      apiKeyLength: apiKey?.length,
      apiSecretLength: apiSecret?.length
    });
    
    const response = await fetch(
      url,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ShipStation API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: response.url
      });
      throw new Error(`ShipStation API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.shipments && data.shipments.length > 0) {
      return data.shipments[0]; // Return first matching shipment
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching shipment by tracking:', error);
    throw error;
  }
}
