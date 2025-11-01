/**
 * Delivery Guarantee Monitoring Service
 * 
 * Automatically monitors shipments for missed delivery guarantees and creates cases
 */

interface ShipmentData {
  trackingNumber: string;
  carrier: string;
  serviceType: string;
  shipDate: Date;
  promisedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  shippingCost: number;
}

interface GuaranteeViolation {
  trackingNumber: string;
  carrier: string;
  serviceType: string;
  promisedDate: Date;
  actualDate: Date;
  daysLate: number;
  refundAmount: number;
  reason: string;
}

/**
 * Check if a shipment violated its delivery guarantee
 */
export function checkDeliveryGuarantee(shipment: ShipmentData): GuaranteeViolation | null {
  if (!shipment.actualDeliveryDate) {
    // Not yet delivered
    return null;
  }

  const promisedTime = shipment.promisedDeliveryDate.getTime();
  const actualTime = shipment.actualDeliveryDate.getTime();

  if (actualTime <= promisedTime) {
    // Delivered on time
    return null;
  }

  const daysLate = Math.ceil((actualTime - promisedTime) / (1000 * 60 * 60 * 24));

  // Determine refund amount based on carrier and service type
  const refundAmount = calculateRefundAmount(shipment);

  return {
    trackingNumber: shipment.trackingNumber,
    carrier: shipment.carrier,
    serviceType: shipment.serviceType,
    promisedDate: shipment.promisedDeliveryDate,
    actualDate: shipment.actualDeliveryDate,
    daysLate,
    refundAmount,
    reason: `Package delivered ${daysLate} day(s) late. ${shipment.serviceType} guarantee was missed.`,
  };
}

/**
 * Calculate refund amount based on carrier policies
 */
function calculateRefundAmount(shipment: ShipmentData): number {
  const { carrier, serviceType, shippingCost } = shipment;

  // Most carriers offer full shipping cost refund for missed guarantees
  // Some exceptions apply (weather, force majeure, etc.)
  
  if (carrier === 'FEDEX') {
    // FedEx typically refunds full shipping cost for Express services
    if (serviceType.includes('Express') || serviceType.includes('Priority')) {
      return shippingCost;
    }
  }

  if (carrier === 'UPS') {
    // UPS Next Day Air, 2nd Day Air, 3 Day Select have money-back guarantee
    if (serviceType.includes('Next Day') || serviceType.includes('2nd Day') || serviceType.includes('3 Day')) {
      return shippingCost;
    }
  }

  if (carrier === 'USPS') {
    // USPS Priority Mail Express has money-back guarantee
    if (serviceType.includes('Express')) {
      return shippingCost;
    }
  }

  // Default: full refund for guaranteed services
  return shippingCost;
}

/**
 * Monitor shipments and auto-create cases for guarantee violations
 */
export async function monitorDeliveryGuarantees(shipments: ShipmentData[]): Promise<GuaranteeViolation[]> {
  const violations: GuaranteeViolation[] = [];

  for (const shipment of shipments) {
    const violation = checkDeliveryGuarantee(shipment);
    if (violation) {
      violations.push(violation);
    }
  }

  return violations;
}

/**
 * Auto-create case from delivery guarantee violation
 */
export async function createCaseFromViolation(
  violation: GuaranteeViolation,
  createCase: (data: any) => Promise<any>
): Promise<void> {
  await createCase({
    trackingId: violation.trackingNumber,
    carrier: violation.carrier,
    claimedAmount: violation.refundAmount,
    disputeType: 'DELIVERY_GUARANTEE',
    status: 'OPEN',
    priority: 'HIGH',
    notes: `AUTO-CREATED: ${violation.reason}`,
    serviceType: violation.serviceType,
  });
}
