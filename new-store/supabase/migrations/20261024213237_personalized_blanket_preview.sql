-- Additive preview features: existing product data, carts and checkout RPCs are unchanged.
create table public.personalizations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.profiles on delete set null,
 product_id uuid not null references public.products on delete restrict,
 session_hash text not null check(length(session_hash)=64),
 request_hash text not null check(length(request_hash)=64),
 deleting boolean not null default false,
 config jsonb not null,
 source_path text not null,
 artwork_path text not null,
 approved_at timestamptz not null,
 created_at timestamptz not null default now()
);
alter table public.personalizations enable row level security;
revoke all on public.personalizations from public,anon,authenticated;
grant select,insert,update,delete on public.personalizations to service_role;
create index personalizations_rate_idx on public.personalizations(request_hash,created_at);
create index personalizations_expiry_idx on public.personalizations(created_at);
alter table public.order_items add column personalization_id uuid references public.personalizations on delete restrict;
alter table public.order_items add column personalization_snapshot jsonb;
create index order_items_personalization_idx on public.order_items(personalization_id) where personalization_id is not null;
create table public.personalization_carts (
 user_id uuid primary key references public.profiles on delete cascade,
 items jsonb not null default '[]'::jsonb check(jsonb_typeof(items)='array' and jsonb_array_length(items)<=50),
 updated_at timestamptz not null default now()
);
alter table public.personalization_carts enable row level security;
create policy personalization_cart_owner on public.personalization_carts for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke all on public.personalization_carts from public,anon;
grant select,insert,update,delete on public.personalization_carts to authenticated,service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('personalization-private','personalization-private',false,5242880,array['image/jpeg','image/svg+xml']);
-- No public/owner Storage policies: server routes verify cookie/account/order ownership.
create function public.complete_personalized_checkout(p_id uuid,p_session text,p_total integer) returns uuid language plpgsql security definer set search_path=public as $$ declare d checkout_drafts; oid uuid; item jsonb; begin
 select * into d from checkout_drafts where id=p_id for update;
 if not found then raise exception 'Missing checkout'; end if;
 if d.state='paid' then select id into oid from orders where stripe_session_id=p_session; return oid; end if;
 if d.state<>'reserved' or d.total_cents<>p_total or (d.stripe_session_id is not null and d.stripe_session_id<>p_session) then raise exception 'Checkout verification failed'; end if;
 insert into orders(user_id,email,subtotal_cents,shipping_cents,tax_cents,total_cents,shipping_address,billing_address,shipping_method,stripe_session_id) values(d.user_id,d.email,d.subtotal_cents,d.shipping_cents,d.tax_cents,d.total_cents,d.shipping_address,d.billing_address,d.shipping_method,p_session) returning id into oid;
 for item in select value from jsonb_array_elements(d.items) loop insert into order_items(order_id,product_id,product_name_snapshot,product_sku_snapshot,unit_price_cents,quantity,personalization_id,personalization_snapshot) values(oid,(item->>'product_id')::uuid,item->>'name',item->>'sku',(item->>'unit_price_cents')::integer,(item->>'quantity')::integer,nullif(item->>'personalization_id','')::uuid,item->'personalization_snapshot'); end loop;
 update checkout_drafts set state='paid',stripe_session_id=p_session where id=p_id;
 insert into email_jobs(order_id,kind,dedupe_key) values(oid,'confirmation',oid||':confirmation'),(oid,'admin',oid||':admin');
 return oid;
end $$;
revoke all on function public.complete_personalized_checkout(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.complete_personalized_checkout(uuid,text,integer) to service_role;

-- Serialize deletion against reservation so a paid order cannot lose its artwork.
create function public.reserve_personalized_checkout(p_id uuid,p_user uuid,p_email text,p_shipping jsonb,p_billing jsonb,p_items jsonb,p_subtotal integer,p_shipping_cents integer,p_tax integer,p_method text) returns void language plpgsql security definer set search_path=public as $$
declare item jsonb; art personalizations; begin
 for item in select value from jsonb_array_elements(p_items) where value->>'personalization_id' is not null order by value->>'personalization_id' loop
  select * into art from personalizations where id=(item->>'personalization_id')::uuid for update;
  if not found or art.deleting or art.product_id<>(item->>'product_id')::uuid then raise exception 'Personalized artwork unavailable. Please customize this size again.'; end if;
 end loop;
 perform reserve_checkout(p_id,p_user,p_email,p_shipping,p_billing,p_items,p_subtotal,p_shipping_cents,p_tax,p_method);
end $$;
revoke all on function public.reserve_personalized_checkout(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_personalized_checkout(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer,integer,text) to service_role;
create function public.prepare_personalization_delete(p_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
begin
 perform 1 from personalizations where id=p_id for update;
 if not found then return false; end if;
 if exists(select 1 from order_items where personalization_id=p_id) or exists(select 1 from checkout_drafts where state='reserved' and items @> jsonb_build_array(jsonb_build_object('personalization_id',p_id))) then return false; end if;
 update personalizations set deleting=true where id=p_id;
 return true;
end $$;
revoke all on function public.prepare_personalization_delete(uuid) from public,anon,authenticated;
grant execute on function public.prepare_personalization_delete(uuid) to service_role;
