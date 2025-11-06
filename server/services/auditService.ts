/**
 * Shipment Auditing Service
 * 
 * Automatically detects overcharges and undercharges by comparing quoted vs actual rates
 */

interface ShipmentAuditData {
  trackingNumber: string;
  carrier: string;
  serviceType: string;
  quotedRate: number;
  actualRate: number;
  weight: number;
  declaredWeight?: number;
  dimensions?: string;
  declaredDimensions?: string;
  zone?: string;
  shipDate: Date;
}

interface AuditResult {
  trackingNumber: string;
  carrier: string;
  discrepancyType: 'OVERCHARGE' | 'UNDERCHARGE' | 'NONE';
  quotedRate: number;
  actualRate: number;
  difference: number;
  differencePercent: number;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autoCreateCase: boolean;
}

/**
 * Audit a single shipment for rate discrepancies
 */
export function auditShipment(shipment: ShipmentAuditData): AuditResult {
  const difference = shipment.actualRate - shipment.quotedRate;
  const differencePercent = (difference / shipment.quotedRate) * 100;
  
  let discrepancyType: 'OVERCHARGE' | 'UNDERCHARGE' | 'NONE' = 'NONE';
  let reason = '';
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let autoCreateCase = false;

  // No discrepancy if within 1% tolerance
  if (Math.abs(differencePercent) < 1) {
    return {
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      discrepancyType: 'NONE',
      quotedRate: shipment.quotedRate,
      actualRate: shipment.actualRate,
      difference: 0,
      differencePercent: 0,
      reason: 'Rate matches quote within tolerance',
      severity: 'LOW',
      autoCreateCase: false,
    };
  }

  if (difference > 0) {
    discrepancyType = 'OVERCHARGE';
    
    // Determine reason for overcharge
    if (shipment.declaredWeight && shipment.weight > shipment.declaredWeight) {
      reason = `Weight discrepancy: Actual ${shipment.weight} lbs vs Declared ${shipment.declaredWeight} lbs`;
      severity = difference > 10 ? 'HIGH' : 'MEDIUM';
      autoCreateCase = difference > 5;
    } else if (shipment.declaredDimensions && shipment.dimensions !== shipment.declaredDimensions) {
      reason = `Dimensional weight adjustment: ${shipment.dimensions} vs ${shipment.declaredDimensions}`;
      severity = difference > 15 ? 'CRITICAL' : 'HIGH';
      autoCreateCase = difference > 10;
    } else if (differencePercent > 50) {
      reason = `Significant rate increase: ${differencePercent.toFixed(1)}% over quote`;
      severity = 'CRITICAL';
      autoCreateCase = true;
    } else if (differencePercent > 20) {
      reason = `Rate increase: ${differencePercent.toFixed(1)}% over quote`;
      severity = 'HIGH';
      autoCreateCase = difference > 20;
    } else {
      reason = `Minor rate adjustment: ${differencePercent.toFixed(1)}% over quote`;
      severity = 'MEDIUM';
      autoCreateCase = difference > 15;
    }
  } else {
    discrepancyType = 'UNDERCHARGE';
    reason = `Undercharged: ${Math.abs(differencePercent).toFixed(1)}% below quote`;
    severity = Math.abs(difference) > 20 ? 'HIGH' : 'MEDIUM';
    autoCreateCase = false; // Don't auto-create cases for undercharges
  }

  return {
    trackingNumber: shipment.trackingNumber,
    carrier: shipment.carrier,
    discrepancyType,
    quotedRate: shipment.quotedRate,
    actualRate: shipment.actualRate,
    difference,
    differencePercent,
    reason,
    severity,
    autoCreateCase,
  };
}

/**
 * Batch audit multiple shipments
 */
export function batchAuditShipments(shipments: ShipmentAuditData[]): AuditResult[] {
  return shipments.map(auditShipment);
}

/**
 * Get summary statistics from audit results
 */
export function getAuditSummary(results: AuditResult[]) {
  const totalShipments = results.length;
  const overcharges = results.filter(r => r.discrepancyType === 'OVERCHARGE');
  const undercharges = results.filter(r => r.discrepancyType === 'UNDERCHARGE');
  const noDiscrepancy = results.filter(r => r.discrepancyType === 'NONE');
  
  const totalOvercharged = overcharges.reduce((sum, r) => sum + r.difference, 0);
  const totalUndercharged = undercharges.reduce((sum, r) => sum + Math.abs(r.difference), 0);
  
  const criticalIssues = results.filter(r => r.severity === 'CRITICAL').length;
  const highIssues = results.filter(r => r.severity === 'HIGH').length;
  const mediumIssues = results.filter(r => r.severity === 'MEDIUM').length;
  
  const autoCreateCount = results.filter(r => r.autoCreateCase).length;

  return {
    totalShipments,
    overchargeCount: overcharges.length,
    underchargeCount: undercharges.length,
    noDiscrepancyCount: noDiscrepancy.length,
    totalOvercharged,
    totalUndercharged,
    netDiscrepancy: totalOvercharged - totalUndercharged,
    criticalIssues,
    highIssues,
    mediumIssues,
    autoCreateCount,
    averageOvercharge: overcharges.length > 0 ? totalOvercharged / overcharges.length : 0,
  };
}

/**
 * Filter audit results by severity
 */
export function filterBySeverity(
  results: AuditResult[],
  minSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): AuditResult[] {
  const severityOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
  const minLevel = severityOrder[minSeverity];
  
  return results.filter(r => severityOrder[r.severity] >= minLevel);
}

/**
 * Get carrier-specific audit statistics
 */
export function getCarrierStats(results: AuditResult[]) {
  const carriers = Array.from(new Set(results.map(r => r.carrier)));
  
  return carriers.map(carrier => {
    const carrierResults = results.filter(r => r.carrier === carrier);
    const overcharges = carrierResults.filter(r => r.discrepancyType === 'OVERCHARGE');
    
    return {
      carrier,
      totalShipments: carrierResults.length,
      overchargeCount: overcharges.length,
      overchargeRate: (overcharges.length / carrierResults.length) * 100,
      totalOvercharged: overcharges.reduce((sum, r) => sum + r.difference, 0),
      averageOvercharge: overcharges.length > 0 
        ? overcharges.reduce((sum, r) => sum + r.difference, 0) / overcharges.length 
        : 0,
    };
  });
}
