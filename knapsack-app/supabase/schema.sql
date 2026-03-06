-- Knapsack cloud sync table
-- Run this script in Supabase SQL Editor once per project.

create table if not exists public.knapsack_user_data (
  account_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_knapsack_user_data_updated_at
  on public.knapsack_user_data(updated_at desc);

alter table public.knapsack_user_data enable row level security;

-- Current app auth is local-only (not Supabase Auth), so anon client access is required.
-- Replace these policies with user-scoped policies if you migrate to Supabase Auth.
drop policy if exists "knapsack anon read" on public.knapsack_user_data;
create policy "knapsack anon read"
  on public.knapsack_user_data
  for select
  to anon
  using (true);

drop policy if exists "knapsack anon insert" on public.knapsack_user_data;
create policy "knapsack anon insert"
  on public.knapsack_user_data
  for insert
  to anon
  with check (true);

drop policy if exists "knapsack anon update" on public.knapsack_user_data;
create policy "knapsack anon update"
  on public.knapsack_user_data
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "knapsack anon delete" on public.knapsack_user_data;
create policy "knapsack anon delete"
  on public.knapsack_user_data
  for delete
  to anon
  using (true);
