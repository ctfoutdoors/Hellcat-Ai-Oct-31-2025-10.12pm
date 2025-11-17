import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";

/**
 * Product Intelligence Service
 * Manages product lifecycle states and readiness scoring
 */

export type LifecycleState = "concept" | "development" | "pre_launch" | "active_launch" | "post_launch" | "cruise" | "end_of_life";

export interface ProductIntelligence {
  id: number;
  sku: string;
  name: string;
  lifecycleState: LifecycleState;
  intelligenceMetadata?: {
    assets?: { type: string; status: string; url?: string }[];
    requirements?: { name: string; completed: boolean }[];
    readinessScore?: number;
    blockers?: string[];
  };
  variantSummary?: {
    total?: number;
    ready?: number;
    blocked?: number;
    avgReadiness?: number;
  };
  lastIntelligenceUpdate?: Date;
}

/**
 * Get all products with intelligence data
 */
export async function getAllProductsWithIntelligence(): Promise<ProductIntelligence[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      lifecycleState: products.lifecycleState,
      intelligenceMetadata: products.intelligenceMetadata,
      variantSummary: products.variantSummary,
      lastIntelligenceUpdate: products.lastIntelligenceUpdate,
    })
    .from(products)
    .where(eq(products.isActive, true));

  return results as ProductIntelligence[];
}

/**
 * Get product by ID with intelligence data
 */
export async function getProductIntelligence(productId: number): Promise<ProductIntelligence | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      lifecycleState: products.lifecycleState,
      intelligenceMetadata: products.intelligenceMetadata,
      variantSummary: products.variantSummary,
      lastIntelligenceUpdate: products.lastIntelligenceUpdate,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return results[0] as ProductIntelligence || null;
}

/**
 * Update product lifecycle state
 */
export async function updateLifecycleState(
  productId: number,
  newState: LifecycleState
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(products)
    .set({
      lifecycleState: newState,
      lastIntelligenceUpdate: new Date(),
    })
    .where(eq(products.id, productId));

  return true;
}

/**
 * Calculate product readiness score
 */
export function calculateReadinessScore(product: ProductIntelligence): number {
  let score = 0;
  const metadata = product.intelligenceMetadata;

  if (!metadata) return 0;

  // Assets score (40%)
  if (metadata.assets && metadata.assets.length > 0) {
    const completedAssets = metadata.assets.filter(a => a.status === "completed").length;
    const assetScore = (completedAssets / metadata.assets.length) * 40;
    score += assetScore;
  }

  // Requirements score (40%)
  if (metadata.requirements && metadata.requirements.length > 0) {
    const completedReqs = metadata.requirements.filter(r => r.completed).length;
    const reqScore = (completedReqs / metadata.requirements.length) * 40;
    score += reqScore;
  }

  // Blockers penalty (20%)
  if (!metadata.blockers || metadata.blockers.length === 0) {
    score += 20;
  }

  return Math.round(score);
}

/**
 * Update product intelligence metadata
 */
export async function updateIntelligenceMetadata(
  productId: number,
  metadata: {
    assets?: { type: string; status: string; url?: string }[];
    requirements?: { name: string; completed: boolean }[];
    blockers?: string[];
  }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Get current product
  const product = await getProductIntelligence(productId);
  if (!product) return false;

  // Merge with existing metadata
  const updatedMetadata = {
    ...(product.intelligenceMetadata || {}),
    ...metadata,
  };

  // Calculate new readiness score
  const readinessScore = calculateReadinessScore({
    ...product,
    intelligenceMetadata: updatedMetadata,
  });

  updatedMetadata.readinessScore = readinessScore;

  await db
    .update(products)
    .set({
      intelligenceMetadata: updatedMetadata,
      lastIntelligenceUpdate: new Date(),
    })
    .where(eq(products.id, productId));

  return true;
}

/**
 * Get products by lifecycle state
 */
export async function getProductsByState(state: LifecycleState): Promise<ProductIntelligence[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      lifecycleState: products.lifecycleState,
      intelligenceMetadata: products.intelligenceMetadata,
      variantSummary: products.variantSummary,
      lastIntelligenceUpdate: products.lastIntelligenceUpdate,
    })
    .from(products)
    .where(and(
      eq(products.isActive, true),
      eq(products.lifecycleState, state)
    ));

  return results as ProductIntelligence[];
}

/**
 * Get products with low readiness scores
 */
export async function getProductsNeedingAttention(threshold: number = 75): Promise<ProductIntelligence[]> {
  const db = await getDb();
  if (!db) return [];

  const allProducts = await getAllProductsWithIntelligence();
  
  return allProducts.filter(p => {
    const score = p.intelligenceMetadata?.readinessScore || 0;
    return score < threshold;
  });
}

/**
 * Validate state transition
 */
export function canTransitionTo(currentState: LifecycleState, newState: LifecycleState): boolean {
  const validTransitions: Record<LifecycleState, LifecycleState[]> = {
    concept: ["development", "end_of_life"],
    development: ["pre_launch", "concept", "end_of_life"],
    pre_launch: ["active_launch", "development", "end_of_life"],
    active_launch: ["post_launch", "pre_launch"],
    post_launch: ["cruise", "active_launch"],
    cruise: ["end_of_life"],
    end_of_life: [],
  };

  return validTransitions[currentState]?.includes(newState) || false;
}
