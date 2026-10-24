import { catalog } from '@/lib/data';
import { PersonalizationEditor } from '@/components/personalization-editor';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Make a blanket starring you',
  description:
    'Upload a favorite face, add a name, and approve your own personalized blanket.',
};
export default async function Customize() {
  const products = process.env.NEXT_PUBLIC_SUPABASE_URL ? await catalog() : [];
  // Each original template can be ordered in the existing blanket size SKUs.
  const sizes = [
    ...new Map(
      products
        .filter((p) => p.shipping_group === 'blankets' && p.is_active)
        .sort((a, b) => a.price_cents - b.price_cents)
        .map((p) => [p.size_label, p]),
    ).values(),
  ];
  return (
    <div className="collection-page shell py-8 md:py-12">
      <p className="mb-5 text-sm text-ink/65">
        Home / Personalized blankets / Your design
      </p>
      {sizes.length ? (
        <PersonalizationEditor products={sizes} />
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
              'Three original worlds. Four cozy sizes. Endless reasons to smile.',
            ],
            [
              '02',
              'Put them in the picture',
              'Upload a clear photo, position the face, and add their name.',
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
