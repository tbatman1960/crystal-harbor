import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { admin, service, check } from '@/lib/supabase';
import { OrderView } from '@/components/order-view';
import { OrderEditor } from '@/components/order-editor';
import { ProductionExport } from '@/components/production-export';
import { RetryEmails } from '@/components/admin-actions';
export default async function Order({ params }: { params: { id: string } }) {
  if (!z.string().uuid().safeParse(params.id).success) notFound();
  const client = await admin();
  const { data, error } = await client
    .from('orders')
    .select('*,order_items(*)')
    .eq('id', params.id)
    .maybeSingle();
  check(error);
  if (!data) notFound();
  const { data: jobs, error: e } = await service()
    .from('email_jobs')
    .select('id,kind,sent_at')
    .eq('order_id', params.id);
  check(e);
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        className="btn secondary mb-6"
        href={`/admin/orders/${params.id}/packing-slip`}
      >
        Printable packing slip
      </Link>
      <OrderView order={data} />
      {data.order_items
        .filter(
          (i: { personalization_id?: string | null }) => i.personalization_id,
        )
        .map(
          (i: {
            id: string;
            personalization_id: string;
            product_name_snapshot: string;
          }) => (
            <section key={i.id} className="panel mt-6">
              <h2 className="text-xl">{i.product_name_snapshot}</h2>
              <ProductionExport
                id={i.personalization_id}
                initialSize={i.product_name_snapshot}
              />
            </section>
          ),
        )}
      <OrderEditor
        id={data.id}
        status={data.status}
        tracking={data.tracking_number}
      />
      <section className="panel mt-6">
        <h2 className="mb-4 text-2xl">Notifications</h2>
        {jobs?.map((j) => (
          <p key={j.id} className="my-2 text-sm capitalize">
            {j.kind}: {j.sent_at ? 'Sent' : 'Pending delivery'}
          </p>
        ))}
        <div className="mt-5">
          <RetryEmails />
        </div>
      </section>
    </div>
  );
}
