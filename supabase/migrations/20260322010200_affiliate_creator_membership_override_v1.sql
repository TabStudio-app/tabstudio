begin;

alter table public.profiles
  add column if not exists affiliate_previous_plan_tier text null,
  add column if not exists affiliate_previous_membership_status text null,
  add column if not exists affiliate_previous_billing_cycle text null;

create or replace function public.send_affiliate_approved_email_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault, auth
as $$
declare
  fn_base_url text;
  service_jwt text;
  existing_profile record;
  existing_auth_user_id uuid;
  has_existing_auth_user boolean := false;
  template_type_value text;
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

  select
    p.id,
    p.email,
    p.affiliate_approved,
    p.plan_tier,
    p.membership_status,
    p.billing_cycle
  into existing_profile
  from public.profiles p
  where lower(coalesce(p.email, '')) = lower(new.email)
  limit 1;

  if existing_profile.id is not null then
    has_existing_auth_user := true;

    update public.profiles
    set
      affiliate_previous_plan_tier = case
        when coalesce(existing_profile.affiliate_approved, false) = false then coalesce(nullif(btrim(existing_profile.plan_tier), ''), 'free')
        else affiliate_previous_plan_tier
      end,
      affiliate_previous_membership_status = case
        when coalesce(existing_profile.affiliate_approved, false) = false then coalesce(nullif(btrim(existing_profile.membership_status), ''), 'free')
        else affiliate_previous_membership_status
      end,
      affiliate_previous_billing_cycle = case
        when coalesce(existing_profile.affiliate_approved, false) = false then coalesce(nullif(btrim(existing_profile.billing_cycle), ''), 'monthly')
        else affiliate_previous_billing_cycle
      end,
      affiliate_approved = true,
      affiliate_approved_at = coalesce(affiliate_approved_at, timezone('utc', now())),
      affiliate_application_id = new.id,
      plan_tier = 'creator',
      membership_status = 'active',
      billing_cycle = 'monthly'
    where id = existing_profile.id;
  else
    select u.id
    into existing_auth_user_id
    from auth.users u
    where lower(coalesce(u.email, '')) = lower(new.email)
    limit 1;

    if existing_auth_user_id is not null then
      has_existing_auth_user := true;

      insert into public.profiles (
        id,
        email,
        affiliate_approved,
        affiliate_approved_at,
        affiliate_application_id,
        plan_tier,
        membership_status,
        billing_cycle
      )
      values (
        existing_auth_user_id,
        lower(new.email),
        true,
        timezone('utc', now()),
        new.id,
        'creator',
        'active',
        'monthly'
      )
      on conflict (id) do update
      set
        email = excluded.email,
        affiliate_approved = true,
        affiliate_approved_at = coalesce(public.profiles.affiliate_approved_at, excluded.affiliate_approved_at),
        affiliate_application_id = excluded.affiliate_application_id,
        plan_tier = 'creator',
        membership_status = 'active',
        billing_cycle = 'monthly';
    end if;
  end if;

  if has_existing_auth_user then
    template_type_value := 'affiliate_approved_existing_account';
    update public.affiliate_applications
    set invite_token_consumed_at = coalesce(invite_token_consumed_at, timezone('utc', now()))
    where id = new.id;
  else
    if new.invite_token is null or btrim(new.invite_token) = '' then
      raise exception 'AFFILIATE_INVITE_TOKEN_NOT_GENERATED';
    end if;
    template_type_value := 'affiliate_approved';
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
      'template_type', template_type_value,
      'template_data', jsonb_build_object(
        'fullName', coalesce(nullif(new.full_name, ''), 'there'),
        'inviteToken', new.invite_token,
        'approvedEmail', lower(new.email)
      )
    )
  );

  return new;
end;
$$;

create or replace function public.revoke_affiliate_membership(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    affiliate_approved = false,
    affiliate_approved_at = null,
    affiliate_application_id = null,
    plan_tier = coalesce(nullif(btrim(affiliate_previous_plan_tier), ''), plan_tier),
    membership_status = coalesce(nullif(btrim(affiliate_previous_membership_status), ''), membership_status),
    billing_cycle = coalesce(nullif(btrim(affiliate_previous_billing_cycle), ''), billing_cycle),
    affiliate_previous_plan_tier = null,
    affiliate_previous_membership_status = null,
    affiliate_previous_billing_cycle = null
  where id = p_profile_id;
end;
$$;

commit;
