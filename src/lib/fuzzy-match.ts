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

/**
 * Hebrew header mapping for Nedarim Plus exports.
 * The export is tab-separated with Hebrew column names.
 */
const HEBREW_HEADER_MAP: Record<string, string> = {
  // Name
  'שם': 'name',
  // Amount
  'סכום': 'amount',
  // Currency
  'מטבע': 'currency',
  // Transaction date
  'תאריך עסקה': 'date',
  // Confirmation number
  'מספר אישור': 'reference',
  // Category
  'קטגוריה': 'category',
  // Notes
  'הערות': 'notes',
  // Email
  'מייל': 'email',
  // Phone
  'טלפון': 'phone',
  // ID number
  'מספר זהות': 'id_number',
  // Address
  'כתובת': 'address',
  // Installments
  'תשלומים': 'installments',
  // Transaction number
  'מספר עסקה': 'transaction_number',
  // Receipt number
  'מספר קבלה': 'receipt_number',
};

/**
 * Map Hebrew currency names to CurrencyCode
 */
function parseCurrency(raw: string): 'USD' | 'ILS' | 'GBP' {
  const trimmed = stripInvisible(raw);
  if (trimmed === 'שקל' || trimmed === 'ש"ח' || trimmed === 'NIS' || trimmed === 'ILS') return 'ILS';
  if (trimmed === 'דולר' || trimmed === 'USD' || trimmed === '$') return 'USD';
  if (trimmed === 'לירה' || trimmed === 'GBP' || trimmed === '£') return 'GBP';
  // Default to ILS for Hebrew exports
  return 'ILS';
}

/**
 * Detect whether the file is tab-separated or comma-separated
 */
function detectDelimiter(firstLine: string): string {
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs >= commas ? '\t' : ',';
}

/**
 * Strip invisible Unicode formatting characters (RTL/LTR marks, zero-width spaces, etc.)
 * These are commonly embedded in Hebrew CSV exports and break exact string matching.
 */
function stripInvisible(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00A0]/g, '').trim();
}

/**
 * Normalize a header: strip invisible chars, try Hebrew mapping, then English patterns
 */
function normalizeHeader(raw: string): string {
  const trimmed = stripInvisible(raw);
  // Try exact Hebrew match
  if (HEBREW_HEADER_MAP[trimmed]) return HEBREW_HEADER_MAP[trimmed];
  // Try contains-based Hebrew match (in case of extra characters)
  for (const [hebrewKey, mapped] of Object.entries(HEBREW_HEADER_MAP)) {
    if (trimmed.includes(hebrewKey) || hebrewKey.includes(trimmed)) {
      return mapped;
    }
  }
  // Try lowercase English match
  const lower = trimmed.toLowerCase();
  if (lower === 'payer name' || lower === 'name' || lower === 'donor') return 'name';
  if (lower === 'amount' || lower === 'payment amount' || lower === 'sum') return 'amount';
  if (lower === 'currency' || lower === 'curr') return 'currency';
  if (lower === 'date' || lower === 'payment date') return 'date';
  if (lower === 'reference' || lower === 'ref' || lower === 'id') return 'reference';
  if (lower === 'description' || lower === 'note' || lower === 'purpose' || lower === 'category') return 'category';
  return lower;
}

export interface ParseResult {
  rows: NedarimRow[];
  headersMapped: string[];
  headersRaw: string[];
  totalLines: number;
}

export function parseNedarimCSV(csvText: string): ParseResult {
  // Strip BOM (common in Hebrew CSV exports from Windows/Israeli systems)
  const cleaned = csvText.replace(/^\uFEFF/, '');
  // Normalize line endings and split
  const lines = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { rows: [], headersMapped: [], headersRaw: [], totalLines: lines.length };

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = lines[0].split(delimiter).map((h) => h.trim());
  const headers = rawHeaders.map(normalizeHeader);

  const rows = lines.slice(1).filter((l) => l.trim()).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });

    const amount = parseFloat(row['amount'] || '0');
    const currencyRaw = row['currency'] || '';

    return {
      payer_name: stripInvisible(row['name'] || ''),
      amount: isNaN(amount) ? 0 : amount,
      currency: parseCurrency(currencyRaw),
      date: row['date'] || '',
      reference: row['reference'] || row['transaction_number'] || '',
      description: row['category'] || row['notes'] || '',
    };
  }).filter((r) => r.payer_name && r.amount > 0);

  return { rows, headersMapped: headers, headersRaw: rawHeaders, totalLines: lines.length };
}
