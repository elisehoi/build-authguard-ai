-- AuthGuard alert notifications — run in the AUTHGUARD Supabase project.
-- One row per medium/high alert, keyed by the alert's deterministic id, so
-- each alert is recorded (and emailed) at most once. Safe to run more than once.

create table if not exists public.authguard_notifications (
  alert_id text primary key,
  app_id text not null,
  severity text not null check (severity in ('medium', 'high')),
  created_at timestamptz not null default now(),
  emailed_at timestamptz,
  read_at timestamptz
);

create index if not exists authguard_notifications_unread_idx
  on public.authguard_notifications (created_at desc)
  where read_at is null;

-- RLS on with no policies: only the service role (which bypasses RLS) can read or write.
alter table public.authguard_notifications enable row level security;
