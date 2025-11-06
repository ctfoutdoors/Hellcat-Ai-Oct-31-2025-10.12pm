/**
 * Carrier tracking URL generators
 * Generates direct links to carrier tracking pages
 */

export type Carrier = 'FEDEX' | 'UPS' | 'USPS' | 'DHL' | 'OTHER';

export function getTrackingUrl(carrier: Carrier, trackingNumber: string): string {
  const tracking = encodeURIComponent(trackingNumber.trim());
  
  switch (carrier) {
    case 'FEDEX':
      return `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${tracking}`;
    
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    
    case 'DHL':
      return `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`;
    
    case 'OTHER':
    default:
      // Generic Google search for tracking number
      return `https://www.google.com/search?q=${tracking}+tracking`;
  }
}

/**
 * Standard box sizes used by the company
 * Dimensions in inches (L x W x H)
 * Note: Fishing line products use these small tube sizes exclusively
 */
export const STANDARD_BOX_SIZES = [
  {
    name: 'Small Tube',
    dimensions: '9 x 2 x 2',
    length: 9,
    width: 2,
    height: 2,
    volumeCubicInches: 36,
    description: '9 inches x 2 inches x 2 inches',
    usage: 'Common for fishing line products',
    shipsVia: ['FEDEX', 'UPS', 'USPS']
  },
  {
    name: 'Medium Tube (3.45")',
    dimensions: '9 x 3.45 x 3.45',
    length: 9,
    width: 3.45,
    height: 3.45,
    volumeCubicInches: 107.1,
    description: '9 inches x 3.45 inches x 3.45 inches (often rounded to 4x4)',
    usage: 'Common for fishing line products',
    shipsVia: ['FEDEX', 'UPS', 'USPS']
  },
  {
    name: 'Medium Tube (4")',
    dimensions: '9 x 4 x 4',
    length: 9,
    width: 4,
    height: 4,
    volumeCubicInches: 144,
    description: '9 inches x 4 inches x 4 inches',
    usage: 'Common for fishing line products',
    shipsVia: ['FEDEX', 'UPS', 'USPS']
  },
  {
    name: 'Large Tube (5")',
    dimensions: '9 x 5 x 5',
    length: 9,
    width: 5,
    height: 5,
    volumeCubicInches: 225,
    description: '9 inches x 5 inches x 5 inches',
    usage: 'Rarely used - wholesale only, NOT shipped via FedEx',
    shipsVia: ['UPS', 'FREIGHT']
  },
  {
    name: 'Extra Large Tube (6")',
    dimensions: '9 x 6 x 6',
    length: 9,
    width: 6,
    height: 6,
    volumeCubicInches: 324,
    description: '9 inches x 6 inches x 6 inches',
    usage: 'Rarely used - wholesale only, NOT shipped via FedEx',
    shipsVia: ['UPS', 'FREIGHT']
  }
] as const;

/**
 * Get standard box sizes that are commonly shipped via a specific carrier
 */
export function getBoxSizesForCarrier(carrier: Carrier) {
  return STANDARD_BOX_SIZES.filter(box => 
    box.shipsVia.includes(carrier) || box.shipsVia.includes('ALL' as any)
  );
}

/**
 * Find the closest standard box size based on dimensions
 */
export function findClosestBoxSize(length: number, width: number, height: number) {
  let closest = STANDARD_BOX_SIZES[0];
  let minDiff = Infinity;
  
  for (const box of STANDARD_BOX_SIZES) {
    const diff = Math.abs(box.length - length) + 
                 Math.abs(box.width - width) + 
                 Math.abs(box.height - height);
    
    if (diff < minDiff) {
      minDiff = diff;
      closest = box;
    }
  }
  
  return { box: closest, difference: minDiff };
}

/**
 * Check if dimensions match any standard box size (within tolerance)
 */
export function matchesStandardSize(
  length: number, 
  width: number, 
  height: number, 
  toleranceInches: number = 0.5
): { matches: boolean; box?: typeof STANDARD_BOX_SIZES[number]; difference?: number } {
  for (const box of STANDARD_BOX_SIZES) {
    const diff = Math.abs(box.length - length) + 
                 Math.abs(box.width - width) + 
                 Math.abs(box.height - height);
    
    if (diff <= toleranceInches) {
      return { matches: true, box, difference: diff };
    }
  }
  
  const closest = findClosestBoxSize(length, width, height);
  return { matches: false, box: closest.box, difference: closest.difference };
}

/**
 * Parse dimension string (e.g., "9 x 2 x 2" or "9x2x2" or "231.14 x 12.70 x 12.70 cm")
 * Returns dimensions in inches
 */
export function parseDimensions(dimString: string): { 
  length: number; 
  width: number; 
  height: number;
  unit: 'in' | 'cm';
  original: string;
} | null {
  const cleaned = dimString.trim().toLowerCase();
  
  // Check if it's in centimeters
  const isCm = cleaned.includes('cm') || cleaned.includes('centimeter');
  const unit = isCm ? 'cm' : 'in';
  
  // Extract numbers
  const match = cleaned.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/);
  
  if (!match) return null;
  
  let length = parseFloat(match[1]);
  let width = parseFloat(match[2]);
  let height = parseFloat(match[3]);
  
  // Convert cm to inches if needed
  if (isCm) {
    length = length / 2.54;
    width = width / 2.54;
    height = height / 2.54;
  }
  
  return {
    length,
    width,
    height,
    unit,
    original: dimString
  };
}

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Format dimensions for display
 */
export function formatDimensions(length: number, width: number, height: number, unit: 'in' | 'cm' = 'in'): string {
  if (unit === 'cm') {
    return `${(length * 2.54).toFixed(2)} x ${(width * 2.54).toFixed(2)} x ${(height * 2.54).toFixed(2)} cm`;
  }
  return `${length} x ${width} x ${height} in`;
}
