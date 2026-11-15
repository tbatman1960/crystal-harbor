alter table public.website_collaborators add column role text not null default 'collaborator' check(role in ('collaborator','products'));
alter table public.website_collaborators add column catalog_active boolean not null default false;
-- Product-only members never satisfy the old website-only active predicate, even on retained deploys.
alter table public.website_collaborators add constraint collaborator_role_access check((role='collaborator' and not catalog_active) or (role='products' and not active and not can_publish));
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
-- This narrow helper must read the private roster and verified Auth identity; callers can only ask about themselves.
create function private.can_manage_catalog() returns boolean language sql stable security definer set search_path='' as $$
 select public.is_admin() or exists(
  select 1 from auth.users u join public.website_collaborators c on c.email=lower(u.email)
  where u.id=(select auth.uid()) and u.email_confirmed_at is not null
  and ((c.role='collaborator' and c.active) or (c.role='products' and c.catalog_active))
 )
$$;
revoke all on function private.can_manage_catalog() from public,anon;
grant execute on function private.can_manage_catalog() to authenticated;
create policy catalog_product_access on public.products for all to authenticated using((select private.can_manage_catalog())) with check((select private.can_manage_catalog()));
create policy catalog_image_access on public.product_images for all to authenticated using((select private.can_manage_catalog())) with check((select private.can_manage_catalog()));
create policy catalog_category_access on public.categories for all to authenticated using((select private.can_manage_catalog())) with check((select private.can_manage_catalog()));
create policy catalog_storage_access on storage.objects for all to authenticated using(bucket_id='products' and (select private.can_manage_catalog())) with check(bucket_id='products' and (select private.can_manage_catalog()));
create or replace function public.save_product(p_product jsonb,p_images jsonb) returns uuid language plpgsql security invoker set search_path=public as $$ declare pid uuid; img text; n integer:=0; begin
 if not private.can_manage_catalog() then raise exception 'Forbidden'; end if;
 pid:=coalesce((p_product->>'id')::uuid,gen_random_uuid());
 insert into products(id,category_id,name,slug,description,price_cents,sku,weight_lbs,inventory_count,is_active,shipping_first_unit_cents,shipping_additional_unit_cents,design_slug,size_label,shipping_group,track_inventory) values(pid,(p_product->>'category_id')::uuid,p_product->>'name',p_product->>'slug',p_product->>'description',(p_product->>'price_cents')::integer,p_product->>'sku',(p_product->>'weight_lbs')::numeric,(p_product->>'inventory_count')::integer,(p_product->>'is_active')::boolean,(p_product->>'shipping_first_unit_cents')::integer,(p_product->>'shipping_additional_unit_cents')::integer,nullif(p_product->>'design_slug',''),nullif(p_product->>'size_label',''),nullif(p_product->>'shipping_group',''),coalesce((p_product->>'track_inventory')::boolean,true)) on conflict(id) do update set category_id=excluded.category_id,name=excluded.name,slug=excluded.slug,description=excluded.description,price_cents=excluded.price_cents,sku=excluded.sku,weight_lbs=excluded.weight_lbs,inventory_count=excluded.inventory_count,is_active=excluded.is_active,shipping_first_unit_cents=excluded.shipping_first_unit_cents,shipping_additional_unit_cents=excluded.shipping_additional_unit_cents,design_slug=excluded.design_slug,size_label=excluded.size_label,shipping_group=excluded.shipping_group,track_inventory=excluded.track_inventory;
 delete from product_images where product_id=pid;
 for img in select jsonb_array_elements_text(p_images) loop insert into product_images(product_id,url,sort_order,is_primary) values(pid,img,n,n=0); n:=n+1; end loop;
 return pid;
 end $$;


