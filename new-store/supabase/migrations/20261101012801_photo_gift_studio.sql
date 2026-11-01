-- Additive tables used only by the Photo Gift Studio preview.
create table public.studio_settings (
 id integer primary key default 1 check(id=1), rewards_enabled boolean not null default true,
 reward_threshold_cents integer not null default 7500 check(reward_threshold_cents between 100 and 1000000),
 reward_percent integer not null default 10 check(reward_percent between 1 and 50),
 reward_minimum_cents integer not null default 4000 check(reward_minimum_cents between 100 and 1000000),
 reward_valid_days integer not null default 30 check(reward_valid_days between 1 and 365)
);
insert into public.studio_settings default values;
alter table public.studio_settings enable row level security;
revoke all on public.studio_settings from public,anon,authenticated;
grant select,insert,update,delete on public.studio_settings to service_role;
create table public.studio_coupons (
 id uuid primary key default gen_random_uuid(), code text unique not null, email text not null,
 source_order_id uuid unique references public.orders on delete restrict,
 percent integer not null check(percent between 1 and 50), minimum_cents integer not null check(minimum_cents>=100),
 expires_at timestamptz not null, active boolean not null default true,
 reserved_draft uuid references public.checkout_drafts on delete set null, reserved_until timestamptz,
 redeemed_order_id uuid unique references public.orders on delete restrict, created_at timestamptz not null default now()
);
alter table public.studio_coupons enable row level security;
revoke all on public.studio_coupons from public,anon,authenticated;
grant select,insert,update,delete on public.studio_coupons to service_role;
create index studio_coupons_email_idx on public.studio_coupons(lower(email));
alter table public.checkout_drafts add column studio boolean not null default false, add column discount_cents integer not null default 0 check(discount_cents>=0), add column studio_coupon_id uuid references public.studio_coupons;
alter table public.orders add column studio boolean not null default false, add column discount_cents integer not null default 0 check(discount_cents>=0);
create index studio_coupons_draft_idx on public.studio_coupons(reserved_draft);
create index studio_coupons_redeemed_idx on public.studio_coupons(redeemed_order_id);
create index studio_draft_coupon_idx on public.checkout_drafts(studio_coupon_id);
create table public.studio_reviews (
 id uuid primary key default gen_random_uuid(), order_item_id uuid unique not null references public.order_items on delete cascade,
 product_id uuid not null references public.products on delete cascade, design_slug text,
 rating integer not null check(rating between 1 and 5), display_name text not null check(length(display_name) between 1 and 40),
 title text not null check(length(title) between 2 and 100), body text not null check(length(body) between 10 and 2000),
 status text not null default 'pending' check(status in ('pending','published','hidden')),
 admin_reply text check(length(admin_reply)<=1000), created_at timestamptz not null default now()
);
alter table public.studio_reviews enable row level security;
revoke all on public.studio_reviews from public,anon,authenticated;
grant select,insert,update,delete on public.studio_reviews to service_role;
create index studio_reviews_product_idx on public.studio_reviews(product_id,status);
create index studio_reviews_design_idx on public.studio_reviews(design_slug,status,created_at desc);
alter table public.illustration_jobs add column stage text not null default 'queued' check(stage in ('queued','preparing','generating','finishing','ready','failed'));
create table public.studio_carts (user_id uuid primary key references public.profiles on delete cascade, items jsonb not null default '[]',updated_at timestamptz not null default now());
alter table public.studio_carts enable row level security;
revoke all on public.studio_carts from public,anon,authenticated;
grant select,insert,update,delete on public.studio_carts to authenticated,service_role;
create policy studio_cart_owner on public.studio_carts for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create function public.attach_studio_coupon(p_draft uuid,p_code text) returns integer language plpgsql security invoker set search_path=public as $$
declare d public.checkout_drafts; c public.studio_coupons; amount integer:=0; begin
 select * into d from public.checkout_drafts where id=p_draft for update;
 if not found or d.state<>'reserved' then raise exception 'Checkout unavailable'; end if;
 if p_code<>'' then
  select * into c from public.studio_coupons where code=upper(trim(p_code)) for update;
  if not found or not c.active or c.expires_at<=now() or lower(c.email)<>lower(d.email) or c.redeemed_order_id is not null or d.subtotal_cents<c.minimum_cents or (c.reserved_draft is not null and c.reserved_draft<>p_draft and exists(select 1 from public.checkout_drafts where id=c.reserved_draft and state='reserved') and c.reserved_until>now()) then raise exception 'Coupon unavailable for this email or order'; end if;
  amount:=floor(d.subtotal_cents::numeric*c.percent/100)::integer;
  update public.studio_coupons set reserved_draft=p_draft,reserved_until=now()+interval '35 minutes' where id=c.id;
 end if;
 update public.checkout_drafts set studio=true,discount_cents=amount,studio_coupon_id=c.id,total_cents=subtotal_cents+shipping_cents+tax_cents-amount where id=p_draft;
 return amount;
end $$;
revoke all on function public.attach_studio_coupon(uuid,text) from public,anon,authenticated;
grant execute on function public.attach_studio_coupon(uuid,text) to service_role;

create function public.complete_studio_checkout(p_id uuid,p_session text,p_total integer) returns uuid language plpgsql security invoker set search_path=public as $$
declare d public.checkout_drafts; oid uuid; cfg public.studio_settings; begin
 select * into d from public.checkout_drafts where id=p_id for update;
 if not found or not d.studio then raise exception 'Studio checkout not found'; end if;
 oid:=public.complete_personalized_checkout(p_id,p_session,p_total);
 if oid is null then raise exception 'Checkout verification failed'; end if;
 update public.orders set studio=true,discount_cents=d.discount_cents where id=oid;
 if d.studio_coupon_id is not null then update public.studio_coupons set redeemed_order_id=oid where id=d.studio_coupon_id and reserved_draft=p_id and (redeemed_order_id is null or redeemed_order_id=oid); if not found then raise exception 'Coupon reservation lost'; end if; end if;
 select * into cfg from public.studio_settings where id=1;
 if cfg.rewards_enabled and d.subtotal_cents-d.discount_cents>=cfg.reward_threshold_cents then
  insert into public.studio_coupons(code,email,source_order_id,percent,minimum_cents,expires_at)
  values('COZY-'||upper(replace(gen_random_uuid()::text,'-','')),lower(d.email),oid,cfg.reward_percent,cfg.reward_minimum_cents,now()+make_interval(days=>cfg.reward_valid_days)) on conflict(source_order_id) do nothing;
 end if;
 return oid;
end $$;
revoke all on function public.complete_studio_checkout(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.complete_studio_checkout(uuid,text,integer) to service_role;
