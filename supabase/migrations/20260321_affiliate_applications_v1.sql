begin;

create extension if not exists pgcrypto;

create table if not exists public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  full_name text not null,
  email text not null,
  creator_links jsonb not null default '[]'::jsonb,
  main_platform text null,
  following_band text null,
  content_types jsonb not null default '[]'::jsonb,
  tab_usage jsonb not null default '[]'::jsonb,
  feature_plan jsonb not null default '[]'::jsonb,
  motivation jsonb not null default '[]'::jsonb,
  extra text null,
  status text not null default 'submitted',
  review_notes text null,
  reviewed_at timestamptz null,
  reviewed_by text null,
  approved_at timestamptz null,
  constraint affiliate_applications_status_check
    check (status in ('submitted', 'approved', 'rejected'))
);

create index if not exists affiliate_applications_email_lower_idx
  on public.affiliate_applications (lower(email));

create index if not exists affiliate_applications_status_created_at_idx
  on public.affiliate_applications (status, created_at desc);

drop trigger if exists set_affiliate_applications_updated_at on public.affiliate_applications;
create trigger set_affiliate_applications_updated_at
before update on public.affiliate_applications
for each row
execute function public.set_updated_at();

alter table public.profiles
  add column if not exists affiliate_approved boolean not null default false,
  add column if not exists affiliate_approved_at timestamptz null,
  add column if not exists affiliate_application_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_affiliate_application_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_affiliate_application_id_fkey
      foreign key (affiliate_application_id)
      references public.affiliate_applications (id)
      on delete set null;
  end if;
end $$;

alter table public.affiliate_applications enable row level security;

drop policy if exists "affiliate_applications_insert_public" on public.affiliate_applications;
create policy "affiliate_applications_insert_public"
on public.affiliate_applications
for insert
to anon, authenticated
with check (true);

commit;
