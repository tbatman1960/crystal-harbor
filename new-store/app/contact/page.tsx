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
        We currently ship to U.S. addresses outside Indiana using USPS. Indiana
        delivery addresses are not eligible for checkout. Blanket shipping is $7
        for one blanket, plus $1 for each additional blanket in the same order.
        Mix designs and sizes, with a maximum of five blankets per order ($11
        shipping). Other products use the shipping charges shown at checkout.
        Carrier delivery estimates are not guarantees. We’ll email your tracking
        number once your order is on its way.
      </p>
    </article>
  );
}
