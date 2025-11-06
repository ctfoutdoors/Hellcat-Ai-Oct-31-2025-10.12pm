/**
 * AI Knowledge Management Service
 * Manages knowledge bases for admin procedures, legal information, case history, and AI learning
 */

interface KnowledgeEntry {
  id?: number;
  category: 'ADMIN' | 'LEGAL' | 'CASE' | 'AI_LEARNED';
  title: string;
  content: string;
  tags: string[];
  metadata?: Record<string, any>;
  relevanceScore?: number;
  successRate?: number;
  usageCount?: number;
}

interface CasePattern {
  pattern: string;
  frequency: number;
  successRate: number;
  avgRecoveryAmount: number;
  recommendedActions: string[];
}

/**
 * Add entry to knowledge base
 */
export async function addKnowledgeEntry(entry: KnowledgeEntry): Promise<number> {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { knowledgeBase } = await import('../../drizzle/schema');
  
  const [result] = await db.insert(knowledgeBase).values({
    category: entry.category,
    title: entry.title,
    content: entry.content,
    tags: entry.tags.join(','),
    metadata: JSON.stringify(entry.metadata || {}),
    relevanceScore: entry.relevanceScore || 0,
    successRate: entry.successRate || 0,
    usageCount: entry.usageCount || 0,
  }).returning({ id: knowledgeBase.id });

  return result.id;
}

/**
 * Search knowledge base
 */
export async function searchKnowledgeBase(
  query: string,
  category?: string,
  limit: number = 10
): Promise<KnowledgeEntry[]> {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) return [];

  const { knowledgeBase } = await import('../../drizzle/schema');
  const { like, or, and, eq, desc } = await import('drizzle-orm');

  let conditions = [
    or(
      like(knowledgeBase.title, `%${query}%`),
      like(knowledgeBase.content, `%${query}%`),
      like(knowledgeBase.tags, `%${query}%`)
    )
  ];

  if (category) {
    conditions.push(eq(knowledgeBase.category, category as any));
  }

  const results = await db
    .select()
    .from(knowledgeBase)
    .where(and(...conditions))
    .orderBy(desc(knowledgeBase.relevanceScore), desc(knowledgeBase.usageCount))
    .limit(limit);

  return results.map(r => ({
    id: r.id,
    category: r.category as any,
    title: r.title,
    content: r.content,
    tags: r.tags?.split(',') || [],
    metadata: r.metadata ? JSON.parse(r.metadata as string) : {},
    relevanceScore: r.relevanceScore || 0,
    successRate: r.successRate || 0,
    usageCount: r.usageCount || 0,
  }));
}

/**
 * Extract knowledge from resolved cases
 */
export async function extractKnowledgeFromCases(): Promise<void> {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) return;

  const { cases } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');

  // Get all resolved cases
  const resolvedCases = await db
    .select()
    .from(cases)
    .where(eq(cases.status, 'RESOLVED'));

  // Analyze patterns
  const patterns = analyzePatterns(resolvedCases);

  // Store learned patterns
  for (const pattern of patterns) {
    await addKnowledgeEntry({
      category: 'AI_LEARNED',
      title: `Pattern: ${pattern.pattern}`,
      content: `Identified pattern with ${pattern.frequency} occurrences and ${(pattern.successRate * 100).toFixed(1)}% success rate. Average recovery: $${pattern.avgRecoveryAmount.toFixed(2)}`,
      tags: ['pattern', 'automated', 'ai-learned'],
      metadata: {
        frequency: pattern.frequency,
        successRate: pattern.successRate,
        avgRecoveryAmount: pattern.avgRecoveryAmount,
        recommendedActions: pattern.recommendedActions,
      },
      successRate: pattern.successRate,
    });
  }
}

/**
 * Analyze patterns from case data
 */
function analyzePatterns(cases: any[]): CasePattern[] {
  const patterns: Map<string, any> = new Map();

  for (const caseData of cases) {
    // Pattern by carrier + issue type
    const key = `${caseData.carrier}-${caseData.issueType || 'UNKNOWN'}`;
    
    if (!patterns.has(key)) {
      patterns.set(key, {
        pattern: key,
        frequency: 0,
        totalRecovered: 0,
        successCount: 0,
        actions: new Set(),
      });
    }

    const p = patterns.get(key);
    p.frequency++;
    p.totalRecovered += caseData.recoveredAmount || 0;
    if (caseData.recoveredAmount > 0) p.successCount++;
  }

  return Array.from(patterns.values()).map(p => ({
    pattern: p.pattern,
    frequency: p.frequency,
    successRate: p.frequency > 0 ? p.successCount / p.frequency : 0,
    avgRecoveryAmount: p.frequency > 0 ? p.totalRecovered / p.frequency / 100 : 0,
    recommendedActions: Array.from(p.actions),
  }));
}

/**
 * Get success probability for new case
 */
export async function predictCaseSuccess(caseData: {
  carrier: string;
  issueType?: string;
  claimedAmount: number;
}): Promise<{
  probability: number;
  confidence: number;
  similarCases: number;
  avgRecoveryAmount: number;
}> {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) {
    return { probability: 0.5, confidence: 0, similarCases: 0, avgRecoveryAmount: 0 };
  }

  const { cases } = await import('../../drizzle/schema');
  const { eq, and, gte, lte } = await import('drizzle-orm');

  // Find similar cases
  const conditions = [eq(cases.carrier, caseData.carrier as any)];
  
  if (caseData.issueType) {
    conditions.push(eq(cases.issueType, caseData.issueType as any));
  }

  // Similar amount range (±30%)
  const amountMin = caseData.claimedAmount * 0.7;
  const amountMax = caseData.claimedAmount * 1.3;
  conditions.push(gte(cases.claimedAmount, Math.floor(amountMin)));
  conditions.push(lte(cases.claimedAmount, Math.ceil(amountMax)));

  const similarCases = await db
    .select()
    .from(cases)
    .where(and(...conditions));

  if (similarCases.length === 0) {
    return { probability: 0.5, confidence: 0, similarCases: 0, avgRecoveryAmount: 0 };
  }

  const successful = similarCases.filter(c => c.recoveredAmount > 0).length;
  const totalRecovered = similarCases.reduce((sum, c) => sum + (c.recoveredAmount || 0), 0);

  return {
    probability: successful / similarCases.length,
    confidence: Math.min(similarCases.length / 20, 1), // Max confidence at 20+ cases
    similarCases: similarCases.length,
    avgRecoveryAmount: totalRecovered / similarCases.length / 100,
  };
}

/**
 * Get AI-powered case recommendations
 */
export async function getCaseRecommendations(caseId: number): Promise<{
  recommendedActions: string[];
  similarSuccessfulCases: any[];
  estimatedRecovery: number;
  confidence: number;
}> {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) {
    return { recommendedActions: [], similarSuccessfulCases: [], estimatedRecovery: 0, confidence: 0 };
  }

  const { cases } = await import('../../drizzle/schema');
  const { eq } = await import('drizzle-orm');

  const [caseData] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseData) {
    return { recommendedActions: [], similarSuccessfulCases: [], estimatedRecovery: 0, confidence: 0 };
  }

  // Get prediction
  const prediction = await predictCaseSuccess({
    carrier: caseData.carrier,
    issueType: caseData.issueType || undefined,
    claimedAmount: caseData.claimedAmount,
  });

  // Search knowledge base for relevant strategies
  const knowledgeEntries = await searchKnowledgeBase(
    `${caseData.carrier} ${caseData.issueType || ''}`,
    'AI_LEARNED',
    5
  );

  const recommendedActions: string[] = [];
  
  // Add actions from knowledge base
  for (const entry of knowledgeEntries) {
    if (entry.metadata?.recommendedActions) {
      recommendedActions.push(...entry.metadata.recommendedActions);
    }
  }

  // Add generic recommendations based on case type
  if (caseData.issueType === 'OVERCHARGE') {
    recommendedActions.push('Request detailed invoice breakdown');
    recommendedActions.push('Compare with quoted rate');
    recommendedActions.push('Check for unauthorized surcharges');
  } else if (caseData.issueType === 'DELIVERY_GUARANTEE') {
    recommendedActions.push('Verify delivery guarantee terms');
    recommendedActions.push('Document actual delivery time');
    recommendedActions.push('Request full refund per carrier policy');
  }

  return {
    recommendedActions: [...new Set(recommendedActions)].slice(0, 5),
    similarSuccessfulCases: [],
    estimatedRecovery: prediction.avgRecoveryAmount,
    confidence: prediction.confidence,
  };
}

/**
 * Update knowledge entry usage
 */
export async function trackKnowledgeUsage(entryId: number): Promise<void> {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) return;

  const { knowledgeBase } = await import('../../drizzle/schema');
  const { eq, sql } = await import('drizzle-orm');

  await db
    .update(knowledgeBase)
    .set({ usageCount: sql`${knowledgeBase.usageCount} + 1` })
    .where(eq(knowledgeBase.id, entryId));
}

/**
 * Get knowledge base statistics
 */
export async function getKnowledgeBaseStats(): Promise<{
  totalEntries: number;
  byCategory: Record<string, number>;
  topEntries: KnowledgeEntry[];
}> {
  const { getDb } = await import('../db');
  const db = await getDb();
  if (!db) {
    return { totalEntries: 0, byCategory: {}, topEntries: [] };
  }

  const { knowledgeBase } = await import('../../drizzle/schema');
  const { desc } = await import('drizzle-orm');

  const allEntries = await db.select().from(knowledgeBase);
  
  const byCategory: Record<string, number> = {};
  for (const entry of allEntries) {
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
  }

  const topEntries = await db
    .select()
    .from(knowledgeBase)
    .orderBy(desc(knowledgeBase.usageCount))
    .limit(10);

  return {
    totalEntries: allEntries.length,
    byCategory,
    topEntries: topEntries.map(r => ({
      id: r.id,
      category: r.category as any,
      title: r.title,
      content: r.content,
      tags: r.tags?.split(',') || [],
      metadata: r.metadata ? JSON.parse(r.metadata as string) : {},
      relevanceScore: r.relevanceScore || 0,
      successRate: r.successRate || 0,
      usageCount: r.usageCount || 0,
    })),
  };
}
