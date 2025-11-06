import { getDb } from "../db";
import { cases } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { sendNewDraftCaseNotification, sendBulkCaseNotification } from "./emailService";

interface ShipStationOrder {
  orderId: number;
  orderNumber: string;
  orderKey: string;
  orderDate: string;
  shipDate?: string;
  shipTo: {
    name: string;
    street1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  shipFrom: {
    name: string;
    street1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    weight?: {
      value: number;
      units: string;
    };
  }>;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    units: string;
  };
  weight?: {
    value: number;
    units: string;
  };
  carrierCode?: string;
  serviceCode?: string;
  trackingNumber?: string;
  shippingAmount?: number;
  advancedOptions?: any;
}

interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  trackingNumber: string;
  carrierCode: string;
  serviceCode: string;
  shipDate: string;
  shipmentCost: number;
  insuranceCost?: number;
  trackingStatus?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    units: string;
  };
  weight?: {
    value: number;
    units: string;
  };
  voided: boolean;
}

export class ShipStationSyncService {
  private static apiKey = process.env.SHIPSTATION_API_KEY;
  private static apiSecret = process.env.SHIPSTATION_API_SECRET;
  private static apiV2Key = process.env.SHIPSTATION_API_V2_KEY;
  private static baseUrl = "https://ssapi.shipstation.com";

  /**
   * Get authorization header for ShipStation API
   */
  private static getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString("base64");
    return `Basic ${credentials}`;
  }

  /**
   * Fetch recent shipments from ShipStation
   */
  static async fetchRecentShipments(daysBack: number = 7): Promise<ShipStationShipment[]> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("ShipStation API credentials not configured");
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    try {
      const response = await axios.get(`${this.baseUrl}/shipments`, {
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        params: {
          shipDateStart: startDate.toISOString(),
          shipDateEnd: new Date().toISOString(),
          pageSize: 500,
        },
      });

      return response.data.shipments || [];
    } catch (error: any) {
      console.error("Error fetching ShipStation shipments:", error.message);
      throw error;
    }
  }

  /**
   * Fetch order details by order ID
   */
  static async fetchOrderById(orderId: number): Promise<ShipStationOrder | null> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("ShipStation API credentials not configured");
    }

    try {
      const response = await axios.get(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          Authorization: this.getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(`Error fetching order ${orderId}:`, error.message);
      return null;
    }
  }

  /**
   * Check for dimensional weight adjustments by comparing carrier charges
   */
  static async detectDimensionalWeightAdjustments(daysBack: number = 7): Promise<any[]> {
    const shipments = await this.fetchRecentShipments(daysBack);
    const potentialDisputes: any[] = [];

    for (const shipment of shipments) {
      // Skip voided shipments
      if (shipment.voided) continue;

      // Fetch full order details
      const order = await this.fetchOrderById(shipment.orderId);
      if (!order) continue;

      // Calculate expected dimensional weight
      const expectedDimWeight = this.calculateDimensionalWeight(
        order.dimensions || shipment.dimensions
      );

      // Check if shipment cost seems high (potential adjustment)
      const baseRate = this.estimateBaseRate(shipment.carrierCode, shipment.serviceCode);
      const expectedCost = baseRate + (expectedDimWeight * 0.5); // Rough estimate

      // If actual cost is significantly higher, flag for review
      if (shipment.shipmentCost > expectedCost * 1.2) {
        potentialDisputes.push({
          trackingNumber: shipment.trackingNumber,
          orderId: shipment.orderId,
          orderNumber: order.orderNumber,
          carrier: this.normalizeCarrierCode(shipment.carrierCode),
          shipDate: shipment.shipDate,
          originalCost: expectedCost,
          actualCost: shipment.shipmentCost,
          potentialDispute: shipment.shipmentCost - expectedCost,
          dimensions: order.dimensions || shipment.dimensions,
          weight: order.weight || shipment.weight,
          recipient: order.shipTo,
          shipper: order.shipFrom,
          productName: order.items[0]?.name || "Unknown Product",
        });
      }
    }

    return potentialDisputes;
  }

  /**
   * Auto-create draft cases for detected adjustments
   */
  static async autoCreateDraftCases(daysBack: number = 7): Promise<number[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const potentialDisputes = await this.detectDimensionalWeightAdjustments(daysBack);
    const createdCaseIds: number[] = [];

    for (const dispute of potentialDisputes) {
      // Check if case already exists for this tracking number
      const existingCase = await db.query.cases.findFirst({
        where: eq(cases.trackingNumber, dispute.trackingNumber),
      });

      if (existingCase) {
        console.log(`Case already exists for tracking ${dispute.trackingNumber}`);
        continue;
      }

      // Create draft case
      try {
        const [newCase] = await db.insert(cases).values({
          caseNumber: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          trackingNumber: dispute.trackingNumber,
          carrier: dispute.carrier,
          status: "DRAFT",
          priority: dispute.potentialDispute > 50 ? "HIGH" : dispute.potentialDispute > 20 ? "MEDIUM" : "LOW",
          disputeAmount: dispute.potentialDispute.toFixed(2),
          originalAmount: dispute.originalCost.toFixed(2),
          adjustedAmount: dispute.actualCost.toFixed(2),
          shipDate: new Date(dispute.shipDate),
          recipientName: dispute.recipient.name,
          recipientAddress: dispute.recipient.street1,
          recipientCity: dispute.recipient.city,
          recipientState: dispute.recipient.state,
          recipientZip: dispute.recipient.postalCode,
          recipientPhone: dispute.recipient.phone,
          shipperName: dispute.shipper.name,
          shipperAddress: dispute.shipper.street1,
          shipperCity: dispute.shipper.city,
          shipperState: dispute.shipper.state,
          shipperZip: dispute.shipper.postalCode,
          productName: dispute.productName,
          productDimensions: dispute.dimensions ? {
            length: dispute.dimensions.length,
            width: dispute.dimensions.width,
            height: dispute.dimensions.height,
            weight: dispute.weight?.value || 0,
          } : null,
          disputeReason: "Potential dimensional weight adjustment detected via ShipStation sync",
          notes: `Auto-detected from ShipStation. Order: ${dispute.orderNumber}. Review and verify adjustment details.`,
          source: "shipstation_sync",
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning({ id: cases.id });

        createdCaseIds.push(newCase.id);
        console.log(`Created draft case ${newCase.id} for tracking ${dispute.trackingNumber}`);

        // Send email notification
        const baseUrl = process.env.VITE_APP_URL || "https://carrier-dispute-system.manus.space";
        await sendNewDraftCaseNotification({
          caseNumber: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          trackingNumber: dispute.trackingNumber,
          carrier: dispute.carrier,
          disputeAmount: dispute.potentialDispute.toFixed(2),
          priority: dispute.potentialDispute > 50 ? "HIGH" : dispute.potentialDispute > 20 ? "MEDIUM" : "LOW",
          status: "DRAFT",
          recipientName: dispute.recipient.name,
          shipDate: new Date(dispute.shipDate),
          source: "ShipStation Sync",
          caseUrl: `${baseUrl}/cases/${newCase.id}`,
        });
      } catch (error: any) {
        console.error(`Error creating case for ${dispute.trackingNumber}:`, error.message);
      }
    }

    return createdCaseIds;
  }

  /**
   * Calculate dimensional weight (in pounds)
   */
  private static calculateDimensionalWeight(dimensions?: { length: number; width: number; height: number; units: string }): number {
    if (!dimensions) return 0;

    const { length, width, height, units } = dimensions;

    // Convert to inches if needed
    let l = length, w = width, h = height;
    if (units === "centimeters") {
      l = length / 2.54;
      w = width / 2.54;
      h = height / 2.54;
    }

    // Standard divisor is 139 for domestic, 166 for international
    const dimWeight = (l * w * h) / 139;

    return Math.ceil(dimWeight);
  }

  /**
   * Estimate base shipping rate (very rough estimate)
   */
  private static estimateBaseRate(carrierCode: string, serviceCode: string): number {
    const carrier = carrierCode.toLowerCase();

    if (carrier.includes("fedex")) {
      if (serviceCode.includes("ground")) return 10;
      if (serviceCode.includes("express")) return 25;
      if (serviceCode.includes("overnight")) return 40;
      return 15;
    } else if (carrier.includes("ups")) {
      if (serviceCode.includes("ground")) return 10;
      if (serviceCode.includes("next_day")) return 40;
      if (serviceCode.includes("2nd_day")) return 25;
      return 15;
    } else if (carrier.includes("usps")) {
      if (serviceCode.includes("priority")) return 8;
      if (serviceCode.includes("express")) return 25;
      return 5;
    }

    return 12; // Default estimate
  }

  /**
   * Normalize carrier code to standard format
   */
  private static normalizeCarrierCode(carrierCode: string): string {
    const code = carrierCode.toLowerCase();

    if (code.includes("fedex")) return "FEDEX";
    if (code.includes("ups")) return "UPS";
    if (code.includes("usps")) return "USPS";
    if (code.includes("dhl")) return "DHL";

    return "OTHER";
  }

  /**
   * Schedule daily sync (to be called by cron job)
   */
  static async runDailySync(): Promise<{ success: boolean; casesCreated: number; errors: string[] }> {
    const errors: string[] = [];

    try {
      console.log("Starting ShipStation daily sync...");

      const createdCaseIds = await this.autoCreateDraftCases(1); // Check last 24 hours

      console.log(`ShipStation sync complete. Created ${createdCaseIds.length} draft cases.`);

      return {
        success: true,
        casesCreated: createdCaseIds.length,
        errors,
      };
    } catch (error: any) {
      console.error("ShipStation sync failed:", error.message);
      errors.push(error.message);

      return {
        success: false,
        casesCreated: 0,
        errors,
      };
    }
  }

  /**
   * Get sync history
   */
  static async getSyncHistory(): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Return mock data for now - will be replaced with actual sync history table
    return [
      {
        id: 1,
        syncedAt: new Date(Date.now() - 86400000), // 1 day ago
        status: "SUCCESS",
        shipmentsProcessed: 150,
        adjustmentsDetected: 5,
        casesCreated: 5,
        completedAt: new Date(Date.now() - 86400000 + 120000),
      },
      {
        id: 2,
        syncedAt: new Date(Date.now() - 172800000), // 2 days ago
        status: "SUCCESS",
        shipmentsProcessed: 142,
        adjustmentsDetected: 3,
        casesCreated: 3,
        completedAt: new Date(Date.now() - 172800000 + 110000),
      },
    ];
  }

  /**
   * Get latest sync status
   */
  static async getLatestSync(): Promise<any | null> {
    const history = await this.getSyncHistory();
    return history[0] || null;
  }
}
