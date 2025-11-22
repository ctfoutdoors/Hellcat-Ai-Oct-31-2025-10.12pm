import axios from "axios";
import { getDb } from "../db";
import { customers, orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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
  date_created: string;
  meta_data?: Array<{ key: string; value: any }>;
}

interface WooOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  customer_id: number;
  billing: any;
  shipping: any;
  line_items: any[];
  customer_note: string;
  order_key: string;
  meta_data?: Array<{ key: string; value: any }>;
}

export class WooCommerceSync {
  private config: WooCommerceConfig;
  private api: any;

  constructor(config: WooCommerceConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: `${config.url}/wp-json/wc/v3`,
      auth: {
        username: config.consumerKey,
        password: config.consumerSecret,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Import customers from WooCommerce
   */
  async importCustomers(options: { page?: number; perPage?: number } = {}) {
    const { page = 1, perPage = 100 } = options;
    
    try {
      const response = await this.api.get("/customers", {
        params: {
          page,
          per_page: perPage,
        },
      });

      const wooCustomers: WooCustomer[] = response.data;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const imported = [];
      
      for (const wooCustomer of wooCustomers) {
        // Check if customer already exists
        const existing = await db
          .select()
          .from(customers)
          .where(eq(customers.email, wooCustomer.email))
          .limit(1);

        const customerData = {
          // woocommerceId: wooCustomer.id,
          customerType: wooCustomer.billing.company ? "company" : "individual",
          companyName: wooCustomer.billing.company || null,
          firstName: wooCustomer.first_name || wooCustomer.billing.first_name,
          lastName: wooCustomer.last_name || wooCustomer.billing.last_name,
          email: wooCustomer.email || wooCustomer.billing.email,
          phone: wooCustomer.billing.phone || null,
          billingAddress: wooCustomer.billing ? JSON.stringify(wooCustomer.billing) : null,
          shippingAddress: wooCustomer.shipping ? JSON.stringify(wooCustomer.shipping) : null,
          source: "woocommerce",
          tags: ["woocommerce"],
        };

        if (existing.length > 0) {
          // Update existing
          await db
            .update(customers)
            .set({
              ...customerData,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, existing[0].id));
          
          imported.push({ id: existing[0].id, action: "updated" });
        } else {
          // Insert new
          const [result] = await db.insert(customers).values([customerData]);
          imported.push({ id: result.insertId, action: "created" });
        }
      }

      return {
        success: true,
        imported: imported.length,
        details: imported,
        hasMore: wooCustomers.length === perPage,
      };
    } catch (error: any) {
      console.error("WooCommerce customer import error:", error.message);
      return {
        success: false,
        error: error.message,
        imported: 0,
      };
    }
  }

  /**
   * Import orders from WooCommerce
   */
  async importOrders(options: { page?: number; perPage?: number; status?: string } = {}) {
    const { page = 1, perPage = 100, status } = options;
    
    try {
      const params: any = {
        page,
        per_page: perPage,
      };
      
      if (status) {
        params.status = status;
      }

      const response = await this.api.get("/orders", { params });
      const wooOrders: WooOrder[] = response.data;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const imported = [];
      
      for (const wooOrder of wooOrders) {
        // Check if order already exists
        const existing = await db
          .select()
          .from(orders)
          .where(eq(orders.woocommerceId, wooOrder.id))
          .limit(1);

        // Find customer by WooCommerce ID
        let customerId = null;
        if (wooOrder.customer_id) {
          const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.email, wooOrder.billing.email))
            .limit(1);
          
          if (customer.length > 0) {
            customerId = customer[0].id;
          }
        }

        const orderData = {
          woocommerceId: wooOrder.id,
          orderNumber: wooOrder.number,
          customerId,
          orderDate: new Date(wooOrder.date_created),
          status: wooOrder.status,
          total: wooOrder.total,
          customerNote: wooOrder.customer_note || null,
          billingAddress: JSON.stringify(wooOrder.billing),
          shippingAddress: JSON.stringify(wooOrder.shipping),
          lineItems: JSON.stringify(wooOrder.line_items),
          source: "woocommerce",
        };

        if (existing.length > 0) {
          // Update existing
          await db
            .update(orders)
            .set({
              ...orderData,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, existing[0].id));
          
          imported.push({ id: existing[0].id, action: "updated" });
        } else {
          // Insert new
          const [result] = await db.insert(orders).values(orderData);
          imported.push({ id: result.insertId, action: "created" });
        }
      }

      return {
        success: true,
        imported: imported.length,
        details: imported,
        hasMore: wooOrders.length === perPage,
      };
    } catch (error: any) {
      console.error("WooCommerce order import error:", error.message);
      return {
        success: false,
        error: error.message,
        imported: 0,
      };
    }
  }

  /**
   * Get a single customer by WooCommerce ID
   */
  async getCustomer(wooCustomerId: number) {
    try {
      const response = await this.api.get(`/customers/${wooCustomerId}`);
      return { success: true, customer: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single order by WooCommerce ID
   */
  async getOrder(wooOrderId: number) {
    try {
      const response = await this.api.get(`/orders/${wooOrderId}`);
      return { success: true, order: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance (will be configured from settings)
let wooSyncInstance: WooCommerceSync | null = null;

export function getWooCommerceSync(config?: WooCommerceConfig): WooCommerceSync | null {
  if (config) {
    wooSyncInstance = new WooCommerceSync(config);
  }
  return wooSyncInstance;
}
