-- Flat shipping is configured per product. NULL means the owner must configure it;
-- zero is an explicit free-shipping choice, never an accidental default.
alter table public.products
  add column shipping_first_unit_cents integer check (shipping_first_unit_cents between 0 and 1000000),
  add column shipping_additional_unit_cents integer not null default 0 check (shipping_additional_unit_cents between 0 and 1000000);

create or replace function public.save_product(p_product jsonb,p_images jsonb) returns uuid language plpgsql security invoker set search_path=public as $$ declare pid uuid; img text; n integer:=0; begin
 if not is_admin() then raise exception 'Forbidden'; end if;
 pid:=coalesce((p_product->>'id')::uuid,gen_random_uuid());
 insert into products(id,category_id,name,slug,description,price_cents,sku,weight_lbs,inventory_count,is_active,shipping_first_unit_cents,shipping_additional_unit_cents) values(pid,(p_product->>'category_id')::uuid,p_product->>'name',p_product->>'slug',p_product->>'description',(p_product->>'price_cents')::integer,p_product->>'sku',(p_product->>'weight_lbs')::numeric,(p_product->>'inventory_count')::integer,(p_product->>'is_active')::boolean,(p_product->>'shipping_first_unit_cents')::integer,(p_product->>'shipping_additional_unit_cents')::integer) on conflict(id) do update set category_id=excluded.category_id,name=excluded.name,slug=excluded.slug,description=excluded.description,price_cents=excluded.price_cents,sku=excluded.sku,weight_lbs=excluded.weight_lbs,inventory_count=excluded.inventory_count,is_active=excluded.is_active,shipping_first_unit_cents=excluded.shipping_first_unit_cents,shipping_additional_unit_cents=excluded.shipping_additional_unit_cents;
 delete from product_images where product_id=pid;
 for img in select jsonb_array_elements_text(p_images) loop insert into product_images(product_id,url,sort_order,is_primary) values(pid,img,n,n=0); n:=n+1; end loop;
 return pid;
 end $$;

create or replace function public.reserve_checkout(p_id uuid,p_user uuid,p_email text,p_shipping jsonb,p_billing jsonb,p_items jsonb,p_subtotal integer,p_shipping_cents integer,p_tax integer,p_method text) returns void language plpgsql security definer set search_path=public as $$
declare item jsonb; p products; begin
 for item in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
 select * into p from products where id=(item->>'product_id')::uuid for update;
 if not found or not p.is_active or p.inventory_count < (item->>'quantity')::integer or p.price_cents <> (item->>'unit_price_cents')::integer or p.shipping_first_unit_cents is distinct from (item->>'shipping_first_unit_cents')::integer or p.shipping_additional_unit_cents is distinct from (item->>'shipping_additional_unit_cents')::integer then raise exception 'Product unavailable or price changed. Refresh your cart.'; end if;
 update products set inventory_count=inventory_count-(item->>'quantity')::integer where id=p.id;
 end loop;
 insert into checkout_drafts(id,user_id,email,shipping_address,billing_address,items,subtotal_cents,shipping_cents,tax_cents,total_cents,shipping_method) values(p_id,p_user,p_email,p_shipping,p_billing,p_items,p_subtotal,p_shipping_cents,p_tax,p_subtotal+p_shipping_cents+p_tax,p_method);
end $$;
