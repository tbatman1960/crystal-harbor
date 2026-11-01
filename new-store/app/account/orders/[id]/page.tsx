import Link from 'next/link';
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
  return (
    <>
      <OrderView order={data} />
      {['shipped', 'delivered'].includes(data.status) && (
        <section className="mt-8">
          <h2 className="text-2xl">Review your blankets</h2>
          {data.order_items.map(
            (i: { id: string; product_name_snapshot: string }) => (
              <p key={i.id} className="mt-3">
                <Link className="link" href={`/review?item=${i.id}`}>
                  Review {i.product_name_snapshot}
                </Link>
              </p>
            ),
          )}
        </section>
      )}
    </>
  );
}
