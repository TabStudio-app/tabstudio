begin;

create or replace function public.revoke_affiliate_membership(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  fn_base_url text;
  service_jwt text;
  profile_email text;
begin
  select lower(coalesce(email, ''))
  into profile_email
  from public.profiles
  where id = p_profile_id;

  update public.profiles
  set
    affiliate_approved = false,
    affiliate_approved_at = null,
    affiliate_application_id = null,
    plan_tier = 'free',
    membership_status = 'free',
    billing_cycle = 'monthly',
    affiliate_previous_plan_tier = null,
    affiliate_previous_membership_status = null,
    affiliate_previous_billing_cycle = null
  where id = p_profile_id;

  if profile_email is null or btrim(profile_email) = '' then
    return;
  end if;

  -- Keep Stripe from auto-renewing if an active subscription still exists.
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
    return;
  end if;

  perform net.http_post(
    url := fn_base_url || '/sync-affiliate-billing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_jwt,
      'apikey', service_jwt
    ),
    body := jsonb_build_object(
      'email', profile_email,
      'supabase_user_id', p_profile_id
    )
  );
end;
$$;

comment on function public.revoke_affiliate_membership(uuid)
is 'Revokes affiliate access, downgrades account to free, and schedules Stripe non-renewal. User must manually subscribe again.';

commit;
