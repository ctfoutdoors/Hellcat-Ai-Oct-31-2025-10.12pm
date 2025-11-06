/**
 * Purchase Verification Service
 * Verifies customer purchases and warranty eligibility for damage claims
 */

import * as db from '../db';

interface PurchaseVerificationResult {
  verified: boolean;
  eligible: boolean;
  reasons: string[];
  warnings: string[];
  purchaseDetails?: {
    orderNumber: string;
    purchaseDate: Date;
    purchaseSource: string;
    customerEmail: string;
    productSku?: string;
    warrantyPeriodDays: number;
    daysRemaining: number;
  };
}

export class PurchaseVerificationService {
  /**
   * Verify purchase for warranty eligibility
   */
  static async verifyPurchase(caseId: number): Promise<PurchaseVerificationResult> {
    const caseRecord = await db.getCaseById(caseId);
    
    if (!caseRecord) {
      return {
        verified: false,
        eligible: false,
        reasons: ['Case not found'],
        warnings: [],
      };
    }

    const reasons: string[] = [];
    const warnings: string[] = [];
    let verified = false;
    let eligible = false;

    // Check if purchase date is available
    if (!caseRecord.purchaseDate) {
      reasons.push('Purchase date not provided');
      return { verified, eligible, reasons, warnings };
    }

    const purchaseDate = new Date(caseRecord.purchaseDate);
    const now = new Date();
    const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check warranty period (default 90 days for rods)
    const warrantyPeriodDays = caseRecord.warrantyPeriodDays || 90;
    const daysRemaining = warrantyPeriodDays - daysSincePurchase;

    if (daysSincePurchase > warrantyPeriodDays) {
      reasons.push(`Purchase is outside warranty period (${daysSincePurchase} days ago, warranty is ${warrantyPeriodDays} days)`);
      verified = true;
      eligible = false;
    } else {
      verified = true;
      eligible = true;
      
      if (daysRemaining < 7) {
        warnings.push(`Warranty expires in ${daysRemaining} days`);
      }
    }

    // Check purchase source
    if (!caseRecord.purchaseSource) {
      warnings.push('Purchase source not specified');
    } else if (caseRecord.purchaseSource !== 'AUTHORIZED_DEALER') {
      warnings.push('Purchase was not from authorized dealer - may require additional verification');
      
      if (!caseRecord.receiptUrl) {
        reasons.push('Receipt required for purchases from non-authorized sources');
        eligible = false;
      }
    }

    // Check if customer email matches
    if (!caseRecord.recipientEmail) {
      warnings.push('Customer email not provided');
    }

    // Check order number
    if (!caseRecord.orderNumber) {
      warnings.push('Order number not provided');
    }

    const purchaseDetails = {
      orderNumber: caseRecord.orderNumber || 'N/A',
      purchaseDate,
      purchaseSource: caseRecord.purchaseSource || 'UNKNOWN',
      customerEmail: caseRecord.recipientEmail || 'N/A',
      productSku: caseRecord.productSku,
      warrantyPeriodDays,
      daysRemaining: Math.max(0, daysRemaining),
    };

    return {
      verified,
      eligible,
      reasons,
      warnings,
      purchaseDetails,
    };
  }

  /**
   * Cross-check purchase with WooCommerce orders
   */
  static async crossCheckWooCommerce(orderNumber: string, customerEmail: string): Promise<{
    found: boolean;
    orderData?: any;
    error?: string;
  }> {
    try {
      // TODO: Implement WooCommerce API integration
      // This is a placeholder for the actual implementation
      
      const wooCommerceUrl = process.env.WOOCOMMERCE_STORE_URL;
      const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
      const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

      if (!wooCommerceUrl || !consumerKey || !consumerSecret) {
        return {
          found: false,
          error: 'WooCommerce credentials not configured',
        };
      }

      // Placeholder: In production, make actual API call to WooCommerce
      // const response = await axios.get(`${wooCommerceUrl}/wp-json/wc/v3/orders`, {
      //   params: { search: orderNumber },
      //   auth: { username: consumerKey, password: consumerSecret },
      // });

      return {
        found: false,
        error: 'WooCommerce integration pending implementation',
      };
    } catch (error: any) {
      return {
        found: false,
        error: error.message,
      };
    }
  }

  /**
   * Request receipt upload for verification
   */
  static async requestReceipt(caseId: number, reason: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await db.updateCase(caseId, {
        receiptRequired: true,
        receiptRequestReason: reason,
        receiptRequestDate: new Date(),
      });

      // TODO: Send email notification to customer requesting receipt

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark purchase as verified
   */
  static async markAsVerified(caseId: number, verifiedBy: string, notes?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await db.updateCase(caseId, {
        purchaseVerified: true,
        purchaseVerifiedBy: verifiedBy,
        purchaseVerifiedDate: new Date(),
        purchaseVerificationNotes: notes,
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get verification statistics
   */
  static async getStatistics(): Promise<{
    totalCases: number;
    verified: number;
    pending: number;
    receiptRequired: number;
    withinWarranty: number;
    outsideWarranty: number;
  }> {
    const allCases = await db.getAllCases();

    const verified = allCases.filter(c => c.purchaseVerified).length;
    const pending = allCases.filter(c => !c.purchaseVerified && c.purchaseDate).length;
    const receiptRequired = allCases.filter(c => c.receiptRequired).length;

    let withinWarranty = 0;
    let outsideWarranty = 0;

    for (const c of allCases) {
      if (c.purchaseDate) {
        const result = await this.verifyPurchase(c.id);
        if (result.eligible) {
          withinWarranty++;
        } else {
          outsideWarranty++;
        }
      }
    }

    return {
      totalCases: allCases.length,
      verified,
      pending,
      receiptRequired,
      withinWarranty,
      outsideWarranty,
    };
  }

  /**
   * Bulk verify purchases from Google Sheets import
   */
  static async bulkVerifyFromSheet(purchases: Array<{
    orderNumber: string;
    customerEmail: string;
    purchaseDate: string;
    purchaseSource: string;
  }>): Promise<{
    verified: number;
    failed: number;
    errors: string[];
  }> {
    let verified = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const purchase of purchases) {
      try {
        // Find case by order number or email
        const cases = await db.getAllCases();
        const matchingCase = cases.find(
          c => c.orderNumber === purchase.orderNumber || c.recipientEmail === purchase.customerEmail
        );

        if (!matchingCase) {
          errors.push(`No case found for order ${purchase.orderNumber}`);
          failed++;
          continue;
        }

        // Update case with purchase information
        await db.updateCase(matchingCase.id, {
          purchaseDate: new Date(purchase.purchaseDate),
          purchaseSource: purchase.purchaseSource,
          purchaseVerified: true,
          purchaseVerifiedBy: 'BULK_IMPORT',
          purchaseVerifiedDate: new Date(),
        });

        verified++;
      } catch (error: any) {
        errors.push(`Error processing order ${purchase.orderNumber}: ${error.message}`);
        failed++;
      }
    }

    return { verified, failed, errors };
  }
}
