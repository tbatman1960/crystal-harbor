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
  return (
    <div className="shell py-10">
      <ProductDetail product={data} />
    </div>
  );
}
