import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  InsertCase, cases,
  InsertActivityLog, activityLogs,
  InsertAttachment, attachments,
  InsertDocument, documents,
  templates
} from "../drizzle/schema";
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

// Case management queries
export async function createCase(caseData: InsertCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cases).values(caseData);
  // Get the inserted ID from result
  const insertId = Number(result[0].insertId);
  
  // Fetch and return the created case
  const createdCase = await getCaseById(insertId);
  if (!createdCase) throw new Error("Failed to retrieve created case");
  
  return createdCase;
}

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return result[0] || null;
}

export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cases).orderBy(cases.createdAt);
}

export async function updateCase(id: number, updates: Partial<InsertCase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(cases).set(updates).where(eq(cases.id, id));
}

export async function deleteCase(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(cases).where(eq(cases.id, id));
}

// Activity log queries
export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(activityLogs).values(log);
}

export async function getCaseActivityLogs(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activityLogs).where(eq(activityLogs.caseId, caseId)).orderBy(activityLogs.createdAt);
}

// Attachment queries
export async function createAttachment(attachment: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(attachments).values(attachment);
  return result;
}

export async function getCaseAttachments(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(attachments).where(eq(attachments.caseId, caseId));
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(attachments).where(eq(attachments.id, id));
}

// Document queries
export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documents).values(doc);
  return result;
}

export async function getCaseDocuments(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(documents).where(eq(documents.caseId, caseId));
}

// Template queries
export async function getActiveTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(templates).where(eq(templates.isActive, 1));
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  return result[0] || null;
}

// Dashboard analytics queries
export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) return null;
  
  const allCases = await db.select().from(cases);
  
  const totalClaimed = allCases.reduce((sum, c) => sum + c.claimedAmount, 0);
  const totalRecovered = allCases.reduce((sum, c) => sum + c.recoveredAmount, 0);
  const openExposure = allCases
    .filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED')
    .reduce((sum, c) => sum + (c.claimedAmount - c.recoveredAmount), 0);
  
  // Case status counts
  const openCases = allCases.filter(c => c.status === 'OPEN').length;
  const inProgressCases = allCases.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCases = allCases.filter(c => c.status === 'RESOLVED').length;
  const rejectedCases = allCases.filter(c => c.status === 'REJECTED').length;
  
  // Carrier statistics
  const carrierMap = new Map<string, { count: number; amount: number }>();
  allCases.forEach(c => {
    const existing = carrierMap.get(c.carrier) || { count: 0, amount: 0 };
    carrierMap.set(c.carrier, {
      count: existing.count + 1,
      amount: existing.amount + c.claimedAmount,
    });
  });
  
  const carrierStats = Array.from(carrierMap.entries())
    .map(([carrier, stats]) => ({
      carrier,
      count: stats.count,
      amount: stats.amount / 100, // Convert cents to dollars
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    totalClaimed,
    totalRecovered,
    openExposure,
    totalCases: allCases.length,
    resolvedCases,
    openCases,
    inProgressCases,
    rejectedCases,
    successRate: allCases.length > 0 ? (resolvedCases / allCases.length) * 100 : 0,
    carrierStats,
  };
}

// AI Conversation functions
export async function saveAIConversation(data: {
  userId: number;
  conversationId: string;
  message: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  context?: string;
  actionTaken?: string;
}) {
  const db = await getDb();
  if (!db) return;
  
  const { aiConversations } = await import("../drizzle/schema");
  
  await db.insert(aiConversations).values({
    userId: data.userId,
    conversationId: data.conversationId,
    message: data.message,
    role: data.role,
    context: data.context,
    actionTaken: data.actionTaken,
  });
}

export async function getAIConversationHistory(
  userId: number,
  conversationId?: string,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];
  
  const { aiConversations } = await import("../drizzle/schema");
  const { desc, and } = await import("drizzle-orm");
  
  let query = conversationId
    ? db.select().from(aiConversations).where(
        and(
          eq(aiConversations.userId, userId),
          eq(aiConversations.conversationId, conversationId)
        )
      )
    : db.select().from(aiConversations).where(eq(aiConversations.userId, userId));
  
  const result = await query.orderBy(desc(aiConversations.createdAt)).limit(limit);
  return result;
}

// ============================================
// Email Accounts Functions
// ============================================

export async function createEmailAccount(account: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { emailAccounts } = await import("../drizzle/schema");
  await db.insert(emailAccounts).values(account);
}

export async function getEmailAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { emailAccounts } = await import("../drizzle/schema");
  return await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId));
}

export async function getEmailAccountById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { emailAccounts } = await import("../drizzle/schema");
  const result = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDefaultEmailAccount(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { emailAccounts } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  const result = await db.select().from(emailAccounts)
    .where(and(
      eq(emailAccounts.userId, userId),
      eq(emailAccounts.isDefault, 1)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEmailAccount(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { emailAccounts } = await import("../drizzle/schema");
  await db.update(emailAccounts).set(updates).where(eq(emailAccounts.id, id));
}

export async function deleteEmailAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { emailAccounts } = await import("../drizzle/schema");
  await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
}

// ============================================
// Email Communications Functions
// ============================================

export async function createEmailCommunication(email: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { emailCommunications } = await import("../drizzle/schema");
  const result = await db.insert(emailCommunications).values(email);
  return Number(result[0].insertId);
}

export async function getEmailCommunications(caseId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { emailCommunications } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
  if (caseId) {
    return await db.select().from(emailCommunications)
      .where(eq(emailCommunications.caseId, caseId))
      .orderBy(desc(emailCommunications.createdAt));
  }
  
  return await db.select().from(emailCommunications)
    .orderBy(desc(emailCommunications.createdAt));
}

export async function updateEmailCommunication(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { emailCommunications } = await import("../drizzle/schema");
  await db.update(emailCommunications).set(updates).where(eq(emailCommunications.id, id));
}

// ============================================
// Google Sheets / Shipment Data Functions
// ============================================

export async function createShipmentData(data: {
  trackingNumber: string | null;
  carrier: string | null;
  service: string | null;
  orderNumber: string | null;
  customerName: string | null;
  shipDate: Date | null;
  deliveryDate: Date | null;
  weight: number | null;
  cost: number | null;
  status: string | null;
  source: string;
  sourceId: string | null;
  rawData: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { shipmentData } = await import("../drizzle/schema");
  
  await db.insert(shipmentData).values({
    trackingNumber: data.trackingNumber,
    carrier: data.carrier,
    service: data.service,
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    shipDate: data.shipDate,
    deliveryDate: data.deliveryDate,
    weight: data.weight,
    cost: data.cost,
    status: data.status,
    source: data.source,
    sourceId: data.sourceId,
    rawData: data.rawData,
  });
}

export async function getShipmentDataByTracking(trackingNumber: string) {
  const db = await getDb();
  if (!db) return [];

  const { shipmentData } = await import("../drizzle/schema");
  return await db.select().from(shipmentData).where(eq(shipmentData.trackingNumber, trackingNumber));
}

export async function getAllShipmentData() {
  const db = await getDb();
  if (!db) return [];

  const { shipmentData } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return await db.select().from(shipmentData).orderBy(desc(shipmentData.createdAt));
}
