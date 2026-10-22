-- Keep the privileged role lookup outside the exposed API schema.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id=(select auth.uid())), false)
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;
create or replace function public.is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$ select private.is_admin() $$;
revoke all on function public.new_profile(), public.protect_reserved_product(), public.queue_shipping_email() from public, anon, authenticated;
alter function public.category_depth() set search_path = public;

-- Evaluate account identity once per statement rather than once per row.
alter policy profile_read on public.profiles using (id=(select auth.uid()) or (select private.is_admin()));
alter policy profile_edit on public.profiles using (id=(select auth.uid())) with check (id=(select auth.uid()));
alter policy carts_owner on public.carts using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
alter policy items_owner on public.cart_items using (exists(select 1 from public.carts where id=cart_id and user_id=(select auth.uid()))) with check (exists(select 1 from public.carts where id=cart_id and user_id=(select auth.uid())));
alter policy orders_read on public.orders using (user_id=(select auth.uid()) or (select private.is_admin()));
alter policy orders_admin_update on public.orders using ((select private.is_admin())) with check ((select private.is_admin()));
alter policy order_items_read on public.order_items using (exists(select 1 from public.orders where id=order_id and (user_id=(select auth.uid()) or (select private.is_admin()))));
alter policy products_read on public.products using (is_active or (select private.is_admin()));
alter policy images_read on public.product_images using (exists(select 1 from public.products where id=product_id and (is_active or (select private.is_admin()))));
alter policy settings_admin on public.settings using ((select private.is_admin())) with check ((select private.is_admin()));

-- Public read policies already allow admins to read. Separate write policies
-- avoid evaluating redundant permissive SELECT policies for every row.
drop policy categories_admin on public.categories;
drop policy products_admin on public.products;
drop policy images_admin on public.product_images;
create policy categories_insert on public.categories for insert to authenticated with check ((select private.is_admin()));
create policy categories_update on public.categories for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_delete on public.categories for delete to authenticated using ((select private.is_admin()));
create policy products_insert on public.products for insert to authenticated with check ((select private.is_admin()));
create policy products_update on public.products for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy products_delete on public.products for delete to authenticated using ((select private.is_admin()));
create policy images_insert on public.product_images for insert to authenticated with check ((select private.is_admin()));
create policy images_update on public.product_images for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy images_delete on public.product_images for delete to authenticated using ((select private.is_admin()));

create index categories_parent_idx on public.categories(parent_id);
create index cart_items_product_idx on public.cart_items(product_id);
create index checkout_drafts_user_idx on public.checkout_drafts(user_id);
create index email_jobs_order_idx on public.email_jobs(order_id);
create index order_items_product_idx on public.order_items(product_id);
