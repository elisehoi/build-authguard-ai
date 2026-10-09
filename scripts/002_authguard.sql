create table if not exists public.authguard_events (
  id uuid primary key default gen_random_uuid(),
  app_id text not null,
  event_type text not null check (event_type in ('login_success', 'login_failed', 'signup', 'password_check', 'session_seen', 'token_invalid')),
  session_id text,
  user_ref text,
  email_hash text,
  user_agent text,
  ip_hash text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists authguard_events_app_session_idx on public.authguard_events (app_id, session_id, occurred_at);
create index if not exists authguard_events_app_email_idx on public.authguard_events (app_id, email_hash, occurred_at);

-- RLS on with no policies: only the service role (which bypasses RLS) can read or write.
alter table public.authguard_events enable row level security;
