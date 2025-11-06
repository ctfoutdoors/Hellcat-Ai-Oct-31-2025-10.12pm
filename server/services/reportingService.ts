/**
 * Reporting Service
 * 
 * Generates comprehensive reports and analytics exports
 */

interface ReportOptions {
  startDate?: Date;
  endDate?: Date;
  carrier?: string;
  status?: string;
  format?: 'JSON' | 'CSV' | 'PDF';
}

interface CaseReport {
  summary: {
    totalCases: number;
    totalClaimed: number;
    totalRecovered: number;
    successRate: number;
    averageClaimAmount: number;
    averageRecoveryTime: number;
  };
  byCarrier: Array<{
    carrier: string;
    cases: number;
    claimed: number;
    recovered: number;
    successRate: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
    avgResolutionDays: number;
  }>;
  timeline: Array<{
    month: string;
    casesFiled: number;
    casesResolved: number;
    amountRecovered: number;
  }>;
}

/**
 * Generate comprehensive case report
 */
export async function generateCaseReport(
  cases: any[],
  options: ReportOptions = {}
): Promise<CaseReport> {
  // Filter cases by date range
  let filteredCases = cases;
  
  if (options.startDate) {
    filteredCases = filteredCases.filter(c => 
      new Date(c.createdAt) >= options.startDate!
    );
  }
  
  if (options.endDate) {
    filteredCases = filteredCases.filter(c => 
      new Date(c.createdAt) <= options.endDate!
    );
  }
  
  if (options.carrier) {
    filteredCases = filteredCases.filter(c => c.carrier === options.carrier);
  }
  
  if (options.status) {
    filteredCases = filteredCases.filter(c => c.status === options.status);
  }

  // Calculate summary metrics
  const totalCases = filteredCases.length;
  const totalClaimed = filteredCases.reduce((sum, c) => sum + (c.claimedAmount || 0), 0);
  const resolvedCases = filteredCases.filter(c => c.status === 'RESOLVED');
  const totalRecovered = resolvedCases.reduce((sum, c) => sum + (c.recoveredAmount || 0), 0);
  const successRate = totalCases > 0 ? (resolvedCases.length / totalCases) * 100 : 0;
  const averageClaimAmount = totalCases > 0 ? totalClaimed / totalCases : 0;
  
  // Calculate average recovery time
  const recoveryTimes = resolvedCases
    .filter(c => c.resolvedAt && c.createdAt)
    .map(c => {
      const created = new Date(c.createdAt).getTime();
      const resolved = new Date(c.resolvedAt).getTime();
      return (resolved - created) / (1000 * 60 * 60 * 24); // days
    });
  const averageRecoveryTime = recoveryTimes.length > 0
    ? recoveryTimes.reduce((sum, t) => sum + t, 0) / recoveryTimes.length
    : 0;

  // Group by carrier
  const carrierMap = new Map<string, any[]>();
  filteredCases.forEach(c => {
    if (!carrierMap.has(c.carrier)) {
      carrierMap.set(c.carrier, []);
    }
    carrierMap.get(c.carrier)!.push(c);
  });

  const byCarrier = Array.from(carrierMap.entries()).map(([carrier, cases]) => {
    const claimed = cases.reduce((sum, c) => sum + (c.claimedAmount || 0), 0);
    const resolved = cases.filter(c => c.status === 'RESOLVED');
    const recovered = resolved.reduce((sum, c) => sum + (c.recoveredAmount || 0), 0);
    
    return {
      carrier,
      cases: cases.length,
      claimed,
      recovered,
      successRate: cases.length > 0 ? (resolved.length / cases.length) * 100 : 0,
    };
  });

  // Group by status
  const statusMap = new Map<string, number>();
  filteredCases.forEach(c => {
    statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1);
  });

  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: totalCases > 0 ? (count / totalCases) * 100 : 0,
  }));

  // Group by priority
  const priorityMap = new Map<string, any[]>();
  filteredCases.forEach(c => {
    if (!priorityMap.has(c.priority)) {
      priorityMap.set(c.priority, []);
    }
    priorityMap.get(c.priority)!.push(c);
  });

  const byPriority = Array.from(priorityMap.entries()).map(([priority, cases]) => {
    const resolvedInPriority = cases.filter(c => c.status === 'RESOLVED' && c.resolvedAt);
    const resolutionTimes = resolvedInPriority.map(c => {
      const created = new Date(c.createdAt).getTime();
      const resolved = new Date(c.resolvedAt).getTime();
      return (resolved - created) / (1000 * 60 * 60 * 24);
    });
    
    return {
      priority,
      count: cases.length,
      avgResolutionDays: resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
        : 0,
    };
  });

  // Generate timeline (monthly)
  const timelineMap = new Map<string, any>();
  filteredCases.forEach(c => {
    const date = new Date(c.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!timelineMap.has(monthKey)) {
      timelineMap.set(monthKey, {
        month: monthKey,
        casesFiled: 0,
        casesResolved: 0,
        amountRecovered: 0,
      });
    }
    
    const entry = timelineMap.get(monthKey);
    entry.casesFiled++;
    
    if (c.status === 'RESOLVED') {
      entry.casesResolved++;
      entry.amountRecovered += c.recoveredAmount || 0;
    }
  });

  const timeline = Array.from(timelineMap.values()).sort((a, b) => 
    a.month.localeCompare(b.month)
  );

  return {
    summary: {
      totalCases,
      totalClaimed,
      totalRecovered,
      successRate,
      averageClaimAmount,
      averageRecoveryTime,
    },
    byCarrier,
    byStatus,
    byPriority,
    timeline,
  };
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(report: CaseReport): string {
  const lines: string[] = [];
  
  // Summary section
  lines.push('SUMMARY');
  lines.push('Metric,Value');
  lines.push(`Total Cases,${report.summary.totalCases}`);
  lines.push(`Total Claimed,$${(report.summary.totalClaimed / 100).toFixed(2)}`);
  lines.push(`Total Recovered,$${(report.summary.totalRecovered / 100).toFixed(2)}`);
  lines.push(`Success Rate,${report.summary.successRate.toFixed(1)}%`);
  lines.push(`Average Claim Amount,$${(report.summary.averageClaimAmount / 100).toFixed(2)}`);
  lines.push(`Average Recovery Time,${report.summary.averageRecoveryTime.toFixed(1)} days`);
  lines.push('');
  
  // By Carrier section
  lines.push('BY CARRIER');
  lines.push('Carrier,Cases,Claimed,Recovered,Success Rate');
  report.byCarrier.forEach(c => {
    lines.push(`${c.carrier},${c.cases},$${(c.claimed / 100).toFixed(2)},$${(c.recovered / 100).toFixed(2)},${c.successRate.toFixed(1)}%`);
  });
  lines.push('');
  
  // By Status section
  lines.push('BY STATUS');
  lines.push('Status,Count,Percentage');
  report.byStatus.forEach(s => {
    lines.push(`${s.status},${s.count},${s.percentage.toFixed(1)}%`);
  });
  lines.push('');
  
  // Timeline section
  lines.push('TIMELINE');
  lines.push('Month,Cases Filed,Cases Resolved,Amount Recovered');
  report.timeline.forEach(t => {
    lines.push(`${t.month},${t.casesFiled},${t.casesResolved},$${(t.amountRecovered / 100).toFixed(2)}`);
  });
  
  return lines.join('\n');
}

/**
 * Generate PDF report (placeholder - would use a PDF library)
 */
export async function exportReportToPDF(report: CaseReport): Promise<Buffer> {
  // This would use a library like pdfkit or puppeteer
  // For now, return placeholder
  return Buffer.from('PDF report would be generated here');
}

/**
 * Generate carrier performance report
 */
export function generateCarrierPerformanceReport(cases: any[]): any {
  const carrierStats = new Map<string, any>();
  
  cases.forEach(c => {
    if (!carrierStats.has(c.carrier)) {
      carrierStats.set(c.carrier, {
        carrier: c.carrier,
        totalCases: 0,
        resolved: 0,
        rejected: 0,
        pending: 0,
        totalClaimed: 0,
        totalRecovered: 0,
        avgResponseTime: 0,
        responseTimes: [],
      });
    }
    
    const stats = carrierStats.get(c.carrier);
    stats.totalCases++;
    stats.totalClaimed += c.claimedAmount || 0;
    
    if (c.status === 'RESOLVED') {
      stats.resolved++;
      stats.totalRecovered += c.recoveredAmount || 0;
      
      if (c.resolvedAt && c.createdAt) {
        const responseTime = (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        stats.responseTimes.push(responseTime);
      }
    } else if (c.status === 'REJECTED') {
      stats.rejected++;
    } else {
      stats.pending++;
    }
  });
  
  // Calculate averages
  Array.from(carrierStats.values()).forEach(stats => {
    if (stats.responseTimes.length > 0) {
      stats.avgResponseTime = stats.responseTimes.reduce((sum: number, t: number) => sum + t, 0) / stats.responseTimes.length;
    }
    delete stats.responseTimes;
    
    stats.successRate = stats.totalCases > 0 ? (stats.resolved / stats.totalCases) * 100 : 0;
    stats.recoveryRate = stats.totalClaimed > 0 ? (stats.totalRecovered / stats.totalClaimed) * 100 : 0;
  });
  
  return Array.from(carrierStats.values());
}
