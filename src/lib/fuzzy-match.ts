import Fuse, { type IFuseOptions } from 'fuse.js';
import type { Member, NedarimRow, LedgerEntry, ReconciliationMatch } from '@/types/database';

const fuseOptions: IFuseOptions<Member> = {
  keys: ['full_name', 'hebrew_name', 'spouse_name'],
  threshold: 0.4,
  includeScore: true,
};

export function matchNedarimRows(
  rows: NedarimRow[],
  members: Member[],
  pendingPledges: LedgerEntry[]
): ReconciliationMatch[] {
  const fuse = new Fuse(members, fuseOptions);

  // Build lookup maps for email and phone exact matching
  const emailMap = new Map<string, Member>();
  const phoneMap = new Map<string, Member>();
  for (const m of members) {
    if (m.email) emailMap.set(m.email.toLowerCase().trim(), m);
    if (m.spouse_email) emailMap.set(m.spouse_email.toLowerCase().trim(), m);
    if (m.phone) {
      const norm = normalizePhone(m.phone);
      if (norm) phoneMap.set(norm, m);
    }
    if (m.spouse_phone) {
      const norm = normalizePhone(m.spouse_phone);
      if (norm) phoneMap.set(norm, m);
    }
  }

  return rows.map((row) => {
    let member: Member | null = null;
    let confidence = 0;

    // 1. Try exact email match first (highest confidence)
    if (row.email) {
      const byEmail = emailMap.get(row.email.toLowerCase().trim());
      if (byEmail) {
        member = byEmail;
        confidence = 98;
      }
    }

    // 2. Try exact phone match
    if (!member && row.phone) {
      const norm = normalizePhone(row.phone);
      if (norm) {
        const byPhone = phoneMap.get(norm);
        if (byPhone) {
          member = byPhone;
          confidence = 95;
        }
      }
    }

    // 3. Fall back to fuzzy name match
    if (!member) {
      const results = fuse.search(row.payer_name);
      const bestMatch = results[0];
      if (bestMatch && bestMatch.score !== undefined) {
        member = bestMatch.item;
        confidence = Math.round((1 - bestMatch.score) * 100);
      }
    }

    if (!member) {
      return {
        nedarim_row: row,
        matched_member: null,
        confidence: 0,
        pending_pledge: null,
        status: 'none' as const,
      };
    }

    // Find a pending pledge for this member that could match this payment
    const matchingPledge = pendingPledges.find((p) => {
      if (p.member_id !== member!.id) return false;
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

function normalizePhone(phone: string): string {
  // Strip everything except digits
  let digits = phone.replace(/\D/g, '');
  // Remove leading 972 (Israel country code)
  if (digits.startsWith('972')) digits = digits.slice(3);
  // Remove leading 0
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/**
 * Strip invisible Unicode formatting characters (RTL/LTR marks, zero-width spaces, etc.)
 */
function stripInvisible(str: string): string {
  return str.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00A0]/g, '').trim();
}

/**
 * Hebrew header mapping for Nedarim Plus exports.
 */
const HEBREW_HEADER_MAP: Record<string, string> = {
  'שם': 'name',
  'סכום': 'amount',
  'מטבע': 'currency',
  'תאריך עסקה': 'date',
  'מספר אישור': 'reference',
  'קטגוריה': 'category',
  'הערות': 'notes',
  'מייל': 'email',
  'טלפון': 'phone',
  'מספר זהות': 'id_number',
  'כתובת': 'address',
  'תשלומים': 'installments',
  'מספר עסקה': 'transaction_number',
  'מספר קבלה': 'receipt_number',
};

function parseCurrency(raw: string): 'USD' | 'ILS' | 'GBP' {
  const trimmed = stripInvisible(raw);
  if (trimmed === 'שקל' || trimmed === 'ש"ח' || trimmed === 'NIS' || trimmed === 'ILS') return 'ILS';
  if (trimmed === 'דולר' || trimmed === 'USD' || trimmed === '$') return 'USD';
  if (trimmed === 'לירה' || trimmed === 'GBP' || trimmed === '£') return 'GBP';
  return 'ILS';
}

function detectDelimiter(firstLine: string): string {
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs >= commas ? '\t' : ',';
}

function normalizeHeader(raw: string): string {
  const trimmed = stripInvisible(raw);
  if (HEBREW_HEADER_MAP[trimmed]) return HEBREW_HEADER_MAP[trimmed];
  // Contains-based match for Hebrew headers with extra chars
  for (const [hebrewKey, mapped] of Object.entries(HEBREW_HEADER_MAP)) {
    if (trimmed.includes(hebrewKey) || hebrewKey.includes(trimmed)) {
      return mapped;
    }
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'payer name' || lower === 'name' || lower === 'donor') return 'name';
  if (lower === 'amount' || lower === 'payment amount' || lower === 'sum') return 'amount';
  if (lower === 'currency' || lower === 'curr') return 'currency';
  if (lower === 'date' || lower === 'payment date') return 'date';
  if (lower === 'reference' || lower === 'ref') return 'reference';
  if (lower === 'email' || lower === 'e-mail') return 'email';
  if (lower === 'phone' || lower === 'tel' || lower === 'telephone') return 'phone';
  if (lower === 'description' || lower === 'note' || lower === 'purpose' || lower === 'category') return 'category';
  return lower;
}

export interface ParseResult {
  rows: NedarimRow[];
  headersMapped: string[];
  headersRaw: string[];
  totalLines: number;
  preview: string;
}

export function parseNedarimCSV(csvText: string): ParseResult {
  // Strip BOM
  const cleaned = csvText.replace(/^\uFEFF/, '');
  // Normalize line endings
  const lines = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  // Build a preview of the first 3 lines (raw)
  const preview = lines.slice(0, 3).join('\n');

  if (lines.length < 2) return { rows: [], headersMapped: [], headersRaw: [], totalLines: lines.length, preview };

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
      // Pass through email/phone for matching
      email: stripInvisible(row['email'] || ''),
      phone: stripInvisible(row['phone'] || ''),
    };
  }).filter((r) => r.payer_name && r.amount > 0);

  return { rows, headersMapped: headers, headersRaw: rawHeaders, totalLines: lines.length, preview };
}
