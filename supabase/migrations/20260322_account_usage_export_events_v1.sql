begin;

create extension if not exists pgcrypto;

create table if not exists public.export_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  export_type text not null check (export_type in ('pdf', 'png', 'chord')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists export_events_user_id_idx on public.export_events(user_id);
create index if not exists export_events_created_at_idx on public.export_events(created_at desc);
create index if not exists export_events_user_type_created_idx on public.export_events(user_id, export_type, created_at desc);

alter table public.export_events enable row level security;

drop policy if exists "export_events_select_own" on public.export_events;
create policy "export_events_select_own"
on public.export_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "export_events_insert_own" on public.export_events;
create policy "export_events_insert_own"
on public.export_events
for insert
to authenticated
with check (auth.uid() = user_id);

commit;
