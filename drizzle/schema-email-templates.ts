import { mysqlTable, int, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core";

/**
 * Email template settings
 * Stores customizable email branding and content
 */
export const emailTemplateSettings = mysqlTable("email_template_settings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id"), // null = global default
  
  // Branding
  companyName: varchar("company_name", { length: 255 }).default("Catch The Fever"),
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 7 }).default("#2c5f2d"),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#10b981"),
  
  // Header customization
  headerText: varchar("header_text", { length: 255 }).default("New Draft Case Created"),
  headerIcon: varchar("header_icon", { length: 10 }).default("🚨"),
  
  // Footer customization
  footerText: text("footer_text"),
  footerLinks: text("footer_links"), // JSON array of {text, url}
  
  // Content customization
  introText: text("intro_text"),
  ctaButtonText: varchar("cta_button_text", { length: 100 }).default("Review Case"),
  ctaButtonColor: varchar("cta_button_color", { length: 7 }).default("#2c5f2d"),
  
  // Email settings
  fromName: varchar("from_name", { length: 255 }),
  fromEmail: varchar("from_email", { length: 255 }),
  replyToEmail: varchar("reply_to_email", { length: 255 }),
  
  // Notification preferences
  enableNewCaseNotifications: boolean("enable_new_case_notifications").default(true),
  enableBulkNotifications: boolean("enable_bulk_notifications").default(true),
  enableStatusChangeNotifications: boolean("enable_status_change_notifications").default(false),
  
  // Metadata
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type EmailTemplateSetting = typeof emailTemplateSettings.$inferSelect;
export type NewEmailTemplateSetting = typeof emailTemplateSettings.$inferInsert;
