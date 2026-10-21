import { settings } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function Policies() {
  const s = await settings();
  return (
    <article className="shell max-w-3xl space-y-6 py-16">
      <h1>Good to know</h1>
      <h2>Returns & damaged items</h2>
      <p>
        Contact{' '}
        <a className="link" href={`mailto:${s.store_email}`}>
          {s.store_email}
        </a>{' '}
        within 14 days of delivery to request a return. Items must be unused and
        in their original condition. Contact us before mailing your return for
        instructions. Customers cover return shipping unless an item arrived
        damaged or incorrect. Please send photos of damaged packaging and items
        so we can help. Approved refunds go to the original payment method after
        inspection.
      </p>
      <h2>Natural materials & product safety</h2>
      <p>
        Colors and markings of natural materials vary. Crystals and decorative
        objects are sold as decorative goods with no medical claims. Small parts
        are not suitable for children. Keep accessories and stones away from
        young children and pets.
      </p>
      <h2>Privacy</h2>
      <p>
        We use your contact information and address to process orders, ship
        parcels, and provide support. Supabase stores account and order data;
        Stripe processes payment details; Resend delivers transactional email;
        USPS receives shipping destination information for rate calculation and
        delivery. We do not store card numbers or sell your personal
        information. Contact us to request access to or deletion of account
        data, subject to records we must retain for accounting and legal
        requirements.
      </p>
      <h2>Payments & cancellations</h2>
      <p>
        All prices are in US dollars. Shipping and applicable sales tax are
        shown before payment. To request cancellation, contact us as soon as
        possible; orders already shipped cannot be cancelled. Refunds may take
        several business days to appear.
      </p>
    </article>
  );
}
