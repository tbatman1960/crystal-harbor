# Photo Gift Studio preview

Branch: `preview/photo-gift-studio`. Separate from production and `preview/personalized-blankets` (PR #4).

## Customer experience

Visual home and product galleries; four proportional size cards; product → size → Customize. Source photographs (up to five) stay in browser memory until a customer selects one, confirms permission, and explicitly requests one preview. One identity per generation; “all faces” repeats that same person, not different people. Removing source thumbnails does not erase already-generated jobs. Each request is still bounded by existing per-requester/hour and global/day quotas.

Photo mode asks the configured OpenAI image-edit model to preserve real facial likeness while blending into the catalog scene. Old illustration jobs and approved files are immutable. No unsupported claim of guaranteed likeness: test customer-owned examples, inspect faces, text and composition before approval. No Google key is required; no new provider or recurring subscription was added. A model/provider change should follow a quality trial rather than assume another service is better.

Processing shows persisted steps: queued → preparing references → generating → finishing preview → ready. The model supplies no granular percentage. Do not fabricate one. The finished digital blanket mockup opens automatically. A customer can compare versions, approve one to the bag, decline and begin again, or leave for the shop without ordering. Approved artwork is linked to its exact SKU/size. Earlier previews are available for seven days by the same browser cookie or account; approved ordered artwork remains attached to the order. Never log photos/tokens. A mockup simulates a hanging blanket and lighting; it is not a photograph of the actual finished item.

New browser cart key: `snuggle-photo-gift-studio-cart`. Signed-in new-preview carts use `studio_carts` with owner RLS. Previous previews and live carts are preserved. Products, accounts, orders and artwork storage are shared with the storefront database. Do not test destructive admin/catalog operations on shared real data.

## Reviews

No fake/demo reviews or ratings. Public published reviews are grouped by design across sizes. The server verifies a shipped/delivered order item belongs to the signed-in customer, or a valid item-bound HMAC review link. Each item can be reviewed once. Reviews start pending; admin `/admin/reviews` can publish/hide and reply, but cannot rewrite the customer text. Display name only; no email/address in public responses. Review links are included in this preview's customer order/shipping emails and account order details, and expire after 90 days. The customer must wait until shipment before submission. User photos are not added to public reviews.

## Coupons and rewards

Admin `/admin/offers` controls automatic **future-order** rewards. Defaults: pay for $75 merchandise subtotal after discounts, earn 10% off a future $40+ merchandise order, valid 30 days. Shipping and tax excluded. Owner can disable rewards or change values. Manual email-bound coupons are also supported; copy/share with intended customer (manual creation does not send email).

Paid Stripe webhook creates reward exactly once, adds the code to confirmation email, and marks a redeemed code used atomically. Same email required, one use, no stacking, no cash value. Cancelling the source order disables its unused reward. Refund handling beyond cancellation is not automated; disable a reward in Offers if a refund should revoke it. Already-used discounts are not retroactively clawed back.

Quote verifies code/email/expiry/minimum and computes integer cents server-side. Checkout atomically reserves coupon and captures discount on draft. Uses a Stripe one-time fixed-amount coupon equal to verified merchandise discount; Stripe item names/prices/SKUs remain accurate. Order snapshots retain original prices and explicit discount; confirmation/admin views reconcile totals. A coupon held by an active draft cannot be used by another. Stripe expiry/release frees it. Paid/repeated webhooks are idempotent. Live and old-preview completion functions stay unchanged.

## Deploy / test

Uses existing preview environment variables; `next.config.mjs` and `siteUrl()` select Netlify's trusted per-preview origin for dispatch, forms and redirects. Keep deployment previews in Stripe **test mode**; live keys are deliberately rejected. Configure a test webhook destination for this preview's `/api/webhooks/stripe`, with a matching signing secret, before attempting a paid end-to-end test. Use a preview-specific value if other previews need their own webhook signing secret. Supabase auth redirect allowlist must include the new preview origin (or the approved Netlify preview wildcard) for registration/recovery email links. Existing email/password login does not require a new user.

Migrations are additive in `supabase/migrations/20261101*.sql`; all new tables enable RLS, revoke anonymous writes and keep operations service-only except owner-protected carts. Existing live/preview code branches are not updated. High-resolution exports remain optional admin actions; neither generation nor customer approval invokes them.

Checks: `npm test`, `npm run typecheck`, `npm run build`. Browser smoke test uses mocked generation/status to avoid consuming credits. Run a separately authorized real image trial when checking likeness.
