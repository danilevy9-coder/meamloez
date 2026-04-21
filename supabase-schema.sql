-- ============================================
-- ShulFlow: Synagogue Management & Unified Ledger
-- Supabase SQL Schema
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. MEMBERS
-- ============================================
create table public.members (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  hebrew_name text,
  address text,
  phone text,
  email text,
  membership_status text not null default 'active'
    check (membership_status in ('active', 'inactive', 'honorary', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for search
create index idx_members_full_name on public.members using gin (to_tsvector('english', full_name));
create index idx_members_status on public.members (membership_status);

-- ============================================
-- 2. FAMILY MEMBERS (spouse, children, niftarim)
-- ============================================
create table public.family_members (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references public.members(id) on delete cascade,
  name text not null,
  hebrew_name text,
  relationship text not null
    check (relationship in ('wife', 'husband', 'child', 'parent', 'sibling', 'other')),
  date_of_death_gregorian date,
  is_after_sunset boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_family_members_member_id on public.family_members (member_id);
create index idx_family_members_death_date on public.family_members (date_of_death_gregorian)
  where date_of_death_gregorian is not null;

-- ============================================
-- 3. LEDGER (Unified: pledges & payments)
-- ============================================
create type ledger_type as enum ('pledge', 'payment');
create type currency_code as enum ('USD', 'ILS');

create table public.ledger (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references public.members(id) on delete restrict,
  type ledger_type not null,
  description text not null,
  amount_original numeric(12, 2) not null check (amount_original > 0),
  currency currency_code not null,
  exchange_rate numeric(10, 4) not null default 1.0,
  amount_ils numeric(12, 2) not null,
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ledger_member_id on public.ledger (member_id);
create index idx_ledger_type on public.ledger (type);
create index idx_ledger_created_at on public.ledger (created_at desc);
create index idx_ledger_external_ref on public.ledger (external_ref)
  where external_ref is not null;

-- ============================================
-- 4. SETTINGS (key-value store)
-- ============================================
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Seed default settings
insert into public.settings (key, value) values
  ('shul_rate', '{"rate": 3.70, "description": "Default Shul USD/ILS rate"}'),
  ('shul_name', '"Meam Loez"'),
  ('yahrzeit_reminder_days', '7');

-- ============================================
-- 5. VIEWS: Member Balance Summary
-- ============================================
create view public.member_balances as
select
  m.id as member_id,
  m.full_name,
  m.membership_status,
  coalesce(sum(case when l.type = 'pledge' then l.amount_ils else 0 end), 0) as total_pledges_ils,
  coalesce(sum(case when l.type = 'payment' then l.amount_ils else 0 end), 0) as total_payments_ils,
  coalesce(sum(case when l.type = 'pledge' then l.amount_ils else 0 end), 0)
    - coalesce(sum(case when l.type = 'payment' then l.amount_ils else 0 end), 0) as balance_ils
from public.members m
left join public.ledger l on l.member_id = m.id
group by m.id, m.full_name, m.membership_status;

-- ============================================
-- 6. FUNCTIONS: Updated_at trigger
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_members_updated_at
  before update on public.members
  for each row execute function public.handle_updated_at();

create trigger set_family_members_updated_at
  before update on public.family_members
  for each row execute function public.handle_updated_at();

create trigger set_ledger_updated_at
  before update on public.ledger
  for each row execute function public.handle_updated_at();

create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.handle_updated_at();

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================
alter table public.members enable row level security;
alter table public.family_members enable row level security;
alter table public.ledger enable row level security;
alter table public.settings enable row level security;

-- Authenticated users can read/write all rows (Gabbai access)
-- Tighten these policies as you add role-based access later.
create policy "Authenticated users full access" on public.members
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on public.family_members
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on public.ledger
  for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access" on public.settings
  for all using (auth.role() = 'authenticated');
