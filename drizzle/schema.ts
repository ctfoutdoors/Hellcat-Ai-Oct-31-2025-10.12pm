import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
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

// Cases table - core dispute case management
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 50 }).notNull().unique(),
  trackingId: varchar("trackingId", { length: 100 }).notNull(),
  carrier: mysqlEnum("carrier", ["FEDEX", "UPS", "USPS", "DHL", "OTHER"]).notNull(),
  status: mysqlEnum("status", ["DRAFT", "FILED", "AWAITING_RESPONSE", "RESOLVED", "CLOSED", "REJECTED"]).default("DRAFT").notNull(),
  priority: mysqlEnum("priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM").notNull(),
  serviceType: varchar("serviceType", { length: 100 }),
  adjustmentDate: timestamp("adjustmentDate"),
  originalAmount: int("originalAmount").notNull(), // stored in cents
  adjustedAmount: int("adjustedAmount").notNull(), // stored in cents
  claimedAmount: int("claimedAmount").notNull(), // stored in cents
  recoveredAmount: int("recoveredAmount").default(0).notNull(), // stored in cents
  actualDimensions: varchar("actualDimensions", { length: 100 }),
  carrierDimensions: varchar("carrierDimensions", { length: 100 }),
  customerName: varchar("customerName", { length: 255 }),
  orderId: varchar("orderId", { length: 100 }),
  productSkus: text("productSkus"),
  notes: text("notes"),
  assignedTo: int("assignedTo"),
  zohoTicketId: varchar("zohoTicketId", { length: 100 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

// Attachments table - evidence files and documents
export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  fileUrl: text("fileUrl").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

// Documents table - generated dispute letters and responses
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  documentType: mysqlEnum("documentType", ["DISPUTE_LETTER", "EVIDENCE", "RESPONSE", "OTHER"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  generatedBy: int("generatedBy").notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Activity logs table - audit trail for all case actions
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  userId: int("userId").notNull(),
  actionType: varchar("actionType", { length: 100 }).notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

// Templates table - document templates for generation
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateContent: text("templateContent").notNull(), // HTML or JSON
  variables: text("variables"), // JSON array of variable names
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

// Knowledge base table - AI-powered knowledge management
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["ADMIN", "LEGAL", "CASE", "CASE_LAW"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: text("tags"), // JSON array of tags
  relatedCaseIds: text("relatedCaseIds"), // JSON array of case IDs
  successRate: int("successRate"), // percentage for case law entries
  confidence: int("confidence").default(100).notNull(), // AI confidence score
  source: varchar("source", { length: 255 }), // where this knowledge came from
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;

// ShipStation accounts table - multi-account support
export const shipstationAccounts = mysqlTable("shipstationAccounts", {
  id: int("id").autoincrement().primaryKey(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  apiKey: text("apiKey").notNull(),
  apiSecret: text("apiSecret").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShipstationAccount = typeof shipstationAccounts.$inferSelect;
export type InsertShipstationAccount = typeof shipstationAccounts.$inferInsert;

// Shipment audits table - comprehensive audit trail
export const shipmentAudits = mysqlTable("shipmentAudits", {
  id: int("id").autoincrement().primaryKey(),
  shipstationAccountId: int("shipstationAccountId").notNull(),
  shipmentId: varchar("shipmentId", { length: 100 }).notNull(),
  trackingNumber: varchar("trackingNumber", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  quotedAmount: int("quotedAmount").notNull(), // in cents
  actualAmount: int("actualAmount").notNull(), // in cents
  variance: int("variance").notNull(), // difference in cents
  varianceType: mysqlEnum("varianceType", ["OVERCHARGE", "UNDERCHARGE", "ACCURATE"]).notNull(),
  auditStatus: mysqlEnum("auditStatus", ["PENDING", "FLAGGED", "RESOLVED", "DISPUTED"]).default("PENDING").notNull(),
  caseId: int("caseId"), // linked case if dispute created
  shipmentDate: timestamp("shipmentDate").notNull(),
  auditedAt: timestamp("auditedAt").defaultNow().notNull(),
});

export type ShipmentAudit = typeof shipmentAudits.$inferSelect;
export type InsertShipmentAudit = typeof shipmentAudits.$inferInsert;

// AI insights table - machine learning insights and predictions
export const aiInsights = mysqlTable("aiInsights", {
  id: int("id").autoincrement().primaryKey(),
  insightType: mysqlEnum("insightType", ["PATTERN", "PREDICTION", "RECOMMENDATION", "ANOMALY"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  confidence: int("confidence").notNull(), // percentage
  relatedCaseIds: text("relatedCaseIds"), // JSON array
  actionTaken: int("actionTaken").default(0).notNull(), // 0 = pending, 1 = acted upon
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = typeof aiInsights.$inferInsert;

// Data sources table - track all data sources and their reliability
export const dataSources = mysqlTable("dataSources", {
  id: int("id").autoincrement().primaryKey(),
  sourceName: varchar("sourceName", { length: 100 }).notNull().unique(),
  sourceType: mysqlEnum("sourceType", ["SHIPSTATION", "GOOGLE_SHEETS", "WOOCOMMERCE", "MANUAL", "API", "OTHER"]).notNull(),
  isActive: int("isActive").default(1).notNull(),
  reliabilityScore: int("reliabilityScore").default(100).notNull(), // 0-100
  totalRecords: int("totalRecords").default(0).notNull(),
  conflictCount: int("conflictCount").default(0).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  configuration: text("configuration"), // JSON for source-specific config
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = typeof dataSources.$inferInsert;

// Shipment data table - unified shipment data from all sources
export const shipmentData = mysqlTable("shipmentData", {
  id: int("id").autoincrement().primaryKey(),
  trackingNumber: varchar("trackingNumber", { length: 100 }).notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  serviceType: varchar("serviceType", { length: 100 }),
  orderId: varchar("orderId", { length: 100 }),
  customerName: varchar("customerName", { length: 255 }),
  shipmentDate: timestamp("shipmentDate"),
  deliveryDate: timestamp("deliveryDate"),
  quotedAmount: int("quotedAmount"), // in cents
  actualAmount: int("actualAmount"), // in cents
  dimensions: varchar("dimensions", { length: 100 }),
  weight: int("weight"), // in ounces
  productData: text("productData"), // JSON
  primarySourceId: int("primarySourceId").notNull(), // which source is considered primary
  confirmedBySources: text("confirmedBySources"), // JSON array of source IDs that confirmed this data
  hasConflict: int("hasConflict").default(0).notNull(), // 0 = no conflict, 1 = conflict detected
  conflictDetails: text("conflictDetails"), // JSON describing conflicts
  caseId: int("caseId"), // linked case if exists
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShipmentData = typeof shipmentData.$inferSelect;
export type InsertShipmentData = typeof shipmentData.$inferInsert;

// Data reconciliation log - track all data reconciliation events
export const dataReconciliationLog = mysqlTable("dataReconciliationLog", {
  id: int("id").autoincrement().primaryKey(),
  shipmentDataId: int("shipmentDataId").notNull(),
  sourceId: int("sourceId").notNull(),
  reconciliationType: mysqlEnum("reconciliationType", ["MATCH", "CONFLICT", "NEW", "UPDATE"]).notNull(),
  fieldName: varchar("fieldName", { length: 100 }),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  resolution: mysqlEnum("resolution", ["AUTO_RESOLVED", "MANUAL_REVIEW", "IGNORED", "ACCEPTED"]),
  confidence: int("confidence"), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataReconciliationLog = typeof dataReconciliationLog.$inferSelect;
export type InsertDataReconciliationLog = typeof dataReconciliationLog.$inferInsert;

// Orders table - centralized order management from all channels
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 100 }).notNull().unique(),
  orderNumber: varchar("orderNumber", { length: 100 }).notNull(),
  orderDate: timestamp("orderDate").notNull(),
  orderStatus: varchar("orderStatus", { length: 50 }).notNull(),
  shipstationAccountId: int("shipstationAccountId"),
  channelId: int("channelId").notNull(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  shippingAddress: text("shippingAddress"),
  billingAddress: text("billingAddress"),
  orderTotal: int("orderTotal").notNull(), // in cents
  shippingCost: int("shippingCost"), // in cents
  taxAmount: int("taxAmount"), // in cents
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  carrier: varchar("carrier", { length: 50 }),
  serviceType: varchar("serviceType", { length: 100 }),
  shipDate: timestamp("shipDate"),
  orderItems: text("orderItems"), // JSON array of items
  orderNotes: text("orderNotes"),
  syncedFromShipstation: int("syncedFromShipstation").default(0).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// Channels table - sales channels and marketplaces
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  channelName: varchar("channelName", { length: 255 }).notNull(),
  channelType: mysqlEnum("channelType", ["SHIPSTATION", "WOOCOMMERCE", "SHOPIFY", "AMAZON", "EBAY", "CUSTOM"]).notNull(),
  isActive: int("isActive").default(1).notNull(),
  configuration: text("configuration"), // JSON for channel-specific config
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

// Products table - master product catalog
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  productName: varchar("productName", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  weight: int("weight"), // in ounces
  dimensions: varchar("dimensions", { length: 100 }),
  price: int("price"), // in cents
  cost: int("cost"), // in cents
  images: text("images"), // JSON array of image URLs
  specifications: text("specifications"), // JSON
  channelMappings: text("channelMappings"), // JSON - SKU mappings per channel
  woocommerceId: int("woocommerceId"), // WooCommerce product ID
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Certifications table - internal product certifications
export const certifications = mysqlTable("certifications", {
  id: int("id").autoincrement().primaryKey(),
  certificationType: mysqlEnum("certificationType", ["ROD_TUBE", "QUALITY", "COMPLIANCE", "OTHER"]).notNull(),
  productId: int("productId"),
  certificationName: varchar("certificationName", { length: 255 }).notNull(),
  specifications: text("specifications"), // JSON with size, material, etc.
  attachments: text("attachments"), // JSON array of file URLs
  certificationDate: timestamp("certificationDate").notNull(),
  expiryDate: timestamp("expiryDate"),
  status: mysqlEnum("status", ["ACTIVE", "EXPIRED", "PENDING_RENEWAL"]).default("ACTIVE").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;

// AI conversations table - long-term memory for AI agent
export const aiConversations = mysqlTable("aiConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: varchar("conversationId", { length: 100 }).notNull(),
  message: text("message").notNull(),
  role: mysqlEnum("role", ["USER", "ASSISTANT", "SYSTEM"]).notNull(),
  context: text("context"), // JSON with relevant context
  actionTaken: text("actionTaken"), // JSON describing any actions performed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

// Credentials vault table - secure storage for API credentials
export const credentialsVault = mysqlTable("credentialsVault", {
  id: int("id").autoincrement().primaryKey(),
  serviceName: varchar("serviceName", { length: 100 }).notNull(),
  serviceType: mysqlEnum("serviceType", [
    "SHIPSTATION",
    "WOOCOMMERCE",
    "ZOHO_DESK",
    "OPENAI",
    "GOOGLE_DRIVE",
    "GOOGLE_DOCS",
    "GOOGLE_SHEETS",
    "GMAIL",
    "GOOGLE_CALENDAR",
    "OTHER"
  ]).notNull(),
  credentialKey: varchar("credentialKey", { length: 100 }).notNull(), // e.g., "api_key", "api_secret", "oauth_token"
  credentialValue: text("credentialValue").notNull(), // encrypted value
  isActive: int("isActive").default(1).notNull(),
  lastTested: timestamp("lastTested"),
  testStatus: mysqlEnum("testStatus", ["SUCCESS", "FAILED", "NOT_TESTED"]).default("NOT_TESTED"),
  expiresAt: timestamp("expiresAt"), // for OAuth tokens
  metadata: text("metadata"), // JSON for additional config
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CredentialsVault = typeof credentialsVault.$inferSelect;
export type InsertCredentialsVault = typeof credentialsVault.$inferInsert;

// Credentials audit log - track all credential access
export const credentialsAuditLog = mysqlTable("credentialsAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  credentialId: int("credentialId").notNull(),
  action: mysqlEnum("action", ["CREATED", "UPDATED", "ACCESSED", "DELETED", "TESTED"]).notNull(),
  userId: int("userId").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 255 }),
  success: int("success").default(1).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CredentialsAuditLog = typeof credentialsAuditLog.$inferSelect;
export type InsertCredentialsAuditLog = typeof credentialsAuditLog.$inferInsert;

// Email Accounts table - Multiple email configurations for sending
export const emailAccounts = mysqlTable("emailAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of this email account
  accountName: varchar("accountName", { length: 255 }).notNull(), // Display name (e.g., "Zoho Support", "Personal Gmail")
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  provider: mysqlEnum("provider", ["SMTP", "GMAIL_API", "ZOHO"]).notNull(),
  
  // SMTP Configuration
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort"),
  smtpUsername: varchar("smtpUsername", { length: 255 }),
  smtpPassword: text("smtpPassword"), // Encrypted
  smtpSecure: int("smtpSecure").default(1).notNull(), // 1 = TLS/SSL, 0 = no encryption
  
  // API Configuration (for Gmail API, Zoho API)
  apiCredentials: text("apiCredentials"), // Encrypted JSON
  
  isDefault: int("isDefault").default(0).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

// Email Communications table - Track all emails sent/received
export const emailCommunications = mysqlTable("emailCommunications", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId"), // Link to case (optional)
  emailAccountId: int("emailAccountId").notNull(), // Which account sent/received
  
  direction: mysqlEnum("direction", ["SENT", "RECEIVED"]).notNull(),
  fromAddress: varchar("fromAddress", { length: 320 }).notNull(),
  toAddresses: text("toAddresses").notNull(), // JSON array
  ccAddresses: text("ccAddresses"), // JSON array
  bccAddresses: text("bccAddresses"), // JSON array
  
  subject: text("subject").notNull(),
  bodyHtml: text("bodyHtml"),
  bodyText: text("bodyText"),
  
  attachments: text("attachments"), // JSON array of {fileName, fileUrl, fileSize}
  
  status: mysqlEnum("status", ["DRAFT", "SENDING", "SENT", "DELIVERED", "FAILED", "BOUNCED"]).default("DRAFT").notNull(),
  errorMessage: text("errorMessage"),
  
  messageId: varchar("messageId", { length: 255 }), // Email Message-ID header
  inReplyTo: varchar("inReplyTo", { length: 255 }), // For threading
  threadId: varchar("threadId", { length: 255 }), // Email thread identifier
  
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCommunication = typeof emailCommunications.$inferSelect;
export type InsertEmailCommunication = typeof emailCommunications.$inferInsert;


// Email template settings - customizable email branding
export const emailTemplateSettings = mysqlTable("emailTemplateSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = global default
  
  // Branding
  companyName: varchar("companyName", { length: 255 }).default("Catch The Fever"),
  logoUrl: varchar("logoUrl", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#2c5f2d"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#10b981"),
  
  // Header customization
  headerText: varchar("headerText", { length: 255 }).default("New Draft Case Created"),
  headerIcon: varchar("headerIcon", { length: 10 }).default("🚨"),
  
  // Footer customization
  footerText: text("footerText"),
  footerLinks: text("footerLinks"), // JSON array of {text, url}
  
  // Content customization
  introText: text("introText"),
  ctaButtonText: varchar("ctaButtonText", { length: 100 }).default("Review Case"),
  ctaButtonColor: varchar("ctaButtonColor", { length: 7 }).default("#2c5f2d"),
  
  // Email settings
  fromName: varchar("fromName", { length: 255 }),
  fromEmail: varchar("fromEmail", { length: 255 }),
  replyToEmail: varchar("replyToEmail", { length: 255 }),
  
  // Notification preferences
  enableNewCaseNotifications: int("enableNewCaseNotifications").default(1).notNull(),
  enableBulkNotifications: int("enableBulkNotifications").default(1).notNull(),
  enableStatusChangeNotifications: int("enableStatusChangeNotifications").default(0).notNull(),
  
  // Metadata
  isDefault: int("isDefault").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplateSetting = typeof emailTemplateSettings.$inferSelect;
export type InsertEmailTemplateSetting = typeof emailTemplateSettings.$inferInsert;


// ============================================================================
// CRM TABLES - Phase 1 Core Foundation
// Google-level optimization: INT keys, ENUM types, composite indexes
// ============================================================================

// Contacts table - Multi-tier contact management with AI scoring
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  
  // Classification (1 byte ENUM vs VARCHAR)
  contactType: mysqlEnum("contactType", [
    "direct_owned",      // Direct B2C customers
    "marketplace",       // Amazon, eBay, Etsy buyers
    "b2b_distributor",   // Wholesale distributors
    "b2b_wholesale",     // Bulk buyers
    "vendor",            // Suppliers
    "raw_data"           // Unqualified leads
  ]).notNull(),
  
  lifecycleStage: mysqlEnum("lifecycleStage", [
    "lead",              // Initial contact
    "mql",               // Marketing qualified lead
    "sql",               // Sales qualified lead
    "opportunity",       // Active deal
    "customer",          // Closed won
    "advocate",          // Promoter
    "churned"            // Lost customer
  ]).default("lead").notNull(),
  
  // Relationships
  companyId: int("companyId"),           // Link to companies table
  ownerId: int("ownerId"),               // Assigned sales rep
  
  // AI Scoring (0-100 scale)
  leadScore: int("leadScore").default(0),           // Conversion probability
  healthScore: int("healthScore").default(100),     // Customer health
  
  // Predictive metrics
  lifetimeValue: int("lifetimeValue").default(0),   // Total revenue (cents)
  churnProbability: int("churnProbability").default(0), // 0-100 scale
  nextPurchaseDate: timestamp("nextPurchaseDate"),
  
  // Location
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("USA"),
  
  // Engagement tracking
  lastActivityAt: timestamp("lastActivityAt"),
  lastContactedAt: timestamp("lastContactedAt"),
  emailOptIn: int("emailOptIn").default(1).notNull(),
  smsOptIn: int("smsOptIn").default(0).notNull(),
  
  // Flexible metadata (JSON for extensibility)
  tags: text("tags"),                    // JSON array of strings
  customFields: text("customFields"),    // JSON object
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),     // Soft delete
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// Companies table - Account management with hierarchy support
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

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// Deals table - Sales pipeline with probability tracking
export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Relationships
  companyId: int("companyId"),
  contactId: int("contactId"),           // Primary contact
  ownerId: int("ownerId").notNull(),     // Assigned sales rep
  
  // Pipeline stage
  stage: mysqlEnum("stage", [
    "prospecting",       // Initial outreach
    "qualification",     // Needs assessment
    "proposal",          // Proposal sent
    "negotiation",       // Terms discussion
    "closed_won",        // Deal won
    "closed_lost"        // Deal lost
  ]).default("prospecting").notNull(),
  
  // Financial
  amount: int("amount"),                 // Deal value (cents)
  probability: int("probability").default(10), // 0-100 scale
  
  // Timeline
  expectedCloseDate: timestamp("expectedCloseDate"),
  actualCloseDate: timestamp("actualCloseDate"),
  
  // Loss tracking
  lossReason: varchar("lossReason", { length: 255 }),
  competitorName: varchar("competitorName", { length: 255 }),
  
  // Metadata
  tags: text("tags"),
  customFields: text("customFields"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

// Distributors table - B2B distributor relationship management
export const distributors = mysqlTable("distributors", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  
  // Classification
  tier: mysqlEnum("tier", [
    "platinum",          // Top tier
    "gold",              // Mid tier
    "silver",            // Standard
    "bronze"             // Entry level
  ]).default("silver").notNull(),
  
  status: mysqlEnum("status", [
    "active",
    "inactive",
    "pending",
    "suspended"
  ]).default("active").notNull(),
  
  // Territory
  territoryRegion: varchar("territoryRegion", { length: 100 }),
  territoryStates: text("territoryStates"), // JSON array
  territoryZipCodes: text("territoryZipCodes"), // JSON array
  
  // Financial terms
  commissionRate: int("commissionRate"),  // Basis points (e.g., 1500 = 15%)
  minimumOrder: int("minimumOrder"),      // Cents
  paymentTerms: varchar("paymentTerms", { length: 100 }), // e.g., "Net 30"
  
  // Performance
  totalRevenue: int("totalRevenue").default(0),
  totalOrders: int("totalOrders").default(0),
  averageOrderValue: int("averageOrderValue").default(0),
  
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
  
  // Metadata
  tags: text("tags"),
  customFields: text("customFields"),
  notes: text("notes"),
  
  // Audit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});

export type Distributor = typeof distributors.$inferSelect;
export type InsertDistributor = typeof distributors.$inferInsert;

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

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

// ============================================================================
// ENTERPRISE CRM TABLES - Phase 1 Enhancement
// ============================================================================

// Activities table - Universal activity tracking (emails, calls, meetings, notes, tasks, SMS)
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  
  type: mysqlEnum("type", [
    "email",
    "call",
    "meeting",
    "note",
    "task",
    "sms",
    "whatsapp"
  ]).notNull(),
  
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  
  // Relationships
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  userId: int("userId").notNull(),
  
  // Communication details
  direction: mysqlEnum("direction", ["inbound", "outbound"]),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]),
  
  // Timing
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  duration: int("duration"), // minutes
  
  // Flexible metadata
  metadata: text("metadata"), // JSON for type-specific data
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("idx_type").on(table.type),
  contactIdx: index("idx_contact").on(table.contactId),
  companyIdx: index("idx_company").on(table.companyId),
  dealIdx: index("idx_deal").on(table.dealId),
  userIdx: index("idx_user").on(table.userId),
  scheduledIdx: index("idx_scheduled").on(table.scheduledAt),
}));

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// Tasks table - Task management with priorities and due dates
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  
  // Assignment
  assignedTo: int("assignedTo").notNull(),
  createdBy: int("createdBy").notNull(),
  
  // Relationships
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  
  // Status
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["todo", "in_progress", "completed", "cancelled"]).default("todo").notNull(),
  
  // Timing
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  reminderAt: timestamp("reminderAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  assignedIdx: index("idx_assigned").on(table.assignedTo),
  statusIdx: index("idx_status").on(table.status),
  dueDateIdx: index("idx_due_date").on(table.dueDate),
  contactIdx: index("idx_contact").on(table.contactId),
  companyIdx: index("idx_company").on(table.companyId),
  dealIdx: index("idx_deal").on(table.dealId),
}));

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Predictions table - AI/ML predictions for contacts, companies, and deals
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  
  modelType: mysqlEnum("modelType", [
    "churn",
    "deal_win",
    "lead_score",
    "next_purchase",
    "upsell"
  ]).notNull(),
  
  entityType: mysqlEnum("entityType", ["contact", "company", "deal"]).notNull(),
  entityId: int("entityId").notNull(),
  
  score: int("score").notNull(), // 0-100
  confidence: int("confidence"), // 0-100
  
  factors: text("factors"), // JSON explaining the prediction
  
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("idx_entity").on(table.entityType, table.entityId),
  modelIdx: index("idx_model").on(table.modelType),
  scoreIdx: index("idx_score").on(table.score),
  expiresIdx: index("idx_expires").on(table.expiresAt),
}));

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

// Prescriptions table - AI-recommended actions
export const prescriptions = mysqlTable("prescriptions", {
  id: int("id").autoincrement().primaryKey(),
  
  type: mysqlEnum("type", [
    "retention",
    "upsell",
    "cross_sell",
    "engagement",
    "nurture"
  ]).notNull(),
  
  entityType: mysqlEnum("entityType", ["contact", "company", "deal"]).notNull(),
  entityId: int("entityId").notNull(),
  
  priority: int("priority").default(50).notNull(), // 0-100
  
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  recommendedAction: text("recommendedAction"),
  
  expectedImpact: text("expectedImpact"), // JSON with revenue, success_rate, cost
  
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed"]).default("pending").notNull(),
  
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  completedAt: timestamp("completedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("idx_entity").on(table.entityType, table.entityId),
  typeIdx: index("idx_type").on(table.type),
  statusIdx: index("idx_status").on(table.status),
  priorityIdx: index("idx_priority").on(table.priority),
}));

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

// Workflows table - Automation rules and workflows
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  triggerType: mysqlEnum("triggerType", [
    "record_created",
    "record_updated",
    "field_changed",
    "scheduled",
    "manual"
  ]).notNull(),
  
  triggerModule: mysqlEnum("triggerModule", [
    "contacts",
    "companies",
    "deals",
    "tasks"
  ]).notNull(),
  
  triggerConditions: text("triggerConditions"), // JSON
  actions: text("actions"), // JSON array of actions
  
  isActive: int("isActive").default(1).notNull(),
  
  executionCount: int("executionCount").default(0).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  triggerIdx: index("idx_trigger").on(table.triggerModule, table.triggerType),
  activeIdx: index("idx_active").on(table.isActive),
}));

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

// Workflow executions table - Track workflow execution history
export const workflowExecutions = mysqlTable("workflowExecutions", {
  id: int("id").autoincrement().primaryKey(),
  
  workflowId: int("workflowId").notNull(),
  
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  
  status: mysqlEnum("status", ["success", "failed", "partial"]).notNull(),
  
  actionsExecuted: text("actionsExecuted"), // JSON
  errorMessage: text("errorMessage"),
  executionTimeMs: int("executionTimeMs"),
  
  executedAt: timestamp("executedAt").defaultNow().notNull(),
}, (table) => ({
  workflowIdx: index("idx_workflow").on(table.workflowId),
  entityIdx: index("idx_entity").on(table.entityType, table.entityId),
  executedIdx: index("idx_executed").on(table.executedAt),
}));

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

// Emails table - Email tracking and history
export const emails = mysqlTable("emails", {
  id: int("id").autoincrement().primaryKey(),
  
  messageId: varchar("messageId", { length: 255 }).unique(),
  threadId: varchar("threadId", { length: 255 }),
  
  // Relationships
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  userId: int("userId").notNull(),
  
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  
  subject: varchar("subject", { length: 500 }),
  bodyText: text("bodyText"),
  bodyHtml: text("bodyHtml"),
  
  fromAddress: varchar("fromAddress", { length: 320 }),
  toAddresses: text("toAddresses"), // JSON array
  ccAddresses: text("ccAddresses"), // JSON array
  bccAddresses: text("bccAddresses"), // JSON array
  
  // Tracking
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  repliedAt: timestamp("repliedAt"),
  bouncedAt: timestamp("bouncedAt"),
  
  // AI analysis
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  intent: mysqlEnum("intent", ["question", "objection", "interest", "purchase", "support"]),
  
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("idx_message").on(table.messageId),
  threadIdx: index("idx_thread").on(table.threadId),
  contactIdx: index("idx_contact").on(table.contactId),
  userIdx: index("idx_user").on(table.userId),
  sentIdx: index("idx_sent").on(table.sentAt),
}));

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

// Calls table - Call logging with recording and transcription
export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relationships
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  userId: int("userId").notNull(),
  
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  
  phoneNumber: varchar("phoneNumber", { length: 50 }),
  duration: int("duration"), // seconds
  
  recordingUrl: varchar("recordingUrl", { length: 500 }),
  transcription: text("transcription"),
  summary: text("summary"),
  
  // AI analysis
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  keywords: text("keywords"), // JSON array
  actionItems: text("actionItems"), // JSON array
  
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  contactIdx: index("idx_contact").on(table.contactId),
  userIdx: index("idx_user").on(table.userId),
  startedIdx: index("idx_started").on(table.startedAt),
}));

export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;

// Campaigns table - Marketing campaigns
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 255 }).notNull(),
  
  type: mysqlEnum("type", [
    "email",
    "sms",
    "social",
    "ads",
    "event",
    "webinar"
  ]).notNull(),
  
  status: mysqlEnum("status", [
    "draft",
    "scheduled",
    "active",
    "paused",
    "completed"
  ]).default("draft").notNull(),
  
  budget: int("budget"), // cents
  spent: int("spent").default(0).notNull(), // cents
  
  targetAudience: text("targetAudience"), // JSON
  
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  typeIdx: index("idx_type").on(table.type),
  statusIdx: index("idx_status").on(table.status),
  datesIdx: index("idx_dates").on(table.startDate, table.endDate),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// Campaign members table - Track campaign participation
export const campaignMembers = mysqlTable("campaignMembers", {
  id: int("id").autoincrement().primaryKey(),
  
  campaignId: int("campaignId").notNull(),
  contactId: int("contactId").notNull(),
  
  status: mysqlEnum("status", [
    "sent",
    "opened",
    "clicked",
    "converted",
    "bounced",
    "unsubscribed"
  ]).default("sent").notNull(),
  
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  convertedAt: timestamp("convertedAt"),
}, (table) => ({
  uniqueMember: index("unique_member").on(table.campaignId, table.contactId),
  campaignIdx: index("idx_campaign").on(table.campaignId),
  contactIdx: index("idx_contact").on(table.contactId),
  statusIdx: index("idx_status").on(table.status),
}));

export type CampaignMember = typeof campaignMembers.$inferSelect;
export type InsertCampaignMember = typeof campaignMembers.$inferInsert;


// ============================================================================
// TEMPLATE MANAGEMENT SYSTEM
// ============================================================================

// Letter templates table - Store custom dispute letter templates
export const letterTemplates = mysqlTable("letterTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content", { length: 'long' }).notNull(), // HTML content
  
  category: mysqlEnum("category", [
    "initial_dispute",
    "follow_up",
    "escalation",
    "final_demand",
    "resolution"
  ]).notNull(),
  
  carrier: mysqlEnum("carrier", ["FEDEX", "UPS", "USPS", "DHL", "ALL"]),
  caseType: varchar("caseType", { length: 100 }), // damage, lost, delay, etc.
  
  tags: text("tags"), // JSON array of tags
  
  isPublic: boolean("isPublic").default(false).notNull(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(), // default for category
  
  version: int("version").default(1).notNull(),
  parentTemplateId: int("parentTemplateId"), // for versioning
  
  usageCount: int("usageCount").default(0).notNull(),
  successRate: int("successRate").default(0).notNull(), // 0-100
  avgResponseTime: int("avgResponseTime"), // hours
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
}, (table) => ({
  categoryIdx: index("idx_category").on(table.category),
  carrierIdx: index("idx_carrier").on(table.carrier),
  publicIdx: index("idx_public").on(table.isPublic),
  favoriteIdx: index("idx_favorite").on(table.isFavorite),
  createdByIdx: index("idx_created_by").on(table.createdBy),
}));

export type LetterTemplate = typeof letterTemplates.$inferSelect;
export type InsertLetterTemplate = typeof letterTemplates.$inferInsert;

// Template versions table - Track template version history
export const templateVersions = mysqlTable("templateVersions", {
  id: int("id").autoincrement().primaryKey(),
  
  templateId: int("templateId").notNull(),
  version: int("version").notNull(),
  
  content: text("content", { length: 'long' }).notNull(),
  changeNotes: text("changeNotes"),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  templateIdx: index("idx_template").on(table.templateId),
  versionIdx: index("idx_version").on(table.templateId, table.version),
}));

export type TemplateVersion = typeof templateVersions.$inferSelect;
export type InsertTemplateVersion = typeof templateVersions.$inferInsert;

// Template shares table - Track template sharing permissions
export const templateShares = mysqlTable("templateShares", {
  id: int("id").autoincrement().primaryKey(),
  
  templateId: int("templateId").notNull(),
  sharedWith: int("sharedWith").notNull(), // user ID
  
  permission: mysqlEnum("permission", ["view", "edit"]).default("view").notNull(),
  
  sharedBy: int("sharedBy").notNull(),
  sharedAt: timestamp("sharedAt").defaultNow().notNull(),
}, (table) => ({
  templateIdx: index("idx_template").on(table.templateId),
  userIdx: index("idx_user").on(table.sharedWith),
}));

export type TemplateShare = typeof templateShares.$inferSelect;
export type InsertTemplateShare = typeof templateShares.$inferInsert;


// ============================================================================
// DOCUMENT MANAGEMENT SYSTEM
// ============================================================================

// Case documents table - Store evidence and attachments
export const caseDocuments = mysqlTable("caseDocuments", {
  id: int("id").autoincrement().primaryKey(),
  
  caseId: int("caseId").notNull(),
  
  fileName: varchar("fileName", { length: 255 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // bytes
  fileType: varchar("fileType", { length: 100 }).notNull(), // MIME type
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: text("fileKey").notNull(), // S3 key for deletion
  
  category: mysqlEnum("category", [
    "damage_photo",
    "packaging_photo",
    "receipt",
    "invoice",
    "correspondence",
    "tracking_info",
    "other"
  ]).notNull(),
  
  description: text("description"),
  tags: text("tags"), // JSON array
  
  thumbnailUrl: text("thumbnailUrl"), // For images/PDFs
  extractedText: text("extractedText", { length: 'long' }), // OCR text
  
  version: int("version").default(1).notNull(),
  parentDocumentId: int("parentDocumentId"), // For versioning
  
  isEvidence: boolean("isEvidence").default(true).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  
  uploadedBy: int("uploadedBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
}, (table) => ({
  caseIdx: index("idx_case").on(table.caseId),
  categoryIdx: index("idx_category").on(table.category),
  uploadedByIdx: index("idx_uploaded_by").on(table.uploadedBy),
  evidenceIdx: index("idx_evidence").on(table.isEvidence),
}));

export type CaseDocument = typeof caseDocuments.$inferSelect;
export type InsertCaseDocument = typeof caseDocuments.$inferInsert;

// Document versions table - Track document revisions
export const documentVersions = mysqlTable("documentVersions", {
  id: int("id").autoincrement().primaryKey(),
  
  documentId: int("documentId").notNull(),
  version: int("version").notNull(),
  
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileSize: int("fileSize").notNull(),
  
  changeNotes: text("changeNotes"),
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  documentIdx: index("idx_document").on(table.documentId),
  versionIdx: index("idx_version").on(table.documentId, table.version),
}));

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;

// Document access log - Audit trail
export const documentAccessLog = mysqlTable("documentAccessLog", {
  id: int("id").autoincrement().primaryKey(),
  
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  
  action: mysqlEnum("action", [
    "viewed",
    "downloaded",
    "uploaded",
    "updated",
    "deleted",
    "shared"
  ]).notNull(),
  
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  documentIdx: index("idx_document").on(table.documentId),
  userIdx: index("idx_user").on(table.userId),
  actionIdx: index("idx_action").on(table.action),
}));

export type DocumentAccessLog = typeof documentAccessLog.$inferSelect;
export type InsertDocumentAccessLog = typeof documentAccessLog.$inferInsert;


// Letter Patterns table - Store successful dispute letter patterns for learning
export const letterPatterns = mysqlTable("letterPatterns", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  carrier: mysqlEnum("carrier", ["FEDEX", "UPS", "USPS", "DHL", "OTHER"]).notNull(),
  disputeReason: varchar("disputeReason", { length: 255 }).notNull(),
  letterContent: text("letterContent").notNull(),
  tone: mysqlEnum("tone", ["professional", "firm", "conciliatory"]).notNull(),
  outcome: mysqlEnum("outcome", ["approved", "partial", "rejected", "pending"]),
  recoveredAmount: int("recoveredAmount"), // stored in cents
  claimedAmount: int("claimedAmount"), // stored in cents
  successRate: int("successRate"), // percentage 0-100
  timeTaken: int("timeTaken"), // days from submission to resolution
  notes: text("notes"),
  markedSuccessful: int("markedSuccessful").default(0).notNull(), // boolean
  usageCount: int("usageCount").default(0).notNull(), // how many times this pattern was used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  carrierIdx: index("idx_carrier").on(table.carrier),
  outcomeIdx: index("idx_outcome").on(table.outcome),
  successIdx: index("idx_successful").on(table.markedSuccessful),
}));

export type LetterPattern = typeof letterPatterns.$inferSelect;
export type InsertLetterPattern = typeof letterPatterns.$inferInsert;


// Case Templates table - Save and reuse case configurations
export const caseTemplates = mysqlTable("caseTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  carrier: mysqlEnum("carrier", ["FEDEX", "UPS", "USPS", "DHL", "OTHER"]),
  disputeType: varchar("disputeType", { length: 100 }), // "dimensional_weight", "damage", "lost_package", etc.
  priority: mysqlEnum("priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  
  // Template data (JSON)
  templateData: text("templateData").notNull(), // JSON string with default values
  
  // Usage tracking
  usageCount: int("usageCount").default(0).notNull(),
  lastUsed: timestamp("lastUsed"),
  
  // Metadata
  isPublic: int("isPublic").default(0).notNull(), // boolean - shared with team
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdx: index("idx_created_by").on(table.createdBy),
  carrierIdx: index("idx_carrier").on(table.carrier),
}));

export type CaseTemplate = typeof caseTemplates.$inferSelect;
export type InsertCaseTemplate = typeof caseTemplates.$inferInsert;


// Reminders table - Deadline tracking and notifications
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  caseId: int("caseId").notNull(),
  reminderType: mysqlEnum("reminderType", [
    "response_deadline",
    "follow_up",
    "escalation",
    "document_submission",
    "custom"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "completed", "cancelled"]).default("pending").notNull(),
  
  // Notification settings
  notifyDaysBefore: int("notifyDaysBefore").default(3), // Notify X days before due date
  notificationSent: int("notificationSent").default(0).notNull(), // boolean
  notificationSentAt: timestamp("notificationSentAt"),
  
  // Metadata
  priority: mysqlEnum("priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM").notNull(),
  assignedTo: int("assignedTo"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  caseIdx: index("idx_case").on(table.caseId),
  dueDateIdx: index("idx_due_date").on(table.dueDate),
  statusIdx: index("idx_status").on(table.status),
}));

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;


// ============================================================================
// VENDOR PO MANAGEMENT, RECEIVING & INVENTORY SYSTEM
// ============================================================================

// Note: vendors table already exists above in CRM section (line 747)

// Purchase Orders table - PO header information
export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  poNumber: varchar("poNumber", { length: 100 }).notNull().unique(),
  vendorId: int("vendorId").notNull(),
  poDate: timestamp("poDate").notNull(),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  status: mysqlEnum("status", [
    "draft",
    "pending_approval",
    "approved",
    "ordered",
    "partially_received",
    "received",
    "cancelled"
  ]).default("draft").notNull(),
  
  // Financial
  subtotal: int("subtotal").notNull(), // in cents
  taxAmount: int("taxAmount").default(0).notNull(), // in cents
  shippingCost: int("shippingCost").default(0).notNull(), // in cents
  totalAmount: int("totalAmount").notNull(), // in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  
  // Shipping
  shipToAddress: text("shipToAddress"),
  shippingMethod: varchar("shippingMethod", { length: 100 }),
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  
  // AI Processing
  scannedFromDocument: int("scannedFromDocument").default(0).notNull(), // boolean
  documentUrl: text("documentUrl"), // URL to original PO document
  aiConfidence: int("aiConfidence"), // 0-100 confidence score
  aiExtractedData: text("aiExtractedData"), // JSON of AI-extracted fields
  
  // Workflow
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  internalNotes: text("internalNotes"), // private notes
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  vendorIdx: index("idx_po_vendor").on(table.vendorId),
  statusIdx: index("idx_po_status").on(table.status),
  poDateIdx: index("idx_po_date").on(table.poDate),
}));

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// Purchase Order Items table - Line items for each PO
export const purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  poId: int("poId").notNull(),
  lineNumber: int("lineNumber").notNull(), // line number on PO
  productId: int("productId"), // linked to products table (may be null if not matched yet)
  
  // Item details (as appears on PO)
  vendorSku: varchar("vendorSku", { length: 100 }).notNull(), // vendor's SKU
  description: text("description").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(), // in cents
  lineTotal: int("lineTotal").notNull(), // in cents
  
  // Receiving tracking
  quantityReceived: int("quantityReceived").default(0).notNull(),
  quantityRemaining: int("quantityRemaining").notNull(), // calculated field
  
  // SKU matching
  skuMatchConfidence: int("skuMatchConfidence"), // 0-100
  skuMatchedBy: mysqlEnum("skuMatchedBy", ["ai", "alias", "manual", "exact"]),
  skuAliasId: int("skuAliasId"), // reference to SKU alias if used
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  poIdx: index("idx_poi_po").on(table.poId),
  productIdx: index("idx_poi_product").on(table.productId),
}));

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

// SKU Aliases table - Customer/Vendor-specific SKU mappings
export const skuAliases = mysqlTable("skuAliases", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(), // our product
  ourSku: varchar("ourSku", { length: 100 }).notNull(), // our SKU
  
  // Alias information
  aliasType: mysqlEnum("aliasType", ["vendor", "customer", "channel"]).notNull(),
  aliasEntityId: int("aliasEntityId").notNull(), // vendor ID, customer ID, or channel ID
  aliasEntityName: varchar("aliasEntityName", { length: 255 }).notNull(), // for display
  aliasSku: varchar("aliasSku", { length: 100 }).notNull(), // their SKU
  aliasDescription: text("aliasDescription"), // their product description
  
  // Learning metadata
  learnedBy: mysqlEnum("learnedBy", ["ai", "manual", "import"]).notNull(),
  confidence: int("confidence").default(100).notNull(), // 0-100
  usageCount: int("usageCount").default(0).notNull(), // how many times used
  lastUsed: timestamp("lastUsed"),
  
  // Validation
  isActive: int("isActive").default(1).notNull(), // boolean
  verifiedBy: int("verifiedBy"), // user who verified this alias
  verifiedAt: timestamp("verifiedAt"),
  
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("idx_alias_product").on(table.productId),
  aliasSkuIdx: index("idx_alias_sku").on(table.aliasSku),
  entityIdx: index("idx_alias_entity").on(table.aliasType, table.aliasEntityId),
}));

export type SkuAlias = typeof skuAliases.$inferSelect;
export type InsertSkuAlias = typeof skuAliases.$inferInsert;

// Receivings table - Receiving header information
export const receivings = mysqlTable("receivings", {
  id: int("id").autoincrement().primaryKey(),
  receivingNumber: varchar("receivingNumber", { length: 100 }).notNull().unique(),
  poId: int("poId").notNull(),
  receivedDate: timestamp("receivedDate").notNull(),
  status: mysqlEnum("status", ["draft", "completed", "cancelled"]).default("draft").notNull(),
  
  // Shipping details
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  carrier: varchar("carrier", { length: 50 }),
  
  // Quality control
  inspectionStatus: mysqlEnum("inspectionStatus", ["pending", "passed", "failed", "partial"]),
  inspectedBy: int("inspectedBy"),
  inspectedAt: timestamp("inspectedAt"),
  
  // Location
  warehouseLocation: varchar("warehouseLocation", { length: 100 }),
  
  notes: text("notes"),
  damageNotes: text("damageNotes"),
  attachments: text("attachments"), // JSON array of photo URLs
  
  receivedBy: int("receivedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  poIdx: index("idx_receiving_po").on(table.poId),
  receivedDateIdx: index("idx_receiving_date").on(table.receivedDate),
}));

export type Receiving = typeof receivings.$inferSelect;
export type InsertReceiving = typeof receivings.$inferInsert;

// Receiving Items table - Line items for each receiving
export const receivingItems = mysqlTable("receivingItems", {
  id: int("id").autoincrement().primaryKey(),
  receivingId: int("receivingId").notNull(),
  poItemId: int("poItemId").notNull(), // link to PO line item
  productId: int("productId").notNull(),
  
  quantityOrdered: int("quantityOrdered").notNull(),
  quantityReceived: int("quantityReceived").notNull(),
  quantityAccepted: int("quantityAccepted").notNull(),
  quantityRejected: int("quantityRejected").default(0).notNull(),
  
  condition: mysqlEnum("condition", ["good", "damaged", "defective", "wrong_item"]).default("good").notNull(),
  lotNumber: varchar("lotNumber", { length: 100 }),
  expiryDate: timestamp("expiryDate"),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  receivingIdx: index("idx_ri_receiving").on(table.receivingId),
  productIdx: index("idx_ri_product").on(table.productId),
}));

export type ReceivingItem = typeof receivingItems.$inferSelect;
export type InsertReceivingItem = typeof receivingItems.$inferInsert;

// Inventory table - Current stock levels
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  
  // Stock levels
  quantityOnHand: int("quantityOnHand").default(0).notNull(),
  quantityAllocated: int("quantityAllocated").default(0).notNull(), // reserved for orders
  quantityAvailable: int("quantityAvailable").default(0).notNull(), // on hand - allocated
  quantityOnOrder: int("quantityOnOrder").default(0).notNull(), // in open POs
  
  // Reorder management
  reorderPoint: int("reorderPoint").default(10).notNull(),
  reorderQuantity: int("reorderQuantity").default(50).notNull(),
  
  // Location
  warehouseLocation: varchar("warehouseLocation", { length: 100 }),
  binLocation: varchar("binLocation", { length: 100 }),
  
  // Valuation (in cents)
  averageCost: int("averageCost").default(0).notNull(), // weighted average
  lastCost: int("lastCost").default(0).notNull(), // most recent purchase cost
  totalValue: int("totalValue").default(0).notNull(), // quantity * average cost
  
  // Tracking
  lastCountDate: timestamp("lastCountDate"),
  lastCountBy: int("lastCountBy"),
  lastReceivedDate: timestamp("lastReceivedDate"),
  lastSoldDate: timestamp("lastSoldDate"),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("idx_inv_product").on(table.productId),
  skuIdx: index("idx_inv_sku").on(table.sku),
  locationIdx: index("idx_inv_location").on(table.warehouseLocation),
}));

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = typeof inventory.$inferInsert;

// Inventory Transactions table - Complete audit trail
export const inventoryTransactions = mysqlTable("inventoryTransactions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  
  transactionType: mysqlEnum("transactionType", [
    "purchase",      // receiving from PO
    "sale",          // order fulfillment
    "adjustment",    // manual adjustment
    "transfer",      // location transfer
    "return",        // customer return
    "damage",        // damaged goods
    "count"          // physical count adjustment
  ]).notNull(),
  
  quantity: int("quantity").notNull(), // positive for increase, negative for decrease
  quantityBefore: int("quantityBefore").notNull(),
  quantityAfter: int("quantityAfter").notNull(),
  
  // Cost tracking (in cents)
  unitCost: int("unitCost"), // cost per unit for this transaction
  totalCost: int("totalCost"), // quantity * unit cost
  
  // Reference
  referenceType: varchar("referenceType", { length: 50 }), // "po", "order", "receiving", "adjustment"
  referenceId: int("referenceId"), // ID of the reference document
  referenceNumber: varchar("referenceNumber", { length: 100 }), // PO#, Order#, etc.
  
  // Location
  fromLocation: varchar("fromLocation", { length: 100 }),
  toLocation: varchar("toLocation", { length: 100 }),
  
  notes: text("notes"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("idx_trans_product").on(table.productId),
  typeIdx: index("idx_trans_type").on(table.transactionType),
  dateIdx: index("idx_trans_date").on(table.createdAt),
  refIdx: index("idx_trans_ref").on(table.referenceType, table.referenceId),
}));

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

// Inventory Valuation Snapshots table - Historical valuation data
export const inventoryValuationSnapshots = mysqlTable("inventoryValuationSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotDate: timestamp("snapshotDate").notNull(),
  snapshotType: mysqlEnum("snapshotType", ["daily", "weekly", "monthly", "manual"]).notNull(),
  
  // Aggregate metrics
  totalQuantity: int("totalQuantity").notNull(),
  totalValue: int("totalValue").notNull(), // in cents
  totalProducts: int("totalProducts").notNull(),
  
  // Valuation methods (all in cents)
  valuationFIFO: int("valuationFIFO").notNull(),
  valuationLIFO: int("valuationLIFO").notNull(),
  valuationWeightedAvg: int("valuationWeightedAvg").notNull(),
  
  // Category breakdowns (JSON)
  byCategory: text("byCategory"), // JSON with category-level metrics
  byLocation: text("byLocation"), // JSON with location-level metrics
  topProducts: text("topProducts"), // JSON with top 20 products by value
  
  // Turnover metrics
  avgTurnoverRate: int("avgTurnoverRate"), // stored as percentage * 100
  slowMovingCount: int("slowMovingCount"), // items not sold in 90 days
  deadStockCount: int("deadStockCount"), // items not sold in 180 days
  
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("idx_snapshot_date").on(table.snapshotDate),
  typeIdx: index("idx_snapshot_type").on(table.snapshotType),
}));

export type InventoryValuationSnapshot = typeof inventoryValuationSnapshots.$inferSelect;
export type InsertInventoryValuationSnapshot = typeof inventoryValuationSnapshots.$inferInsert;

// Email Threads - Group related emails together
export const emailThreads = mysqlTable("emailThreads", {
  id: int("id").autoincrement().primaryKey(),
  
  subject: varchar("subject", { length: 500 }).notNull(),
  
  // Relationships
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  
  // Thread metadata
  messageCount: int("messageCount").default(0).notNull(),
  participants: text("participants"), // JSON array of email addresses
  
  // Status
  status: mysqlEnum("status", ["active", "archived", "spam"]).default("active").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  isStarred: boolean("isStarred").default(false).notNull(),
  
  // Timestamps
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailThread = typeof emailThreads.$inferSelect;
export type InsertEmailThread = typeof emailThreads.$inferInsert;

// Email Messages - Individual emails in a thread
export const emailMessages = mysqlTable("emailMessages", {
  id: int("id").autoincrement().primaryKey(),
  
  threadId: int("threadId").notNull(),
  
  // Email headers
  messageId: varchar("messageId", { length: 255 }), // External email ID
  inReplyTo: varchar("inReplyTo", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  
  // Sender/Recipients
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  fromName: varchar("fromName", { length: 255 }),
  toEmails: text("toEmails").notNull(), // JSON array
  ccEmails: text("ccEmails"), // JSON array
  bccEmails: text("bccEmails"), // JSON array
  
  // Content
  bodyHtml: text("bodyHtml"),
  bodyText: text("bodyText"),
  
  // Metadata
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  
  // Attachments
  hasAttachments: boolean("hasAttachments").default(false).notNull(),
  attachmentUrls: text("attachmentUrls"), // JSON array of S3 URLs
  
  // Tracking
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  
  // Relationships
  userId: int("userId"), // User who sent (if outbound)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = typeof emailMessages.$inferInsert;

// CRM Documents - Files attached to CRM entities
export const crmDocuments = mysqlTable("crmDocuments", {
  id: int("id").autoincrement().primaryKey(),
  
  // File info
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // bytes
  fileUrl: text("fileUrl").notNull(), // S3 URL
  
  // Classification
  documentType: mysqlEnum("documentType", [
    "contract",
    "proposal",
    "invoice",
    "receipt",
    "presentation",
    "report",
    "other"
  ]).default("other").notNull(),
  
  // Relationships (at least one required)
  contactId: int("contactId"),
  companyId: int("companyId"),
  dealId: int("dealId"),
  emailMessageId: int("emailMessageId"),
  
  // Metadata
  description: text("description"),
  tags: text("tags"), // JSON array
  
  // Tracking
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CrmDocument = typeof crmDocuments.$inferSelect;
export type InsertCrmDocument = typeof crmDocuments.$inferInsert;

// Email Templates - Reusable email templates
export const crmEmailTemplates = mysqlTable("crmEmailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(),
  bodyText: text("bodyText"),
  
  // Template variables (e.g., {{firstName}}, {{companyName}})
  variables: text("variables"), // JSON array of variable names
  
  // Classification
  category: varchar("category", { length: 100 }),
  
  // Usage tracking
  useCount: int("useCount").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  
  // Ownership
  createdBy: int("createdBy").notNull(),
  isShared: boolean("isShared").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmEmailTemplate = typeof crmEmailTemplates.$inferSelect;
export type InsertCrmEmailTemplate = typeof crmEmailTemplates.$inferInsert;
