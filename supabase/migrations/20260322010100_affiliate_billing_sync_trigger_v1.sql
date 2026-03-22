begin;

create or replace function public.sync_affiliate_billing_on_status_change()
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

  perform net.http_post(
    url := fn_base_url || '/sync-affiliate-billing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_jwt,
      'apikey', service_jwt
    ),
    body := jsonb_build_object(
      'email', lower(new.email),
      'affiliate_application_id', new.id
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_sync_affiliate_billing_on_status_change on public.affiliate_applications;
create trigger trg_sync_affiliate_billing_on_status_change
after update on public.affiliate_applications
for each row
execute function public.sync_affiliate_billing_on_status_change();

commit;
