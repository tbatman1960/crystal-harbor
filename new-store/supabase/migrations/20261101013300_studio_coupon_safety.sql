create or replace function public.attach_studio_coupon(p_draft uuid,p_code text) returns integer language plpgsql security invoker set search_path=public as $$
declare d public.checkout_drafts; c public.studio_coupons; amount integer:=0; begin
 select * into d from public.checkout_drafts where id=p_draft for update;
 if not found or d.state<>'reserved' then raise exception 'Checkout unavailable'; end if;
 if p_code<>'' then
  select * into c from public.studio_coupons where code=upper(trim(p_code)) for update;
  if not found or not c.active or c.expires_at<=now() or lower(c.email)<>lower(d.email) or c.redeemed_order_id is not null or d.subtotal_cents<c.minimum_cents or (c.reserved_draft is not null and c.reserved_draft<>p_draft and exists(select 1 from public.checkout_drafts where id=c.reserved_draft and state='reserved')) then raise exception 'Coupon unavailable for this email or order'; end if;
  amount:=floor(d.subtotal_cents::numeric*c.percent/100)::integer;
  update public.studio_coupons set reserved_draft=p_draft,reserved_until=now()+interval '35 minutes' where id=c.id;
 end if;
 update public.checkout_drafts set studio=true,discount_cents=amount,studio_coupon_id=c.id,total_cents=subtotal_cents+shipping_cents+tax_cents-amount where id=p_draft;
 return amount;
end $$;
create function public.cancel_studio_reward() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if new.status='cancelled' and old.status is distinct from new.status then
  update public.studio_coupons set active=false where source_order_id=new.id and redeemed_order_id is null;
 end if;
 return new;
end $$;
revoke all on function public.cancel_studio_reward() from public,anon,authenticated;
grant execute on function public.cancel_studio_reward() to service_role;
create trigger cancel_studio_reward after update of status on public.orders for each row execute function public.cancel_studio_reward();
