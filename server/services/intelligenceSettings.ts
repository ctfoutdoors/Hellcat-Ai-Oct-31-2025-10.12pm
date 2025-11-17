import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { intelligenceSettings, type IntelligenceSettings, type InsertIntelligenceSettings } from "../../drizzle/schema";

/**
 * Intelligence Settings Service
 * Manages versioned configuration for the entire Intelligence Suite
 */

export interface TimingRules {
  assetDeadlineDays?: number;
  copyDeadlineDays?: number;
  freezeWindowDays?: number;
  goNoGoTimingDays?: number;
  reviewTimingDays?: number;
  escalationDelayHours?: number;
  syncFrequencyMinutes?: number;
}

export interface Thresholds {
  inventoryThresholds?: { [category: string]: number };
  safetyStockMultiplier?: number;
  variantReadinessMinScore?: number;
  minimumApprovalQuorum?: number;
}

export interface Templates {
  defaultTasks?: { [productType: string]: any[] };
  defaultChecklists?: any[];
  assetRequirements?: any[];
  notificationRules?: any[];
  phaseRequirements?: any[];
  fallbackOwners?: any[];
}

/**
 * Get the latest active settings
 */
export async function getActiveSettings(): Promise<IntelligenceSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(intelligenceSettings)
    .orderBy(desc(intelligenceSettings.version))
    .limit(1);

  return results[0] || null;
}

/**
 * Get settings by version number
 */
export async function getSettingsByVersion(version: number): Promise<IntelligenceSettings | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(intelligenceSettings)
    .where(eq(intelligenceSettings.version, version))
    .limit(1);

  return results[0] || null;
}

/**
 * Create new settings version
 */
export async function createSettingsVersion(
  settings: {
    timingRules?: TimingRules;
    thresholds?: Thresholds;
    templates?: Templates;
  },
  createdBy: number
): Promise<IntelligenceSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get latest version
  const latest = await getActiveSettings();
  const newVersion = (latest?.version || 0) + 1;

  const newSettings: InsertIntelligenceSettings = {
    version: newVersion,
    timingRules: settings.timingRules || {},
    thresholds: settings.thresholds || {},
    templates: settings.templates || {},
    createdBy,
  };

  await db.insert(intelligenceSettings).values(newSettings);

  const created = await getSettingsByVersion(newVersion);
  if (!created) throw new Error("Failed to create settings");

  return created;
}

/**
 * Get default settings (used for first-time setup)
 */
export function getDefaultSettings(): {
  timingRules: TimingRules;
  thresholds: Thresholds;
  templates: Templates;
} {
  return {
    timingRules: {
      assetDeadlineDays: 14,
      copyDeadlineDays: 7,
      freezeWindowDays: 3,
      goNoGoTimingDays: 1,
      reviewTimingDays: 2,
      escalationDelayHours: 24,
      syncFrequencyMinutes: 15,
    },
    thresholds: {
      inventoryThresholds: {
        default: 50,
        high_demand: 100,
        seasonal: 200,
      },
      safetyStockMultiplier: 1.5,
      variantReadinessMinScore: 75,
      minimumApprovalQuorum: 2,
    },
    templates: {
      defaultTasks: {
        simple_product: [
          { name: "Create product listing", daysBeforeLaunch: 14 },
          { name: "Upload product images", daysBeforeLaunch: 10 },
          { name: "Write product description", daysBeforeLaunch: 7 },
          { name: "Set pricing", daysBeforeLaunch: 5 },
          { name: "Final review", daysBeforeLaunch: 1 },
        ],
        variable_product: [
          { name: "Create product listing", daysBeforeLaunch: 21 },
          { name: "Define all variants", daysBeforeLaunch: 18 },
          { name: "Upload variant images", daysBeforeLaunch: 14 },
          { name: "Write descriptions", daysBeforeLaunch: 10 },
          { name: "Set variant pricing", daysBeforeLaunch: 7 },
          { name: "Inventory check", daysBeforeLaunch: 3 },
          { name: "Final review", daysBeforeLaunch: 1 },
        ],
      },
      defaultChecklists: [
        { item: "All product images uploaded", required: true },
        { item: "Product description complete", required: true },
        { item: "Pricing configured", required: true },
        { item: "Inventory levels verified", required: true },
        { item: "SEO metadata added", required: false },
      ],
      assetRequirements: [
        { type: "hero_image", required: true, minResolution: "2000x2000" },
        { type: "gallery_images", required: true, minCount: 3 },
        { type: "product_description", required: true, minWords: 100 },
        { type: "seo_title", required: false },
        { type: "seo_description", required: false },
      ],
      notificationRules: [
        { trigger: "task_overdue", channel: "slack", escalate: true },
        { trigger: "asset_missing", channel: "slack", escalate: false },
        { trigger: "inventory_low", channel: "slack", escalate: true },
        { trigger: "go_no_go_required", channel: "slack", escalate: true },
      ],
      phaseRequirements: [
        { phase: "pre_launch", requiredAssets: ["hero_image", "product_description"] },
        { phase: "launch_execution", requiredAssets: ["all"], inventoryMin: 50 },
      ],
      fallbackOwners: [
        { role: "product_manager", fallback: "operations_manager" },
        { role: "designer", fallback: "product_manager" },
      ],
    },
  };
}

/**
 * Initialize settings if none exist
 */
export async function initializeSettings(createdBy: number): Promise<IntelligenceSettings> {
  const existing = await getActiveSettings();
  if (existing) return existing;

  const defaults = getDefaultSettings();
  return createSettingsVersion(defaults, createdBy);
}
