create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users on delete cascade, email text not null, full_name text, default_shipping_address jsonb, is_admin boolean not null default false, stripe_customer_id text);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;
create function public.new_profile() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,email) values(new.id,new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.new_profile();
create table public.categories(id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, parent_id uuid references categories on delete restrict, sort_order integer not null default 0);
create function public.category_depth() returns trigger language plpgsql as $$ begin if new.parent_id is not null and (new.parent_id=new.id or exists(select 1 from categories where id=new.parent_id and parent_id is not null) or exists(select 1 from categories where parent_id=new.id)) then raise exception 'Only one level of nesting is allowed'; end if; return new; end $$;
create trigger category_depth_check before insert or update on categories for each row execute function public.category_depth();
create table public.products(id uuid primary key default gen_random_uuid(), category_id uuid references categories on delete set null, name text not null, slug text unique not null, description text not null default '', price_cents integer not null check(price_cents>0), sku text unique not null, weight_lbs numeric(10,3) not null check(weight_lbs>0), inventory_count integer not null default 0 check(inventory_count>=0), is_active boolean not null default true, created_at timestamptz not null default now());
create table public.product_images(id uuid primary key default gen_random_uuid(),product_id uuid not null references products on delete cascade,url text not null,sort_order integer not null default 0,is_primary boolean not null default false);
create table public.carts(id uuid primary key default gen_random_uuid(),user_id uuid not null unique references profiles on delete cascade,session_id text,created_at timestamptz not null default now());
create table public.cart_items(id uuid primary key default gen_random_uuid(),cart_id uuid not null references carts on delete cascade,product_id uuid not null references products on delete cascade,quantity integer not null check(quantity between 1 and 99),unique(cart_id,product_id));
create table public.settings(id integer primary key default 1 check(id=1),store_name text not null default 'Earth & Thread',store_email text not null default 'hello@example.com',admin_alert_email text not null default 'orders@example.com',origin_zip text not null default '46201',tax_rate_indiana numeric not null default .08 check(tax_rate_indiana between 0 and 1),shipping_fallback_percent numeric not null default .12 check(shipping_fallback_percent between 0 and 1),shipping_fallback_minimum_cents integer not null default 799 check(shipping_fallback_minimum_cents>=0),free_shipping_threshold_cents integer check(free_shipping_threshold_cents>=0),package_length numeric not null default 12 check(package_length>0),package_width numeric not null default 9 check(package_width>0),package_height numeric not null default 4 check(package_height>0),ga4_id text);
insert into settings default values;
-- A draft is a server-only immutable snapshot; stock is reserved atomically before Stripe.
create table public.checkout_drafts(id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete set null,email text not null,shipping_address jsonb not null,billing_address jsonb not null,items jsonb not null,subtotal_cents integer not null,shipping_cents integer not null,tax_cents integer not null,total_cents integer not null,shipping_method text not null,stripe_session_id text unique,state text not null default 'reserved' check(state in ('reserved','paid','released')),created_at timestamptz not null default now());
create table public.orders(id uuid primary key default gen_random_uuid(),order_number bigint generated always as identity unique,user_id uuid references profiles on delete set null,email text not null,status text not null default 'new' check(status in ('new','processing','shipped','delivered','cancelled')),subtotal_cents integer not null,shipping_cents integer not null,tax_cents integer not null,total_cents integer not null,shipping_address jsonb not null,billing_address jsonb not null,shipping_method text not null,tracking_number text,stripe_session_id text not null unique,created_at timestamptz not null default now());
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders on delete cascade,product_id uuid references products on delete set null,product_name_snapshot text not null,product_sku_snapshot text not null,unit_price_cents integer not null,quantity integer not null);
create table public.email_jobs(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders on delete cascade,kind text not null check(kind in ('confirmation','admin','shipping')),dedupe_key text unique not null,payload jsonb not null default '{}',sent_at timestamptz,created_at timestamptz not null default now());
create index orders_user_idx on orders(user_id,created_at desc);
create index products_category_idx on products(category_id);
create index items_order_idx on order_items(order_id);
create index images_product_idx on product_images(product_id);
create index jobs_pending_idx on email_jobs(created_at) where sent_at is null;
-- Never allow profile owners to promote themselves or replace Stripe IDs.
alter table profiles enable row level security;
create policy profile_read on profiles for select using(id=auth.uid() or is_admin());
create policy profile_edit on profiles for update using(id=auth.uid()) with check(id=auth.uid());
revoke update on profiles from authenticated;
grant update(full_name,default_shipping_address) on profiles to authenticated;
alter table categories enable row level security;
create policy categories_read on categories for select using(true);
create policy categories_admin on categories for all to authenticated using(is_admin()) with check(is_admin());
alter table products enable row level security;
create policy products_read on products for select using(is_active or is_admin());
create policy products_admin on products for all to authenticated using(is_admin()) with check(is_admin());
alter table product_images enable row level security;
create policy images_read on product_images for select using(exists(select 1 from products where id=product_id and (is_active or is_admin())));
create policy images_admin on product_images for all to authenticated using(is_admin()) with check(is_admin());
alter table carts enable row level security;
create policy carts_owner on carts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table cart_items enable row level security;
create policy items_owner on cart_items for all to authenticated using(exists(select 1 from carts where id=cart_id and user_id=auth.uid())) with check(exists(select 1 from carts where id=cart_id and user_id=auth.uid()));
alter table orders enable row level security;
create policy orders_read on orders for select to authenticated using(user_id=auth.uid() or is_admin());
create policy orders_admin_update on orders for update to authenticated using(is_admin()) with check(is_admin());
alter table order_items enable row level security;
create policy order_items_read on order_items for select to authenticated using(exists(select 1 from orders where id=order_id and (user_id=auth.uid() or is_admin())));
alter table settings enable row level security;
create policy settings_admin on settings for all to authenticated using(is_admin()) with check(is_admin());
alter table checkout_drafts enable row level security;
alter table email_jobs enable row level security;
-- Public clients cannot read private operational settings. The server projects safe fields.
create function public.reserve_checkout(p_id uuid,p_user uuid,p_email text,p_shipping jsonb,p_billing jsonb,p_items jsonb,p_subtotal integer,p_shipping_cents integer,p_tax integer,p_method text) returns void language plpgsql security definer set search_path=public as $$
declare item jsonb; p products; begin
 for item in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
 select * into p from products where id=(item->>'product_id')::uuid for update;
 if not found or not p.is_active or p.inventory_count < (item->>'quantity')::integer or p.price_cents <> (item->>'unit_price_cents')::integer then raise exception 'Product unavailable or price changed. Refresh your cart.'; end if;
 update products set inventory_count=inventory_count-(item->>'quantity')::integer where id=p.id;
 end loop;
 insert into checkout_drafts(id,user_id,email,shipping_address,billing_address,items,subtotal_cents,shipping_cents,tax_cents,total_cents,shipping_method) values(p_id,p_user,p_email,p_shipping,p_billing,p_items,p_subtotal,p_shipping_cents,p_tax,p_subtotal+p_shipping_cents+p_tax,p_method);
end $$;
create function public.release_checkout(p_id uuid) returns void language plpgsql security definer set search_path=public as $$ declare d checkout_drafts; item jsonb; begin
 select * into d from checkout_drafts where id=p_id for update;
 if d.state='reserved' then
 for item in select value from jsonb_array_elements(d.items) order by value->>'product_id' loop update products set inventory_count=inventory_count+(item->>'quantity')::integer where id=(item->>'product_id')::uuid; end loop;
 update checkout_drafts set state='released' where id=p_id;
 end if;
end $$;
create function public.complete_checkout(p_id uuid,p_session text,p_total integer) returns uuid language plpgsql security definer set search_path=public as $$ declare d checkout_drafts; oid uuid; item jsonb; begin
 select * into d from checkout_drafts where id=p_id for update;
 if not found then raise exception 'Missing checkout'; end if;
 if d.state='paid' then select id into oid from orders where stripe_session_id=p_session; return oid; end if;
 if d.state<>'reserved' or d.total_cents<>p_total or (d.stripe_session_id is not null and d.stripe_session_id<>p_session) then raise exception 'Checkout verification failed'; end if;
 insert into orders(user_id,email,subtotal_cents,shipping_cents,tax_cents,total_cents,shipping_address,billing_address,shipping_method,stripe_session_id) values(d.user_id,d.email,d.subtotal_cents,d.shipping_cents,d.tax_cents,d.total_cents,d.shipping_address,d.billing_address,d.shipping_method,p_session) returning id into oid;
 for item in select value from jsonb_array_elements(d.items) loop insert into order_items(order_id,product_id,product_name_snapshot,product_sku_snapshot,unit_price_cents,quantity) values(oid,(item->>'product_id')::uuid,item->>'name',item->>'sku',(item->>'unit_price_cents')::integer,(item->>'quantity')::integer); end loop;
 update checkout_drafts set state='paid',stripe_session_id=p_session where id=p_id;
 insert into email_jobs(order_id,kind,dedupe_key) values(oid,'confirmation',oid||':confirmation'),(oid,'admin',oid||':admin');
 return oid;
end $$;
create function public.replace_cart(p_items jsonb) returns void language plpgsql security invoker set search_path=public as $$ declare cid uuid; item jsonb; begin
 insert into carts(user_id) values(auth.uid()) on conflict(user_id) do update set user_id=excluded.user_id returning id into cid;
 delete from cart_items where cart_id=cid;
 for item in select value from jsonb_array_elements(p_items) loop insert into cart_items(cart_id,product_id,quantity) values(cid,(item->>'product_id')::uuid,(item->>'quantity')::integer); end loop;
end $$;
revoke all on function reserve_checkout(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer,integer,text), release_checkout(uuid), complete_checkout(uuid,text,integer) from public,anon,authenticated;
grant execute on function reserve_checkout(uuid,uuid,text,jsonb,jsonb,jsonb,integer,integer,integer,text), release_checkout(uuid), complete_checkout(uuid,text,integer) to service_role;
revoke all on function replace_cart(jsonb) from public,anon;
grant execute on function replace_cart(jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('products','products',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy product_storage_read on storage.objects for select using(bucket_id='products');
create policy product_storage_admin on storage.objects for all to authenticated using(bucket_id='products' and public.is_admin()) with check(bucket_id='products' and public.is_admin());
create function public.queue_shipping_email() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if new.tracking_number is not null and new.tracking_number<>'' and (new.tracking_number is distinct from old.tracking_number or (new.status='shipped' and old.status<>'shipped')) then
 insert into email_jobs(order_id,kind,dedupe_key,payload) values(new.id,'shipping',new.id||':shipping:'||new.tracking_number,jsonb_build_object('tracking',new.tracking_number)) on conflict(dedupe_key) do nothing;
 end if;return new;end $$;
create trigger order_shipping_email after update on orders for each row execute function queue_shipping_email();
create function public.save_product(p_product jsonb,p_images jsonb) returns uuid language plpgsql security invoker set search_path=public as $$ declare pid uuid; img text; n integer:=0; begin
 if not is_admin() then raise exception 'Forbidden'; end if;
 pid:=coalesce((p_product->>'id')::uuid,gen_random_uuid());
 insert into products(id,category_id,name,slug,description,price_cents,sku,weight_lbs,inventory_count,is_active) values(pid,(p_product->>'category_id')::uuid,p_product->>'name',p_product->>'slug',p_product->>'description',(p_product->>'price_cents')::integer,p_product->>'sku',(p_product->>'weight_lbs')::numeric,(p_product->>'inventory_count')::integer,(p_product->>'is_active')::boolean) on conflict(id) do update set category_id=excluded.category_id,name=excluded.name,slug=excluded.slug,description=excluded.description,price_cents=excluded.price_cents,sku=excluded.sku,weight_lbs=excluded.weight_lbs,inventory_count=excluded.inventory_count,is_active=excluded.is_active;
 delete from product_images where product_id=pid;
 for img in select jsonb_array_elements_text(p_images) loop insert into product_images(product_id,url,sort_order,is_primary) values(pid,img,n,n=0); n:=n+1; end loop;
 return pid;
 end $$;
revoke all on function save_product(jsonb,jsonb) from public,anon;
grant execute on function save_product(jsonb,jsonb) to authenticated;
create function public.protect_reserved_product() returns trigger language plpgsql security definer set search_path=public as $$ begin
 if exists(select 1 from checkout_drafts d,jsonb_array_elements(d.items) i where d.state='reserved' and i->>'product_id'=old.id::text) then raise exception 'Product has an active checkout. Deactivate it instead.'; end if;return old;end $$;
create trigger protect_reserved_product before delete on products for each row execute function protect_reserved_product();
create function public.dashboard_metrics() returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object('today',jsonb_build_object('count',count(*) filter(where created_at>=date_trunc('day',now())),'revenue',coalesce(sum(total_cents) filter(where created_at>=date_trunc('day',now())),0)),'week',jsonb_build_object('count',count(*) filter(where created_at>=date_trunc('week',now())),'revenue',coalesce(sum(total_cents) filter(where created_at>=date_trunc('week',now())),0)),'month',jsonb_build_object('count',count(*) filter(where created_at>=date_trunc('month',now())),'revenue',coalesce(sum(total_cents) filter(where created_at>=date_trunc('month',now())),0))) from orders where status<>'cancelled' and is_admin()
$$;
create function public.customer_metrics(p_offset integer default 0) returns table(id uuid,email text,full_name text,order_count bigint,lifetime_value bigint) language sql stable security invoker set search_path=public as $$ select p.id,p.email,p.full_name,count(o.id),coalesce(sum(o.total_cents),0)::bigint from profiles p left join orders o on o.user_id=p.id and o.status<>'cancelled' where is_admin() group by p.id order by p.email limit 50 offset p_offset $$;
revoke all on function dashboard_metrics(), customer_metrics(integer) from public,anon;
grant execute on function dashboard_metrics(), customer_metrics(integer) to authenticated;

-- Explicit API privileges work with Supabase's opt-in Data API defaults.
-- These grants permit access to the tables; RLS still authorizes each row.
grant usage on schema public to anon, authenticated, service_role;
grant select on categories, products, product_images to anon, authenticated;
grant select on profiles, carts, cart_items, orders, order_items, settings to authenticated;
grant insert, update, delete on categories, products, product_images, carts, cart_items to authenticated;
grant update(full_name, default_shipping_address) on profiles to authenticated;
grant update on settings to authenticated;
revoke update on orders from authenticated;
grant update(status, tracking_number) on orders to authenticated;
revoke all on checkout_drafts, email_jobs from anon, authenticated;
grant select, insert, update, delete on profiles, categories, products, product_images, carts, cart_items, settings, checkout_drafts, orders, order_items, email_jobs to service_role;
grant usage, select on sequence orders_order_number_seq to service_role;
grant execute on function is_admin() to anon, authenticated, service_role;
