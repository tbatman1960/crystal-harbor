import { notFound } from 'next/navigation';
import { db, check } from '@/lib/supabase';
import { ProductDetail } from '@/components/product-detail';
export const dynamic = 'force-dynamic';
export default async function Product({
  params,
}: {
  params: { slug: string };
}) {
  const { data, error } = await db()
    .from('products')
    .select('*,product_images(*)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  const { data: sizes, error: sizesError } = data.design_slug
    ? await db()
        .from('products')
        .select('id,slug,size_label,price_cents,inventory_count')
        .eq('design_slug', data.design_slug)
        .eq('is_active', true)
        .order('price_cents')
    : { data: [], error: null };
  check(sizesError);
  return (
    <div className="shell py-10">
      <ProductDetail key={data.id} product={data} sizes={sizes || []} />
    </div>
  );
}
