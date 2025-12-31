/**
 * Formats a number with thousands separator in Spanish format
 *
 * This function always uses the thousands separator (.)
 * regardless of the number size, unlike toLocaleString which
 * only applies it for numbers >= 10,000 in Spanish locale.
 *
 * @param num - The number to format
 * @returns Formatted string with thousands separator
 *
 * @example
 * formatNumber(1995) // "1.995"
 * formatNumber(10000) // "10.000"
 * formatNumber(1234567) // "1.234.567"
 */
export function formatNumber(num: number | string): string {
  const numValue = Number(num);

  if (isNaN(numValue)) {
    return '0';
  }

  // Convert to string and split by decimal point
  const parts = numValue.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add thousands separator
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Reconstruct with decimal part if exists
  return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
}
