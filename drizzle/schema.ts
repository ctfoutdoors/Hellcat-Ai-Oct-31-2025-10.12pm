import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index, json, date } from "drizzle-orm/mysql-core";

/**
 * HELLCAT AI V4 - CARRIER DISPUTE CLAIMS MANAGEMENT SYSTEM
 * Complete Database Schema - 59 Tables
 */

// ============================================================================
// USER & SECURITY TABLES
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  permissions: json("permissions").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  granted: boolean("granted").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  resource: varchar("resource", { length: 100 }),
  resourceId: int("resourceId"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export const credentialsVault = mysqlTable("credentials_vault", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull(),
  credentialType: varchar("credentialType", { length: 50 }).notNull(),
  encryptedValue: text("encryptedValue").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  serviceIdx: index("service_idx").on(table.service),
}));

// ============================================================================
// CORE CASE MANAGEMENT TABLES
// ============================================================================

export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", [
    "draft", "open", "investigating", "evidence_gathering", 
    "dispute_filed", "awaiting_response", "under_review", 
    "escalated", "resolved_won", "resolved_lost", "closed"
  ]).default("draft").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  caseType: varchar("caseType", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 100 }),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  claimAmount: decimal("claimAmount", { precision: 10, scale: 2 }),
  recoveredAmount: decimal("recoveredAmount", { precision: 10, scale: 2 }),
  
  // Customer Information
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  
  // Shipping Address
  shippingAddress1: varchar("shippingAddress1", { length: 255 }),
  shippingAddress2: varchar("shippingAddress2", { length: 255 }),
  shippingCity: varchar("shippingCity", { length: 100 }),
  shippingState: varchar("shippingState", { length: 50 }),
  shippingZip: varchar("shippingZip", { length: 20 }),
  shippingCountry: varchar("shippingCountry", { length: 100 }),
  
  // Billing Address
  billingAddress1: varchar("billingAddress1", { length: 255 }),
  billingAddress2: varchar("billingAddress2", { length: 255 }),
  billingCity: varchar("billingCity", { length: 100 }),
  billingState: varchar("billingState", { length: 50 }),
  billingZip: varchar("billingZip", { length: 20 }),
  billingCountry: varchar("billingCountry", { length: 100 }),
  
  // Order Information
  orderNumber: varchar("orderNumber", { length: 100 }),
  orderDate: timestamp("orderDate"),
  orderTotal: decimal("orderTotal", { precision: 10, scale: 2 }),
  
  // Product Information
  productSku: varchar("productSku", { length: 100 }),
  productName: varchar("productName", { length: 500 }),
  productQuantity: int("productQuantity"),
  productPrice: decimal("productPrice", { precision: 10, scale: 2 }),
  
  // Service and dimensions
  serviceType: varchar("serviceType", { length: 100 }),
  actualDimensions: varchar("actualDimensions", { length: 100 }),
  carrierStatedDimensions: varchar("carrierStatedDimensions", { length: 100 }),
  dimensionsMismatch: boolean("dimensionsMismatch").default(false),
  closestTubeSize: varchar("closestTubeSize", { length: 50 }),
  dimensionDifference: decimal("dimensionDifference", { precision: 10, scale: 2 }),
  
  assignedTo: int("assignedTo"),
  templateId: int("templateId"),
  aiSuccessProbability: int("aiSuccessProbability"),
  aiRecommendation: text("aiRecommendation"),
  dueDate: timestamp("dueDate"),
  resolvedAt: timestamp("resolvedAt"),
  isFlagged: int("isFlagged").default(0).notNull(),
  flagReason: text("flagReason"),
  flaggedAt: timestamp("flaggedAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseNumberIdx: index("case_number_idx").on(table.caseNumber),
  statusIdx: index("status_idx").on(table.status),
  carrierIdx: index("carrier_idx").on(table.carrier),
  trackingIdx: index("tracking_idx").on(table.trackingNumber),
  createdByIdx: index("created_by_idx").on(table.createdBy),
}));

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

export const caseDocuments = mysqlTable("case_documents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  documentType: varchar("documentType", { length: 100 }),
  source: mysqlEnum("source", ["ctf", "carrier", "system", "external"]).default("ctf").notNull(),
  isAuthoritative: boolean("isAuthoritative").default(true).notNull(),
  ocrText: text("ocrText"),
  aiSummary: text("aiSummary"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
  sourceIdx: index("source_idx").on(table.source),
}));

export type CaseDocument = typeof caseDocuments.$inferSelect;
export type InsertCaseDocument = typeof caseDocuments.$inferInsert;

export const caseNotes = mysqlTable("case_notes", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  content: text("content").notNull(),
  noteType: varchar("noteType", { length: 50 }).default("general"),
  isInternal: boolean("isInternal").default(false).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
}));

export const caseActivities = mysqlTable("case_activities", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  activityType: varchar("activityType", { length: 100 }).notNull(),
  description: text("description").notNull(),
  metadata: json("metadata"),
  performedBy: int("performedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
  typeIdx: index("type_idx").on(table.activityType),
}));

export type CaseNote = typeof caseNotes.$inferSelect;
export type InsertCaseNote = typeof caseNotes.$inferInsert;
export type CaseActivity = typeof caseActivities.$inferSelect;
export type InsertCaseActivity = typeof caseActivities.$inferInsert;

/**
 * Extraction History - AI Learning System
 * Tracks document extractions to improve accuracy over time
 */
export const extractionHistory = mysqlTable("extraction_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  extractedData: text("extractedData").notNull(), // JSON string of extracted data
  finalData: text("finalData"), // JSON string of user-corrected data
  wasModified: int("wasModified").default(0).notNull(), // 0 = accepted as-is, 1 = user modified
  confidenceScores: text("confidenceScores"), // JSON string of confidence scores
  caseId: int("caseId"), // Link to created case if applicable
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExtractionHistory = typeof extractionHistory.$inferSelect;
export type InsertExtractionHistory = typeof extractionHistory.$inferInsert;

export const caseTemplates = mysqlTable("case_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  caseType: varchar("caseType", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 100 }),
  templateData: json("templateData").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const disputeLetters = mysqlTable("dispute_letters", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  templateId: int("templateId"),
  version: int("version").default(1).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["draft", "review", "sent", "archived"]).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  generatedBy: varchar("generatedBy", { length: 50 }).default("ai").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
}));

export const scheduledFollowups = mysqlTable("scheduled_followups", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  followupType: mysqlEnum("followupType", ["3_day", "7_day", "14_day", "custom"]).notNull(),
  emailSubject: text("emailSubject").notNull(),
  emailBody: text("emailBody").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "cancelled"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
  scheduledForIdx: index("scheduled_for_idx").on(table.scheduledFor),
  statusIdx: index("status_idx").on(table.status),
}));

export type ScheduledFollowup = typeof scheduledFollowups.$inferSelect;
export type InsertScheduledFollowup = typeof scheduledFollowups.$inferInsert;

export const disputeLetterTemplates = mysqlTable("dispute_letter_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  caseType: varchar("caseType", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 100 }),
  templateContent: text("templateContent").notNull(),
  variables: json("variables").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseTypeIdx: index("case_type_idx").on(table.caseType),
  carrierIdx: index("carrier_idx").on(table.carrier),
}));

export type DisputeLetterTemplate = typeof disputeLetterTemplates.$inferSelect;
export type InsertDisputeLetterTemplate = typeof disputeLetterTemplates.$inferInsert;

// ============================================================================
// SHIPMENT & ORDER TABLES
// ============================================================================

export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  trackingNumber: varchar("trackingNumber", { length: 100 }).notNull().unique(),
  carrier: varchar("carrier", { length: 100 }).notNull(),
  service: varchar("service", { length: 100 }),
  orderId: int("orderId"),
  poId: int("poId"),
  shipDate: timestamp("shipDate"),
  deliveryDate: timestamp("deliveryDate"),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  status: varchar("status", { length: 100 }),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  declaredWeight: decimal("declaredWeight", { precision: 10, scale: 2 }),
  dimensions: varchar("dimensions", { length: 100 }),
  declaredDimensions: varchar("declaredDimensions", { length: 100 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  billedCost: decimal("billedCost", { precision: 10, scale: 2 }),
  originZip: varchar("originZip", { length: 20 }),
  destinationZip: varchar("destinationZip", { length: 20 }),
  currentLocation: text("currentLocation"),
  destinationAddress: text("destinationAddress"),
  hasDiscrepancy: boolean("hasDiscrepancy").default(false).notNull(),
  lastAuditDate: timestamp("lastAuditDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  trackingIdx: index("tracking_idx").on(table.trackingNumber),
  carrierIdx: index("carrier_idx").on(table.carrier),
  orderIdx: index("order_idx").on(table.orderId),
}));

export type Shipment = typeof shipments.$inferSelect;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull().unique(),
  source: varchar("source", { length: 100 }).notNull(), // "shipstation", "manual", etc.
  channel: varchar("channel", { length: 100 }), // "Amazon", "eBay", "Shopify", etc.
  externalId: varchar("externalId", { length: 255 }), // ShipStation orderId
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  shippingAddress: json("shippingAddress"), // Full address object
  orderDate: timestamp("orderDate").notNull(),
  shipDate: timestamp("shipDate"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 100 }), // "awaiting_shipment", "shipped", "cancelled", etc.
  orderItems: json("orderItems"), // Array of items with SKU, name, quantity, price
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  carrierCode: varchar("carrierCode", { length: 100 }),
  serviceCode: varchar("serviceCode", { length: 100 }),
  shipmentId: int("shipmentId"), // Foreign key to shipments table
  orderData: json("orderData"), // Full ShipStation order response
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderNumberIdx: index("order_number_idx").on(table.orderNumber),
  sourceIdx: index("source_idx").on(table.source),
  channelIdx: index("channel_idx").on(table.channel),
  statusIdx: index("status_idx").on(table.status),
  trackingIdx: index("tracking_idx").on(table.trackingNumber),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const trackingEvents = mysqlTable("tracking_events", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  eventDate: timestamp("eventDate").notNull(),
  eventCode: varchar("eventCode", { length: 100 }),
  eventDescription: text("eventDescription"),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  shipmentIdx: index("shipment_idx").on(table.shipmentId),
  eventDateIdx: index("event_date_idx").on(table.eventDate),
}));

export const deliveryGuarantees = mysqlTable("delivery_guarantees", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  service: varchar("service", { length: 100 }).notNull(),
  guaranteedDate: timestamp("guaranteedDate").notNull(),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  isMissed: boolean("isMissed").default(false).notNull(),
  refundAmount: decimal("refundAmount", { precision: 10, scale: 2 }),
  claimFiled: boolean("claimFiled").default(false).notNull(),
  claimStatus: varchar("claimStatus", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  shipmentIdx: index("shipment_idx").on(table.shipmentId),
}));

export const shipmentAudits = mysqlTable("shipment_audits", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  auditDate: timestamp("auditDate").notNull(),
  auditType: varchar("auditType", { length: 100 }).notNull(),
  findings: json("findings"),
  potentialSavings: decimal("potentialSavings", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  shipmentIdx: index("shipment_idx").on(table.shipmentId),
}));

export const discrepancies = mysqlTable("discrepancies", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  discrepancyType: varchar("discrepancyType", { length: 100 }).notNull(),
  description: text("description"),
  expectedValue: varchar("expectedValue", { length: 255 }),
  actualValue: varchar("actualValue", { length: 255 }),
  impactAmount: decimal("impactAmount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 100 }),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  shipmentIdx: index("shipment_idx").on(table.shipmentId),
  typeIdx: index("type_idx").on(table.discrepancyType),
}));

// ============================================================================
// CARRIER & SERVICE TABLES
// ============================================================================

export const carriers = mysqlTable("carriers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  website: varchar("website", { length: 500 }),
  supportEmail: varchar("supportEmail", { length: 320 }),
  supportPhone: varchar("supportPhone", { length: 50 }),
  apiEndpoint: varchar("apiEndpoint", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const carrierServices = mysqlTable("carrier_services", {
  id: int("id").autoincrement().primaryKey(),
  carrierId: int("carrierId").notNull(),
  serviceName: varchar("serviceName", { length: 255 }).notNull(),
  serviceCode: varchar("serviceCode", { length: 100 }).notNull(),
  hasDeliveryGuarantee: boolean("hasDeliveryGuarantee").default(false).notNull(),
  guaranteeTerms: text("guaranteeTerms"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  carrierIdx: index("carrier_idx").on(table.carrierId),
}));

export const carrierTerms = mysqlTable("carrier_terms", {
  id: int("id").autoincrement().primaryKey(),
  carrierId: int("carrierId").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  effectiveDate: timestamp("effectiveDate").notNull(),
  termsUrl: varchar("termsUrl", { length: 500 }),
  termsContent: text("termsContent"),
  changes: text("changes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  carrierIdx: index("carrier_idx").on(table.carrierId),
}));

export const carrierRateCards = mysqlTable("carrier_rate_cards", {
  id: int("id").autoincrement().primaryKey(),
  carrierId: int("carrierId").notNull(),
  serviceId: int("serviceId").notNull(),
  effectiveDate: timestamp("effectiveDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  rateData: json("rateData").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  carrierIdx: index("carrier_idx").on(table.carrierId),
}));

export const carrierAccounts = mysqlTable("carrier_accounts", {
  id: int("id").autoincrement().primaryKey(),
  carrierId: int("carrierId").notNull(),
  accountNumber: varchar("accountNumber", { length: 100 }).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  credentialId: int("credentialId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  carrierIdx: index("carrier_idx").on(table.carrierId),
}));

// ============================================================================
// FINANCIAL TABLES
// ============================================================================

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  carrierId: int("carrierId").notNull(),
  accountId: int("accountId"),
  poId: int("poId"),
  invoiceDate: timestamp("invoiceDate").notNull(),
  dueDate: timestamp("dueDate"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 100 }),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),
  carrierIdx: index("carrier_idx").on(table.carrierId),
}));

export const invoiceLineItems = mysqlTable("invoice_line_items", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  shipmentId: int("shipmentId"),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  hasDispute: boolean("hasDispute").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index("invoice_idx").on(table.invoiceId),
  shipmentIdx: index("shipment_idx").on(table.shipmentId),
}));

export const refunds = mysqlTable("refunds", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId"),
  shipmentId: int("shipmentId"),
  invoiceId: int("invoiceId"),
  refundType: varchar("refundType", { length: 100 }).notNull(),
  requestedAmount: decimal("requestedAmount", { precision: 10, scale: 2 }).notNull(),
  approvedAmount: decimal("approvedAmount", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 100 }),
  requestDate: timestamp("requestDate").notNull(),
  approvalDate: timestamp("approvalDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
  statusIdx: index("status_idx").on(table.status),
}));

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  referenceNumber: varchar("referenceNumber", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index("invoice_idx").on(table.invoiceId),
}));

export const costAnalysis = mysqlTable("cost_analysis", {
  id: int("id").autoincrement().primaryKey(),
  analysisDate: timestamp("analysisDate").notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  carrierId: int("carrierId"),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }),
  totalSavings: decimal("totalSavings", { precision: 10, scale: 2 }),
  analysisData: json("analysisData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.analysisDate),
}));

// ============================================================================
// INVENTORY & PRODUCT TABLES
// ============================================================================

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 255 }),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  dimensions: varchar("dimensions", { length: 100 }),
  standardDimensions: varchar("standardDimensions", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  margin: decimal("margin", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 255 }),
  leadTimeDays: int("leadTimeDays"),
  imageUrl: text("imageUrl"),
  parentProductIdentifier: varchar("parentProductIdentifier", { length: 100 }),
  shipstationCost: decimal("shipstationCost", { precision: 10, scale: 2 }),
  manualCost: decimal("manualCost", { precision: 10, scale: 2 }),
  channelCosts: json("channelCosts").$type<Record<string, number>>(),
  isActive: boolean("isActive").default(true).notNull(),
  // Intelligence Suite fields
  lifecycleState: mysqlEnum("lifecycleState", ["concept", "development", "pre_launch", "active_launch", "post_launch", "cruise", "end_of_life"]).default("concept"),
  intelligenceMetadata: json("intelligenceMetadata").$type<{
    assets?: { type: string; status: string; url?: string }[];
    requirements?: { name: string; completed: boolean }[];
    readinessScore?: number;
    blockers?: string[];
  }>(),
  variantSummary: json("variantSummary").$type<{
    total?: number;
    ready?: number;
    blocked?: number;
    avgReadiness?: number;
  }>(),
  lastIntelligenceUpdate: timestamp("lastIntelligenceUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  skuIdx: index("sku_idx").on(table.sku),
}));

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),
  parentProductId: int("parentProductId").notNull(),
  woocommerceVariationId: int("woocommerceVariationId"),
  variantSku: varchar("variantSku", { length: 100 }).notNull(),
  attributes: json("attributes").$type<Array<{ name: string; option: string }>>(),
  price: decimal("price", { precision: 10, scale: 2 }),
  compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  stock: int("stock").default(0),
  imageUrl: text("imageUrl"),
  parentProductIdentifier: varchar("parentProductIdentifier", { length: 100 }),
  shipstationCost: decimal("shipstationCost", { precision: 10, scale: 2 }),
  manualCost: decimal("manualCost", { precision: 10, scale: 2 }),
  channelCosts: json("channelCosts").$type<Record<string, number>>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  parentProductIdx: index("parent_product_idx").on(table.parentProductId),
  variantSkuIdx: index("variant_sku_idx").on(table.variantSku),
  woocommerceVariationIdx: index("woocommerce_variation_idx").on(table.woocommerceVariationId),
}));

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

export const productPricing = mysqlTable("product_pricing", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  priceType: mysqlEnum("priceType", ["public", "wholesale", "distributor", "customer_specific"]).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  customerEmailIdx: index("customer_email_idx").on(table.customerEmail),
  priceTypeIdx: index("price_type_idx").on(table.priceType),
}));

export type ProductPricing = typeof productPricing.$inferSelect;
export type InsertProductPricing = typeof productPricing.$inferInsert;

export const channelInventory = mysqlTable("channel_inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  channel: mysqlEnum("channel", ["shipstation", "woocommerce", "amazon", "tiktok", "ebay"]).notNull(),
  warehouseId: varchar("warehouseId", { length: 100 }),
  warehouseName: varchar("warehouseName", { length: 255 }),
  availableQty: int("availableQty").default(0).notNull(),
  buffer: int("buffer").default(0).notNull(),
  zeroStockThreshold: int("zeroStockThreshold").default(0).notNull(),
  manualOverride: int("manualOverride"),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  skuIdx: index("sku_idx").on(table.sku),
  channelIdx: index("channel_idx").on(table.channel),
  uniqueProductChannelWarehouse: index("unique_product_channel_warehouse").on(table.productId, table.channel, table.warehouseId),
}));

export type ChannelInventory = typeof channelInventory.$inferSelect;
export type InsertChannelInventory = typeof channelInventory.$inferInsert;

export const productDimensions = mysqlTable("product_dimensions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  dimensionType: varchar("dimensionType", { length: 100 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }).notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("inches").notNull(),
  isStandard: boolean("isStandard").default(true).notNull(),
  referenceDocumentId: int("referenceDocumentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
}));

export const inventoryLevels = mysqlTable("inventory_levels", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  reservedQuantity: int("reservedQuantity").default(0).notNull(),
  lastCountDate: timestamp("lastCountDate"),
  // Intelligence Suite fields
  safetyStockThreshold: int("safetyStockThreshold"),
  projectedDepletionDate: timestamp("projectedDepletionDate"),
  intelligenceFlags: json("intelligenceFlags").$type<{
    lowStock?: boolean;
    incomingShipment?: boolean;
    criticalLevel?: boolean;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
}));

export const inventoryLocations = mysqlTable("inventory_locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 50 }),
  address: text("address"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inventoryStock = mysqlTable("inventory_stock", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  locationId: int("locationId").notNull(),
  quantity: int("quantity").default(0).notNull(),
  reservedQuantity: int("reservedQuantity").default(0).notNull(),
  availableQuantity: int("availableQuantity").default(0).notNull(),
  reorderPoint: int("reorderPoint"),
  reorderQuantity: int("reorderQuantity"),
  lastCountDate: timestamp("lastCountDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productLocationIdx: index("product_location_idx").on(table.productId, table.locationId),
}));

export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  locationId: int("locationId").notNull(),
  quantity: int("quantity").notNull(),
  movementType: varchar("movementType", { length: 50 }).notNull(),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  notes: text("notes"),
  performedBy: int("performedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  locationIdx: index("location_idx").on(table.locationId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  poNumber: varchar("poNumber", { length: 100 }).notNull().unique(),
  vendorId: int("vendorId").notNull(),
  orderDate: timestamp("orderDate").notNull(),
  shipDate: timestamp("shipDate"),
  expectedDate: timestamp("expectedDate"),
  receivedDate: timestamp("receivedDate"),
  status: varchar("status", { length: 100 }).default("pending"),
  subtotal: int("subtotal").notNull(), // stored in cents
  shippingCost: int("shippingCost").default(0),
  tax: int("tax").default(0),
  totalAmount: int("totalAmount").notNull(), // stored in cents
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  paymentStatus: varchar("paymentStatus", { length: 50 }).default("unpaid"),
  paidDate: timestamp("paidDate"),
  shipToName: varchar("shipToName", { length: 255 }),
  shipToAddress: varchar("shipToAddress", { length: 500 }),
  shipToCity: varchar("shipToCity", { length: 100 }),
  shipToState: varchar("shipToState", { length: 50 }),
  shipToZip: varchar("shipToZip", { length: 20 }),
  shipToCountry: varchar("shipToCountry", { length: 100 }).default("USA"),
  notes: text("notes"),
  internalNotes: text("internalNotes"),
  emailThreadId: varchar("emailThreadId", { length: 255 }),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  poNumberIdx: index("po_number_idx").on(table.poNumber),
  vendorIdx: index("vendor_idx").on(table.vendorId),
  orderDateIdx: index("order_date_idx").on(table.orderDate),
  statusIdx: index("status_idx").on(table.status),
}));

export const poLineItems = mysqlTable("po_line_items", {
  id: int("id").autoincrement().primaryKey(),
  poId: int("poId").notNull(),
  productId: int("productId"),
  sku: varchar("sku", { length: 100 }),
  description: varchar("description", { length: 500 }),
  quantity: int("quantity").notNull(),
  receivedQuantity: int("receivedQuantity").default(0).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  poIdx: index("po_idx").on(table.poId),
}));

export const receivingLogs = mysqlTable("receiving_logs", {
  id: int("id").autoincrement().primaryKey(),
  poId: int("poId").notNull(),
  lineItemId: int("lineItemId"),
  receivedDate: timestamp("receivedDate").notNull(),
  quantityReceived: int("quantityReceived").notNull(),
  receivedBy: int("receivedBy").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  poIdx: index("po_idx").on(table.poId),
}));

export const skuMappings = mysqlTable("sku_mappings", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  externalSku: varchar("externalSku", { length: 100 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  confidence: int("confidence").default(100).notNull(),
  learnedBy: varchar("learnedBy", { length: 50 }).default("ai").notNull(),
  verifiedBy: int("verifiedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  externalSkuIdx: index("external_sku_idx").on(table.externalSku),
}));

// ============================================================================
// CRM TABLES
// ============================================================================

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  companyId: int("companyId"),
  title: varchar("title", { length: 255 }),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  companyIdx: index("company_idx").on(table.companyId),
}));

export const crmCompanies = mysqlTable("crm_companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 255 }),
  size: varchar("size", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  contactId: int("contactId"),
  companyId: int("companyId"),
  value: decimal("value", { precision: 10, scale: 2 }),
  stage: varchar("stage", { length: 100 }),
  probability: int("probability"),
  expectedCloseDate: timestamp("expectedCloseDate"),
  closedDate: timestamp("closedDate"),
  status: varchar("status", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  stageIdx: index("stage_idx").on(table.stage),
}));

export const crmActivities = mysqlTable("crm_activities", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  activityType: varchar("activityType", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  description: text("description"),
  activityDate: timestamp("activityDate").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  contactIdx: index("contact_idx").on(table.contactId),
  dateIdx: index("date_idx").on(table.activityDate),
}));

export const crmNotes = mysqlTable("crm_notes", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId"),
  companyId: int("companyId"),
  content: text("content").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  contactIdx: index("contact_idx").on(table.contactId),
  companyIdx: index("company_idx").on(table.companyId),
}));

// ============================================================================
// AI & KNOWLEDGE BASE TABLES
// ============================================================================

export const aiKnowledgeBase = mysqlTable("ai_knowledge_base", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["admin", "legal", "case", "precedent"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  tags: json("tags").$type<string[]>(),
  source: varchar("source", { length: 255 }),
  relevanceScore: int("relevanceScore"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
}));

export const aiConversations = mysqlTable("ai_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: varchar("conversationId", { length: 255 }).notNull(),
  message: text("message").notNull(),
  response: text("response"),
  context: json("context"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  conversationIdx: index("conversation_idx").on(table.conversationId),
}));

export const aiActions = mysqlTable("ai_actions", {
  id: int("id").autoincrement().primaryKey(),
  actionType: varchar("actionType", { length: 100 }).notNull(),
  description: text("description"),
  parameters: json("parameters"),
  result: json("result"),
  status: varchar("status", { length: 100 }),
  executedAt: timestamp("executedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.actionType),
}));

export const casePrecedents = mysqlTable("case_precedents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  caseType: varchar("caseType", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 100 }),
  outcome: varchar("outcome", { length: 100 }).notNull(),
  claimAmount: decimal("claimAmount", { precision: 10, scale: 2 }),
  recoveredAmount: decimal("recoveredAmount", { precision: 10, scale: 2 }),
  strategy: text("strategy"),
  keyFactors: json("keyFactors"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseTypeIdx: index("case_type_idx").on(table.caseType),
  carrierIdx: index("carrier_idx").on(table.carrier),
}));

export const successPredictions = mysqlTable("success_predictions", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  probability: int("probability").notNull(),
  factors: json("factors"),
  recommendation: text("recommendation"),
  confidence: int("confidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
}));

export const aiRecommendations = mysqlTable("ai_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  recommendationType: varchar("recommendationType", { length: 100 }).notNull(),
  targetId: int("targetId"),
  targetType: varchar("targetType", { length: 100 }),
  recommendation: text("recommendation").notNull(),
  priority: varchar("priority", { length: 50 }),
  status: varchar("status", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.recommendationType),
}));

// ============================================================================
// INTEGRATION & SYNC TABLES
// ============================================================================

export const integrationConfigs = mysqlTable("integration_configs", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull().unique(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  credentialId: int("credentialId"),
  config: json("config"),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const syncLogs = mysqlTable("sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull(),
  syncType: varchar("syncType", { length: 100 }).notNull(),
  status: varchar("status", { length: 100 }).notNull(),
  recordsProcessed: int("recordsProcessed"),
  errors: json("errors"),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  serviceIdx: index("service_idx").on(table.service),
  statusIdx: index("status_idx").on(table.status),
}));

export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 100 }).notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  payload: json("payload").notNull(),
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("source_idx").on(table.source),
  processedIdx: index("processed_idx").on(table.processed),
}));

export const apiRequests = mysqlTable("api_requests", {
  id: int("id").autoincrement().primaryKey(),
  service: varchar("service", { length: 100 }).notNull(),
  endpoint: varchar("endpoint", { length: 500 }).notNull(),
  method: varchar("method", { length: 20 }).notNull(),
  requestData: json("requestData"),
  responseData: json("responseData"),
  statusCode: int("statusCode"),
  duration: int("duration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  serviceIdx: index("service_idx").on(table.service),
}));

export const dataSources = mysqlTable("data_sources", {
  id: int("id").autoincrement().primaryKey(),
  sourceName: varchar("sourceName", { length: 100 }).notNull(),
  sourceType: varchar("sourceType", { length: 100 }).notNull(),
  isAuthoritative: boolean("isAuthoritative").default(false).notNull(),
  priority: int("priority").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailAccounts = mysqlTable("email_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }),
  provider: varchar("provider", { length: 50 }).notNull(), // 'gmail', 'outlook', etc.
  isPrimary: boolean("isPrimary").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  mcpServerName: varchar("mcpServerName", { length: 100 }), // MCP server identifier for this account
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  primaryIdx: index("primary_idx").on(table.isPrimary),
}));

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

export const complaintEmails = mysqlTable("complaint_emails", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  sentAt: timestamp("sentAt"),
  responseReceived: boolean("responseReceived").default(false).notNull(),
  responseReceivedAt: timestamp("responseReceivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
  statusIdx: index("status_idx").on(table.status),
}));

export type ComplaintEmail = typeof complaintEmails.$inferSelect;
export type InsertComplaintEmail = typeof complaintEmails.$inferInsert;

// ============================================================================
// DOCUMENT & TEMPLATE TABLES
// ============================================================================

export const documentTemplates = mysqlTable("document_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  templateType: varchar("templateType", { length: 100 }).notNull(),
  content: text("content").notNull(),
  hasLetterhead: boolean("hasLetterhead").default(false).notNull(),
  letterheadUrl: varchar("letterheadUrl", { length: 1000 }),
  variables: json("variables").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documentVersions = mysqlTable("document_versions", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  version: int("version").notNull(),
  content: text("content").notNull(),
  changes: text("changes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  templateIdx: index("template_idx").on(table.templateId),
}));

export const generatedDocuments = mysqlTable("generated_documents", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId"),
  caseId: int("caseId"),
  documentType: varchar("documentType", { length: 100 }).notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  generatedBy: varchar("generatedBy", { length: 50 }).default("ai").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
}));

export const referenceDocuments = mysqlTable("reference_documents", {
  id: int("id").autoincrement().primaryKey(),
  documentName: varchar("documentName", { length: 255 }).notNull(),
  documentType: varchar("documentType", { length: 100 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  description: text("description"),
  isPermanent: boolean("isPermanent").default(true).notNull(),
  tags: json("tags").$type<string[]>(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// MONITORING & ALERTS TABLES
// ============================================================================

export const monitoringRules = mysqlTable("monitoring_rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleName: varchar("ruleName", { length: 255 }).notNull(),
  ruleType: varchar("ruleType", { length: 100 }).notNull(),
  conditions: json("conditions").notNull(),
  actions: json("actions").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  targetId: int("targetId"),
  targetType: varchar("targetType", { length: 100 }),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.alertType),
  severityIdx: index("severity_idx").on(table.severity),
}));

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  notificationType: varchar("notificationType", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  isReadIdx: index("is_read_idx").on(table.isRead),
}));

export const emailMonitoring = mysqlTable("email_monitoring", {
  id: int("id").autoincrement().primaryKey(),
  emailId: varchar("emailId", { length: 255 }).notNull().unique(),
  fromAddress: varchar("fromAddress", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  receivedAt: timestamp("receivedAt").notNull(),
  caseId: int("caseId"),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  isProcessed: boolean("isProcessed").default(false).notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  fromIdx: index("from_idx").on(table.fromAddress),
  processedIdx: index("processed_idx").on(table.isProcessed),
}));

// ============================================================================
// VOICE & AUDIO TABLES
// ============================================================================

export const voiceCommands = mysqlTable("voice_commands", {
  id: int("id").autoincrement().primaryKey(),
  commandName: varchar("commandName", { length: 255 }).notNull().unique(),
  commandPhrase: varchar("commandPhrase", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  parameters: json("parameters"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const voiceRecordings = mysqlTable("voice_recordings", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId"),
  recordingUrl: varchar("recordingUrl", { length: 1000 }).notNull(),
  duration: int("duration"),
  transcriptionId: int("transcriptionId"),
  recordedBy: int("recordedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
}));

export const transcriptions = mysqlTable("transcriptions", {
  id: int("id").autoincrement().primaryKey(),
  recordingId: int("recordingId"),
  transcriptionText: text("transcriptionText").notNull(),
  confidence: int("confidence"),
  language: varchar("language", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  recordingIdx: index("recording_idx").on(table.recordingId),
}));

export const voiceActions = mysqlTable("voice_actions", {
  id: int("id").autoincrement().primaryKey(),
  commandId: int("commandId").notNull(),
  userId: int("userId").notNull(),
  executedAt: timestamp("executedAt").notNull(),
  result: json("result"),
  status: varchar("status", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

// ============================================================================
// ANALYTICS & REPORTING TABLES
// ============================================================================

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reportName: varchar("reportName", { length: 255 }).notNull(),
  reportType: varchar("reportType", { length: 100 }).notNull(),
  description: text("description"),
  config: json("config").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reportSchedules = mysqlTable("report_schedules", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(),
  recipients: json("recipients").$type<string[]>(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  reportIdx: index("report_idx").on(table.reportId),
}));

export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricName: varchar("metricName", { length: 255 }).notNull(),
  metricType: varchar("metricType", { length: 100 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  period: varchar("period", { length: 50 }),
  metadata: json("metadata"),
  recordedAt: timestamp("recordedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("name_idx").on(table.metricName),
  recordedIdx: index("recorded_idx").on(table.recordedAt),
}));

export const dashboards = mysqlTable("dashboards", {
  id: int("id").autoincrement().primaryKey(),
  dashboardName: varchar("dashboardName", { length: 255 }).notNull(),
  description: text("description"),
  config: json("config").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});




// Vendors table - Supplier and vendor management (PO Intake)
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  vendorNumber: varchar("vendorNumber", { length: 100 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  address: text("address"),
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  taxId: varchar("taxId", { length: 100 }),
  customerNumber: varchar("customerNumber", { length: 100 }),
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Vendor Activities - Track all interactions with vendors
export const vendorActivities = mysqlTable("vendor_activities", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  contactId: int("contactId"), // Which contact was involved
  activityType: mysqlEnum("activityType", [
    "phone_call",
    "email",
    "letter_in",
    "letter_out",
    "fax_in",
    "fax_out",
    "meeting",
    "manual",
    "note"
  ]).notNull(),
  subject: varchar("subject", { length: 500 }),
  description: text("description"),
  direction: mysqlEnum("direction", ["inbound", "outbound"]),
  duration: int("duration"), // Duration in minutes for calls/meetings
  outcome: varchar("outcome", { length: 255 }),
  userId: int("userId").notNull(), // Who logged this activity
  activityDate: timestamp("activityDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Vendor Attachments - Documents, PDFs, images related to vendors
export const vendorAttachments = mysqlTable("vendor_attachments", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  activityId: int("activityId"), // Link to activity if applicable
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"), // Size in bytes
  category: mysqlEnum("category", [
    "contract",
    "invoice",
    "bol",
    "quote",
    "correspondence",
    "screenshot",
    "other"
  ]).default("other"),
  description: text("description"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Vendor Action Items - Tasks and follow-ups
export const vendorActionItems = mysqlTable("vendor_action_items", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  assignedTo: int("assignedTo").notNull(), // User ID
  dueDate: timestamp("dueDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorActivity = typeof vendorActivities.$inferSelect;
export type VendorAttachment = typeof vendorAttachments.$inferSelect;
export type VendorActionItem = typeof vendorActionItems.$inferSelect;

// Companies table - Organization/account management
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 100 }),
  
  // Classification
  accountType: mysqlEnum("accountType", [
    "prospect",          // Potential customer
    "customer",          // Active customer
    "partner",           // Strategic partner
    "competitor"         // Competitive intelligence
  ]).default("prospect").notNull(),
  
  tier: mysqlEnum("tier", [
    "enterprise",        // >$1M annual revenue
    "mid-market",        // $100K-$1M
    "smb"                // <$100K
  ]),
  
  // Financial
  annualRevenue: int("annualRevenue"),   // Company's revenue (not ours)
  lifetimeValue: int("lifetimeValue").default(0), // Our revenue from them (cents)
  
  // Hierarchy
  parentCompanyId: int("parentCompanyId"), // For subsidiaries
  
  // Location
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("USA"),
  
  // Metadata
  tags: text("tags"),                    // JSON array
  customFields: text("customFields"),    // JSON object
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

// ============================================================================
// CRM OVERHAUL - NEW UNIFIED STRUCTURE
// ============================================================================

// Customers table - Unified contact and company management
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  customerNumber: varchar("customerNumber", { length: 255 }).notNull().unique(),
  customerType: mysqlEnum("customerType", ["individual", "company"]).notNull(),
  businessType: mysqlEnum("businessType", ["retail", "wholesale", "distributor", "direct"]).notNull(),
  
  // Individual fields
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  
  // Company fields
  companyName: varchar("companyName", { length: 500 }),
  taxId: varchar("taxId", { length: 100 }),
  website: varchar("website", { length: 500 }),
  
  // Address
  billingAddress: json("billingAddress"),
  shippingAddress: json("shippingAddress"),
  
  // Enrichment data
  googlePlaceId: varchar("googlePlaceId", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Metadata
  source: varchar("source", { length: 100 }), // 'woocommerce', 'shipstation', 'manual', etc.
  externalIds: json("externalIds"), // {woocommerce: 123, shipstation: 456}
  tags: json("tags"),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  companyIdx: index("company_idx").on(table.companyName),
}));

// Customer contacts - Related contacts for company customers
export const customerContacts = mysqlTable("customer_contacts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  title: varchar("title", { length: 255 }),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  customerIdx: index("customer_idx").on(table.customerId),
}));

// Customer activities - Timeline of all interactions
export const customerActivities = mysqlTable("customer_activities", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  activityType: varchar("activityType", { length: 100 }), // 'order', 'support_ticket', 'email', 'note'
  activityDate: timestamp("activityDate"),
  title: varchar("title", { length: 500 }),
  description: text("description"),
  relatedId: varchar("relatedId", { length: 255 }), // order number, ticket ID, etc.
  source: varchar("source", { length: 100 }), // 'woocommerce', 'reamaze', 'klaviyo', 'manual'
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  customerDateIdx: index("customer_date_idx").on(table.customerId, table.activityDate),
}));

// Customer shipments - For route visualization
export const customerShipments = mysqlTable("customer_shipments", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  orderNumber: varchar("orderNumber", { length: 255 }),
  trackingNumber: varchar("trackingNumber", { length: 255 }),
  carrierCode: varchar("carrierCode", { length: 50 }),
  serviceCode: varchar("serviceCode", { length: 50 }),
  originAddress: json("originAddress"),
  destinationAddress: json("destinationAddress"),
  shipDate: timestamp("shipDate"),
  deliveryDate: timestamp("deliveryDate"),
  status: varchar("status", { length: 50 }),
  trackingEvents: json("trackingEvents"), // Array of tracking waypoints
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  customerIdx: index("customer_idx").on(table.customerId),
  trackingIdx: index("tracking_idx").on(table.trackingNumber),
}));

// Vendor contacts - Contacts for vendors
export const vendorContacts = mysqlTable("vendor_contacts", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  title: varchar("title", { length: 255 }),
  department: varchar("department", { length: 255 }),
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  vendorIdx: index("vendor_idx").on(table.vendorId),
}));

// Leads table - Track potential customers and partners
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  leadNumber: varchar("leadNumber", { length: 255 }).notNull().unique(),
  leadType: mysqlEnum("leadType", ["affiliate", "partnership", "distributor", "wholesale", "retail"]).notNull(),
  leadStatus: mysqlEnum("leadStatus", ["new", "contacted", "qualified", "negotiating", "won", "lost"]).default("new"),
  
  // Contact info
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  companyName: varchar("companyName", { length: 500 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  
  // Lead details
  source: varchar("source", { length: 255 }), // 'website', 'referral', 'trade_show', etc.
  estimatedValue: decimal("estimatedValue", { precision: 10, scale: 2 }),
  expectedCloseDate: timestamp("expectedCloseDate"),
  notes: text("notes"),
  
  // Assignment
  assignedTo: int("assignedTo"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  convertedAt: timestamp("convertedAt"),
  convertedToCustomerId: int("convertedToCustomerId"),
}, (table) => ({
  statusIdx: index("status_idx").on(table.leadStatus),
  typeIdx: index("type_idx").on(table.leadType),
}));

// Lead activities - Track lead interactions
export const leadActivities = mysqlTable("lead_activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  activityType: varchar("activityType", { length: 100 }), // 'call', 'email', 'meeting', 'note'
  activityDate: timestamp("activityDate"),
  title: varchar("title", { length: 500 }),
  description: text("description"),
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  leadIdx: index("lead_idx").on(table.leadId),
}));

// Note: skuMappings table already exists earlier in the schema (line 667)


// Tasks table for CRM follow-ups and reminders
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  entityType: mysqlEnum("entityType", ["customer", "lead", "vendor"]).notNull(),
  entityId: int("entityId").notNull(),
  assignedTo: int("assignedTo"),
  dueDate: timestamp("dueDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  metadata: text("metadata"), // JSON string
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;


export const calendarMeetings = mysqlTable("calendar_meetings", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 255 }).notNull().unique(),
  entityType: mysqlEnum("entityType", ["customer", "lead", "vendor"]).notNull(),
  entityId: int("entityId").notNull(),
  summary: varchar("summary", { length: 500 }),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  autoTaskEnabled: boolean("autoTaskEnabled").default(false),
  taskCreated: boolean("taskCreated").default(false),
  createdTaskId: int("createdTaskId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarMeeting = typeof calendarMeetings.$inferSelect;
export type InsertCalendarMeeting = typeof calendarMeetings.$inferInsert;


// Email logs table for tracking email communications
export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who logged the email
  entityType: mysqlEnum("entityType", ["customer", "vendor", "lead", "contact"]).notNull(),
  entityId: int("entityId").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body"),
  direction: mysqlEnum("direction", ["sent", "received"]).notNull(),
  visibility: mysqlEnum("visibility", ["private", "public", "shared"]).default("private").notNull(),
  sharedWithUserIds: text("sharedWithUserIds"), // JSON array of user IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;


// ============================================================================
// INTELLIGENCE SUITE TABLES
// ============================================================================

export const intelligenceProducts = mysqlTable("intelligence_products", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  lifecycleState: mysqlEnum("lifecycleState", ["concept", "development", "pre_launch", "active_launch", "post_launch", "cruise", "end_of_life"]).default("concept").notNull(),
  readinessScore: int("readinessScore").default(0).notNull(),
  intelligenceMetadata: json("intelligenceMetadata").$type<{
    requirements?: { id: string; title: string; status: string; assignee?: number }[];
    assets?: { id: string; type: string; status: string; url?: string }[];
    blockers?: { id: string; severity: string; description: string; resolvedAt?: string }[];
    notes?: string;
  }>(),
  variantSummary: json("variantSummary").$type<{
    totalVariants?: number;
    readyVariants?: number;
    variantDetails?: { variantId: number; readiness: number }[];
  }>(),
  lastIntelligenceUpdate: timestamp("lastIntelligenceUpdate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  lifecycleIdx: index("lifecycle_idx").on(table.lifecycleState),
  readinessIdx: index("readiness_idx").on(table.readinessScore),
}));

export const intelligenceVariants = mysqlTable("intelligence_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  variantId: int("variantId").notNull().unique(),
  inventoryReadiness: int("inventoryReadiness").default(0).notNull(),
  variantMetadata: json("variantMetadata").$type<{
    currentStock?: number;
    projectedDemand?: number;
    supplierStatus?: string;
    imageStatus?: string;
    pricingStatus?: string;
  }>(),
  lastInventorySync: timestamp("lastInventorySync").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  variantIdx: index("variant_idx").on(table.variantId),
}));

export const launchMissions = mysqlTable("launch_missions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  missionName: varchar("missionName", { length: 255 }).notNull(),
  launchDatetime: timestamp("launchDatetime").notNull(),
  currentPhase: mysqlEnum("currentPhase", ["initial_briefing", "pre_launch", "launch_execution", "post_launch", "cruise"]).default("initial_briefing").notNull(),
  settingsVersion: int("settingsVersion").notNull(),
  missionConfig: json("missionConfig").$type<{
    phases?: { name: string; tasks: any[]; checklists: any[] }[];
    notifications?: any[];
    collaborators?: any[];
  }>(),
  readinessSnapshot: json("readinessSnapshot").$type<{
    overallScore?: number;
    productReady?: boolean;
    variantsReady?: boolean;
    inventoryReady?: boolean;
    assetsReady?: boolean;
    blockers?: string[];
    lastCalculated?: string;
  }>(),
  collaborators: json("collaborators").$type<{
    internal?: { userId: number; role: string }[];
    external?: { email: string; name: string; role: string; permissions: string[] }[];
  }>(),
  status: mysqlEnum("status", ["planning", "active", "completed", "aborted"]).default("planning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("product_idx").on(table.productId),
  launchDateIdx: index("launch_date_idx").on(table.launchDatetime),
}));

export const missionEvents = mysqlTable("mission_events", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("missionId").notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  eventData: json("eventData").$type<{
    taskId?: number;
    assetType?: string;
    vote?: string;
    reasoning?: string;
    [key: string]: any;
  }>(),
  triggeredBy: int("triggeredBy"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  missionIdx: index("mission_idx").on(table.missionId),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
}));

export const intelligenceSettings = mysqlTable("intelligence_settings", {
  id: int("id").autoincrement().primaryKey(),
  version: int("version").notNull().unique(),
  timingRules: json("timingRules").$type<{
    assetDeadlineDays?: number;
    copyDeadlineDays?: number;
    freezeWindowDays?: number;
    goNoGoTimingDays?: number;
    reviewTimingDays?: number;
    escalationDelayHours?: number;
    syncFrequencyMinutes?: number;
  }>(),
  thresholds: json("thresholds").$type<{
    inventoryThresholds?: { [category: string]: number };
    safetyStockMultiplier?: number;
    variantReadinessMinScore?: number;
    minimumApprovalQuorum?: number;
  }>(),
  templates: json("templates").$type<{
    defaultTasks?: { [productType: string]: any[] };
    defaultChecklists?: any[];
    assetRequirements?: any[];
    notificationRules?: any[];
    phaseRequirements?: any[];
    fallbackOwners?: any[];
  }>(),
  activeFrom: timestamp("activeFrom").defaultNow().notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  versionIdx: index("version_idx").on(table.version),
}));

export const launchVotes = mysqlTable("launch_votes", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("missionId").notNull(),
  voterId: int("voterId").notNull(),
  vote: mysqlEnum("vote", ["go", "no_go"]).notNull(),
  reasoning: text("reasoning"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  missionIdx: index("mission_idx").on(table.missionId),
  voterIdx: index("voter_idx").on(table.voterId),
}));

export type IntelligenceProduct = typeof intelligenceProducts.$inferSelect;
export type InsertIntelligenceProduct = typeof intelligenceProducts.$inferInsert;
export type IntelligenceVariant = typeof intelligenceVariants.$inferSelect;
export type InsertIntelligenceVariant = typeof intelligenceVariants.$inferInsert;
export type LaunchMission = typeof launchMissions.$inferSelect;
export type InsertLaunchMission = typeof launchMissions.$inferInsert;
export type MissionEvent = typeof missionEvents.$inferSelect;
export type InsertMissionEvent = typeof missionEvents.$inferInsert;
export type IntelligenceSettings = typeof intelligenceSettings.$inferSelect;
export type InsertIntelligenceSettings = typeof intelligenceSettings.$inferInsert;
export type LaunchVote = typeof launchVotes.$inferSelect;
export type InsertLaunchVote = typeof launchVotes.$inferInsert;

// ============================================================================
// AI TRACKING AGENT TABLES
// ============================================================================

/**
 * Tracking Screenshots Table
 * Stores screenshots captured from carrier tracking pages for vision AI extraction
 */
export const trackingScreenshots = mysqlTable("tracking_screenshots", {
  id: int("id").autoincrement().primaryKey(),
  
  // Link to shipment
  shipmentId: int("shipmentId"),
  
  // Tracking details
  trackingNumber: varchar("trackingNumber", { length: 255 }).notNull(),
  carrier: varchar("carrier", { length: 100 }).notNull(),
  carrierUrl: text("carrierUrl").notNull(),
  
  // Screenshot storage
  screenshotUrl: text("screenshotUrl").notNull(), // S3 URL
  screenshotKey: varchar("screenshotKey", { length: 500 }).notNull(), // S3 key
  
  // Extracted data from vision AI
  extractedStatus: varchar("extractedStatus", { length: 100 }),
  extractedLocation: text("extractedLocation"),
  extractedEta: timestamp("extractedEta"),
  extractedDetails: text("extractedDetails"), // JSON string with full extraction
  
  // Metadata
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  processingStatus: varchar("processingStatus", { length: 50 }).default("pending").notNull(), // pending, processing, completed, failed
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrackingScreenshot = typeof trackingScreenshots.$inferSelect;
export type InsertTrackingScreenshot = typeof trackingScreenshots.$inferInsert;


// ============================================================================
// ACTIVITY ATTACHMENTS & EMAIL TEMPLATES
// ============================================================================

/**
 * Activities Attachments Table
 * Stores file attachments linked to CRM activities (emails, meetings, notes)
 */
export const activitiesAttachments = mysqlTable("activities_attachments", {
  id: int("id").autoincrement().primaryKey(),
  
  // Entity linkage
  entityType: mysqlEnum("entityType", ["customer", "vendor", "lead", "contact"]).notNull(),
  entityId: int("entityId").notNull(),
  
  // File information
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileSize: int("fileSize").notNull(), // bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  
  // Activity type detection
  activityType: mysqlEnum("activityType", ["email", "meeting", "note", "document", "other"]).default("other").notNull(),
  isEmailAttachment: boolean("isEmailAttachment").default(false).notNull(),
  
  // Email metadata (if recognized as email)
  emailSubject: varchar("emailSubject", { length: 500 }),
  emailDate: timestamp("emailDate"),
  emailDirection: mysqlEnum("emailDirection", ["sent", "received"]),
  
  // User and timestamps
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("entity_idx").on(table.entityType, table.entityId),
  uploadedByIdx: index("uploaded_by_idx").on(table.uploadedBy),
  activityTypeIdx: index("activity_type_idx").on(table.activityType),
}));

export type ActivitiesAttachment = typeof activitiesAttachments.$inferSelect;
export type InsertActivitiesAttachment = typeof activitiesAttachments.$inferInsert;

/**
 * Email Templates Table
 * Stores reusable email templates for common CRM communications
 */
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Template information
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "follow_up", 
    "quote", 
    "order_confirmation", 
    "shipping_update",
    "payment_reminder",
    "thank_you",
    "general"
  ]).default("general").notNull(),
  
  // Template content
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  
  // Template variables (JSON array of variable names)
  variables: json("variables").$type<string[]>().default([]),
  
  // Metadata
  isActive: boolean("isActive").default(true).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  createdByIdx: index("created_by_idx").on(table.createdBy),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;


// ============================================================================
// LEGAL REFERENCES & DOCUMENT BUILDER TABLES
// ============================================================================

/**
 * Legal References Table
 * Stores legal citations, statutes, and regulations for dispute letters
 */
export const legalReferences = mysqlTable("legal_references", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reference type and classification
  referenceType: mysqlEnum("referenceType", [
    "ucc",                    // Uniform Commercial Code
    "state_law",              // State-specific laws
    "federal_regulation",     // Federal regulations (49 CFR, etc.)
    "carrier_terms",          // Carrier terms and conditions
    "contract_terms",         // Contract clauses
    "case_law",              // Legal precedents
    "industry_standard"       // Industry standards and best practices
  ]).notNull(),
  
  // Citation information
  citation: varchar("citation", { length: 500 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 100 }), // e.g., "Federal", "California", "New York"
  
  // Content
  fullText: text("fullText").notNull(),
  summary: text("summary"),
  
  // Application context
  applicableCarriers: json("applicableCarriers").$type<string[]>(), // ["UPS", "FedEx", "USPS"]
  applicableClaimTypes: json("applicableClaimTypes").$type<string[]>(), // ["late_delivery", "lost_package", etc.]
  relevanceScore: int("relevanceScore").default(50), // 0-100, for ranking
  
  // Source information
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  sourceDocument: varchar("sourceDocument", { length: 500 }),
  effectiveDate: timestamp("effectiveDate"),
  expiryDate: timestamp("expiryDate"),
  
  // Usage tracking
  usageCount: int("usageCount").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  
  // Metadata
  tags: json("tags").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  referenceTypeIdx: index("reference_type_idx").on(table.referenceType),
  jurisdictionIdx: index("jurisdiction_idx").on(table.jurisdiction),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type LegalReference = typeof legalReferences.$inferSelect;
export type InsertLegalReference = typeof legalReferences.$inferInsert;

/**
 * Case Legal References Junction Table
 * Links legal references to specific cases
 */
export const caseLegalReferences = mysqlTable("case_legal_references", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  legalReferenceId: int("legalReferenceId").notNull(),
  
  // Context of use
  relevanceNote: text("relevanceNote"), // Why this reference applies to this case
  includeInLetter: boolean("includeInLetter").default(true).notNull(),
  
  // Metadata
  addedBy: int("addedBy").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (table) => ({
  caseIdx: index("case_idx").on(table.caseId),
  legalRefIdx: index("legal_ref_idx").on(table.legalReferenceId),
}));

export type CaseLegalReference = typeof caseLegalReferences.$inferSelect;
export type InsertCaseLegalReference = typeof caseLegalReferences.$inferInsert;


// ============================================================================
// AI ENTERPRISE SYSTEM TABLES
// ============================================================================

/**
 * AI Agents Table
 * Stores all AI agents in the enterprise system (120+ agents)
 */
export const aiAgents = mysqlTable("ai_agents", {
  id: int("id").autoincrement().primaryKey(),
  
  // Agent identity
  role: mysqlEnum("role", [
    // C-Suite
    "ceo", "cfo", "cgo", "cmo", "cto", "coo", "chro", "cxo",
    "chief_intelligence_officer", "clo", "cdo", "cso",
    // VP-Level
    "vp_sales", "vp_product", "vp_engineering", "vp_customer_success",
    "vp_business_development", "vp_supply_chain",
    // Specialists
    "financial_analyst", "tax_specialist", "accountant", "budget_analyst",
    "accounting_specialist", "budget_manager",
    "market_researcher", "partnership_developer", "growth_analyst",
    "seo_specialist", "social_media_manager", "content_writer", "email_marketer",
    "content_marketing",
    "backend_developer", "frontend_developer", "devops_engineer", "qa_engineer",
    "security_specialist",
    "product_manager", "ux_designer", "data_scientist",
    "recruiter", "hr_specialist", "training_coordinator", "compensation_analyst",
    "sales_rep", "account_executive", "sales_engineer",
    "customer_success_manager", "support_agent", "onboarding_specialist",
    "legal_counsel", "compliance_officer", "contract_specialist",
    "data_scientist", "data_engineer", "business_analyst",
    "qa_engineer", "product_manager", "ux_designer",
    "customer_success_manager", "support_agent", "community_manager",
    "legal_counsel", "compliance_officer", "contract_specialist",
    "security_analyst", "penetration_tester", "incident_responder",
    "sales_rep", "account_executive", "sales_engineer",
    // Personal
    "personal_assistant", "personal_life_manager", "family_manager",
    // Generic
    "specialist", "analyst", "coordinator", "manager"
  ]).notNull(),
  
  name: varchar("name", { length: 200 }).notNull(),
  department: varchar("department", { length: 100 }), // "Finance", "Marketing", "Engineering", etc.
  team: varchar("team", { length: 100 }), // "Tax Team", "Social Media Team", etc.
  
  // Hierarchy
  parentAgentId: int("parentAgentId"), // Reports to which agent
  level: int("level").default(0).notNull(), // 0=CEO, 1=C-Suite, 2=VP, 3=Team Lead, 4=Specialist
  
  // Capabilities
  capabilities: json("capabilities").$type<{
    analysis?: boolean;
    decision_making?: boolean;
    task_execution?: boolean;
    learning?: boolean;
    team_creation?: boolean;
    cross_functional?: boolean;
    multimodal?: boolean; // Can handle voice/video/text
  }>().notNull(),
  
  // Configuration
  modelConfig: json("modelConfig").$type<{
    model: string; // "gpt-4o", "gpt-4-turbo", etc.
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
    tools?: string[]; // Available tools/functions
  }>().notNull(),
  
  // State
  status: mysqlEnum("status", ["active", "idle", "working", "learning", "error", "offline"]).default("idle").notNull(),
  currentTask: text("currentTask"),
  lastActiveAt: timestamp("lastActiveAt"),
  
  // Performance metrics
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  avgResponseTime: int("avgResponseTime"), // milliseconds
  successRate: int("successRate").default(100), // 0-100
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).default("0.00"), // OpenAI API cost
  
  // Privacy & Access
  accessLevel: int("accessLevel").default(2).notNull(), // 5=Master, 4=C-Suite, 3=Team Lead, 2=Specialist, 1=Personal
  canAccessPersonalData: boolean("canAccessPersonalData").default(false).notNull(),
  
  // Metadata
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  roleIdx: index("role_idx").on(table.role),
  parentIdx: index("parent_idx").on(table.parentAgentId),
  statusIdx: index("status_idx").on(table.status),
  departmentIdx: index("department_idx").on(table.department),
}));

export type AIAgent = typeof aiAgents.$inferSelect;
export type InsertAIAgent = typeof aiAgents.$inferInsert;

/**
 * AI Agent Teams Table
 * Tracks dynamically created agent teams for specific initiatives
 */
export const aiAgentTeams = mysqlTable("ai_agent_teams", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 200 }).notNull(),
  purpose: text("purpose").notNull(), // "Q4 Product Launch", "APAC Expansion", etc.
  
  // Team composition
  leaderAgentId: int("leaderAgentId").notNull(),
  memberAgentIds: json("memberAgentIds").$type<number[]>().notNull(),
  
  // Lifecycle
  status: mysqlEnum("status", ["active", "completed", "on_hold", "cancelled"]).default("active").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Context
  initiative: varchar("initiative", { length: 200 }), // Links to business initiative
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  
  // Performance
  tasksCompleted: int("tasksCompleted").default(0).notNull(),
  tasksInProgress: int("tasksInProgress").default(0).notNull(),
  
  // Metadata
  createdBy: int("createdBy").notNull(), // Which agent created this team
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  leaderIdx: index("leader_idx").on(table.leaderAgentId),
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
}));

export type AIAgentTeam = typeof aiAgentTeams.$inferSelect;
export type InsertAIAgentTeam = typeof aiAgentTeams.$inferInsert;

/**
 * AI Agent Tasks Table
 * Tracks tasks assigned to agents
 */
export const aiAgentTasks = mysqlTable("ai_agent_tasks", {
  id: int("id").autoincrement().primaryKey(),
  
  // Task details
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  taskType: varchar("taskType", { length: 100 }).notNull(), // "analysis", "decision", "execution", "learning"
  
  // Assignment
  assignedToAgentId: int("assignedToAgentId").notNull(),
  assignedByAgentId: int("assignedByAgentId"), // Which agent delegated this
  teamId: int("teamId"), // If part of a team initiative
  
  // Context
  context: json("context").$type<{
    entity_type?: string; // "case", "customer", "order", etc.
    entity_id?: number;
    related_tasks?: number[];
    dependencies?: number[];
    [key: string]: any;
  }>(),
  
  // Status
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  
  // Timing
  dueDate: timestamp("dueDate"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  
  // Results
  result: json("result").$type<{
    success: boolean;
    output?: any;
    error?: string;
    learnings?: string[];
    recommendations?: string[];
  }>(),
  
  // Performance
  executionTime: int("executionTime"), // milliseconds
  cost: decimal("cost", { precision: 10, scale: 4 }), // OpenAI API cost
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  assignedToIdx: index("assigned_to_idx").on(table.assignedToAgentId),
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
  teamIdx: index("team_idx").on(table.teamId),
  dueDateIdx: index("due_date_idx").on(table.dueDate),
}));

export type AIAgentTask = typeof aiAgentTasks.$inferSelect;
export type InsertAIAgentTask = typeof aiAgentTasks.$inferInsert;

/**
 * AI Agent Conversations Table
 * Stores conversations between agents and with users
 */
export const aiAgentConversations = mysqlTable("ai_agent_conversations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Participants
  participantAgentIds: json("participantAgentIds").$type<number[]>().notNull(),
  userId: int("userId"), // If user is involved
  
  // Conversation type
  conversationType: mysqlEnum("type", [
    "user_command",        // User commanding an agent
    "agent_collaboration", // Agents working together
    "escalation",         // Agent escalating to superior
    "delegation",         // Agent delegating to subordinate
    "learning",           // Agent learning from feedback
  ]).notNull(),
  
  // Messages
  messages: json("messages").$type<Array<{
    role: "user" | "agent" | "system";
    agent_id?: number;
    content: string;
    timestamp: string;
    modality?: "text" | "voice" | "video";
  }>>().notNull(),
  
  // Context
  relatedTaskId: int("relatedTaskId"),
  relatedTeamId: int("relatedTeamId"),
  
  // Status
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  typeIdx: index("type_idx").on(table.conversationType),
  statusIdx: index("status_idx").on(table.status),
  taskIdx: index("task_idx").on(table.relatedTaskId),
}));

export type AIAgentConversation = typeof aiAgentConversations.$inferSelect;
export type InsertAIAgentConversation = typeof aiAgentConversations.$inferInsert;

/**
 * AI Learning Data Table
 * Stores outcomes and learnings from cases for continuous improvement
 */
export const aiLearningData = mysqlTable("ai_learning_data", {
  id: int("id").autoincrement().primaryKey(),
  
  // Source
  sourceType: mysqlEnum("sourceType", [
    "case_outcome",
    "template_performance",
    "user_feedback",
    "agent_decision",
    "market_data"
  ]).notNull(),
  sourceId: int("sourceId").notNull(), // ID of case, template, etc.
  
  // Learning content
  context: json("context").$type<{
    carrier?: string;
    claim_type?: string;
    amount?: number;
    template_used?: number;
    legal_refs_used?: number[];
    [key: string]: any;
  }>().notNull(),
  
  outcome: json("outcome").$type<{
    success: boolean;
    result?: "won" | "lost" | "settled";
    settlement_amount?: number;
    response_time_days?: number;
    carrier_response?: string;
  }>().notNull(),
  
  learnings: json("learnings").$type<{
    effective_strategies?: string[];
    ineffective_strategies?: string[];
    winning_legal_citations?: string[];
    optimal_evidence_types?: string[];
    best_language_patterns?: string[];
    recommendations?: string[];
  }>(),
  
  // Impact on AI
  appliedToAgents: json("appliedToAgents").$type<number[]>(), // Which agents learned from this
  improvedMetrics: json("improvedMetrics").$type<{
    template_win_rate?: number;
    citation_effectiveness?: number;
    response_time_improvement?: number;
  }>(),
  
  // Metadata
  collectedBy: int("collectedBy"), // Which agent collected this learning
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("source_idx").on(table.sourceType, table.sourceId),
  collectedByIdx: index("collected_by_idx").on(table.collectedBy),
}));

export type AILearningData = typeof aiLearningData.$inferSelect;
export type InsertAILearningData = typeof aiLearningData.$inferInsert;

/**
 * AI Fine-Tuned Models Table
 * Tracks custom fine-tuned OpenAI models
 */
export const aiFineTunedModels = mysqlTable("ai_fine_tuned_models", {
  id: int("id").autoincrement().primaryKey(),
  
  // Model identity
  openaiModelId: varchar("openaiModelId", { length: 200 }).notNull().unique(), // "ft:gpt-4o-2024-08-06:..."
  basedOn: varchar("basedOn", { length: 100 }).notNull(), // "gpt-4o", "gpt-3.5-turbo"
  purpose: varchar("purpose", { length: 500 }).notNull(), // "Carrier-specific dispute letters", "Legal citation selection"
  
  // Training
  trainingDataSize: int("trainingDataSize").notNull(), // Number of training examples
  trainingCost: decimal("trainingCost", { precision: 10, scale: 2 }),
  trainingStartedAt: timestamp("trainingStartedAt"),
  trainingCompletedAt: timestamp("trainingCompletedAt"),
  
  // Performance
  validationAccuracy: decimal("validationAccuracy", { precision: 5, scale: 2 }), // 0-100
  productionUsageCount: int("productionUsageCount").default(0).notNull(),
  avgPerformanceImprovement: decimal("avgPerformanceImprovement", { precision: 5, scale: 2 }), // % improvement over base model
  
  // Assignment
  assignedToAgents: json("assignedToAgents").$type<number[]>(), // Which agents use this model
  
  // Status
  status: mysqlEnum("status", ["training", "validating", "active", "deprecated", "failed"]).default("training").notNull(),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  purposeIdx: index("purpose_idx").on(table.purpose),
}));

export type AIFineTunedModel = typeof aiFineTunedModels.$inferSelect;
export type InsertAIFineTunedModel = typeof aiFineTunedModels.$inferInsert;
