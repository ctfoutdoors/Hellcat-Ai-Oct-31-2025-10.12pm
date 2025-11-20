import { getDb } from '../db';
import { cases } from '../../drizzle/schema';
import { and, eq, gte, lte, sql, count, sum, avg } from 'drizzle-orm';

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  carrier?: string;
  caseType?: string;
  status?: string;
}

export interface CarrierMetrics {
  carrier: string;
  totalCases: number;
  resolvedCases: number;
  wonCases: number;
  lostCases: number;
  totalClaimed: number;
  totalRecovered: number;
  recoveryRate: number;
  successRate: number;
  avgResolutionDays: number;
}

export interface CaseTypeMetrics {
  caseType: string;
  totalCases: number;
  wonCases: number;
  successRate: number;
  avgClaimAmount: number;
  avgRecoveredAmount: number;
}

export interface OverallMetrics {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  wonCases: number;
  lostCases: number;
  totalClaimed: number;
  totalRecovered: number;
  overallRecoveryRate: number;
  overallSuccessRate: number;
  avgResolutionDays: number;
  roi: number; // Return on Investment percentage
}

/**
 * Get overall analytics metrics
 */
export async function getOverallMetrics(filters: AnalyticsFilters = {}): Promise<OverallMetrics> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = buildConditions(filters);

  // Get basic counts
  const [metrics] = await db
    .select({
      totalCases: count(),
      totalClaimed: sum(cases.claimAmount),
      totalRecovered: sum(cases.recoveredAmount),
    })
    .from(cases)
    .where(conditions ? and(...conditions) : undefined);

  // Get status-specific counts
  const [activeCases] = await db
    .select({ count: count() })
    .from(cases)
    .where(
      and(
        ...conditions,
        sql`${cases.status} NOT IN ('resolved_won', 'resolved_lost', 'closed')`
      )
    );

  const [resolvedCases] = await db
    .select({ count: count() })
    .from(cases)
    .where(
      and(
        ...conditions,
        sql`${cases.status} IN ('resolved_won', 'resolved_lost')`
      )
    );

  const [wonCases] = await db
    .select({ count: count() })
    .from(cases)
    .where(and(...conditions, eq(cases.status, 'resolved_won')));

  const [lostCases] = await db
    .select({ count: count() })
    .from(cases)
    .where(and(...conditions, eq(cases.status, 'resolved_lost')));

  // Calculate resolution time for resolved cases
  const resolvedWithDates = await db
    .select({
      createdAt: cases.createdAt,
      resolvedAt: cases.resolvedAt,
    })
    .from(cases)
    .where(
      and(
        ...conditions,
        sql`${cases.status} IN ('resolved_won', 'resolved_lost')`,
        sql`${cases.resolvedAt} IS NOT NULL`
      )
    );

  let avgResolutionDays = 0;
  if (resolvedWithDates.length > 0) {
    const totalDays = resolvedWithDates.reduce((sum, case_) => {
      const days = Math.floor(
        (new Date(case_.resolvedAt!).getTime() - new Date(case_.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    avgResolutionDays = Math.round(totalDays / resolvedWithDates.length);
  }

  const totalClaimed = Number(metrics.totalClaimed || 0);
  const totalRecovered = Number(metrics.totalRecovered || 0);
  const recoveryRate = totalClaimed > 0 ? (totalRecovered / totalClaimed) * 100 : 0;
  const successRate =
    resolvedCases.count > 0 ? (wonCases.count / resolvedCases.count) * 100 : 0;
  const roi = totalClaimed > 0 ? ((totalRecovered - totalClaimed) / totalClaimed) * 100 : 0;

  return {
    totalCases: metrics.totalCases,
    activeCases: activeCases.count,
    resolvedCases: resolvedCases.count,
    wonCases: wonCases.count,
    lostCases: lostCases.count,
    totalClaimed,
    totalRecovered,
    overallRecoveryRate: Math.round(recoveryRate * 100) / 100,
    overallSuccessRate: Math.round(successRate * 100) / 100,
    avgResolutionDays,
    roi: Math.round(roi * 100) / 100,
  };
}

/**
 * Get metrics by carrier
 */
export async function getCarrierMetrics(filters: AnalyticsFilters = {}): Promise<CarrierMetrics[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = buildConditions(filters);

  // Get all carriers with their metrics
  const carrierData = await db
    .select({
      carrier: cases.carrier,
      totalCases: count(),
      totalClaimed: sum(cases.claimAmount),
      totalRecovered: sum(cases.recoveredAmount),
    })
    .from(cases)
    .where(conditions ? and(...conditions) : undefined)
    .groupBy(cases.carrier);

  const metrics: CarrierMetrics[] = [];

  for (const data of carrierData) {
    if (!data.carrier) continue;

    // Get resolved, won, and lost counts for this carrier
    const [resolved] = await db
      .select({ count: count() })
      .from(cases)
      .where(
        and(
          ...conditions,
          eq(cases.carrier, data.carrier),
          sql`${cases.status} IN ('resolved_won', 'resolved_lost')`
        )
      );

    const [won] = await db
      .select({ count: count() })
      .from(cases)
      .where(and(...conditions, eq(cases.carrier, data.carrier), eq(cases.status, 'resolved_won')));

    const [lost] = await db
      .select({ count: count() })
      .from(cases)
      .where(
        and(...conditions, eq(cases.carrier, data.carrier), eq(cases.status, 'resolved_lost'))
      );

    // Calculate avg resolution time
    const resolvedWithDates = await db
      .select({
        createdAt: cases.createdAt,
        resolvedAt: cases.resolvedAt,
      })
      .from(cases)
      .where(
        and(
          ...conditions,
          eq(cases.carrier, data.carrier),
          sql`${cases.status} IN ('resolved_won', 'resolved_lost')`,
          sql`${cases.resolvedAt} IS NOT NULL`
        )
      );

    let avgResolutionDays = 0;
    if (resolvedWithDates.length > 0) {
      const totalDays = resolvedWithDates.reduce((sum, case_) => {
        const days = Math.floor(
          (new Date(case_.resolvedAt!).getTime() - new Date(case_.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgResolutionDays = Math.round(totalDays / resolvedWithDates.length);
    }

    const totalClaimed = Number(data.totalClaimed || 0);
    const totalRecovered = Number(data.totalRecovered || 0);
    const recoveryRate = totalClaimed > 0 ? (totalRecovered / totalClaimed) * 100 : 0;
    const successRate = resolved.count > 0 ? (won.count / resolved.count) * 100 : 0;

    metrics.push({
      carrier: data.carrier,
      totalCases: data.totalCases,
      resolvedCases: resolved.count,
      wonCases: won.count,
      lostCases: lost.count,
      totalClaimed,
      totalRecovered,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      avgResolutionDays,
    });
  }

  return metrics.sort((a, b) => b.totalCases - a.totalCases);
}

/**
 * Get metrics by case type
 */
export async function getCaseTypeMetrics(
  filters: AnalyticsFilters = {}
): Promise<CaseTypeMetrics[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const conditions = buildConditions(filters);

  const caseTypeData = await db
    .select({
      caseType: cases.caseType,
      totalCases: count(),
      avgClaimAmount: avg(cases.claimAmount),
      avgRecoveredAmount: avg(cases.recoveredAmount),
    })
    .from(cases)
    .where(conditions ? and(...conditions) : undefined)
    .groupBy(cases.caseType);

  const metrics: CaseTypeMetrics[] = [];

  for (const data of caseTypeData) {
    const [won] = await db
      .select({ count: count() })
      .from(cases)
      .where(and(...conditions, eq(cases.caseType, data.caseType), eq(cases.status, 'resolved_won')));

    const [resolved] = await db
      .select({ count: count() })
      .from(cases)
      .where(
        and(
          ...conditions,
          eq(cases.caseType, data.caseType),
          sql`${cases.status} IN ('resolved_won', 'resolved_lost')`
        )
      );

    const successRate = resolved.count > 0 ? (won.count / resolved.count) * 100 : 0;

    metrics.push({
      caseType: data.caseType,
      totalCases: data.totalCases,
      wonCases: won.count,
      successRate: Math.round(successRate * 100) / 100,
      avgClaimAmount: Math.round(Number(data.avgClaimAmount || 0) * 100) / 100,
      avgRecoveredAmount: Math.round(Number(data.avgRecoveredAmount || 0) * 100) / 100,
    });
  }

  return metrics.sort((a, b) => b.totalCases - a.totalCases);
}

/**
 * Build SQL conditions from filters
 */
function buildConditions(filters: AnalyticsFilters) {
  const conditions: any[] = [];

  if (filters.startDate) {
    conditions.push(gte(cases.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(cases.createdAt, filters.endDate));
  }

  if (filters.carrier) {
    conditions.push(eq(cases.carrier, filters.carrier));
  }

  if (filters.caseType) {
    conditions.push(eq(cases.caseType, filters.caseType));
  }

  if (filters.status) {
    conditions.push(eq(cases.status, filters.status as any));
  }

  return conditions.length > 0 ? conditions : null;
}
