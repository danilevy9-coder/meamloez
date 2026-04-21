'use server';

import { supabase } from './supabase';
import { revalidatePath } from 'next/cache';
import { convertToILS, getShulRate, getLiveExchangeRate } from './exchange-rate';
import type {
  Member,
  FamilyMember,
  LedgerEntry,
  LedgerType,
  CurrencyCode,
  MembershipStatus,
  Relationship,
  MemberBalance,
  LedgerEntryWithMember,
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
  const { error } = await supabase.from('members').insert({
    full_name: formData.get('full_name') as string,
    hebrew_name: (formData.get('hebrew_name') as string) || null,
    address: (formData.get('address') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    notes: (formData.get('notes') as string) || null,
    membership_status: (formData.get('membership_status') as MembershipStatus) || 'active',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/members');
  revalidatePath('/');
}

export async function updateMember(id: string, formData: FormData): Promise<void> {
  const { error } = await supabase
    .from('members')
    .update({
      full_name: formData.get('full_name') as string,
      hebrew_name: (formData.get('hebrew_name') as string) || null,
      address: (formData.get('address') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      notes: (formData.get('notes') as string) || null,
      membership_status: formData.get('membership_status') as MembershipStatus,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${id}`);
  revalidatePath('/members');
  revalidatePath('/');
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/members');
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
  const { error } = await supabase.from('family_members').insert({
    member_id: memberId,
    name: formData.get('name') as string,
    hebrew_name: (formData.get('hebrew_name') as string) || null,
    relationship: formData.get('relationship') as Relationship,
    date_of_death_gregorian: (formData.get('date_of_death_gregorian') as string) || null,
    is_after_sunset: formData.get('is_after_sunset') === 'true',
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${memberId}`);
  revalidatePath('/');
}

export async function deleteFamilyMember(id: string, memberId: string): Promise<void> {
  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/members/${memberId}`);
  revalidatePath('/');
}

// ===== LEDGER =====

export async function getLedgerEntries(memberId?: string): Promise<LedgerEntryWithMember[]> {
  let query = supabase
    .from('ledger')
    .select('*, members(full_name)')
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
  const memberId = formData.get('member_id') as string;
  const description = formData.get('description') as string;
  const externalRef = (formData.get('external_ref') as string) || null;

  const useShulRate = formData.get('use_shul_rate') === 'true';
  let rate = 1.0;
  if (currency !== 'ILS') {
    if (useShulRate) {
      rate = await getShulRate();
    } else {
      const live = await getLiveExchangeRate();
      rate = live.rate;
    }
  }

  const amountIls = convertToILS(amountOriginal, currency, rate);

  const { error } = await supabase.from('ledger').insert({
    member_id: memberId,
    type,
    description,
    amount_original: amountOriginal,
    currency,
    exchange_rate: rate,
    amount_ils: amountIls,
    external_ref: externalRef,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/members/${memberId}`);
  revalidatePath('/ledger');
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
  recentPayments: LedgerEntryWithMember[];
  memberCount: number;
  shulRate: number;
  liveRate: number;
  liveRateSource: string;
  liveRateUpdatedAt: string | null;
}> {
  const [balancesRes, paymentsRes, membersRes, shulRate, liveRateData] = await Promise.all([
    supabase.from('member_balances').select('balance_ils'),
    supabase
      .from('ledger')
      .select('*, members(full_name)')
      .eq('type', 'payment')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('members').select('id', { count: 'exact', head: true }),
    getShulRate(),
    getLiveExchangeRate(),
  ]);

  const totalOutstandingIls = (balancesRes.data ?? []).reduce(
    (sum, b) => sum + Math.max(0, (b as { balance_ils: number }).balance_ils),
    0
  );

  return {
    totalOutstandingIls,
    totalOutstandingUsd: liveRateData.rate > 0 ? Math.round((totalOutstandingIls / liveRateData.rate) * 100) / 100 : 0,
    recentPayments: (paymentsRes.data ?? []) as LedgerEntryWithMember[],
    memberCount: membersRes.count ?? 0,
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
  const { data, error } = await supabase
    .from('family_members')
    .select('*, members(full_name)')
    .not('date_of_death_gregorian', 'is', null);
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
