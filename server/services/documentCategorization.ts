import { invokeLLM } from '../_core/llm';

/**
 * Document Categorization Service
 * 
 * Automatically categorizes uploaded documents using AI
 * Assigns tags, extracts metadata, and suggests case associations
 */

export interface DocumentCategory {
  primary: 'invoice' | 'tracking' | 'receipt' | 'correspondence' | 'evidence' | 'form' | 'other';
  subcategory?: string;
  confidence: number;
  tags: string[];
  suggestedCaseIds?: number[];
  extractedData?: Record<string, any>;
}

export class DocumentCategorizationService {
  /**
   * Categorize document based on content
   */
  static async categorizeDocument(params: {
    filename: string;
    content?: string;
    imageUrl?: string;
  }): Promise<DocumentCategory> {
    try {
      // Use filename extension as hint
      const ext = params.filename.split('.').pop()?.toLowerCase();
      const isPDF = ext === 'pdf';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');

      let messages: any[] = [];

      if (params.imageUrl) {
        // Image-based categorization
        messages = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this document image and categorize it. Return JSON:
{
  "primary": "invoice|tracking|receipt|correspondence|evidence|form|other",
  "subcategory": "string (optional, e.g., 'FedEx Invoice', 'UPS Tracking')",
  "confidence": 0.0-1.0,
  "tags": ["array", "of", "relevant", "tags"],
  "extractedData": {
    "trackingNumber": "string (if found)",
    "invoiceNumber": "string (if found)",
    "amount": number (if found),
    "date": "YYYY-MM-DD (if found)",
    "carrier": "FedEx|UPS|USPS|DHL (if found)"
  }
}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: params.imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ];
      } else if (params.content) {
        // Text-based categorization
        messages = [
          {
            role: 'user',
            content: `Analyze this document content and categorize it. Return JSON:
{
  "primary": "invoice|tracking|receipt|correspondence|evidence|form|other",
  "subcategory": "string (optional)",
  "confidence": 0.0-1.0,
  "tags": ["array", "of", "relevant", "tags"],
  "extractedData": {
    "trackingNumber": "string (if found)",
    "invoiceNumber": "string (if found)",
    "amount": number (if found)",
    "date": "YYYY-MM-DD (if found)",
    "carrier": "FedEx|UPS|USPS|DHL (if found)"
  }
}

Document content:
${params.content.substring(0, 4000)}`,
          },
        ];
      } else {
        // Filename-only categorization
        return this.categorizeByFilename(params.filename);
      }

      const response = await invokeLLM({
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'document_category',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                primary: {
                  type: 'string',
                  enum: ['invoice', 'tracking', 'receipt', 'correspondence', 'evidence', 'form', 'other'],
                },
                subcategory: { type: ['string', 'null'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                },
                extractedData: {
                  type: ['object', 'null'],
                  properties: {
                    trackingNumber: { type: ['string', 'null'] },
                    invoiceNumber: { type: ['string', 'null'] },
                    amount: { type: ['number', 'null'] },
                    date: { type: ['string', 'null'] },
                    carrier: { type: ['string', 'null'] },
                  },
                  required: [],
                  additionalProperties: false,
                },
              },
              required: ['primary', 'confidence', 'tags'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);

      return {
        primary: result.primary,
        subcategory: result.subcategory || undefined,
        confidence: result.confidence,
        tags: result.tags || [],
        extractedData: result.extractedData || undefined,
      };
    } catch (error: any) {
      console.error('[DocumentCategorization] Categorization failed:', error);
      // Fallback to filename-based categorization
      return this.categorizeByFilename(params.filename);
    }
  }

  /**
   * Simple filename-based categorization (fallback)
   */
  private static categorizeByFilename(filename: string): DocumentCategory {
    const lower = filename.toLowerCase();
    const tags: string[] = [];

    let primary: DocumentCategory['primary'] = 'other';
    let subcategory: string | undefined;
    let confidence = 0.3;

    if (lower.includes('invoice')) {
      primary = 'invoice';
      tags.push('invoice');
      confidence = 0.6;
    } else if (lower.includes('tracking') || lower.includes('label')) {
      primary = 'tracking';
      tags.push('tracking');
      confidence = 0.6;
    } else if (lower.includes('receipt')) {
      primary = 'receipt';
      tags.push('receipt');
      confidence = 0.6;
    } else if (lower.includes('email') || lower.includes('correspondence')) {
      primary = 'correspondence';
      tags.push('email');
      confidence = 0.6;
    } else if (lower.includes('form')) {
      primary = 'form';
      tags.push('form');
      confidence = 0.6;
    }

    // Detect carrier
    if (lower.includes('fedex')) {
      tags.push('FedEx');
      subcategory = 'FedEx';
    } else if (lower.includes('ups')) {
      tags.push('UPS');
      subcategory = 'UPS';
    } else if (lower.includes('usps')) {
      tags.push('USPS');
      subcategory = 'USPS';
    } else if (lower.includes('dhl')) {
      tags.push('DHL');
      subcategory = 'DHL';
    }

    return {
      primary,
      subcategory,
      confidence,
      tags,
    };
  }

  /**
   * Suggest case associations based on extracted data
   */
  static async suggestCaseAssociations(params: {
    trackingNumber?: string;
    invoiceNumber?: string;
    amount?: number;
    date?: string;
    carrier?: string;
  }): Promise<number[]> {
    // This would query the database to find matching cases
    // For now, return empty array
    // TODO: Implement database query
    return [];
  }

  /**
   * Auto-tag document based on content
   */
  static async autoTag(content: string): Promise<string[]> {
    const tags: string[] = [];

    // Simple keyword-based tagging
    const keywords = {
      'dimensional weight': ['dimensional-weight', 'dim-weight'],
      'overcharge': ['overcharge', 'billing-error'],
      'late delivery': ['late-delivery', 'service-failure'],
      'damage': ['damage', 'claim'],
      'lost package': ['lost', 'missing'],
      'address correction': ['address-correction', 'asc'],
      'residential surcharge': ['residential', 'surcharge'],
      'fuel surcharge': ['fuel', 'surcharge'],
    };

    const lower = content.toLowerCase();
    for (const [keyword, tagList] of Object.entries(keywords)) {
      if (lower.includes(keyword)) {
        tags.push(...tagList);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }
}
