-- AuthGuard AI — initial schema.
-- Safe to run more than once: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- notes
-- The spec says this table already exists. "create table if not exists" means
-- this block is a no-op when it does, and creates it when it does not (which
-- was the case in the connected database when this script was written).
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

-- RLS is the real security boundary: even if app code had a bug, Postgres
-- itself refuses to return or modify another user's rows.
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- session_events
-- ---------------------------------------------------------------------------
create table if not exists public.session_events (
  id bigint generated always as identity primary key,
  -- Nullable: a failed login for an unknown email has no user to attach to.
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,
  event_type text not null check (event_type in ('login_success', 'login_failed', 'page_view', 'token_replay')),
  user_agent text,
  -- SHA-256(salt + ip). We never store raw IPs: they are personal data and
  -- a hash is enough to tell "same network vs different network".
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists session_events_user_created_idx
  on public.session_events (user_id, created_at desc);

alter table public.session_events enable row level security;

-- Read-only for users. No insert policy: events are written server-side with
-- the service role so a user cannot forge or erase their own audit trail.
drop policy if exists "session_events_select_own" on public.session_events;
create policy "session_events_select_own" on public.session_events for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Helper: map a login email to a user id so failed logins can be attributed
-- (for the "failed login burst" rule). Only the service role may call it,
-- otherwise anyone could use it to check whether an email is registered.
-- ---------------------------------------------------------------------------
create or replace function public.user_id_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select id from auth.users where lower(email) = lower(lookup_email) limit 1;
$$;

revoke all on function public.user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.user_id_by_email(text) to service_role;

-- ---------------------------------------------------------------------------
-- Helper: report whether RLS is enabled on a teaching table, so the assistant
-- can state a real fact instead of guessing. Returns only a boolean.
-- ---------------------------------------------------------------------------
create or replace function public.is_rls_enabled(target_table text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select c.relrowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = target_table
    and target_table in ('notes', 'session_events');
$$;

revoke all on function public.is_rls_enabled(text) from public, anon;
grant execute on function public.is_rls_enabled(text) to authenticated, service_role;
