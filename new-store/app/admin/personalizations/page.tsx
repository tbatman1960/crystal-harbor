import Link from 'next/link';
import { admin, service, check } from '@/lib/supabase';
import { templates } from '@/lib/personalization/designs';
import { ArtworkCleanup } from '@/components/artwork-cleanup';
export default async function Artwork() {
  await admin();
  const client = service();
  const { data, error } = await client
    .from('personalizations')
    .select(
      'id,product_id,config,approved_at,created_at,deleting,artwork_kind,generation_id',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  check(error);
  const ids = (data || []).map((i) => i.id);
  const { data: items, error: e } = ids.length
    ? await client
        .from('order_items')
        .select('personalization_id,order_id')
        .in('personalization_id', ids)
    : { data: [], error: null };
  check(e);
  const generationIds = (data || [])
    .map((row) => row.generation_id)
    .filter(Boolean);
  const { data: generated, error: generatedError } = generationIds.length
    ? await client
        .from('illustration_jobs')
        .select('id,width,height')
        .in('id', generationIds)
    : { data: [], error: null };
  check(generatedError);
  return (
    <section>
      <h1>Personalized artwork</h1>
      <p className="mt-4 max-w-2xl text-ink/70">
        Approved designs are linked to paid orders. Download the SVG, review it
        in your printing software at the selected physical size, and check photo
        quality before production. Pending designs are not paid orders.
      </p>
      <div className="mt-6">
        <ArtworkCleanup />
      </div>
      <p className="text-xs mt-3 text-ink/60">
        Housekeeping removes up to 100 unordered designs older than 30 days and
        unapproved illustration jobs older than seven days per run. Paid artwork
        and active checkout artwork are retained.
      </p>
      <div className="grid gap-4 mt-8 md:grid-cols-2">
        {data?.length ? (
          data.map((row) => (
            <article key={row.id} className="panel">
              <h2 className="text-xl">
                {templates.find((t) => t.id === row.config.template)?.name ||
                  'Personalized blanket'}
              </h2>
              {row.artwork_kind === 'ai' && (
                <p className="notice mt-3 text-sm">
                  AI-redrawn artwork · native image{' '}
                  {generated?.find((g) => g.id === row.generation_id)?.width ||
                    'unknown'}{' '}
                  ×{' '}
                  {generated?.find((g) => g.id === row.generation_id)?.height ||
                    'unknown'}{' '}
                  pixels. Review likeness and print resolution; large blankets
                  may require upscaling before production. The SVG wrapper does
                  not add image detail.
                </p>
              )}
              <p className="mt-2">
                Name: {row.config.name || 'No name entered'}
              </p>
              <p className="text-xs mt-2">
                Approved{' '}
                {new Date(row.approved_at).toLocaleString('en-US', {
                  timeZone: 'America/Indiana/Indianapolis',
                })}
              </p>
              <p className="text-xs mt-1 break-all">Reference: {row.id}</p>
              {(items || [])
                .filter((i) => i.personalization_id === row.id)
                .map((i) => (
                  <Link
                    key={i.order_id}
                    className="link block mt-3"
                    href={`/admin/orders/${i.order_id}`}
                  >
                    View paid order →
                  </Link>
                ))}
              {!(items || []).some((i) => i.personalization_id === row.id) && (
                <p className="text-sm mt-3">Awaiting checkout</p>
              )}
              {!row.deleting && (
                <a
                  className="personalization-link"
                  href={`/api/customizations/${row.id}?file=artwork`}
                >
                  Download approved SVG ↗
                </a>
              )}
            </article>
          ))
        ) : (
          <p className="notice">
            Approved designs will appear here after customers add them to their
            bag.
          </p>
        )}
      </div>
    </section>
  );
}
