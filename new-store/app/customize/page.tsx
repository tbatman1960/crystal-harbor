import { catalog } from '@/lib/data';
import { PersonalizationEditor } from '@/components/personalization-editor';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Make a blanket starring you',
  description:
    'Turn a favorite face into a coordinated illustration, add a name, and approve your personalized blanket.',
};
export default async function Customize({
  searchParams,
}: {
  searchParams: { product?: string };
}) {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [];
  const blankets = products
    .filter((p) => p.shipping_group === 'blankets' && p.is_active)
    .sort((a, b) => a.price_cents - b.price_cents);
  const initial = blankets.find(
    (p) => p.slug === searchParams.product || p.id === searchParams.product,
  );
  return (
    <div className="collection-page shell py-8 md:py-12">
      <p className="mb-5 text-sm text-ink/65">
        Home / Personalized blankets / Your design
      </p>
      {blankets.length ? (
        <PersonalizationEditor
          products={blankets}
          initialProductId={initial?.id}
        />
      ) : (
        <div className="panel">
          <h1>Personalized blankets are on their way.</h1>
          <p className="mt-4">
            Please check back when the blanket sizes are available.
          </p>
        </div>
      )}
      <section className="custom-how">
        <h2>A gift with their name written all over it.</h2>
        <div>
          {[
            [
              '01',
              'Find their vibe',
              'Choose from the same six blanket designs and four sizes in our store.',
            ],
            [
              '02',
              'Put them in the picture',
              'Confirm photo permission and upload a clear portrait. Your personalized preview appears automatically after processing.',
            ],
            [
              '03',
              'Give a little happy',
              'Approve the artwork. We save the exact design with your order.',
            ],
          ].map(([n, h, p]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
