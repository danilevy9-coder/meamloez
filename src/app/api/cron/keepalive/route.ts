import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ping Supabase with a simple query to keep it alive
  const { data, error } = await supabase
    .from('settings')
    .select('key')
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  // Also update the live exchange rate in settings
  try {
    const res = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { cache: 'no-store' }
    );
    const json = await res.json();
    const liveRate = json.rates?.ILS;

    if (liveRate) {
      await supabase.from('settings').upsert({
        key: 'live_rate',
        value: {
          rate: liveRate,
          updated_at: new Date().toISOString(),
          source: 'exchangerate-api.com',
        },
      });
    }
  } catch {
    // Non-fatal — keepalive still succeeded
  }

  return NextResponse.json({
    ok: true,
    pinged: data?.length ?? 0,
    timestamp: new Date().toISOString(),
  });
}
