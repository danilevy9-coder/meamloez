import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      { next: { revalidate: 3600 } } // cache 1 hour
    );
    const json = await res.json();
    const rate = json.rates?.ILS;

    if (!rate) {
      return NextResponse.json(
        { error: 'ILS rate not found' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      rate,
      source: 'exchangerate-api.com',
      base: 'USD',
      target: 'ILS',
      updated: json.date,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch rate' },
      { status: 502 }
    );
  }
}
