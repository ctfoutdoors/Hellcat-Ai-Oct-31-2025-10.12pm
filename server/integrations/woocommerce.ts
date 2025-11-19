/**
 * WooCommerce API Integration
 * Syncs orders and customers from WooCommerce store
 */

interface WooCommerceConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

interface WooCommerceOrder {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: string;
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_paid_gmt: string | null;
  date_completed: string | null;
  date_completed_gmt: string | null;
  cart_hash: string;
  meta_data: any[];
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    taxes: any[];
    meta_data: any[];
    sku: string;
    price: number;
  }>;
  tax_lines: any[];
  shipping_lines: any[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
}

interface WooCommerceCustomer {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: any[];
}

export class WooCommerceClient {
  private config: WooCommerceConfig;
  private authHeader: string;

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string) {
    this.config = {
      storeUrl: storeUrl.replace(/\/$/, ''), // Remove trailing slash
      consumerKey,
      consumerSecret,
    };
    
    // WooCommerce uses Basic Auth with Consumer Key:Consumer Secret
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.storeUrl}/wp-json/wc/v3${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WooCommerce API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get orders with optional filters
   */
  async getOrders(params: {
    status?: string;
    after?: string;
    before?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<WooCommerceOrder[]> {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.after) queryParams.append('after', params.after);
    if (params.before) queryParams.append('before', params.before);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    return this.request(`/orders?${queryParams.toString()}`);
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    return this.request(`/orders/${orderId}`);
  }

  /**
   * Get customers with optional filters
   */
  async getCustomers(params: {
    role?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<WooCommerceCustomer[]> {
    const queryParams = new URLSearchParams();
    
    if (params.role) queryParams.append('role', params.role);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());

    return this.request(`/customers?${queryParams.toString()}`);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: number): Promise<WooCommerceCustomer> {
    return this.request(`/customers/${customerId}`);
  }

  /**
   * Get product variations for a specific product
   */
  async getProductVariations(productId: number): Promise<any[]> {
    return this.request(`/products/${productId}/variations?per_page=100`);
  }

  /**
   * Get products from WooCommerce
   */
  async getProducts(params: {
    per_page?: number;
    page?: number;
    status?: string;
  } = {}): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.status) queryParams.append('status', params.status);
    
    return this.request(`/products?${queryParams.toString()}`);
  }

  /**
   * Test connection to WooCommerce
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/system_status');
      return true;
    } catch (error) {
      console.error('[WooCommerce] Connection test failed:', error);
      return false;
    }
  }
}

/**
 * Initialize WooCommerce client from environment variables
 */
export function createWooCommerceClient(): WooCommerceClient | null {
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL || '';
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || '';

  console.log('[WooCommerce] Environment variables check:');
  console.log('  storeUrl:', storeUrl ? '✓ Found' : '✗ Missing');
  console.log('  consumerKey:', consumerKey ? '✓ Found' : '✗ Missing');
  console.log('  consumerSecret:', consumerSecret ? '✓ Found' : '✗ Missing');

  if (!storeUrl || !consumerKey || !consumerSecret) {
    console.warn('[WooCommerce] Missing required credentials');
    return null;
  }

  return new WooCommerceClient(storeUrl, consumerKey, consumerSecret);
}

/**
 * Test WooCommerce connection
 */
export async function testWooCommerceConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const client = createWooCommerceClient();
  
  if (!client) {
    return {
      connected: false,
      error: 'WooCommerce credentials not configured',
    };
  }

  try {
    const connected = await client.testConnection();
    return { connected };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
    };
  }
}
