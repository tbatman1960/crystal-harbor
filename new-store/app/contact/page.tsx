import { settings } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function Contact() {
  const s = await settings();
  return (
    <article className="shell max-w-3xl py-16">
      <h1>A real person, here to help.</h1>
      <p className="mt-8">
        Questions about an item or an order? Email{' '}
        <a className="link" href={`mailto:${s.store_email}`}>
          {s.store_email}
        </a>
        . Include your order number if you have one.
      </p>
      <h2 className="mt-10">Shipping</h2>
      <p className="mt-4">
        We ship within the United States using USPS. Each product has a
        first-unit shipping charge and an optional charge for each additional
        unit. Charges for different products are combined and shown before
        payment. Carrier delivery estimates are not guarantees. We’ll email your
        tracking number once your order is on its way.
      </p>
    </article>
  );
}
