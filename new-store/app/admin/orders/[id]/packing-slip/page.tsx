import { notFound } from 'next/navigation';
import { z } from 'zod';
import { admin, check } from '@/lib/supabase';
import { OrderView } from '@/components/order-view';
import { PrintButton } from '@/components/admin-actions';
export default async function PackingSlip({
  params,
}: {
  params: { id: string };
}) {
  if (!z.string().uuid().safeParse(params.id).success) notFound();
  const client = await admin();
  const { data, error } = await client
    .from('orders')
    .select('*,order_items(*)')
    .eq('id', params.id)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PrintButton />
      <OrderView order={data} packing />
    </div>
  );
}
