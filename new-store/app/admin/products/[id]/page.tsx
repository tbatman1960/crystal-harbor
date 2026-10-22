import { notFound } from 'next/navigation';
import { z } from 'zod';
import { admin, check } from '@/lib/supabase';
import { categories } from '@/lib/data';
import { ProductForm } from '@/components/product-form';
export default async function Edit({ params }: { params: { id: string } }) {
  if (!z.string().uuid().safeParse(params.id).success) notFound();
  const client = await admin();
  const { data, error } = await client
    .from('products')
    .select('*,product_images(*)')
    .eq('id', params.id)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  return (
    <>
      <h1 className="text-4xl">Edit product</h1>
      <ProductForm product={data} categories={await categories()} />
    </>
  );
}
