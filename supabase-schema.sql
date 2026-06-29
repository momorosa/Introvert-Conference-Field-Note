-- Run this once in your Supabase project: SQL Editor -> New query -> Run.
-- One row per user holds the entire field-plan state as JSON.
-- Row-level security guarantees you can only ever read/write your own row.

create table if not exists public.field_plan (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.field_plan enable row level security;

-- Drop-and-recreate so this script is safe to re-run.
drop policy if exists "field_plan_select_own" on public.field_plan;
drop policy if exists "field_plan_insert_own" on public.field_plan;
drop policy if exists "field_plan_update_own" on public.field_plan;

create policy "field_plan_select_own"
  on public.field_plan for select
  using (auth.uid() = user_id);

create policy "field_plan_insert_own"
  on public.field_plan for insert
  with check (auth.uid() = user_id);

create policy "field_plan_update_own"
  on public.field_plan for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
