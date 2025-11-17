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

// ============================================================================
// SHIPMENT & ORDER TABLES
// ============================================================================

export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  trackingNumber: varchar("trackingNumber", { length: 100 }).notNull().unique(),
  carrier: varchar("carrier", { length: 100 }).notNull(),
  service: varchar("service", { length: 100 }),
  orderId: int("orderId"),
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
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  skuIdx: index("sku_idx").on(table.sku),
}));

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
  vendorName: varchar("vendorName", { length: 255 }).notNull(),
  orderDate: timestamp("orderDate").notNull(),
  expectedDate: timestamp("expectedDate"),
  receivedDate: timestamp("receivedDate"),
  status: varchar("status", { length: 100 }),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  poNumberIdx: index("po_number_idx").on(table.poNumber),
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




// Vendors table - Supplier and vendor management
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  
  // Classification
  vendorType: mysqlEnum("vendorType", [
    "manufacturer",      // Product manufacturer
    "supplier",          // Raw materials
    "service",           // Service provider
    "logistics",         // Shipping/fulfillment
    "technology"         // Software/tools
  ]).notNull(),
  
  status: mysqlEnum("status", [
    "active",
    "inactive",
    "pending",
    "suspended"
  ]).default("active").notNull(),
  
  // Performance ratings (0-100 scale)
  qualityRating: int("qualityRating").default(0),
  deliveryRating: int("deliveryRating").default(0),
  priceRating: int("priceRating").default(0),
  overallRating: int("overallRating").default(0),
  
  // Financial
  totalSpend: int("totalSpend").default(0),      // Total paid (cents)
  totalOrders: int("totalOrders").default(0),
  averageLeadTime: int("averageLeadTime"),       // Days
  paymentTerms: varchar("paymentTerms", { length: 100 }),
  
  // Location
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("USA"),
  
  // Contract
  contractStartDate: timestamp("contractStartDate"),
  contractEndDate: timestamp("contractEndDate"),
  contractUrl: varchar("contractUrl", { length: 500 }),
  
  // Compliance
  certifications: text("certifications"),  // JSON array
  insuranceExpiry: timestamp("insuranceExpiry"),
  
  // Metadata
  tags: text("tags"),
  customFields: text("customFields"),
  notes: text("notes"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

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
