/**
 * AI-Powered Purchase Order Scanner Service
 * 
 * Extracts vendor information, line items, and SKUs from PO documents
 * Automatically learns and creates SKU aliases when mismatches detected
 */

import { invokeLLM } from '../_core/llm';

interface POScanResult {
  vendor: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    address?: string;
    confidence: number;
  };
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  lineItems: POLineItem[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  shippingInfo?: {
    method?: string;
    trackingNumber?: string;
    shipToAddress?: string;
  };
  confidence: number;
  rawExtraction: any;
}

interface POLineItem {
  lineNumber: number;
  vendorSku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  confidence: number;
}

interface SKUMatchResult {
  matched: boolean;
  productId?: number;
  ourSku?: string;
  matchMethod: 'exact' | 'alias' | 'ai' | 'none';
  confidence: number;
  suggestedAlias?: {
    productId: number;
    ourSku: string;
    reason: string;
  };
}

export class POScannerService {
  /**
   * Scan PO document and extract structured data
   */
  static async scanPODocument(params: {
    documentUrl: string;
    vendorId?: number;
  }): Promise<POScanResult> {
    try {
      // Use Vision AI to extract PO data
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting structured data from purchase order documents.
Extract all relevant information including vendor details, line items, pricing, and shipping information.
Be precise with numbers and SKUs. Return data in valid JSON format only.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all information from this purchase order document. Return ONLY valid JSON with this structure: { "vendor": { "name": string, "contact": string, "email": string, "phone": string, "address": string }, "poNumber": string, "poDate": string (YYYY-MM-DD), "expectedDeliveryDate": string (YYYY-MM-DD), "lineItems": [{ "lineNumber": number, "vendorSku": string, "description": string, "quantity": number, "unitPrice": number (in cents), "lineTotal": number (in cents) }], "totals": { "subtotal": number (in cents), "tax": number (in cents), "shipping": number (in cents), "total": number (in cents) }, "shippingInfo": { "method": string, "trackingNumber": string, "shipToAddress": string } }',
              },
              {
                type: 'image_url',
                image_url: {
                  url: params.documentUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'po_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                vendor: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    contact: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    address: { type: 'string' },
                  },
                  required: ['name'],
                  additionalProperties: false,
                },
                poNumber: { type: 'string' },
                poDate: { type: 'string' },
                expectedDeliveryDate: { type: 'string' },
                lineItems: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      lineNumber: { type: 'integer' },
                      vendorSku: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'integer' },
                      unitPrice: { type: 'integer' },
                      lineTotal: { type: 'integer' },
                    },
                    required: ['lineNumber', 'vendorSku', 'description', 'quantity', 'unitPrice', 'lineTotal'],
                    additionalProperties: false,
                  },
                },
                totals: {
                  type: 'object',
                  properties: {
                    subtotal: { type: 'integer' },
                    tax: { type: 'integer' },
                    shipping: { type: 'integer' },
                    total: { type: 'integer' },
                  },
                  required: ['subtotal', 'tax', 'shipping', 'total'],
                  additionalProperties: false,
                },
                shippingInfo: {
                  type: 'object',
                  properties: {
                    method: { type: 'string' },
                    trackingNumber: { type: 'string' },
                    shipToAddress: { type: 'string' },
                  },
                  required: [],
                  additionalProperties: false,
                },
              },
              required: ['vendor', 'poNumber', 'poDate', 'lineItems', 'totals'],
              additionalProperties: false,
            },
          },
        },
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}');

      // Calculate confidence based on completeness
      const confidence = this.calculateExtractionConfidence(extracted);

      return {
        ...extracted,
        vendor: {
          ...extracted.vendor,
          confidence: extracted.vendor.name ? 95 : 50,
        },
        lineItems: extracted.lineItems.map((item: any, index: number) => ({
          ...item,
          confidence: this.calculateLineItemConfidence(item),
        })),
        confidence,
        rawExtraction: extracted,
      };
    } catch (error) {
      console.error('[POScanner] Scan failed:', error);
      throw new Error('Failed to scan PO document');
    }
  }

  /**
   * Match vendor SKU to our product catalog
   */
  static async matchSKU(params: {
    vendorSku: string;
    vendorId: number;
    description: string;
    existingProducts: Array<{ id: number; sku: string; productName: string; description?: string }>;
    existingAliases: Array<{ productId: number; ourSku: string; aliasSku: string; aliasEntityId: number }>;
  }): Promise<SKUMatchResult> {
    // 1. Try exact SKU match
    const exactMatch = params.existingProducts.find(
      p => p.sku.toLowerCase() === params.vendorSku.toLowerCase()
    );
    if (exactMatch) {
      return {
        matched: true,
        productId: exactMatch.id,
        ourSku: exactMatch.sku,
        matchMethod: 'exact',
        confidence: 100,
      };
    }

    // 2. Try alias match for this vendor
    const aliasMatch = params.existingAliases.find(
      a => a.aliasSku.toLowerCase() === params.vendorSku.toLowerCase() && 
           a.aliasEntityId === params.vendorId
    );
    if (aliasMatch) {
      return {
        matched: true,
        productId: aliasMatch.productId,
        ourSku: aliasMatch.ourSku,
        matchMethod: 'alias',
        confidence: 95,
      };
    }

    // 3. Use AI to find best match based on description
    const aiMatch = await this.findBestMatchWithAI({
      vendorSku: params.vendorSku,
      description: params.description,
      products: params.existingProducts,
    });

    if (aiMatch && aiMatch.confidence >= 80) {
      return {
        matched: true,
        productId: aiMatch.productId,
        ourSku: aiMatch.ourSku,
        matchMethod: 'ai',
        confidence: aiMatch.confidence,
        suggestedAlias: {
          productId: aiMatch.productId,
          ourSku: aiMatch.ourSku,
          reason: `AI matched based on description similarity (${aiMatch.confidence}% confidence)`,
        },
      };
    }

    // 4. No match found
    return {
      matched: false,
      matchMethod: 'none',
      confidence: 0,
    };
  }

  /**
   * Use AI to find best product match based on description
   */
  private static async findBestMatchWithAI(params: {
    vendorSku: string;
    description: string;
    products: Array<{ id: number; sku: string; productName: string; description?: string }>;
  }): Promise<{ productId: number; ourSku: string; confidence: number } | null> {
    if (params.products.length === 0) {
      return null;
    }

    try {
      const productList = params.products.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.productName,
        description: p.description || '',
      }));

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are an expert at matching product descriptions to find the same product across different SKU systems.
Analyze the vendor's product description and find the best match from our catalog.
Return confidence as a percentage (0-100). Only suggest matches with >70% confidence.`,
          },
          {
            role: 'user',
            content: `Vendor SKU: ${params.vendorSku}
Vendor Description: ${params.description}

Our Product Catalog:
${JSON.stringify(productList, null, 2)}

Find the best matching product. Return ONLY valid JSON: { "productId": number, "ourSku": string, "confidence": number (0-100), "reason": string }
If no good match (confidence < 70), return: { "productId": null, "ourSku": null, "confidence": 0, "reason": "No confident match found" }`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sku_match',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                productId: { type: ['integer', 'null'] },
                ourSku: { type: ['string', 'null'] },
                confidence: { type: 'integer' },
                reason: { type: 'string' },
              },
              required: ['productId', 'ourSku', 'confidence', 'reason'],
              additionalProperties: false,
            },
          },
        },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      if (result.productId && result.confidence >= 70) {
        return {
          productId: result.productId,
          ourSku: result.ourSku,
          confidence: result.confidence,
        };
      }

      return null;
    } catch (error) {
      console.error('[POScanner] AI matching failed:', error);
      return null;
    }
  }

  /**
   * Calculate extraction confidence score
   */
  private static calculateExtractionConfidence(data: any): number {
    let score = 0;
    let maxScore = 0;

    // Vendor name (critical)
    maxScore += 30;
    if (data.vendor?.name) score += 30;

    // PO number (critical)
    maxScore += 30;
    if (data.poNumber) score += 30;

    // PO date (important)
    maxScore += 15;
    if (data.poDate) score += 15;

    // Line items (critical)
    maxScore += 25;
    if (data.lineItems && data.lineItems.length > 0) {
      score += 25;
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate line item confidence score
   */
  private static calculateLineItemConfidence(item: any): number {
    let score = 0;
    let maxScore = 0;

    // SKU (critical)
    maxScore += 30;
    if (item.vendorSku && item.vendorSku.length > 0) score += 30;

    // Description (critical)
    maxScore += 30;
    if (item.description && item.description.length > 5) score += 30;

    // Quantity (critical)
    maxScore += 20;
    if (item.quantity && item.quantity > 0) score += 20;

    // Price (critical)
    maxScore += 20;
    if (item.unitPrice && item.unitPrice > 0) score += 20;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Batch process multiple line items for SKU matching
   */
  static async batchMatchSKUs(params: {
    lineItems: Array<{ vendorSku: string; description: string }>;
    vendorId: number;
    existingProducts: Array<{ id: number; sku: string; productName: string; description?: string }>;
    existingAliases: Array<{ productId: number; ourSku: string; aliasSku: string; aliasEntityId: number }>;
  }): Promise<SKUMatchResult[]> {
    const results: SKUMatchResult[] = [];

    for (const item of params.lineItems) {
      const match = await this.matchSKU({
        vendorSku: item.vendorSku,
        vendorId: params.vendorId,
        description: item.description,
        existingProducts: params.existingProducts,
        existingAliases: params.existingAliases,
      });

      results.push(match);
    }

    return results;
  }

  /**
   * Generate SKU alias suggestions for review
   */
  static generateAliasSuggestions(params: {
    matchResults: SKUMatchResult[];
    lineItems: POLineItem[];
    vendorId: number;
    vendorName: string;
  }): Array<{
    vendorSku: string;
    description: string;
    productId: number;
    ourSku: string;
    confidence: number;
    reason: string;
    autoCreate: boolean;
  }> {
    const suggestions: any[] = [];

    params.matchResults.forEach((match, index) => {
      const lineItem = params.lineItems[index];

      if (match.matchMethod === 'ai' && match.suggestedAlias) {
        suggestions.push({
          vendorSku: lineItem.vendorSku,
          description: lineItem.description,
          productId: match.suggestedAlias.productId,
          ourSku: match.suggestedAlias.ourSku,
          confidence: match.confidence,
          reason: match.suggestedAlias.reason,
          autoCreate: match.confidence >= 90, // Auto-create if very confident
        });
      }
    });

    return suggestions;
  }
}
