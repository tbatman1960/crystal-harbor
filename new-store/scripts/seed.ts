import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error('Load .env.local before running seed (see README).');
const client = createClient(url, key, { auth: { persistSession: false } });
async function seed() {
  const { data: cats, error } = await client
    .from('categories')
    .upsert(
      [
        { name: 'Jewelry & Beads', slug: 'jewelry-beads', sort_order: 0 },
        { name: 'Crystals & Stones', slug: 'crystals-stones', sort_order: 1 },
        { name: 'Objects & Home', slug: 'objects-home', sort_order: 2 },
      ],
      { onConflict: 'slug' },
    )
    .select();
  if (error) throw error;
  const samples: [string, string, number, number, number, string][] = [
    [
      'Amethyst Point',
      'crystals-stones',
      1800,
      0.35,
      12,
      'A natural amethyst point with soft violet tones. Approximately 2–3 inches tall; each stone has its own beautiful markings.',
    ],
    [
      'Rose Quartz Palm Stone',
      'crystals-stones',
      1400,
      0.25,
      20,
      'A smooth, polished rose quartz stone in delicate pink. A lovely companion for your desk or bedside.',
    ],
    [
      'Clear Quartz Cluster',
      'crystals-stones',
      3200,
      0.7,
      8,
      'A small clear quartz cluster with naturally formed points. Each specimen varies in shape and clarity.',
    ],
    [
      'Moss Agate Bracelet',
      'jewelry-beads',
      2400,
      0.08,
      16,
      'Earthy green moss agate beads on a simple stretch bracelet. Approximately 7 inches in circumference.',
    ],
    [
      'Golden Hour Earrings',
      'jewelry-beads',
      2800,
      0.04,
      9,
      'Simple gold-tone stainless steel drop earrings with a warm, understated finish. Approximately 1.25 inches long.',
    ],
    [
      'Riverstone Bead Necklace',
      'jewelry-beads',
      3800,
      0.12,
      7,
      'Neutral riverstone beads on an 18-inch stainless steel chain. An easy everyday layer.',
    ],
    [
      'Lava Stone Bracelet',
      'jewelry-beads',
      1600,
      0.08,
      22,
      'Matte black lava stone beads, strung on stretch cord. Approximately 7 inches in circumference.',
    ],
    [
      'Little Stone Dish',
      'objects-home',
      2200,
      0.8,
      6,
      'A small carved stone dish for jewelry and pocket treasures. Approximately 4 inches across.',
    ],
    [
      'Selenite Wand',
      'crystals-stones',
      1200,
      0.3,
      18,
      'A smooth white selenite wand, approximately 4 inches long. Keep dry; selenite is a delicate natural mineral.',
    ],
    [
      'Pebble Bud Vase',
      'objects-home',
      2600,
      1.1,
      4,
      'A small ceramic bud vase with a softly textured glaze. Approximately 5 inches tall.',
    ],
  ];
  for (const [
    index,
    [name, cat, price, weight, stock, description],
  ] of samples.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data: p, error } = await client
      .from('products')
      .upsert(
        {
          name,
          slug,
          description,
          category_id: cats!.find((c) => c.slug === cat)!.id,
          price_cents: price,
          shipping_first_unit_cents: cat === 'objects-home' ? 799 : 499,
          shipping_additional_unit_cents: cat === 'objects-home' ? 200 : 100,
          sku: `ET-${String(index + 1).padStart(3, '0')}`,
          weight_lbs: weight,
          inventory_count: stock,
          is_active: true,
        },
        { onConflict: 'slug' },
      )
      .select()
      .single();
    if (error) throw error;
    const { data: images, error: e } = await client
      .from('product_images')
      .select('id')
      .eq('product_id', p.id);
    if (e) throw e;
    if (!images?.length) {
      const { error } = await client.from('product_images').insert({
        product_id: p.id,
        url: `${process.env.SITE_URL || 'http://localhost:3000'}/placeholder.svg`,
        sort_order: 0,
        is_primary: true,
      });
      if (error) throw error;
    }
  }
  console.log(
    'Seeded 3 categories and 10 products. Re-running resets sample stock and prices.',
  );
}
seed().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
