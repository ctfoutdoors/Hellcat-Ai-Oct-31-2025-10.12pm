/**
 * Currency formatting utilities for amounts stored in cents
 */

/**
 * Format amount in cents to USD currency string
 * @param cents - Amount in cents (e.g., 725288 for $7,252.88)
 * @returns Formatted currency string (e.g., "$7,252.88")
 */
export function formatCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '$0.00';
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format amount in cents to compact currency string (e.g., "$7.3K")
 * @param cents - Amount in cents
 * @returns Compact currency string
 */
export function formatCurrencyCompact(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '$0';
  const dollars = cents / 100;
  
  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`;
  } else if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(cents);
}

/**
 * Parse currency string to cents
 * @param currencyString - Currency string (e.g., "$7,252.88" or "7252.88")
 * @returns Amount in cents
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString.replace(/[$,]/g, '');
  const dollars = parseFloat(cleaned);
  return Math.round(dollars * 100);
}
