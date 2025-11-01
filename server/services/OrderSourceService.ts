import { getDb } from "../db";
import { orderSources, InsertOrderSource } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

/**
 * Multi-Channel Order Source Integration Service
 * 
 * Fetches order data from WooCommerce, Amazon, eBay, TikTok, and ShipStation
 * Provides unified order interface across all channels
 */

interface OrderData {
  orderId: string;
  channel: "woocommerce" | "amazon" | "ebay" | "tiktok" | "shipstation" | "other";
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderTotal: number; // in cents
  orderStatus: string;
  paymentMethod?: string;
  shippingAddress: string;
  trackingNumber?: string;
  shippingMethod?: string;
  itemCount: number;
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: number; // in cents
  }>;
  orderDate: Date;
  externalData?: Record<string, any>;
}

export class OrderSourceService {
  /**
   * Fetch order by tracking number from all sources
   */
  static async fetchOrderByTracking(trackingNumber: string): Promise<OrderData | null> {
    // Try ShipStation first (most likely source)
    let order = await this.fetchFromShipStation(trackingNumber);
    if (order) return order;

    // Try WooCommerce
    order = await this.fetchFromWooCommerce(trackingNumber);
    if (order) return order;

    // Try other sources...
    // Note: Amazon, eBay, TikTok typically don't support direct tracking lookup
    // They're usually accessed via ShipStation or order ID

    return null;
  }

  /**
   * Fetch order from ShipStation
   */
  private static async fetchFromShipStation(trackingNumber: string): Promise<OrderData | null> {
    try {
      const apiKey = ENV.shipstationApiKey;
      const apiSecret = ENV.shipstationApiSecret;

      if (!apiKey || !apiSecret) {
        console.warn("[OrderSource] ShipStation credentials not configured");
        return null;
      }

      const response = await fetch(
        `https://ssapi.shipstation.com/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.warn(`[OrderSource] ShipStation API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.shipments || data.shipments.length === 0) {
        return null;
      }

      const shipment = data.shipments[0];

      // Fetch full order details
      const orderResponse = await fetch(
        `https://ssapi.shipstation.com/orders/${shipment.orderId}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!orderResponse.ok) {
        console.warn(`[OrderSource] ShipStation order API error: ${orderResponse.status}`);
        return null;
      }

      const orderData = await orderResponse.json();

      // Map to unified format
      const order: OrderData = {
        orderId: orderData.orderNumber || orderData.orderId.toString(),
        channel: this.detectChannelFromShipStation(orderData),
        customerEmail: orderData.customerEmail || "",
        customerName: orderData.customerName || `${orderData.shipTo.name}`,
        customerPhone: orderData.customerPhone || orderData.shipTo.phone,
        orderTotal: Math.round((orderData.orderTotal || 0) * 100),
        orderStatus: orderData.orderStatus,
        paymentMethod: orderData.paymentMethod,
        shippingAddress: this.formatAddress(orderData.shipTo),
        trackingNumber: shipment.trackingNumber,
        shippingMethod: shipment.serviceCode,
        itemCount: orderData.items?.length || 0,
        items: (orderData.items || []).map((item: any) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: Math.round((item.unitPrice || 0) * 100),
        })),
        orderDate: new Date(orderData.orderDate),
        externalData: {
          shipstationOrderId: orderData.orderId,
          shipmentId: shipment.shipmentId,
          carrierCode: shipment.carrierCode,
        },
      };

      // Store in database
      await this.storeOrder(order);

      return order;
    } catch (error) {
      console.error("[OrderSource] ShipStation error:", error);
      return null;
    }
  }

  /**
   * Fetch order from WooCommerce
   */
  private static async fetchFromWooCommerce(trackingNumber: string): Promise<OrderData | null> {
    try {
      const storeUrl = ENV.woocommerceStoreUrl;
      const consumerKey = ENV.woocommerceConsumerKey;
      const consumerSecret = ENV.woocommerceConsumerSecret;

      if (!storeUrl || !consumerKey || !consumerSecret) {
        console.warn("[OrderSource] WooCommerce credentials not configured");
        return null;
      }

      // WooCommerce doesn't have direct tracking lookup, need to search orders
      // This is a simplified example - actual implementation may vary
      const response = await fetch(
        `${storeUrl}/wp-json/wc/v3/orders?search=${encodeURIComponent(trackingNumber)}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.warn(`[OrderSource] WooCommerce API error: ${response.status}`);
        return null;
      }

      const orders = await response.json();

      if (!orders || orders.length === 0) {
        return null;
      }

      const wooOrder = orders[0];

      const order: OrderData = {
        orderId: wooOrder.number || wooOrder.id.toString(),
        channel: "woocommerce",
        customerEmail: wooOrder.billing.email,
        customerName: `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`,
        customerPhone: wooOrder.billing.phone,
        orderTotal: Math.round(parseFloat(wooOrder.total) * 100),
        orderStatus: wooOrder.status,
        paymentMethod: wooOrder.payment_method_title,
        shippingAddress: this.formatWooCommerceAddress(wooOrder.shipping),
        trackingNumber,
        shippingMethod: wooOrder.shipping_lines?.[0]?.method_title,
        itemCount: wooOrder.line_items?.length || 0,
        items: (wooOrder.line_items || []).map((item: any) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: Math.round(parseFloat(item.price) * 100),
        })),
        orderDate: new Date(wooOrder.date_created),
        externalData: {
          woocommerceOrderId: wooOrder.id,
        },
      };

      await this.storeOrder(order);

      return order;
    } catch (error) {
      console.error("[OrderSource] WooCommerce error:", error);
      return null;
    }
  }

  /**
   * Detect sales channel from ShipStation order
   */
  private static detectChannelFromShipStation(orderData: any): OrderData["channel"] {
    const advancedOptions = orderData.advancedOptions || {};
    const storeId = orderData.storeId;

    // Check for channel indicators
    if (advancedOptions.source?.toLowerCase().includes("amazon")) return "amazon";
    if (advancedOptions.source?.toLowerCase().includes("ebay")) return "ebay";
    if (advancedOptions.source?.toLowerCase().includes("tiktok")) return "tiktok";
    if (advancedOptions.source?.toLowerCase().includes("woocommerce")) return "woocommerce";

    // Default to shipstation
    return "shipstation";
  }

  /**
   * Format address object to string
   */
  private static formatAddress(address: any): string {
    const parts = [
      address.street1,
      address.street2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Format WooCommerce address to string
   */
  private static formatWooCommerceAddress(address: any): string {
    const parts = [
      address.address_1,
      address.address_2,
      address.city,
      address.state,
      address.postcode,
      address.country,
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Store order in database
   */
  private static async storeOrder(order: OrderData): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const orderData: InsertOrderSource = {
      orderId: order.orderId,
      channel: order.channel,
      customerEmail: order.customerEmail.toLowerCase(),
      customerName: order.customerName,
      customerPhone: order.customerPhone || null,
      orderTotal: order.orderTotal,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod || null,
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber || null,
      shippingMethod: order.shippingMethod || null,
      itemCount: order.itemCount,
      items: JSON.stringify(order.items),
      externalData: order.externalData ? JSON.stringify(order.externalData) : null,
      orderDate: order.orderDate,
      syncedAt: new Date(),
    };

    await db
      .insert(orderSources)
      .values(orderData)
      .onDuplicateKeyUpdate({
        set: {
          orderStatus: orderData.orderStatus,
          syncedAt: new Date(),
        },
      });
  }

  /**
   * Get cached order from database
   */
  static async getCachedOrder(trackingNumber: string): Promise<OrderData | null> {
    const db = await getDb();
    if (!db) return null;

    const [order] = await db
      .select()
      .from(orderSources)
      .where(eq(orderSources.trackingNumber, trackingNumber));

    if (!order) return null;

    return {
      orderId: order.orderId,
      channel: order.channel,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone || undefined,
      orderTotal: order.orderTotal,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod || undefined,
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber || undefined,
      shippingMethod: order.shippingMethod || undefined,
      itemCount: order.itemCount,
      items: order.items ? JSON.parse(order.items) : [],
      orderDate: order.orderDate,
      externalData: order.externalData ? JSON.parse(order.externalData) : undefined,
    };
  }

  /**
   * Get channel icon/logo
   */
  static getChannelIcon(channel: OrderData["channel"]): string {
    const icons: Record<OrderData["channel"], string> = {
      woocommerce: "🛒",
      amazon: "📦",
      ebay: "🔨",
      tiktok: "🎵",
      shipstation: "🚢",
      other: "📋",
    };

    return icons[channel];
  }

  /**
   * Get channel display name
   */
  static getChannelName(channel: OrderData["channel"]): string {
    const names: Record<OrderData["channel"], string> = {
      woocommerce: "WooCommerce",
      amazon: "Amazon",
      ebay: "eBay",
      tiktok: "TikTok Shop",
      shipstation: "ShipStation",
      other: "Other",
    };

    return names[channel];
  }
}
