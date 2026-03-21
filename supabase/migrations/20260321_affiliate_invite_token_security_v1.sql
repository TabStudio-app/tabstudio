begin;

create extension if not exists pgcrypto;
create extension if not exists pg_net;

alter table public.affiliate_applications
  add column if not exists invite_token text null,
  add column if not exists invite_token_created_at timestamptz null,
  add column if not exists invite_token_consumed_at timestamptz null;

create unique index if not exists affiliate_applications_invite_token_key
  on public.affiliate_applications (invite_token)
  where invite_token is not null;

create or replace function public.assign_affiliate_invite_token_on_approval()
returns trigger
language plpgsql
as $$
begin
  if old.status is distinct from new.status and new.status = 'approved' then
    if new.invite_token is null or btrim(new.invite_token) = '' or new.invite_token_consumed_at is not null then
      new.invite_token := encode(gen_random_bytes(24), 'hex');
    end if;
    new.invite_token_created_at := timezone('utc', now());
    new.invite_token_consumed_at := null;
    if new.approved_at is null then
      new.approved_at := timezone('utc', now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assign_affiliate_invite_token_on_approval on public.affiliate_applications;
create trigger trg_assign_affiliate_invite_token_on_approval
before update on public.affiliate_applications
for each row
execute function public.assign_affiliate_invite_token_on_approval();

create or replace function public.send_affiliate_approved_email_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  fn_base_url text;
  service_jwt text;
begin
  if not (old.status is distinct from new.status and new.status = 'approved') then
    return new;
  end if;

  select decrypted_secret into fn_base_url
  from vault.decrypted_secrets
  where name = 'SUPABASE_FUNCTIONS_URL'
  order by created_at desc
  limit 1;

  select decrypted_secret into service_jwt
  from vault.decrypted_secrets
  where name = 'SUPABASE_SERVICE_ROLE_JWT'
  order by created_at desc
  limit 1;

  if fn_base_url is null or service_jwt is null then
    raise exception 'Missing vault secrets: SUPABASE_FUNCTIONS_URL or SUPABASE_SERVICE_ROLE_JWT';
  end if;

  if new.invite_token is null or btrim(new.invite_token) = '' then
    raise exception 'AFFILIATE_INVITE_TOKEN_NOT_GENERATED';
  end if;

  perform net.http_post(
    url := fn_base_url || '/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_jwt,
      'apikey', service_jwt
    ),
    body := jsonb_build_object(
      'to', new.email,
      'template_type', 'affiliate_approved',
      'template_data', jsonb_build_object(
        'fullName', coalesce(nullif(new.full_name, ''), 'there'),
        'inviteToken', new.invite_token
      )
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_send_affiliate_approved_email on public.affiliate_applications;
create trigger trg_send_affiliate_approved_email
after update on public.affiliate_applications
for each row
execute function public.send_affiliate_approved_email_on_status_change();

create or replace function public.enforce_affiliate_invite_token_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  signup_context text;
  invite_token_value text;
  consumed_application_id uuid;
begin
  signup_context := coalesce(new.raw_user_meta_data->>'signup_context', '');
  if signup_context <> 'affiliate_approved' then
    return new;
  end if;

  invite_token_value := nullif(btrim(coalesce(new.raw_user_meta_data->>'affiliate_invite_token', '')), '');
  if invite_token_value is null then
    raise exception 'AFFILIATE_INVITE_MISSING';
  end if;

  update public.affiliate_applications
  set invite_token_consumed_at = timezone('utc', now())
  where lower(email) = lower(new.email)
    and status = 'approved'
    and invite_token = invite_token_value
    and invite_token_consumed_at is null
  returning id into consumed_application_id;

  if consumed_application_id is null then
    raise exception 'AFFILIATE_INVITE_INVALID_OR_USED';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_affiliate_invite_token_on_signup on auth.users;
create trigger trg_enforce_affiliate_invite_token_on_signup
before insert on auth.users
for each row
execute function public.enforce_affiliate_invite_token_on_signup();

update public.affiliate_applications
set
  invite_token = coalesce(nullif(btrim(invite_token), ''), encode(gen_random_bytes(24), 'hex')),
  invite_token_created_at = coalesce(invite_token_created_at, timezone('utc', now()))
where status = 'approved'
  and (invite_token is null or btrim(invite_token) = '');

commit;
