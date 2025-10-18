/**
 * Currency formatting utilities for the application
 * Uses Indonesian Rupiah (IDR) as the default currency
 */

/**
 * Format a number as Indonesian Rupiah (IDR)
 * @param amount - The amount to format
 * @param options - Additional formatting options
 * @returns Formatted currency string (e.g., "Rp 50.000,00")
 */
export function formatIDR(amount: number | string, options: Intl.NumberFormatOptions = {}): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return 'Rp 0,00';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(numAmount);
}

/**
 * Format a number as Indonesian Rupiah (IDR) with decimal places
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with decimals
 */
export function formatIDRWithDecimals(amount: number | string, decimals: number = 2): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `Rp 0,${'0'.repeat(decimals)}`;
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);
}

/**
 * Legacy formatPrice function for backward compatibility
 * @deprecated Use formatIDR instead
 */
export function formatPrice(price: string | number): string {
  return formatIDR(price);
}

/**
 * Format a number without currency symbol (for use in calculations or when currency symbol is shown separately)
 * @param amount - The amount to format
 * @returns Formatted number string (e.g., "50.000")
 */
export function formatNumber(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID').format(numAmount);
}