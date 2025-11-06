import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Saved search presets
 */
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(), // Store filter state as JSON
  isDefault: integer("is_default").default(0), // 1 = default search
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
