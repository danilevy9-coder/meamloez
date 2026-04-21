import { supabase } from './supabase';

interface ShulRateSetting {
  rate: number;
  description: string;
}

interface LiveRateSetting {
  rate: number;
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
    const rate = json.rates?.ILS;
    if (rate) {
      // Cache it in settings
      await supabase.from('settings').upsert({
        key: 'live_rate',
        value: {
          rate,
          updated_at: new Date().toISOString(),
          source: 'exchangerate-api.com',
        },
      });
      return { rate, source: 'exchangerate-api.com', updatedAt: new Date().toISOString() };
    }
  } catch {
    // fall through
  }

  // Final fallback to shul rate
  const shulRate = await getShulRate();
  return { rate: shulRate, source: 'shul_rate (fallback)', updatedAt: null };
}

export function convertToILS(
  amount: number,
  currency: 'USD' | 'ILS',
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
