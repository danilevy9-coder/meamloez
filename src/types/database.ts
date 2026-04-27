export type MembershipStatus = 'active' | 'inactive' | 'honorary' | 'suspended';
export type LedgerType = 'pledge' | 'payment';
export type CurrencyCode = 'USD' | 'ILS' | 'GBP';
export type Relationship = 'wife' | 'husband' | 'child' | 'parent' | 'sibling' | 'other';
export type Gender = 'male' | 'female';
export type IncomeCategory = 'donation' | 'membership_fee';
export type DonorLeadStatus = 'cold' | 'warm' | 'hot' | 'regular';

export interface Member {
  id: string;
  full_name: string;
  hebrew_name: string | null;
  gender: Gender;
  address: string | null;
  phone: string | null;
  email: string | null;
  spouse_name: string | null;
  spouse_phone: string | null;
  spouse_email: string | null;
  membership_fee: number | null;
  notes: string | null;
  membership_status: MembershipStatus;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  member_id: string;
  name: string;
  hebrew_name: string | null;
  relationship: Relationship;
  date_of_death_gregorian: string | null;
  is_after_sunset: boolean;
  yahrzeit_day: number | null;
  yahrzeit_month: number | null;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  lead_status: DonorLeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  member_id: string | null;
  donor_id: string | null;
  type: LedgerType;
  income_category: IncomeCategory;
  description: string;
  amount_original: number;
  currency: CurrencyCode;
  exchange_rate: number;
  amount_ils: number;
  external_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface MemberBalance {
  member_id: string;
  full_name: string;
  membership_status: MembershipStatus;
  total_pledges_ils: number;
  total_payments_ils: number;
  balance_ils: number;
}

// Joined types for UI
export interface MemberWithFamily extends Member {
  family_members: FamilyMember[];
}

export interface LedgerEntryWithMember extends LedgerEntry {
  members: { full_name: string } | null;
  donors: { full_name: string } | null;
}

// Nedarim Plus CSV row
export interface NedarimRow {
  payer_name: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  reference: string;
  description: string;
}

export interface ReconciliationMatch {
  nedarim_row: NedarimRow;
  matched_member: Member | null;
  confidence: number;
  pending_pledge: LedgerEntry | null;
  status: 'high' | 'medium' | 'low' | 'none';
}
