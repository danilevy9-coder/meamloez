'use server';

import { supabase } from './supabase';
import { revalidatePath } from 'next/cache';
import { convertToILS, getExchangeRateForCurrency, getShulRate, getLiveExchangeRate } from './exchange-rate';
import type {
  Member,
  FamilyMember,
  LedgerEntry,
  LedgerType,
  CurrencyCode,
  MembershipStatus,
  Relationship,
  Gender,
  IncomeCategory,
  DonorLeadStatus,
  MemberBalance,
  LedgerEntryWithMember,
  Donor,
} from '@/types/database';

// ===== MEMBERS =====

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('full_name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMember(id: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function searchMembers(query: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .order('full_name')
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMember(formData: FormData): Promise<void> {
  const fee = formData.get('membership_fee') as string;
  const { error } = await supabase.from('members').insert({
    full_name: formData.get('full_name') as string,
    hebrew_name: (formData.get('hebrew_name') as string) || null,
    gender: (formData.get('gender') as Gender) || 'male',
    address: (formData.get('address') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    spouse_name: (formData.get('spouse_name') as string) || null,
    spouse_phone: (formData.get('spouse_phone') as string) || null,
    spouse_email: (formData.get('spouse_email') as string) || null,
    membership_fee: fee ? parseFloat(fee) : null,
    notes: (formData.get('notes') as string) || null,
    membership_status: (formData.get('membership_status') as MembershipStatus) || 'active',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/members');
  revalidatePath('/');
}

export async function updateMember(id: string, formData: FormData): Promise<void> {
  const fee = formData.get('membership_fee') as string;
  const { error } = await supabase
    .from('members')
    .update({
      full_name: formData.get('full_name') as string,
      hebrew_name: (formData.get('hebrew_name') as string) || null,
      gender: (formData.get('gender') as Gender) || 'male',
      address: (formData.get('address') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      spouse_name: (formData.get('spouse_name') as string) || null,
      spouse_phone: (formData.get('spouse_phone') as string) || null,
      spouse_email: (formData.get('spouse_email') as string) || null,
      membership_fee: fee ? parseFloat(fee) : null,
      notes: (formData.get('notes') as string) || null,
      membership_status: formData.get('membership_status') as MembershipStatus,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${id}`);
  revalidatePath('/members');
  revalidatePath('/');
}

export async function bulkCreateMembers(
  members: Array<{
    full_name: string;
    hebrew_name?: string;
    address?: string;
    phone?: string;
    email?: string;
    notes?: string;
    membership_status?: MembershipStatus;
  }>
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  const valid = members.filter((m, i) => {
    if (!m.full_name || m.full_name.trim() === '') {
      errors.push(`Row ${i + 1}: Missing full name, skipped`);
      return false;
    }
    return true;
  });

  if (valid.length === 0) {
    return { inserted: 0, errors };
  }

  const rows = valid.map((m) => ({
    full_name: m.full_name.trim(),
    hebrew_name: m.hebrew_name?.trim() || null,
    address: m.address?.trim() || null,
    phone: m.phone?.trim() || null,
    email: m.email?.trim() || null,
    notes: m.notes?.trim() || null,
    membership_status: m.membership_status || 'active',
  }));

  const { error } = await supabase.from('members').insert(rows);
  if (error) {
    return { inserted: 0, errors: [...errors, error.message] };
  }

  revalidatePath('/members');
  revalidatePath('/');
  return { inserted: rows.length, errors };
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/members');
  revalidatePath('/');
}

// ===== DONORS =====

export async function getDonors(): Promise<Donor[]> {
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .order('full_name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDonor(id: string): Promise<Donor | null> {
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createDonor(formData: FormData): Promise<void> {
  const { error } = await supabase.from('donors').insert({
    full_name: formData.get('full_name') as string,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    notes: (formData.get('notes') as string) || null,
    lead_status: (formData.get('lead_status') as DonorLeadStatus) || 'cold',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/donors');
  revalidatePath('/');
}

export async function updateDonor(id: string, formData: FormData): Promise<void> {
  const { error } = await supabase
    .from('donors')
    .update({
      full_name: formData.get('full_name') as string,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      notes: (formData.get('notes') as string) || null,
      lead_status: formData.get('lead_status') as DonorLeadStatus,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/donors');
  revalidatePath('/');
}

export async function deleteDonor(id: string): Promise<void> {
  const { error } = await supabase.from('donors').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/donors');
  revalidatePath('/');
}

// ===== FAMILY MEMBERS =====

export async function getFamilyMembers(memberId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('member_id', memberId)
    .order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createFamilyMember(formData: FormData): Promise<void> {
  const memberId = formData.get('member_id') as string;
  const yahrzeitDay = formData.get('yahrzeit_day') as string;
  const yahrzeitMonth = formData.get('yahrzeit_month') as string;

  const { error } = await supabase.from('family_members').insert({
    member_id: memberId,
    name: formData.get('name') as string,
    hebrew_name: (formData.get('hebrew_name') as string) || null,
    relationship: formData.get('relationship') as Relationship,
    date_of_death_gregorian: (formData.get('date_of_death_gregorian') as string) || null,
    is_after_sunset: formData.get('is_after_sunset') === 'true',
    yahrzeit_day: yahrzeitDay ? parseInt(yahrzeitDay, 10) : null,
    yahrzeit_month: yahrzeitMonth ? parseInt(yahrzeitMonth, 10) : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${memberId}`);
  revalidatePath('/yahrzeits');
  revalidatePath('/');
}

export async function updateFamilyMember(id: string, formData: FormData): Promise<void> {
  const memberId = formData.get('member_id') as string;
  const yahrzeitDay = formData.get('yahrzeit_day') as string;
  const yahrzeitMonth = formData.get('yahrzeit_month') as string;

  const { error } = await supabase
    .from('family_members')
    .update({
      name: formData.get('name') as string,
      hebrew_name: (formData.get('hebrew_name') as string) || null,
      relationship: formData.get('relationship') as Relationship,
      date_of_death_gregorian: (formData.get('date_of_death_gregorian') as string) || null,
      is_after_sunset: formData.get('is_after_sunset') === 'true',
      yahrzeit_day: yahrzeitDay ? parseInt(yahrzeitDay, 10) : null,
      yahrzeit_month: yahrzeitMonth ? parseInt(yahrzeitMonth, 10) : null,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${memberId}`);
  revalidatePath('/yahrzeits');
  revalidatePath('/');
}

export async function deleteFamilyMember(id: string, memberId: string): Promise<void> {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${memberId}`);
  revalidatePath('/yahrzeits');
  revalidatePath('/');
}

// ===== LEDGER =====

export async function getLedgerEntries(memberId?: string): Promise<LedgerEntryWithMember[]> {
  let query = supabase
    .from('ledger')
    .select('*, members(full_name), donors(full_name)')
    .order('created_at', { ascending: false });

  if (memberId) {
    query = query.eq('member_id', memberId);
  }

  const { data, error } = await query.limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as LedgerEntryWithMember[];
}

export async function createLedgerEntry(formData: FormData): Promise<void> {
  const currency = formData.get('currency') as CurrencyCode;
  const amountOriginal = parseFloat(formData.get('amount_original') as string);
  const type = formData.get('type') as LedgerType;
  const memberId = (formData.get('member_id') as string) || null;
  const donorId = (formData.get('donor_id') as string) || null;
  const description = formData.get('description') as string;
  const incomeCategory = (formData.get('income_category') as IncomeCategory) || 'donation';
  const externalRef = (formData.get('external_ref') as string) || null;

  const useShulRate = formData.get('use_shul_rate') === 'true';
  let rate = 1.0;
  if (currency !== 'ILS') {
    if (useShulRate) {
      rate = await getShulRate();
    } else {
      const live = await getLiveExchangeRate();
      rate = getExchangeRateForCurrency(currency, live.rate, live.rateGbp);
    }
  }

  const amountIls = convertToILS(amountOriginal, currency, rate);

  const { error } = await supabase.from('ledger').insert({
    member_id: memberId,
    donor_id: donorId,
    type,
    income_category: incomeCategory,
    description,
    amount_original: amountOriginal,
    currency,
    exchange_rate: rate,
    amount_ils: amountIls,
    external_ref: externalRef,
  });

  if (error) throw new Error(error.message);
  if (memberId) revalidatePath(`/members/${memberId}`);
  revalidatePath('/ledger');
  revalidatePath('/donors');
  revalidatePath('/');
}

export async function batchCreatePayments(
  entries: Array<{
    member_id: string;
    description: string;
    amount_original: number;
    currency: CurrencyCode;
    exchange_rate: number;
    amount_ils: number;
    external_ref: string | null;
  }>
): Promise<void> {
  const rows = entries.map((e) => ({
    ...e,
    type: 'payment' as const,
    income_category: 'donation' as const,
  }));

  const { error } = await supabase.from('ledger').insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath('/ledger');
  revalidatePath('/members');
  revalidatePath('/');
}

// ===== BALANCES =====

export async function getMemberBalances(): Promise<MemberBalance[]> {
  const { data, error } = await supabase
    .from('member_balances')
    .select('*')
    .order('balance_ils', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberBalance[];
}

export async function getMemberBalance(memberId: string): Promise<MemberBalance | null> {
  const { data, error } = await supabase
    .from('member_balances')
    .select('*')
    .eq('member_id', memberId)
    .single();
  if (error) return null;
  return data as MemberBalance;
}

// ===== DASHBOARD AGGREGATES =====

export async function getDashboardStats(): Promise<{
  totalOutstandingIls: number;
  totalOutstandingUsd: number;
  totalDonationsIls: number;
  totalMembershipFeesIls: number;
  totalExpectedMonthlyFees: number;
  recentPayments: LedgerEntryWithMember[];
  memberCount: number;
  donorCount: number;
  shulRate: number;
  liveRate: number;
  liveRateSource: string;
  liveRateUpdatedAt: string | null;
}> {
  const [balancesRes, paymentsRes, membersRes, donorsRes, donationTotalRes, feeTotalRes, monthlyFeesRes, shulRate, liveRateData] = await Promise.all([
    supabase.from('member_balances').select('balance_ils'),
    supabase
      .from('ledger')
      .select('*, members(full_name), donors(full_name)')
      .eq('type', 'payment')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('members').select('id', { count: 'exact', head: true }),
    supabase.from('donors').select('id', { count: 'exact', head: true }),
    supabase.from('ledger').select('amount_ils').eq('type', 'payment').eq('income_category', 'donation'),
    supabase.from('ledger').select('amount_ils').eq('type', 'payment').eq('income_category', 'membership_fee'),
    supabase.from('members').select('membership_fee').not('membership_fee', 'is', null),
    getShulRate(),
    getLiveExchangeRate(),
  ]);

  const totalOutstandingIls = (balancesRes.data ?? []).reduce(
    (sum, b) => sum + Math.max(0, (b as { balance_ils: number }).balance_ils),
    0
  );

  const totalDonationsIls = (donationTotalRes.data ?? []).reduce(
    (sum, d) => sum + (d as { amount_ils: number }).amount_ils,
    0
  );

  const totalMembershipFeesIls = (feeTotalRes.data ?? []).reduce(
    (sum, d) => sum + (d as { amount_ils: number }).amount_ils,
    0
  );

  const totalExpectedMonthlyFees = (monthlyFeesRes.data ?? []).reduce(
    (sum, m) => sum + ((m as { membership_fee: number }).membership_fee ?? 0),
    0
  );

  return {
    totalOutstandingIls,
    totalOutstandingUsd: liveRateData.rate > 0 ? Math.round((totalOutstandingIls / liveRateData.rate) * 100) / 100 : 0,
    totalDonationsIls,
    totalMembershipFeesIls,
    totalExpectedMonthlyFees,
    recentPayments: (paymentsRes.data ?? []) as LedgerEntryWithMember[],
    memberCount: membersRes.count ?? 0,
    donorCount: donorsRes.count ?? 0,
    shulRate,
    liveRate: liveRateData.rate,
    liveRateSource: liveRateData.source,
    liveRateUpdatedAt: liveRateData.updatedAt,
  };
}

// ===== YAHRZEITS =====

export async function getAllFamilyMembersWithDeathDates(): Promise<
  Array<FamilyMember & { members: { full_name: string } }>
> {
  // Get family members that have either Hebrew yahrzeit fields or Gregorian death date
  const { data, error } = await supabase
    .from('family_members')
    .select('*, members(full_name)')
    .or('date_of_death_gregorian.not.is.null,yahrzeit_day.not.is.null');
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<FamilyMember & { members: { full_name: string } }>;
}

// ===== SETTINGS =====

export async function getSetting(key: string): Promise<unknown> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value ?? null;
}

export async function updateSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value });
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

// ===== PENDING PLEDGES (for reconciliation) =====

export async function getPendingPledges(): Promise<LedgerEntry[]> {
  // Get pledges that exceed their payments per member
  const { data: balances } = await supabase
    .from('member_balances')
    .select('member_id')
    .gt('balance_ils', 0);

  if (!balances || balances.length === 0) return [];

  const memberIds = balances.map((b) => (b as { member_id: string }).member_id);

  const { data, error } = await supabase
    .from('ledger')
    .select('*')
    .eq('type', 'pledge')
    .in('member_id', memberIds)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as LedgerEntry[];
}
