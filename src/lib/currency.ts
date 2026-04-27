// Pure currency conversion functions - safe to import from client components

import type { CurrencyCode } from '@/types/database';

export function convertToILS(
  amount: number,
  currency: CurrencyCode,
  rate: number
): number {
  if (currency === 'ILS') return amount;
  return Math.round(amount * rate * 100) / 100;
}

export function convertToUSD(
  amountIls: number,
  rate: number
): number {
  if (rate === 0) return 0;
  return Math.round((amountIls / rate) * 100) / 100;
}

export function currencySymbol(currency: CurrencyCode): string {
  switch (currency) {
    case 'ILS': return '\u20AA';
    case 'USD': return '$';
    case 'GBP': return '\u00A3';
  }
}
