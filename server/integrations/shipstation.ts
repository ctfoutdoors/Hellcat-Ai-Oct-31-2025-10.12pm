/**
 * ShipStation API Integration
 * Syncs orders and automatically creates cases from delivery exceptions
 */

interface ShipStationConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

interface ShipStationOrder {
  orderId: number;
  orderNumber: string;
  orderKey: string;
  orderDate: string;
  orderStatus: string;
  customerEmail: string;
  shipTo: {
    name: string;
    company: string;
    street1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    orderItemId: number;
    lineItemKey: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  carrierCode: string;
  serviceCode: string;
  trackingNumber: string;
  shipDate: string;
  deliveryDate?: string;
}

interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  trackingNumber: string;
  carrierCode: string;
  serviceCode: string;
  shipDate: string;
  deliveryDate?: string;
  voided: boolean;
  voidDate?: string;
}

export class ShipStationClient {
  private config: ShipStationConfig;
  private authHeader: string;

  constructor(apiKey: string, apiSecret: string) {
    this.config = {
      apiKey,
      apiSecret,
      baseUrl: 'https://ssapi.shipstation.com',
    };
    
    // ShipStation uses Basic Auth with API Key:API Secret
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`ShipStation API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all stores/channels
   */
  async getStores(): Promise<Array<{ storeId: number; storeName: string; marketplaceId: number; marketplaceName: string; active: boolean }>> {
    return this.request('/stores');
  }

  /**
   * Get orders with optional filters
   */
  async getOrders(params: {
    orderStatus?: string;
    orderDateStart?: string;
    orderDateEnd?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ orders: ShipStationOrder[]; total: number; pages: number }> {
    const queryParams = new URLSearchParams();
    
    if (params.orderStatus) queryParams.append('orderStatus', params.orderStatus);
    if (params.orderDateStart) queryParams.append('orderDateStart', params.orderDateStart);
    if (params.orderDateEnd) queryParams.append('orderDateEnd', params.orderDateEnd);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    return this.request(`/orders?${queryParams.toString()}`);
  }

  /**
   * Get shipments for tracking
   */
  async getShipments(params: {
    shipDateStart?: string;
    shipDateEnd?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ shipments: ShipStationShipment[]; total: number; pages: number }> {
    const queryParams = new URLSearchParams();
    
    if (params.shipDateStart) queryParams.append('shipDateStart', params.shipDateStart);
    if (params.shipDateEnd) queryParams.append('shipDateEnd', params.shipDateEnd);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    return this.request(`/shipments?${queryParams.toString()}`);
  }

  /**
   * Get all warehouses
   */
  async getWarehouses(): Promise<any[]> {
    const response = await this.request<{ warehouses?: any[] }>('/warehouses');
    return response.warehouses || response || [];
  }

  /**
   * Get products with optional filters
   */
  async getProducts(params: {
    sku?: string;
    warehouseId?: number;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ products: any[]; total: number; pages: number }> {
    const queryParams = new URLSearchParams();
    
    if (params.sku) queryParams.append('sku', params.sku);
    if (params.warehouseId) queryParams.append('warehouseId', params.warehouseId.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    return this.request(`/products?${queryParams.toString()}`);
  }

  /**
   * Get tracking information for a shipment
   */
  async getTracking(carrierCode: string, trackingNumber: string): Promise<any> {
    return this.request(`/shipments/getrates`, {
      method: 'POST',
      body: JSON.stringify({
        carrierCode,
        trackingNumber,
      }),
    });
  }

  /**
   * Detect delivery exceptions from orders
   * Returns orders that may need dispute cases
   */
  async detectExceptions(daysBack: number = 30): Promise<Array<{
    order: ShipStationOrder;
    exceptionType: 'late_delivery' | 'no_tracking' | 'missing_delivery_date';
    severity: 'high' | 'medium' | 'low';
  }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { orders } = await this.getOrders({
      orderStatus: 'shipped',
      orderDateStart: startDate.toISOString(),
      orderDateEnd: endDate.toISOString(),
      pageSize: 500,
    });

    const exceptions: Array<{
      order: ShipStationOrder;
      exceptionType: 'late_delivery' | 'no_tracking' | 'missing_delivery_date';
      severity: 'high' | 'medium' | 'low';
    }> = [];

    for (const order of orders) {
      // Check for missing tracking
      if (!order.trackingNumber) {
        exceptions.push({
          order,
          exceptionType: 'no_tracking',
          severity: 'medium',
        });
        continue;
      }

      // Check for late delivery (shipped > 7 days ago, no delivery date)
      const shipDate = new Date(order.shipDate);
      const daysSinceShip = Math.floor((Date.now() - shipDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceShip > 7 && !order.deliveryDate) {
        exceptions.push({
          order,
          exceptionType: 'late_delivery',
          severity: daysSinceShip > 14 ? 'high' : 'medium',
        });
      }
    }

    return exceptions;
  }
}

/**
 * Test ShipStation API connection
 * Returns connection status and account info
 */
export async function testShipStationConnection(): Promise<{
  success: boolean;
  message: string;
  accountInfo?: any;
}> {
  try {
    const client = createShipStationClient();
    if (!client) {
      return {
        success: false,
        message: 'ShipStation API credentials not configured',
      };
    }

    // Test by fetching stores (lightweight endpoint)
    const response = await client['request']<any>('/stores');
    
    return {
      success: true,
      message: 'Successfully connected to ShipStation',
      accountInfo: {
        storeCount: response.length || 0,
        stores: response.slice(0, 3).map((s: any) => ({
          storeId: s.storeId,
          storeName: s.storeName,
          active: s.active,
        })),
      },
    };
  } catch (error) {
    console.error('[ShipStation] Connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Initialize ShipStation client from environment variables
 */
export function createShipStationClient(): ShipStationClient | null {
  // Import ENV from core - using dynamic import converted to sync
  const apiKey = process.env.Shipstation_API_PK || process.env.SHIPSTATION_API_KEY || '';
  const apiSecret = process.env.Shipstation_API_Secret || process.env.SHIPSTATION_API_SECRET || '';

  // Debug logging
  console.log('[ShipStation] Environment variables check:');
  console.log('  shipstationApiKey:', apiKey ? '✓ Found' : '✗ Missing');
  console.log('  shipstationApiSecret:', apiSecret ? '✓ Found' : '✗ Missing');

  if (!apiKey || !apiSecret) {
    console.warn('[ShipStation] API credentials not configured - missing apiKey or apiSecret');
    console.warn('[ShipStation] Make sure Shipstation_API_PK and Shipstation_API_Secret are set in environment');
    return null;
  }

  console.log('[ShipStation] Client created successfully');
  return new ShipStationClient(apiKey, apiSecret);
}
