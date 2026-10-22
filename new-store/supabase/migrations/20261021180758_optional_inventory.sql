alter table public.products add column track_inventory boolean not null default true;
alter table public.products alter column weight_lbs drop not null;
create or replace function public.save_product(p_product jsonb,p_images jsonb) returns uuid language plpgsql security invoker set search_path=public as $$ declare pid uuid; img text; n integer:=0; begin
 if not is_admin() then raise exception 'Forbidden'; end if;
 pid:=coalesce((p_product->>'id')::uuid,gen_random_uuid());
 insert into products(id,category_id,name,slug,description,price_cents,sku,weight_lbs,inventory_count,is_active,shipping_first_unit_cents,shipping_additional_unit_cents,design_slug,size_label,shipping_group,track_inventory) values(pid,(p_product->>'category_id')::uuid,p_product->>'name',p_product->>'slug',p_product->>'description',(p_product->>'price_cents')::integer,p_product->>'sku',(p_product->>'weight_lbs')::numeric,(p_product->>'inventory_count')::integer,(p_product->>'is_active')::boolean,(p_product->>'shipping_first_unit_cents')::integer,(p_product->>'shipping_additional_unit_cents')::integer,nullif(p_product->>'design_slug',''),nullif(p_product->>'size_label',''),nullif(p_product->>'shipping_group',''),coalesce((p_product->>'track_inventory')::boolean,true)) on conflict(id) do update set category_id=excluded.category_id,name=excluded.name,slug=excluded.slug,description=excluded.description,price_cents=excluded.price_cents,sku=excluded.sku,weight_lbs=excluded.weight_lbs,inventory_count=excluded.inventory_count,is_active=excluded.is_active,shipping_first_unit_cents=excluded.shipping_first_unit_cents,shipping_additional_unit_cents=excluded.shipping_additional_unit_cents,design_slug=excluded.design_slug,size_label=excluded.size_label,shipping_group=excluded.shipping_group,track_inventory=excluded.track_inventory;
 delete from product_images where product_id=pid;
 for img in select jsonb_array_elements_text(p_images) loop insert into product_images(product_id,url,sort_order,is_primary) values(pid,img,n,n=0); n:=n+1; end loop;
 return pid;
 end $$;


create or replace function public.reserve_checkout(p_id uuid,p_user uuid,p_email text,p_shipping jsonb,p_billing jsonb,p_items jsonb,p_subtotal integer,p_shipping_cents integer,p_tax integer,p_method text) returns void language plpgsql security definer set search_path=public as $$
declare item jsonb; p products; reserved_items jsonb := '[]'::jsonb; begin
 for item in select value from jsonb_array_elements(p_items) order by value->>'product_id' loop
 select * into p from products where id=(item->>'product_id')::uuid for update;
 if not found or not p.is_active or (p.track_inventory and p.inventory_count < (item->>'quantity')::integer) or p.price_cents <> (item->>'unit_price_cents')::integer or p.shipping_first_unit_cents is distinct from (item->>'shipping_first_unit_cents')::integer or p.shipping_additional_unit_cents is distinct from (item->>'shipping_additional_unit_cents')::integer then raise exception 'Product unavailable or price changed. Refresh your cart.'; end if;
 if p.track_inventory then update products set inventory_count=inventory_count-(item->>'quantity')::integer where id=p.id; end if;
 reserved_items := reserved_items || jsonb_build_array(item || jsonb_build_object('inventory_reserved',p.track_inventory));
 end loop;
 insert into checkout_drafts(id,user_id,email,shipping_address,billing_address,items,subtotal_cents,shipping_cents,tax_cents,total_cents,shipping_method) values(p_id,p_user,p_email,p_shipping,p_billing,reserved_items,p_subtotal,p_shipping_cents,p_tax,p_subtotal+p_shipping_cents+p_tax,p_method);
end $$;

create or replace function public.release_checkout(p_id uuid) returns void language plpgsql security definer set search_path=public as $$ declare d checkout_drafts; item jsonb; begin
 select * into d from checkout_drafts where id=p_id for update;
 if d.state='reserved' then
 for item in select value from jsonb_array_elements(d.items) order by value->>'product_id' loop update products set inventory_count=inventory_count+(item->>'quantity')::integer where id=(item->>'product_id')::uuid and coalesce((item->>'inventory_reserved')::boolean,true); end loop;
 update checkout_drafts set state='released' where id=p_id;
 end if;
end $$;
