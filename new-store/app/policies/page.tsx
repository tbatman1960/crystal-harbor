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
      <h2>Product details &amp; care</h2>
      <p>
        Check the dimensions on your selected size before ordering. Follow the
        care label supplied with the item. Colors may look slightly different
        across screens; listing illustrations and sample designs are for preview
        purposes. Blankets are not intended as loose bedding for infants.
      </p>
      <h2>Personalized blankets &amp; photos</h2>
      <p>
        Upload only photos you have permission to use. For a child’s photo, a
        parent or guardian must authorize its use. Photos are used to prepare
        your blanket artwork, not to train an AI model. This editor places your
        portrait into an illustrated template; it is not an AI face-swap
        service. Review placement, spelling, and size before approving. Contact
        us promptly about corrections; changes may not be possible once printing
        begins. Our damaged or incorrect item support still applies.
      </p>
      <p>
        Uploaded portraits and approved artwork are stored in private storage.
        They are accessible through your browser session, your account when
        linked, or authorized store administrators. Unordered saved designs
        expire after 30 days and are removed during housekeeping. Ordered
        artwork is retained for fulfillment and customer support. You can delete
        an unordered design from My saved designs, or contact us about deletion
        of ordered artwork subject to fulfillment and record-retention needs.
      </p>
      <h2>Privacy</h2>
      <p>
        We use your contact information and address to process orders, ship
        parcels, and provide support. Supabase stores account and order data;
        Stripe processes payment details; our configured email provider delivers
        transactional email; USPS receives shipping destination information for
        delivery. We do not store card numbers or sell your personal
        information. Contact us to request access to or deletion of account
        data, subject to records we must retain for accounting and legal
        requirements.
      </p>
      <h2>Shipping destinations</h2>
      <p>
        We currently ship to U.S. addresses outside Indiana. Orders with an
        Indiana shipping address cannot be placed. This restriction applies to
        the delivery address; an Indiana billing address is allowed for an
        eligible out-of-state delivery.
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
