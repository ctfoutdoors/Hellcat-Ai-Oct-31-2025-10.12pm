import { invokeLLM } from "../_core/llm";

/**
 * Parse Bill of Lading (BOL) PDF and extract structured data
 */
export async function parseBOL(pdfUrl: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a document extraction specialist. Extract all relevant data from Bill of Lading documents and return it as structured JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the following information from this Bill of Lading:\n- BOL number\n- Carrier name\n- Tracking number\n- Ship date\n- Delivery date (if available)\n- Origin address (street, city, state, zip)\n- Destination address (street, city, state, zip)\n- Weight\n- Dimensions\n- Number of pieces/cartons\n- Freight charges\n- Any special instructions or notes\n\nReturn the data as JSON.",
          },
          {
            type: "file_url",
            file_url: {
              url: pdfUrl,
              mime_type: "application/pdf",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "bol_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            bolNumber: { type: "string", description: "Bill of Lading number" },
            carrier: { type: "string", description: "Carrier/shipping company name" },
            trackingNumber: { type: "string", description: "Tracking/PRO number" },
            shipDate: { type: "string", description: "Ship date in YYYY-MM-DD format" },
            deliveryDate: { type: ["string", "null"], description: "Delivery date in YYYY-MM-DD format if available" },
            origin: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zip: { type: "string" },
              },
              required: ["street", "city", "state", "zip"],
              additionalProperties: false,
            },
            destination: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zip: { type: "string" },
              },
              required: ["street", "city", "state", "zip"],
              additionalProperties: false,
            },
            weight: { type: "number", description: "Total weight in pounds" },
            dimensions: { type: ["string", "null"], description: "Dimensions if specified" },
            pieces: { type: "number", description: "Number of pieces/cartons" },
            freightCharges: { type: "number", description: "Freight charges in dollars" },
            notes: { type: ["string", "null"], description: "Special instructions or notes" },
          },
          required: ["bolNumber", "carrier", "trackingNumber", "shipDate", "origin", "destination", "weight", "pieces", "freightCharges"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content returned from LLM");
  }

  return JSON.parse(content);
}

/**
 * Parse Invoice PDF and extract structured data
 */
export async function parseInvoice(pdfUrl: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a document extraction specialist. Extract all relevant data from invoices and return it as structured JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the following information from this invoice:\n- Invoice number\n- Invoice date\n- Due date (if available)\n- Vendor/seller information (name, address)\n- Customer/buyer information (name, address)\n- Line items (description, quantity, unit price, total)\n- Subtotal\n- Tax amount\n- Shipping/freight amount\n- Total amount\n- Payment terms\n- Any notes or special instructions\n\nReturn the data as JSON.",
          },
          {
            type: "file_url",
            file_url: {
              url: pdfUrl,
              mime_type: "application/pdf",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "invoice_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            invoiceNumber: { type: "string", description: "Invoice number" },
            invoiceDate: { type: "string", description: "Invoice date in YYYY-MM-DD format" },
            dueDate: { type: ["string", "null"], description: "Due date in YYYY-MM-DD format if available" },
            vendor: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
              },
              required: ["name", "address"],
              additionalProperties: false,
            },
            customer: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
              },
              required: ["name", "address"],
              additionalProperties: false,
            },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                  total: { type: "number" },
                },
                required: ["description", "quantity", "unitPrice", "total"],
                additionalProperties: false,
              },
            },
            subtotal: { type: "number", description: "Subtotal amount" },
            tax: { type: "number", description: "Tax amount" },
            shipping: { type: "number", description: "Shipping/freight amount" },
            total: { type: "number", description: "Total amount" },
            paymentTerms: { type: ["string", "null"], description: "Payment terms if specified" },
            notes: { type: ["string", "null"], description: "Notes or special instructions" },
          },
          required: ["invoiceNumber", "invoiceDate", "vendor", "customer", "lineItems", "subtotal", "tax", "shipping", "total"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content returned from LLM");
  }

  return JSON.parse(content);
}

/**
 * Parse Purchase Order PDF and extract structured data
 */
export async function parsePurchaseOrder(pdfUrl: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a document extraction specialist. Extract all relevant data from purchase orders and return it as structured JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the following information from this purchase order:\n- PO number\n- PO date\n- Vendor information (name, address, contact)\n- Ship to address\n- Line items (SKU, description, quantity, unit price, total)\n- Subtotal\n- Tax\n- Shipping\n- Total amount\n- Payment terms\n- Expected delivery date\n- Any special instructions\n\nReturn the data as JSON.",
          },
          {
            type: "file_url",
            file_url: {
              url: pdfUrl,
              mime_type: "application/pdf",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "po_data",
        strict: true,
        schema: {
          type: "object",
          properties: {
            poNumber: { type: "string", description: "Purchase order number" },
            poDate: { type: "string", description: "PO date in YYYY-MM-DD format" },
            vendor: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                contact: { type: ["string", "null"] },
              },
              required: ["name", "address"],
              additionalProperties: false,
            },
            shipTo: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
              },
              required: ["name", "address"],
              additionalProperties: false,
            },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sku: { type: ["string", "null"] },
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unitPrice: { type: "number" },
                  total: { type: "number" },
                },
                required: ["description", "quantity", "unitPrice", "total"],
                additionalProperties: false,
              },
            },
            subtotal: { type: "number" },
            tax: { type: "number" },
            shipping: { type: "number" },
            total: { type: "number" },
            paymentTerms: { type: ["string", "null"] },
            expectedDelivery: { type: ["string", "null"], description: "Expected delivery date in YYYY-MM-DD format" },
            notes: { type: ["string", "null"] },
          },
          required: ["poNumber", "poDate", "vendor", "shipTo", "lineItems", "subtotal", "tax", "shipping", "total"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content returned from LLM");
  }

  return JSON.parse(content);
}
