create or replace function public.cancel_studio_reward() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status='cancelled' and old.status is distinct from new.status then
  update public.studio_coupons set active=false where source_order_id=new.id and redeemed_order_id is null;
 end if;
 return new;
end $$;
-- Trigger-only function (no caller-supplied IDs); preserves existing RLS-authorized admin order updates.
revoke all on function public.cancel_studio_reward() from public,anon,authenticated;
grant execute on function public.cancel_studio_reward() to service_role;
