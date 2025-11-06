import { invokeLLM } from '../_core/llm';

/**
 * Screenshot OCR Service
 * 
 * Extracts text and structured data from screenshots using Vision AI
 * Useful for capturing carrier portal data, invoices, and tracking info
 */

export class ScreenshotOCRService {
  /**
   * Extract text from screenshot
   */
  static async extractText(imageUrl: string): Promise<{
    success: boolean;
    text?: string;
    error?: string;
  }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this image. Return only the extracted text, preserving formatting and structure.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      });

      const text = response.choices[0]?.message?.content || '';

      return {
        success: true,
        text,
      };
    } catch (error: any) {
      console.error('[ScreenshotOCR] Text extraction failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract structured tracking data from screenshot
   */
  static async extractTrackingData(imageUrl: string): Promise<{
    success: boolean;
    data?: {
      trackingNumber?: string;
      carrier?: string;
      status?: string;
      shipDate?: string;
      deliveryDate?: string;
      weight?: string;
      dimensions?: string;
      charges?: Array<{ description: string; amount: number }>;
    };
    error?: string;
  }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this shipping/tracking screenshot and extract structured data. Return JSON with these fields:
{
  "trackingNumber": "string",
  "carrier": "FedEx|UPS|USPS|DHL",
  "status": "string",
  "shipDate": "YYYY-MM-DD",
  "deliveryDate": "YYYY-MM-DD",
  "weight": "string with unit",
  "dimensions": "LxWxH",
  "charges": [{"description": "string", "amount": number}]
}

Only include fields that are visible in the image. Use null for missing fields.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'tracking_data',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                trackingNumber: { type: ['string', 'null'] },
                carrier: { type: ['string', 'null'] },
                status: { type: ['string', 'null'] },
                shipDate: { type: ['string', 'null'] },
                deliveryDate: { type: ['string', 'null'] },
                weight: { type: ['string', 'null'] },
                dimensions: { type: ['string', 'null'] },
                charges: {
                  type: ['array', 'null'],
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      amount: { type: 'number' },
                    },
                    required: ['description', 'amount'],
                    additionalProperties: false,
                  },
                },
              },
              required: [],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const data = JSON.parse(content);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('[ScreenshotOCR] Tracking data extraction failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract invoice data from screenshot
   */
  static async extractInvoiceData(imageUrl: string): Promise<{
    success: boolean;
    data?: {
      invoiceNumber?: string;
      invoiceDate?: string;
      carrier?: string;
      totalAmount?: number;
      lineItems?: Array<{
        trackingNumber?: string;
        description: string;
        amount: number;
      }>;
    };
    error?: string;
  }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this invoice screenshot and extract structured data. Return JSON with these fields:
{
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "carrier": "FedEx|UPS|USPS|DHL",
  "totalAmount": number,
  "lineItems": [
    {
      "trackingNumber": "string (optional)",
      "description": "string",
      "amount": number
    }
  ]
}

Extract all line items from the invoice. Use null for missing fields.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'invoice_data',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                invoiceNumber: { type: ['string', 'null'] },
                invoiceDate: { type: ['string', 'null'] },
                carrier: { type: ['string', 'null'] },
                totalAmount: { type: ['number', 'null'] },
                lineItems: {
                  type: ['array', 'null'],
                  items: {
                    type: 'object',
                    properties: {
                      trackingNumber: { type: ['string', 'null'] },
                      description: { type: 'string' },
                      amount: { type: 'number' },
                    },
                    required: ['description', 'amount'],
                    additionalProperties: false,
                  },
                },
              },
              required: [],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const data = JSON.parse(content);

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('[ScreenshotOCR] Invoice data extraction failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Identify document type from screenshot
   */
  static async identifyDocumentType(imageUrl: string): Promise<{
    success: boolean;
    type?: 'tracking' | 'invoice' | 'receipt' | 'form' | 'email' | 'unknown';
    confidence?: number;
    error?: string;
  }> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Identify the type of document in this screenshot. Return JSON:
{
  "type": "tracking|invoice|receipt|form|email|unknown",
  "confidence": 0.0-1.0
}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'document_type',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['tracking', 'invoice', 'receipt', 'form', 'email', 'unknown'],
                },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['type', 'confidence'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      return {
        success: true,
        type: result.type,
        confidence: result.confidence,
      };
    } catch (error: any) {
      console.error('[ScreenshotOCR] Document type identification failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
