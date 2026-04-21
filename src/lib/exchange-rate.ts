import { supabase } from './supabase';

interface ShulRateSetting {
  rate: number;
  description: string;
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

export async function getLiveExchangeRate(): Promise<number> {
  try {
    const res = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { next: { revalidate: 86400 } } // cache for 24h
    );
    const json = await res.json();
    return json.rates?.ILS ?? await getShulRate();
  } catch {
    return await getShulRate();
  }
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
