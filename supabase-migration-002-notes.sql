-- Migration: Add notes field to members
alter table public.members add column if not exists notes text;
