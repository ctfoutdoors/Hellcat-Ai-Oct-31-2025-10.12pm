import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
