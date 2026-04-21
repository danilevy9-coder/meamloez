import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Member, NedarimRow, LedgerEntry, ReconciliationMatch } from '@/types/database';

const fuseOptions: IFuseOptions<Member> = {
  keys: ['full_name'],
  threshold: 0.4,
  includeScore: true,
};

export function matchNedarimRows(
  rows: NedarimRow[],
  members: Member[],
  pendingPledges: LedgerEntry[]
): ReconciliationMatch[] {
  const fuse = new Fuse(members, fuseOptions);

  return rows.map((row) => {
    const results = fuse.search(row.payer_name);
    const bestMatch = results[0];

    if (!bestMatch || bestMatch.score === undefined) {
      return {
        nedarim_row: row,
        matched_member: null,
        confidence: 0,
        pending_pledge: null,
        status: 'none' as const,
      };
    }

    const member = bestMatch.item;
    const confidence = Math.round((1 - bestMatch.score) * 100);

    // Find a pending pledge for this member that could match this payment
    const matchingPledge = pendingPledges.find((p) => {
      if (p.member_id !== member.id) return false;
      // Check if amounts are close (within 5% tolerance for exchange rate drift)
      const pledgeAmount = p.amount_original;
      const tolerance = pledgeAmount * 0.05;
      return Math.abs(pledgeAmount - row.amount) <= tolerance;
    });

    let status: ReconciliationMatch['status'] = 'none';
    if (confidence >= 85 && matchingPledge) {
      status = 'high';
    } else if (confidence >= 70) {
      status = 'medium';
    } else if (confidence >= 50) {
      status = 'low';
    }

    return {
      nedarim_row: row,
      matched_member: member,
      confidence,
      pending_pledge: matchingPledge ?? null,
      status,
    };
  });
}

export function parseNedarimCSV(csvText: string): NedarimRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });

    // Flexible column mapping for Nedarim Plus exports
    const amount = parseFloat(
      row['amount'] || row['payment amount'] || row['sum'] || '0'
    );
    const currencyRaw = (
      row['currency'] || row['curr'] || ''
    ).toUpperCase();

    return {
      payer_name: row['payer name'] || row['name'] || row['donor'] || '',
      amount: isNaN(amount) ? 0 : amount,
      currency: (currencyRaw === 'ILS' || currencyRaw === 'NIS' ? 'ILS' : 'USD') as 'USD' | 'ILS',
      date: row['date'] || row['payment date'] || '',
      reference: row['reference'] || row['ref'] || row['id'] || '',
      description: row['description'] || row['note'] || row['purpose'] || '',
    };
  }).filter((r) => r.payer_name && r.amount > 0);
}
