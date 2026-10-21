import { createClient } from '@supabase/supabase-js';
import { sampleCategories, sampleProducts } from '../lib/sample-catalog';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error('Load .env.local before running seed (see README).');
const client = createClient(url, key, { auth: { persistSession: false } });
async function seed() {
  const { data: cats, error } = await client
    .from('categories')
    .upsert(sampleCategories, { onConflict: 'slug' })
    .select();
  if (error) throw error;
  for (const sample of sampleProducts) {
    const { category_slug, images, ...fields } = sample;
    const { data: p, error } = await client
      .from('products')
      .upsert(
        {
          ...fields,
          category_id: cats!.find((c) => c.slug === category_slug)!.id,
        },
        { onConflict: 'slug' },
      )
      .select()
      .single();
    if (error) throw error;
    const { error: remove } = await client
      .from('product_images')
      .delete()
      .eq('product_id', p.id);
    if (remove) throw remove;
    const { error: insert } = await client
      .from('product_images')
      .insert(
        images.map((path, i) => ({
          product_id: p.id,
          url: `${process.env.SITE_URL || 'http://localhost:3000'}${path}`,
          sort_order: i,
          is_primary: i === 0,
        })),
      );
    if (insert) throw insert;
  }
  console.log(
    'Seeded 3 blanket categories and 12 size-specific sample SKUs across 4 designs. Re-running resets sample stock and prices.',
  );
}
seed().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
