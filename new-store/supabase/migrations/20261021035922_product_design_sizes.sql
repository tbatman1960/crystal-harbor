-- Sizes stay independent SKUs; optional design groups link related ready-made items.
alter table public.products
 add column design_slug text check (design_slug is null or (length(design_slug)<=100 and design_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')),
 add column size_label text check (size_label is null or length(size_label) between 1 and 80);
create index products_design_idx on public.products(design_slug) where design_slug is not null;

create or replace function public.save_product(p_product jsonb,p_images jsonb) returns uuid language plpgsql security invoker set search_path=public as $$ declare pid uuid; img text; n integer:=0; begin
 if not is_admin() then raise exception 'Forbidden'; end if;
 pid:=coalesce((p_product->>'id')::uuid,gen_random_uuid());
 insert into products(id,category_id,name,slug,description,price_cents,sku,weight_lbs,inventory_count,is_active,shipping_first_unit_cents,shipping_additional_unit_cents,design_slug,size_label) values(pid,(p_product->>'category_id')::uuid,p_product->>'name',p_product->>'slug',p_product->>'description',(p_product->>'price_cents')::integer,p_product->>'sku',(p_product->>'weight_lbs')::numeric,(p_product->>'inventory_count')::integer,(p_product->>'is_active')::boolean,(p_product->>'shipping_first_unit_cents')::integer,(p_product->>'shipping_additional_unit_cents')::integer,nullif(p_product->>'design_slug',''),nullif(p_product->>'size_label','')) on conflict(id) do update set category_id=excluded.category_id,name=excluded.name,slug=excluded.slug,description=excluded.description,price_cents=excluded.price_cents,sku=excluded.sku,weight_lbs=excluded.weight_lbs,inventory_count=excluded.inventory_count,is_active=excluded.is_active,shipping_first_unit_cents=excluded.shipping_first_unit_cents,shipping_additional_unit_cents=excluded.shipping_additional_unit_cents,design_slug=excluded.design_slug,size_label=excluded.size_label;
 delete from product_images where product_id=pid;
 for img in select jsonb_array_elements_text(p_images) loop insert into product_images(product_id,url,sort_order,is_primary) values(pid,img,n,n=0); n:=n+1; end loop;
 return pid;
 end $$;

