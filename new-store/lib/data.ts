import 'server-only';
import { cache } from 'react';
import { db, service, check } from './supabase';
import type { Settings, Product, Category } from './types';
export const settings = cache(async (): Promise<Settings> => {
  const { data, error } = await service()
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();
  check(error);
  return data;
});
export async function catalog(search = '', category = ''): Promise<Product[]> {
  const client = db();
  let q = client
    .from('products')
    .select('*,product_images(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .order('name');
  if (search) q = q.ilike('name', `%${search.replace(/[%_\\]/g, '')}%`);
  if (category) {
    const { data } = await client
      .from('categories')
      .select('id,parent_id')
      .or(`slug.eq.${category.replace(/[^a-z0-9-]/g, '')}`);
    if (data?.length) {
      const { data: children } = await client
        .from('categories')
        .select('id')
        .eq('parent_id', data[0].id);
      q = q.in('category_id', [
        data[0].id,
        ...(children || []).map((c) => c.id),
      ]);
    } else return [];
  }
  const { data, error } = await q;
  check(error);
  return data || [];
}
export async function categories(): Promise<Category[]> {
  const { data, error } = await db()
    .from('categories')
    .select('*')
    .order('sort_order');
  check(error);
  return data || [];
}
