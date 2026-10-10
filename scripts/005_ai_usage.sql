-- AuthGuard demo mode: one row per AI request (assistant, explain, report),
-- used to limit each user to 30 requests per hour while AUTHGUARD_DEMO_MODE=true.
-- Run in the AUTHGUARD Supabase project. Safe to run more than once.

create table if not exists public.authguard_ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists authguard_ai_usage_user_created_idx
  on public.authguard_ai_usage (user_id, created_at desc);

-- RLS on with no policies: only the service role (which bypasses RLS) can read or write.
alter table public.authguard_ai_usage enable row level security;
