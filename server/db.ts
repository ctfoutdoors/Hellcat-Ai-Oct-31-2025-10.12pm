import { eq, sql, desc, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users, type InsertUser } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// HELLCAT AI V4 - DATABASE QUERY HELPERS
// ============================================================================

// TODO: Add query helpers for each module as we build them:
// - Cases module (Phase 3)
// - Shipments & Orders (Phase 6)
// - Inventory & Products (Phase 8)
// - CRM (Phase 9)
// - AI & Knowledge Base (Phase 10)
// - etc.


// ============================================================================
// CASES MODULE - Query Helpers
// ============================================================================

import { cases, caseNotes, caseActivities, caseDocuments, orders, type InsertCase, type InsertCaseNote, type InsertCaseActivity } from "../drizzle/schema";
import { like, inArray } from "drizzle-orm";

export async function createCase(caseData: InsertCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [newCase] = await db.insert(cases).values(caseData).$returningId();
  return newCase;
}

export async function getCaseById(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  return caseRecord;
}

export async function listCases(filters?: {
  status?: string;
  caseType?: string;
  carrier?: string;
  searchTerm?: string;
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [];
  
  if (filters?.status) {
    conditions.push(eq(cases.status, filters.status as any));
  }
  
  if (filters?.caseType) {
    conditions.push(eq(cases.caseType, filters.caseType as any));
  }
  
  if (filters?.carrier) {
    conditions.push(eq(cases.carrier, filters.carrier as any));
  }
  
  if (filters?.searchTerm) {
    const term = `%${filters.searchTerm}%`;
    conditions.push(
      or(
        like(cases.trackingNumber, term),
        like(cases.caseNumber, term),
        like(cases.description, term)
      )
    );
  }
  
  if (filters?.userId) {
    conditions.push(eq(cases.createdBy, filters.userId));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  return await db
    .select()
    .from(cases)
    .where(whereClause)
    .orderBy(desc(cases.createdAt));
}

export async function updateCase(caseId: number, updates: Partial<InsertCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cases).set(updates).where(eq(cases.id, caseId));
  return getCaseById(caseId);
}

export async function addCaseNote(noteData: InsertCaseNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(caseNotes).values(noteData);
  return { success: true };
}

export async function getCaseNotes(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(caseNotes)
    .where(eq(caseNotes.caseId, caseId))
    .orderBy(desc(caseNotes.createdAt));
}

export async function addCaseActivity(activityData: InsertCaseActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(caseActivities).values(activityData);
}

export async function getCaseActivities(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(caseActivities)
    .where(eq(caseActivities.caseId, caseId))
    .orderBy(desc(caseActivities.createdAt));
}


// ==================== PHASE 4: AI DOCUMENT EXTRACTION ====================

import { invokeLLM } from "./_core/llm";

interface DocumentExtractionInput {
  fileName: string;
  fileType: string;
  fileData: string; // base64 encoded
}

interface ExtractedCaseData {
  title?: string;
  description?: string;
  caseType?: string;
  carrier?: string;
  trackingNumber?: string;
  claimAmount?: string;
  priority?: string;
  confidence: Record<string, number>;
}

export async function extractCaseDataFromDocument(
  input: DocumentExtractionInput,
  userId: number
): Promise<ExtractedCaseData & { extractionId: number }> {
  try {
    // Prepare the prompt for LLM
    const systemPrompt = `You are an AI assistant specialized in extracting carrier dispute claim information from documents.
Extract the following information from carrier documents (invoices, tracking reports, emails, screenshots):

1. **Title**: A concise case title (e.g., "FedEx Late Delivery - Order #12345")
2. **Description**: Detailed description of the issue
3. **Case Type**: One of: "adjustments", "damages", "sla", "lost_package", "billing_dispute", "refund_request"
4. **Carrier**: One of: "fedex", "ups", "usps", "dhl", "other"
5. **Tracking Number**: The shipment tracking number
6. **Claim Amount**: Dollar amount being claimed (number only, no $ sign)
7. **Priority**: One of: "low", "medium", "high", "urgent"

Return ONLY a JSON object with this exact structure:
{
  "title": "extracted title",
  "description": "extracted description",
  "caseType": "one of the case types",
  "carrier": "one of the carriers",
  "trackingNumber": "tracking number",
  "claimAmount": "amount as number",
  "priority": "priority level",
  "confidence": {
    "title": 0.95,
    "description": 0.90,
    "caseType": 0.85,
    "carrier": 0.95,
    "trackingNumber": 0.98,
    "claimAmount": 0.90,
    "priority": 0.70
  }
}

Confidence scores should be between 0 and 1. If a field cannot be extracted, omit it from the response.`;

    // Determine content type for LLM
    let content: any[];
    if (input.fileType.startsWith('image/')) {
      // For images, send as image_url
      content = [
        {
          type: "text",
          text: `Extract carrier dispute claim information from this document (${input.fileName}).`
        },
        {
          type: "image_url",
          image_url: {
            url: input.fileData,
            detail: "high"
          }
        }
      ];
    } else if (input.fileType === 'application/pdf') {
      // For PDFs, send as file_url
      content = [
        {
          type: "text",
          text: `Extract carrier dispute claim information from this PDF document (${input.fileName}).`
        },
        {
          type: "file_url",
          file_url: {
            url: input.fileData,
            mime_type: "application/pdf"
          }
        }
      ];
    } else {
      throw new Error(`Unsupported file type: ${input.fileType}`);
    }

    // Call LLM with structured output
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: content as any }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "case_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Case title" },
              description: { type: "string", description: "Detailed description" },
              caseType: { 
                type: "string", 
                enum: ["adjustments", "damages", "sla", "lost_package", "billing_dispute", "refund_request"],
                description: "Type of case"
              },
              carrier: { 
                type: "string", 
                enum: ["fedex", "ups", "usps", "dhl", "other"],
                description: "Carrier name"
              },
              trackingNumber: { type: "string", description: "Tracking number" },
              claimAmount: { type: "string", description: "Claim amount as number string" },
              priority: { 
                type: "string", 
                enum: ["low", "medium", "high", "urgent"],
                description: "Priority level"
              },
              confidence: {
                type: "object",
                properties: {
                  title: { type: "number" },
                  description: { type: "number" },
                  caseType: { type: "number" },
                  carrier: { type: "number" },
                  trackingNumber: { type: "number" },
                  claimAmount: { type: "number" },
                  priority: { type: "number" }
                },
                required: [],
                additionalProperties: false
              }
            },
            required: ["confidence"],
            additionalProperties: false
          }
        }
      }
    });

    // Parse the response
    const messageContent = response.choices[0].message.content;
    if (!messageContent) {
      throw new Error("No content in LLM response");
    }

    // Handle content as string or array
    const content_text = typeof messageContent === 'string' 
      ? messageContent 
      : JSON.stringify(messageContent);

    const extractedData: ExtractedCaseData = JSON.parse(content_text);

    // Ensure confidence object exists
    if (!extractedData.confidence) {
      extractedData.confidence = {};
    }

    // Save extraction history for learning
    const extractionId = await saveExtractionHistory({
      userId,
      fileName: input.fileName,
      fileType: input.fileType,
      extractedData: JSON.stringify(extractedData),
      confidenceScores: JSON.stringify(extractedData.confidence),
    });

    return { ...extractedData, extractionId };
  } catch (error) {
    console.error("[AI Extraction] Error:", error);
    throw new Error(`Failed to extract data from document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


// ==================== AI LEARNING SYSTEM ====================

import { extractionHistory, InsertExtractionHistory } from "../drizzle/schema";

/**
 * Save extraction history for learning purposes
 */
export async function saveExtractionHistory(
  data: InsertExtractionHistory
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(extractionHistory).values(data);
  return Number(result[0].insertId);
}

/**
 * Update extraction history with final user-corrected data
 */
export async function updateExtractionFeedback(
  id: number,
  finalData: any,
  wasModified: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(extractionHistory)
    .set({
      finalData: JSON.stringify(finalData),
      wasModified: wasModified ? 1 : 0,
    })
    .where(eq(extractionHistory.id, id));
}

/**
 * Get extraction accuracy stats for monitoring
 */
export async function getExtractionStats(userId: number) {
  const db = await getDb();
  if (!db) {
    return { total: 0, accepted: 0, modified: 0, accuracy: 0 };
  }

  const results = await db
    .select()
    .from(extractionHistory)
    .where(eq(extractionHistory.userId, userId));

  const total = results.length;
  const accepted = results.filter((r) => r.wasModified === 0).length;
  const modified = results.filter((r) => r.wasModified === 1).length;
  const accuracy = total > 0 ? (accepted / total) * 100 : 0;

  return { total, accepted, modified, accuracy };
}


// ==================== CAPTURE PROOF FUNCTIONALITY ====================
// Moved to CASE DOCUMENTS section below


// ==================== SHIPSTATION INTEGRATION ====================

export async function syncShipStationOrders(exceptions: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const createdCases = [];

  for (const exception of exceptions) {
    const { order, exceptionType, severity } = exception;

    // Check if case already exists for this order
    const existing = await db.select()
      .from(cases)
      .where(eq(cases.trackingNumber, order.trackingNumber))
      .limit(1);

    if (existing.length > 0) {
      continue; // Skip if case already exists
    }

    // Determine if case should be flagged
    const shouldFlag = severity === 'high';
    const flagReason = shouldFlag ? `High-severity ${exceptionType.replace(/_/g, ' ')} detected from ShipStation. Requires immediate review.` : null;

    // Create new case from exception
    const caseNumber = `CASE-${Date.now()}-${order.orderNumber}`;
    const caseData: InsertCase = {
      caseNumber,
      title: `${exceptionType.replace(/_/g, ' ').toUpperCase()} - Order ${order.orderNumber}`,
      description: `Automatically detected from ShipStation: ${exceptionType}. Order shipped on ${order.shipDate}.`,
      caseType: exceptionType === 'late_delivery' ? 'sla_violations' : 'lost_packages',
      status: 'open',
      priority: severity,
      carrier: order.carrierCode?.toLowerCase() || null,
      trackingNumber: order.trackingNumber,
      claimAmount: order.items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0).toString(),
      isFlagged: shouldFlag ? 1 : 0,
      flagReason,
      flaggedAt: shouldFlag ? new Date() : null,
      createdBy: 1, // System user
    };

    const result = await db.insert(cases).values(caseData);
    createdCases.push(result);
  }

  return createdCases;
}

export async function getShipStationSyncStatus() {
  // This would track last sync time, errors, etc.
  // For now, return a placeholder
  return {
    lastSync: new Date().toISOString(),
    status: 'active',
    casesCreated: 0,
  };
}


// ==================== GMAIL MONITORING ====================

export async function createCasesFromGmailExceptions(exceptions: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const createdCases = [];

  for (const exception of exceptions) {
    const { carrier, trackingNumber, exceptionType, description } = exception;

    // Check if case already exists for this tracking number
    const existing = await db.select()
      .from(cases)
      .where(eq(cases.trackingNumber, trackingNumber))
      .limit(1);

    if (existing.length > 0) {
      continue; // Skip if case already exists
    }

    // Map exception type to case type
    const caseTypeMap: Record<string, string> = {
      late_delivery: 'sla_violations',
      delivery_exception: 'sla_violations',
      lost_package: 'lost_packages',
      damage: 'damage_claims',
    };

    // Create new case from exception
    const caseNumber = `CASE-${Date.now()}-${carrier.toUpperCase()}-${trackingNumber}`;
    const caseData: InsertCase = {
      caseNumber,
      title: `${exceptionType.replace(/_/g, ' ').toUpperCase()} - ${carrier.toUpperCase()}`,
      description: `Automatically detected from Gmail: ${description}`,
      caseType: caseTypeMap[exceptionType] || 'sla_violations',
      status: 'open',
      priority: 'high',
      carrier: carrier.toLowerCase(),
      trackingNumber,
      claimAmount: '0',
      createdBy: 1, // System user
    };

    const result = await db.insert(cases).values(caseData);
    createdCases.push(result);
  }

  return createdCases;
}


// ==================== CASE FLAGGING ====================

export async function flagCase(caseId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cases)
    .set({
      isFlagged: 1,
      flagReason: reason,
      flaggedAt: new Date(),
    })
    .where(eq(cases.id, caseId));

  return { success: true };
}

export async function unflagCase(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(cases)
    .set({
      isFlagged: 0,
      flagReason: null,
      flaggedAt: null,
    })
    .where(eq(cases.id, caseId));

  return { success: true };
}

export async function getFlaggedCases() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select()
    .from(cases)
    .where(eq(cases.isFlagged, 1))
    .orderBy(desc(cases.flaggedAt));
}


// ==================== ORDERS MODULE ====================

export async function listOrders(filters?: {
  source?: string;
  status?: string;
  searchTerm?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(orders);

  // Apply filters
  const conditions = [];
  if (filters?.source) {
    conditions.push(eq(orders.source, filters.source));
  }
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status));
  }
  if (filters?.searchTerm) {
    conditions.push(
      or(
        like(orders.orderNumber, `%${filters.searchTerm}%`),
        like(orders.customerName, `%${filters.searchTerm}%`),
        like(orders.customerEmail, `%${filters.searchTerm}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(desc(orders.orderDate));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  return result[0] || null;
}

export async function syncOrdersFromShipStation(shipstationOrders: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const synced = [];

  for (const ssOrder of shipstationOrders) {
    // Check if order already exists
    const existing = await db.select()
      .from(orders)
      .where(eq(orders.orderNumber, ssOrder.orderNumber))
      .limit(1);

    if (existing.length > 0) {
      // Update existing order
      await db.update(orders)
        .set({
          status: ssOrder.orderStatus,
          orderData: ssOrder,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existing[0].id));
      
      synced.push(existing[0]);
    } else {
      // Create new order
      const orderData = {
        orderNumber: ssOrder.orderNumber,
        source: 'shipstation',
        externalId: ssOrder.orderId.toString(),
        customerName: `${ssOrder.shipTo.name}`,
        customerEmail: ssOrder.customerEmail,
        orderDate: new Date(ssOrder.orderDate),
        totalAmount: ssOrder.orderTotal.toString(),
        shippingCost: ssOrder.shippingAmount.toString(),
        status: ssOrder.orderStatus,
        orderData: ssOrder,
      };

      const result = await db.insert(orders).values(orderData);
      synced.push(result);
    }
  }

  return synced;
}

export async function linkOrderToCase(orderId: number, caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update case with order reference
  await db.update(cases)
    .set({
      // Store order ID in case data or add orderId field to cases table
      description: `Linked to Order #${orderId}`,
    })
    .where(eq(cases.id, caseId));

  return { success: true };
}


// ==================== INVENTORY MANAGEMENT ====================

// Inventory tables not yet created in schema
// TODO: Implement inventory functions after creating tables in schema.ts

/*
export async function listInventoryItems(filters?: {
  category?: string;
  lowStock?: boolean;
  searchTerm?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(inventory);

  const conditions = [];
  if (filters?.category) {
    conditions.push(eq(inventory.category, filters.category));
  }
  if (filters?.lowStock) {
    conditions.push(sql`${inventory.quantity} <= ${inventory.minStockLevel}`);
  }
  if (filters?.searchTerm) {
    conditions.push(
      or(
        like(inventory.sku, `%${filters.searchTerm}%`),
        like(inventory.name, `%${filters.searchTerm}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  return await query.orderBy(inventory.name);
}

export async function getInventoryById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select()
    .from(inventory)
    .where(eq(inventory.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createInventoryItem(item: InsertInventoryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(inventory).values(item);
  return { success: true };
}

export async function updateInventoryQuantity(id: number, quantity: number, userId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const item = await getInventoryById(id);
  if (!item) throw new Error("Inventory item not found");

  const diff = quantity - item.quantity;

  await db.update(inventory)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(inventory.id, id));

  // Record transaction
  await db.insert(inventoryTransactions).values({
    inventoryId: id,
    type: diff > 0 ? "in" : "out",
    quantity: Math.abs(diff),
    reason,
    userId,
  });

  return { success: true };
}
*/

// Supplier and Purchase Order functions - tables not yet created in schema
// TODO: Create suppliers and purchase_orders tables in schema.ts

export async function listSuppliers() {
  return [];
}

export async function createSupplier(supplier: any) {
  return { success: true };
}

export async function listPurchaseOrders(filters?: {
  status?: string;
  supplierId?: number;
}) {
  return [];
}

export async function createPurchaseOrder(po: any) {
  return { success: true };
}

export async function receivePurchaseOrder(poId: number, userId: number) {
  return { success: true };
}


// ============================================================================
// EMAIL ACCOUNTS
// ============================================================================

import { emailAccounts, type EmailAccount, type InsertEmailAccount } from "../drizzle/schema";

export async function listEmailAccounts(): Promise<EmailAccount[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(emailAccounts).orderBy(desc(emailAccounts.isPrimary), emailAccounts.email);
}

export async function getEmailAccountById(id: number): Promise<EmailAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const results = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id)).limit(1);
  return results[0];
}

export async function getPrimaryEmailAccount(): Promise<EmailAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const results = await db.select().from(emailAccounts)
    .where(and(eq(emailAccounts.isPrimary, true), eq(emailAccounts.isActive, true)))
    .limit(1);
  return results[0];
}

export async function createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If this is being set as primary, unset all other primary accounts first
  if (account.isPrimary) {
    await db.update(emailAccounts)
      .set({ isPrimary: false })
      .where(eq(emailAccounts.isPrimary, true));
  }
  
  const result = await db.insert(emailAccounts).values(account);
  const newId = Number(result[0].insertId);
  
  const newAccount = await getEmailAccountById(newId);
  if (!newAccount) throw new Error("Failed to retrieve created email account");
  
  return newAccount;
}

export async function updateEmailAccount(id: number, updates: Partial<InsertEmailAccount>): Promise<EmailAccount> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If setting as primary, unset all other primary accounts first
  if (updates.isPrimary === true) {
    await db.update(emailAccounts)
      .set({ isPrimary: false })
      .where(eq(emailAccounts.isPrimary, true));
  }
  
  await db.update(emailAccounts)
    .set(updates)
    .where(eq(emailAccounts.id, id));
  
  const updated = await getEmailAccountById(id);
  if (!updated) throw new Error("Failed to retrieve updated email account");
  
  return updated;
}

export async function deleteEmailAccount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
}

export async function setPrimaryEmailAccount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Unset all primary flags
  await db.update(emailAccounts)
    .set({ isPrimary: false })
    .where(eq(emailAccounts.isPrimary, true));
  
  // Set the specified account as primary
  await db.update(emailAccounts)
    .set({ isPrimary: true })
    .where(eq(emailAccounts.id, id));
}


// ============================================================================
// COMPLAINT EMAILS
// ============================================================================

import { complaintEmails, type ComplaintEmail, type InsertComplaintEmail } from "../drizzle/schema";

export async function createComplaintEmail(complaint: InsertComplaintEmail): Promise<ComplaintEmail> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(complaintEmails).values(complaint);
  const newId = Number(result[0].insertId);
  
  const newComplaint = await db.select().from(complaintEmails).where(eq(complaintEmails.id, newId)).limit(1);
  if (!newComplaint[0]) throw new Error("Failed to retrieve created complaint email");
  
  return newComplaint[0];
}

export async function getCaseComplaints(caseId: number): Promise<ComplaintEmail[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(complaintEmails)
    .where(eq(complaintEmails.caseId, caseId))
    .orderBy(desc(complaintEmails.createdAt));
}

export async function updateComplaintStatus(id: number, status: string, sentAt?: Date): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status };
  if (sentAt) updates.sentAt = sentAt;
  
  await db.update(complaintEmails)
    .set(updates)
    .where(eq(complaintEmails.id, id));
}

export async function markComplaintResponseReceived(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(complaintEmails)
    .set({
      responseReceived: true,
      responseReceivedAt: new Date(),
    })
    .where(eq(complaintEmails.id, id));
}


// ============================================================================
// CASE DOCUMENTS
// ============================================================================

import { type CaseDocument, type InsertCaseDocument } from "../drizzle/schema";

export async function uploadCaseDocument(document: InsertCaseDocument): Promise<CaseDocument> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(caseDocuments).values(document);
  const newId = Number(result[0].insertId);
  
  const newDoc = await db.select().from(caseDocuments).where(eq(caseDocuments.id, newId)).limit(1);
  if (!newDoc[0]) throw new Error("Failed to retrieve uploaded document");
  
  return newDoc[0];
}

export async function getCaseDocuments(caseId: number): Promise<CaseDocument[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(caseDocuments)
    .where(eq(caseDocuments.caseId, caseId))
    .orderBy(desc(caseDocuments.createdAt));
}

export async function deleteCaseDocument(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(caseDocuments).where(eq(caseDocuments.id, id));
}

// Legacy function name for backward compatibility
export async function captureScreenshotProof(caseId: number, screenshotUrl: string, uploadedBy: number): Promise<CaseDocument> {
  return await uploadCaseDocument({
    caseId,
    fileName: `screenshot-${Date.now()}.png`,
    fileKey: screenshotUrl,
    fileUrl: screenshotUrl,
    fileType: "image/png",
    fileSize: 0,
    documentType: "screenshot",
    uploadedBy,
  });
}


// ==================== INVENTORY MANAGEMENT ====================

import {
  products,
  inventoryLocations,
  inventoryStock,
  stockMovements,
} from "../drizzle/schema";

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type InventoryLocation = typeof inventoryLocations.$inferSelect;
export type InventoryStock = typeof inventoryStock.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;

/**
 * Get inventory overview with key metrics
 */
export async function getInventoryOverview() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get total inventory value
  const stockWithProducts = await db
    .select({
      productId: inventoryStock.productId,
      quantity: inventoryStock.quantity,
      cost: products.cost,
      price: products.price,
    })
    .from(inventoryStock)
    .leftJoin(products, eq(inventoryStock.productId, products.id));

  const totalValue = stockWithProducts.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.cost || 0),
    0
  );
  const totalRetailValue = stockWithProducts.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.price || 0),
    0
  );
  const totalUnits = stockWithProducts.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Get low stock count
  const lowStockItems = await db
    .select({ count: sql<number>`count(*)` })
    .from(inventoryStock)
    .where(sql`${inventoryStock.quantity} < ${inventoryStock.reorderPoint}`);

  // Get recent movements
  const recentMovements = await db
    .select()
    .from(stockMovements)
    .orderBy(desc(stockMovements.createdAt))
    .limit(10);

  return {
    totalValue,
    totalRetailValue,
    potentialProfit: totalRetailValue - totalValue,
    totalUnits,
    lowStockCount: lowStockItems[0]?.count || 0,
    recentMovements,
  };
}

/**
 * Get inventory by location
 */
export async function getInventoryByLocation(locationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stockAtLocation = await db
    .select({
      id: inventoryStock.id,
      productId: inventoryStock.productId,
      sku: products.sku,
      name: products.name,
      quantity: inventoryStock.quantity,
      reservedQuantity: inventoryStock.reservedQuantity,
      availableQuantity: sql<number>`${inventoryStock.quantity} - ${inventoryStock.reservedQuantity}`,
      cost: products.cost,
      price: products.price,
      value: sql<number>`${inventoryStock.quantity} * ${products.cost}`,
      reorderPoint: inventoryStock.reorderPoint,
      needsReorder: sql<boolean>`${inventoryStock.quantity} < ${inventoryStock.reorderPoint}`,
    })
    .from(inventoryStock)
    .leftJoin(products, eq(inventoryStock.productId, products.id))
    .where(eq(inventoryStock.locationId, locationId));

  return stockAtLocation;
}

/**
 * Calculate real-time inventory valuation
 */
export async function calculateInventoryValuation() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Total valuation
  const totalVal = await db
    .select({
      totalCost: sql<number>`SUM(${inventoryStock.quantity} * ${products.cost})`,
      totalRetail: sql<number>`SUM(${inventoryStock.quantity} * ${products.price})`,
      totalUnits: sql<number>`SUM(${inventoryStock.quantity})`,
    })
    .from(inventoryStock)
    .leftJoin(products, eq(inventoryStock.productId, products.id));

  // By location
  const byLocation = await db
    .select({
      locationId: inventoryStock.locationId,
      locationName: inventoryLocations.name,
      totalValue: sql<number>`SUM(${inventoryStock.quantity} * ${products.cost})`,
      units: sql<number>`SUM(${inventoryStock.quantity})`,
    })
    .from(inventoryStock)
    .leftJoin(products, eq(inventoryStock.productId, products.id))
    .leftJoin(inventoryLocations, eq(inventoryStock.locationId, inventoryLocations.id))
    .groupBy(inventoryStock.locationId, inventoryLocations.name);

  // By category
  const byCategory = await db
    .select({
      category: products.category,
      totalValue: sql<number>`SUM(${inventoryStock.quantity} * ${products.cost})`,
      units: sql<number>`SUM(${inventoryStock.quantity})`,
    })
    .from(inventoryStock)
    .leftJoin(products, eq(inventoryStock.productId, products.id))
    .groupBy(products.category);

  return {
    total: totalVal[0],
    byLocation,
    byCategory,
  };
}

/**
 * Get low stock products with AI reorder recommendations
 */
export async function getLowStockProducts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const lowStock = await db
    .select({
      productId: products.id,
      sku: products.sku,
      name: products.name,
      currentStock: sql<number>`SUM(${inventoryStock.quantity})`,
      reserved: sql<number>`SUM(${inventoryStock.reservedQuantity})`,
      reorderPoint: inventoryStock.reorderPoint,
      reorderQuantity: inventoryStock.reorderQuantity,
      supplier: products.supplier,
      leadTimeDays: products.leadTimeDays,
      cost: products.cost,
    })
    .from(inventoryStock)
    .leftJoin(products, eq(inventoryStock.productId, products.id))
    .where(sql`${inventoryStock.quantity} < ${inventoryStock.reorderPoint}`)
    .groupBy(
      products.id,
      products.sku,
      products.name,
      inventoryStock.reorderPoint,
      inventoryStock.reorderQuantity,
      products.supplier,
      products.leadTimeDays,
      products.cost
    );

  return lowStock;
}

/**
 * Get top products by value
 */
export async function getTopProductsByValue(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const topProducts = await db
    .select({
      productId: products.id,
      sku: products.sku,
      name: products.name,
      totalQuantity: sql<number>`SUM(${inventoryStock.quantity})`,
      totalValue: sql<number>`SUM(${inventoryStock.quantity} * ${products.cost})`,
      cost: products.cost,
      price: products.price,
    })
    .from(inventoryStock)
    .leftJoin(products, eq(inventoryStock.productId, products.id))
    .groupBy(products.id, products.sku, products.name, products.cost, products.price)
    .orderBy(desc(sql`SUM(${inventoryStock.quantity} * ${products.cost})`))
    .limit(limit);

  return topProducts;
}

/**
 * Create or update product
 */
export async function upsertProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (product.id) {
    // Update existing
    await db.update(products).set(product).where(eq(products.id, product.id));
    return product.id;
  } else {
    // Insert new
    const result = await db.insert(products).values(product);
    return result[0].insertId;
  }
}

/**
 * Get product by ID with stock levels
 */
export async function getProductWithStock(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);

  if (product.length === 0) return null;

  const stockLevels = await db
    .select({
      locationId: inventoryStock.locationId,
      locationName: inventoryLocations.name,
      quantity: inventoryStock.quantity,
      reservedQuantity: inventoryStock.reservedQuantity,
      availableQuantity: sql<number>`${inventoryStock.quantity} - ${inventoryStock.reservedQuantity}`,
      reorderPoint: inventoryStock.reorderPoint,
    })
    .from(inventoryStock)
    .leftJoin(inventoryLocations, eq(inventoryStock.locationId, inventoryLocations.id))
    .where(eq(inventoryStock.productId, productId));

  return {
    ...product[0],
    stockLevels,
  };
}

/**
 * Search products by SKU or name
 */
export async function searchProducts(query: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const searchPattern = `%${query}%`;

  const results = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      category: products.category,
      cost: products.cost,
      price: products.price,
      supplier: products.supplier,
      totalStock: sql<number>`(SELECT SUM(quantity) FROM inventory_stock WHERE productId = products.id)`,
    })
    .from(products)
    .where(
      or(
        sql`${products.sku} LIKE ${searchPattern}`,
        sql`${products.name} LIKE ${searchPattern}`,
        sql`${products.barcode} LIKE ${searchPattern}`
      )
    )
    .limit(limit);

  return results;
}

/**
 * Adjust stock level (add or remove inventory)
 */
export async function adjustStock(params: {
  productId: number;
  locationId: number;
  quantity: number; // Positive for add, negative for remove
  movementType: string;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  performedBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { productId, locationId, quantity, movementType, referenceType, referenceId, notes, performedBy } = params;

  // Update stock level
  const currentStock = await db
    .select()
    .from(inventoryStock)
    .where(and(eq(inventoryStock.productId, productId), eq(inventoryStock.locationId, locationId)))
    .limit(1);

  if (currentStock.length === 0) {
    // Create new stock record
    await db.insert(inventoryStock).values({
      productId,
      locationId,
      quantity: Math.max(0, quantity),
      reservedQuantity: 0,
      reorderPoint: 10,
      reorderQuantity: 50,
    });
  } else {
    // Update existing
    const newQuantity = Math.max(0, currentStock[0].quantity + quantity);
    await db
      .update(inventoryStock)
      .set({ quantity: newQuantity })
      .where(eq(inventoryStock.id, currentStock[0].id));
  }

  // Record movement
  await db.insert(stockMovements).values({
    productId,
    locationId,
    movementType,
    quantity,
    referenceType,
    referenceId,
    notes,
    performedBy,
  });

  return { success: true };
}

/**
 * Get stock movement history
 */
export async function getStockMovements(params: {
  productId?: number;
  locationId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { productId, locationId, limit = 100 } = params;

  let query = db
    .select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      productSku: products.sku,
      productName: products.name,
      locationId: stockMovements.locationId,
      locationName: inventoryLocations.name,
      movementType: stockMovements.movementType,
      quantity: stockMovements.quantity,
      notes: stockMovements.notes,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .leftJoin(inventoryLocations, eq(stockMovements.locationId, inventoryLocations.id))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

  if (productId) {
    query = query.where(eq(stockMovements.productId, productId)) as any;
  }
  if (locationId) {
    query = query.where(eq(stockMovements.locationId, locationId)) as any;
  }

  return await query;
}

/**
 * Get all inventory locations
 */
export async function getInventoryLocations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(inventoryLocations).where(eq(inventoryLocations.isActive, true));
}

/**
 * Get all products with pagination
 */
export async function getProducts(params: { page?: number; limit?: number; category?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { page = 1, limit = 50, category } = params;
  const offset = (page - 1) * limit;

  let query = db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      category: products.category,
      cost: products.cost,
      price: products.price,
      margin: products.margin,
      supplier: products.supplier,
      isActive: products.isActive,
      totalStock: sql<number>`(SELECT SUM(quantity) FROM inventory_stock WHERE productId = products.id)`,
    })
    .from(products)
    .limit(limit)
    .offset(offset);

  if (category) {
    query = query.where(eq(products.category, category)) as any;
  }

  return await query;
}
