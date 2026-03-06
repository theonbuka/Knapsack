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

-- RLS Policies: Authenticated users can only access their own data
-- account_id must match the authenticated user's UUID (auth.uid())

-- Drop old anon policies (permissive, not secure)
drop policy if exists "knapsack anon read" on public.knapsack_user_data;
drop policy if exists "knapsack anon insert" on public.knapsack_user_data;
drop policy if exists "knapsack anon update" on public.knapsack_user_data;
drop policy if exists "knapsack anon delete" on public.knapsack_user_data;

-- New authenticated-only policy: allows authenticated users to read their own data
create policy "Allow authenticated users to read own data"
  on public.knapsack_user_data
  for select
  to authenticated
  using (account_id = auth.uid()::text);

-- New authenticated-only policy: allows authenticated users to insert their own data
create policy "Allow authenticated users to insert own data"
  on public.knapsack_user_data
  for insert
  to authenticated
  with check (account_id = auth.uid()::text);

-- New authenticated-only policy: allows authenticated users to update their own data
create policy "Allow authenticated users to update own data"
  on public.knapsack_user_data
  for update
  to authenticated
  using (account_id = auth.uid()::text)
  with check (account_id = auth.uid()::text);

-- New authenticated-only policy: allows authenticated users to delete their own data
create policy "Allow authenticated users to delete own data"
  on public.knapsack_user_data
  for delete
  to authenticated
  using (account_id = auth.uid()::text);
