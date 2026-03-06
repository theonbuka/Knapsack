-- Verify Knapsack cloud sync setup in Supabase SQL Editor.

-- 1) Table exists
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'knapsack_user_data';

-- 2) RLS is enabled
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname = 'knapsack_user_data';

-- 3) Policies exist
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'knapsack_user_data'
order by policyname;

-- 4) Optional: row count snapshot
select count(*) as total_rows
from public.knapsack_user_data;
