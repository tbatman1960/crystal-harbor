import { notFound } from 'next/navigation';
import { z } from 'zod';
import { account } from '@/lib/account';
import { check } from '@/lib/supabase';
import { OrderView } from '@/components/order-view';
export default async function Order({ params }: { params: { id: string } }) {
  if (!z.string().uuid().safeParse(params.id).success) notFound();
  const { client, user } = await account();
  const { data, error } = await client
    .from('orders')
    .select('*,order_items(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  return <OrderView order={data} />;
}
