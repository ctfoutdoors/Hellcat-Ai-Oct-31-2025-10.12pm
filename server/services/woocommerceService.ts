/**
 * WooCommerce Service
 * Integration with WooCommerce for order management
 */

import { getServiceCredentials } from './apiService';

interface WooCommerceConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  total_tax: string;
  shipping_total: string;
  date_created: string;
  date_modified: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    subtotal: string;
    total: string;
    sku: string;
  }>;
  shipping_lines: Array<{
    id: number;
    method_title: string;
    method_id: string;
    total: string;
  }>;
  meta_data: Array<{
    key: string;
    value: any;
  }>;
}

/**
 * Make authenticated request to WooCommerce API
 */
async function wooCommerceRequest(
  config: WooCommerceConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  const url = `${config.storeUrl}/wp-json/wc/v3${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WooCommerce API error: ${response.statusText} - ${error}`);
  }

  return response.json();
}

/**
 * Get WooCommerce orders
 */
export async function getWooCommerceOrders(params?: {
  page?: number;
  perPage?: number;
  status?: string;
  after?: string;
  before?: string;
}): Promise<WooCommerceOrder[]> {
  const creds = await getServiceCredentials('WOOCOMMERCE');
  const config: WooCommerceConfig = {
    storeUrl: creds.store_url || process.env.WOOCOMMERCE_STORE_URL || '',
    consumerKey: creds.consumer_key || process.env.WOOCOMMERCE_CONSUMER_KEY || '',
    consumerSecret: creds.consumer_secret || process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  };

  if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
    throw new Error('WooCommerce credentials not configured');
  }

  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.perPage) queryParams.append('per_page', params.perPage.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.after) queryParams.append('after', params.after);
  if (params?.before) queryParams.append('before', params.before);

  const endpoint = `/orders?${queryParams.toString()}`;
  return await wooCommerceRequest(config, endpoint);
}

/**
 * Get single WooCommerce order
 */
export async function getWooCommerceOrder(orderId: number): Promise<WooCommerceOrder> {
  const creds = await getServiceCredentials('WOOCOMMERCE');
  const config: WooCommerceConfig = {
    storeUrl: creds.store_url || process.env.WOOCOMMERCE_STORE_URL || '',
    consumerKey: creds.consumer_key || process.env.WOOCOMMERCE_CONSUMER_KEY || '',
    consumerSecret: creds.consumer_secret || process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  };

  if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
    throw new Error('WooCommerce credentials not configured');
  }

  return await wooCommerceRequest(config, `/orders/${orderId}`);
}

/**
 * Get WooCommerce products
 */
export async function getWooCommerceProducts(params?: {
  page?: number;
  perPage?: number;
  search?: string;
  sku?: string;
}): Promise<any[]> {
  const creds = await getServiceCredentials('WOOCOMMERCE');
  const config: WooCommerceConfig = {
    storeUrl: creds.store_url || process.env.WOOCOMMERCE_STORE_URL || '',
    consumerKey: creds.consumer_key || process.env.WOOCOMMERCE_CONSUMER_KEY || '',
    consumerSecret: creds.consumer_secret || process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  };

  if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
    throw new Error('WooCommerce credentials not configured');
  }

  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.perPage) queryParams.append('per_page', params.perPage.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sku) queryParams.append('sku', params.sku);

  const endpoint = `/products?${queryParams.toString()}`;
  return await wooCommerceRequest(config, endpoint);
}

/**
 * Get single WooCommerce product
 */
export async function getWooCommerceProduct(productId: number): Promise<any> {
  const creds = await getServiceCredentials('WOOCOMMERCE');
  const config: WooCommerceConfig = {
    storeUrl: creds.store_url,
    consumerKey: creds.consumer_key,
    consumerSecret: creds.consumer_secret,
  };

  return await wooCommerceRequest(config, `/products/${productId}`);
}

/**
 * Update WooCommerce order
 */
export async function updateWooCommerceOrder(
  orderId: number,
  updates: Partial<WooCommerceOrder>
): Promise<WooCommerceOrder> {
  const creds = await getServiceCredentials('WOOCOMMERCE');
  const config: WooCommerceConfig = {
    storeUrl: creds.store_url,
    consumerKey: creds.consumer_key,
    consumerSecret: creds.consumer_secret,
  };

  return await wooCommerceRequest(config, `/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Add note to WooCommerce order
 */
export async function addWooCommerceOrderNote(
  orderId: number,
  note: string,
  customerNote: boolean = false
): Promise<any> {
  const creds = await getServiceCredentials('WOOCOMMERCE');
  const config: WooCommerceConfig = {
    storeUrl: creds.store_url,
    consumerKey: creds.consumer_key,
    consumerSecret: creds.consumer_secret,
  };

  return await wooCommerceRequest(config, `/orders/${orderId}/notes`, {
    method: 'POST',
    body: JSON.stringify({
      note,
      customer_note: customerNote,
    }),
  });
}

/**
 * Get WooCommerce order notes
 */
export async function getWooCommerceOrderNotes(orderId: number): Promise<any[]> {
  const creds = await getServiceCredentials('WOOCOMMERCE');
  const config: WooCommerceConfig = {
    storeUrl: creds.store_url,
    consumerKey: creds.consumer_key,
    consumerSecret: creds.consumer_secret,
  };

  return await wooCommerceRequest(config, `/orders/${orderId}/notes`);
}

/**
 * Test WooCommerce connection
 */
export async function testWooCommerceConnection(): Promise<boolean> {
  try {
    const creds = await getServiceCredentials('WOOCOMMERCE');
    const config: WooCommerceConfig = {
      storeUrl: creds.store_url,
      consumerKey: creds.consumer_key,
      consumerSecret: creds.consumer_secret,
    };

    await wooCommerceRequest(config, '/system_status');
    return true;
  } catch (error) {
    console.error('WooCommerce connection test failed:', error);
    return false;
  }
}

/**
 * Sync WooCommerce order to database
 */
export async function syncWooCommerceOrder(order: WooCommerceOrder, userId: number) {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // const { woocommerceOrders } = await import('../../drizzle/schema');
  // Table doesn't exist in schema - would need to be added
  throw new Error('WooCommerce orders table not implemented yet');

  //   // Check if order already exists
  //   const { eq } = await import('drizzle-orm');
  //   const existing = await db
  //     .select()
  //     .from(woocommerceOrders)
  //     .where(eq(woocommerceOrders.wooOrderId, order.id))
  //     .limit(1);
  // 
  //   const orderData = {
  //     wooOrderId: order.id,
  //     orderNumber: order.number,
  //     status: order.status,
  //     total: parseFloat(order.total),
  //     shippingTotal: parseFloat(order.shipping_total),
  //     customerName: `${order.billing.first_name} ${order.billing.last_name}`,
  //     customerEmail: order.billing.email,
  //     customerPhone: order.billing.phone || null,
  //     shippingAddress: JSON.stringify(order.shipping),
  //     billingAddress: JSON.stringify(order.billing),
  //     lineItems: JSON.stringify(order.line_items),
  //     orderDate: new Date(order.date_created),
  //     lastSyncedAt: new Date(),
  //   };
  // 
  //   if (existing.length > 0) {
  //     // Update existing
  //     await db
  //       .update(woocommerceOrders)
  //       .set(orderData)
  //       .where(eq(woocommerceOrders.id, existing[0].id));
  //     
  //     return existing[0].id;
  //   } else {
  //     // Insert new
  //     const result = await db.insert(woocommerceOrders).values(orderData);
  //     return result[0].insertId;
  //   }
}
