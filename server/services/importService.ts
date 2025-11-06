/**
 * Import Service
 * Handle CSV/Excel file parsing and bulk case import
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ImportRow {
  tracking_id?: string;
  carrier?: string;
  service_type?: string;
  original_amount?: string;
  adjusted_amount?: string;
  claimed_amount?: string;
  actual_dimensions?: string;
  carrier_dimensions?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_id?: string;
  notes?: string;
}

/**
 * Parse CSV content
 */
export function parseCSV(content: string): ImportRow[] {
  const result = Papa.parse<ImportRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }

  return result.data;
}

/**
 * Parse Excel content
 */
export function parseExcel(content: string): ImportRow[] {
  const workbook = XLSX.read(content, { type: 'binary' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = XLSX.utils.sheet_to_json<ImportRow>(worksheet, {
    header: 1,
    defval: '',
  });

  if (data.length === 0) {
    throw new Error('Excel file is empty');
  }

  // First row is headers
  const headers = (data[0] as any[]).map((h: string) => 
    h.toString().trim().toLowerCase().replace(/\s+/g, '_')
  );
  
  const rows: ImportRow[] = [];
  for (let i = 1; i < data.length; i++) {
    const row: any = {};
    const values = data[i] as any[];
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

/**
 * Parse file based on extension
 */
export function parseFile(content: string, fileName: string): ImportRow[] {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return parseCSV(content);
    case 'xlsx':
    case 'xls':
      return parseExcel(content);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

/**
 * Validate import row
 */
export function validateRow(row: ImportRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.tracking_id) {
    errors.push('Tracking ID is required');
  }

  if (!row.carrier) {
    errors.push('Carrier is required');
  }

  const validCarriers = ['FEDEX', 'UPS', 'USPS', 'DHL', 'OTHER'];
  if (row.carrier && !validCarriers.includes(row.carrier.toUpperCase())) {
    errors.push(`Invalid carrier: ${row.carrier}. Must be one of: ${validCarriers.join(', ')}`);
  }

  if (row.claimed_amount) {
    const amount = parseFloat(row.claimed_amount);
    if (isNaN(amount) || amount < 0) {
      errors.push('Claimed amount must be a positive number');
    }
  }

  if (row.customer_email && !isValidEmail(row.customer_email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Convert import row to case data
 */
export function rowToCaseData(row: ImportRow, userId: number) {
  return {
    caseNumber: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    trackingId: row.tracking_id || '',
    carrier: (row.carrier?.toUpperCase() as any) || 'OTHER',
    serviceType: row.service_type || '',
    originalAmount: parseFloat(row.original_amount || '0'),
    adjustedAmount: parseFloat(row.adjusted_amount || '0'),
    claimedAmount: parseFloat(row.claimed_amount || '0'),
    recoveredAmount: 0,
    actualDimensions: row.actual_dimensions || null,
    carrierDimensions: row.carrier_dimensions || null,
    customerName: row.customer_name || null,
    customerEmail: row.customer_email || null,
    customerPhone: row.customer_phone || null,
    orderId: row.order_id || null,
    notes: row.notes || null,
    status: 'DRAFT' as const,
    createdBy: userId,
  };
}
