import { catalog } from '@/lib/data';
import { PersonalizationEditor } from '@/components/personalization-editor';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Make a blanket starring you',
  description:
    'Create a photo-personalized blanket, compare your previews, and choose the version you love.',
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
    </div>
  );
}
