import {catalogClient} from '@/lib/catalog-access';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { check } from '@/lib/supabase';
import { categories } from '@/lib/data';
import { ProductForm } from '@/components/product-form';
export default async function Edit({ params }: { params: { id: string } }) {
  if (!z.string().uuid().safeParse(params.id).success) notFound();
  const client = await catalogClient();
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
      <ProductForm managementPath="/catalog" product={data} categories={await categories()} />
    </>
  );
}
