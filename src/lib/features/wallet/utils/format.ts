/**
 * Format a sats amount for display
 */
export function formatSats(amount: number | undefined): string {
  if (amount === undefined) return '...';
  return new Intl.NumberFormat('en-US').format(amount);
}
