import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Tracking Screenshots Table
 * Stores screenshots captured from carrier tracking pages
 */
export const trackingScreenshots = mysqlTable("tracking_screenshots", {
  id: int("id").autoincrement().primaryKey(),
  
  // Link to shipment
  shipmentId: int("shipmentId").notNull(),
  
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
