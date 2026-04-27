import { supabase } from './supabase';
import type { CurrencyCode } from '@/types/database';

interface ShulRateSetting {
  rate: number;
  description: string;
}

interface LiveRateSetting {
  rate: number;
  rate_gbp?: number;
  updated_at: string;
  source: string;
}

export async function getShulRate(): Promise<number> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'shul_rate')
    .single();

  if (data?.value) {
    const setting = data.value as ShulRateSetting;
    return setting.rate;
  }
  return 3.70; // fallback
}

export async function getLiveExchangeRate(): Promise<{
  rate: number;
  rateGbp: number;
  source: string;
  updatedAt: string | null;
}> {
  // First try the cached live rate from our daily cron
  const { data: cached } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'live_rate')
    .single();

  if (cached?.value) {
    const setting = cached.value as LiveRateSetting;
    // Use cached rate if it's less than 25 hours old
    const age = Date.now() - new Date(setting.updated_at).getTime();
    if (age < 25 * 60 * 60 * 1000) {
      return {
        rate: setting.rate,
        rateGbp: setting.rate_gbp ?? setting.rate * 1.27,
        source: setting.source,
        updatedAt: setting.updated_at,
      };
    }
  }

  // Otherwise fetch fresh
  try {
    const res = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { next: { revalidate: 3600 } }
    );
    const json = await res.json();
    const rateIls = json.rates?.ILS;
    const rateGbpToUsd = json.rates?.GBP; // GBP per 1 USD
    if (rateIls) {
      // GBP→ILS: 1 GBP = (1/rateGbpToUsd) USD * rateIls ILS
      const gbpToIls = rateGbpToUsd ? rateIls / rateGbpToUsd : rateIls * 1.27;
      // Cache it in settings
      await supabase.from('settings').upsert({
        key: 'live_rate',
        value: {
          rate: rateIls,
          rate_gbp: gbpToIls,
          updated_at: new Date().toISOString(),
          source: 'exchangerate-api.com',
        },
      });
      return { rate: rateIls, rateGbp: gbpToIls, source: 'exchangerate-api.com', updatedAt: new Date().toISOString() };
    }
  } catch {
    // fall through
  }

  // Final fallback to shul rate
  const shulRate = await getShulRate();
  return { rate: shulRate, rateGbp: shulRate * 1.27, source: 'shul_rate (fallback)', updatedAt: null };
}

// Re-export from currency.ts for backward compat in server code
export { convertToILS, convertToUSD, currencySymbol } from './currency';

export function getExchangeRateForCurrency(
  currency: CurrencyCode,
  usdRate: number,
  gbpRate: number
): number {
  switch (currency) {
    case 'ILS': return 1;
    case 'USD': return usdRate;
    case 'GBP': return gbpRate;
  }
}
