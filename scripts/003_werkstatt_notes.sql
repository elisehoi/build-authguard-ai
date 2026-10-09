-- Werkstatt demo app — run in the WERKSTATT Supabase project (not AuthGuard's).
-- Werkstatt only needs its notes table; logins use the project's built-in auth.
-- Safe to run more than once.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

-- Werkstatt uses the anon key only, so RLS is the whole boundary: each
-- signed-in customer can read, add and delete their own notes and nothing else.
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);
