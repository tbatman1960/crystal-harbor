# GitHub / Netlify review branch

This `new-store/` directory contains the new inventory storefront. The existing DearPast app remains at the repository root for reference. The review branch’s root `netlify.toml` selects `new-store` as its build base. Do not merge into the production branch until a dedicated Supabase project, preview environment variables, and Stripe test-mode webhook are configured. No existing customer data has been migrated.

From the repository root, run `cd new-store`, then follow the setup below. Netlify must use Node 22 and the `new-store` base directory. Preview environment variables must point to the new Supabase project and Stripe test mode, not the existing live store.

# SnuggleBug

A mobile-first physical-goods shop built with Next.js 14 App Router, TypeScript, Tailwind, Supabase, Stripe Checkout, fixed product shipping, and Resend. Customer and admin pages share an accessible, understated storefront. No custom card form and no AI features.

## Local setup

Use Node.js 22 LTS and npm. Install dependencies with `npm ci`, copy `.env.example` to `.env.local`, and fill in credentials. `npm run dev` starts the app at http://localhost:3000. An unconfigured home/shop renders an empty storefront; transactional pages require Supabase. Do not expose service-role, Stripe, Resend, USPS, or cron credentials to browser code.

### Database and authentication

1. Create a Supabase project. Install the Supabase CLI (see https://supabase.com/docs/guides/cli), then run:

   ```sh
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

   This applies all SQL files in `supabase/migrations`, including tables, constraints, RLS, auth trigger, transactional RPCs, and a public `products` image bucket (5 MB, JPEG/PNG/WebP only). For an isolated local stack, use `supabase start` then `supabase db reset` instead. Do not run reset against production.

2. Set Supabase Auth Site URL to your canonical `SITE_URL`. Allow `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback` as redirect URLs. Enable email/password and email confirmations. Configure production SMTP for **Supabase Auth emails**; Resend transactional order email is separate. Enable Auth rate limits and strong password settings in Supabase. Signup and recovery use Supabase's PKCE code exchange. Reset links must return through `/auth/callback?next=/auth?mode=update`.
3. Register the owner's account through `/auth?mode=register`, confirm the email, then promote that specific account using the Supabase SQL editor:

   ```sql
   update public.profiles set is_admin = true where email = 'owner@your-domain.com';
   ```

   Regular users cannot write `is_admin`, `email`, or `stripe_customer_id`. There is deliberately no public admin-promotion API.
4. Load sample data (3 categories, 12 blanket size options across 4 designs, placeholder images):

   ```sh
   node --env-file=.env.local --import tsx scripts/seed.ts
   ```

   Seed is rerunnable by slug, but **resets sample inventory and prices**. Do not run it on a working store. Image URLs use `SITE_URL`; use HTTPS in deployed environments. Replace sample images and inventory in admin before opening sales.
5. Log into `/admin`, set real support/alert emails, origin ZIP, packaging dimensions, tax and optional free-shipping threshold; set each product’s first/additional-unit shipping charges. Prices and money settings are integer **cents**; rates are decimal fractions (`0.08` = 8%). Legacy package dimensions and fallback percentages do not affect the active fixed-rate checkout. Uploads are saved immediately; the product form attaches and reorders them when saved. First image is primary. Unattached uploads can be removed in Supabase Storage.

### Stripe

Use `sk_test_…` locally; switch to `sk_live_…` and a live signing secret on the production site. No Stripe publishable key is needed for hosted Checkout. Only card payment methods are enabled, avoiding delayed-payment inventory ambiguity.

For local webhook forwarding:

```sh
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed,checkout.session.expired
```

Set the printed `whsec_…` as `STRIPE_WEBHOOK_SECRET`, then restart Next. Use test card `4242 4242 4242 4242`, a future expiry and any CVC. In Stripe Dashboard, add the deployed HTTPS webhook URL `/api/webhooks/stripe` with those **two events** and its own signing secret. Keep webhook API version at `2025-02-24.acacia` to match the SDK.

The server reloads prices, stock, taxes, and product shipping rates when creating a session. A database transaction locks product rows in deterministic order and reserves stock before the Stripe redirect. This prevents competing buyers from paying for the last unit. The signed `checkout.session.completed` webhook verifies amount and currency, creates the order and snapshots exactly once, and queues customer/admin email in the same database transaction. Stock is consumed at reservation, so webhook completion does not decrement it a second time. Expired sessions release reservations once. Checkout sessions expire in 30 minutes. A customer leaving Checkout does not immediately release inventory; it remains reserved until expiry. A checkout price or service change requires recalculating shipping in the bag.

The confirmation URL has an unguessable Stripe session capability and shows only confirmation/order number, never the shipping address or email. Registered order details use RLS and owner filters. Guest orders are not automatically linked to accounts later created with the same email.

Billing address is collected before checkout and snapshotted, and Stripe independently collects the card's billing address for payment verification. The shipping destination and selected rate are fixed before redirect; Stripe does not permit changing shipping details on its hosted page.

### Optional inventory

Admin → Products has a Track inventory checkbox. The six actual blanket designs use no inventory tracking and no weight; fixed shipping still applies and the five-blanket order limit remains. Tracked items continue to reserve stock atomically. Checkout snapshots whether stock was reserved, so an expired payment never adds phantom stock if tracking is changed later. Sample products are retained but inactive.

### Product shipping: first unit + additional units

For the six imported blanket designs, all sizes share the `blankets` shipping group. Shipping is $7 once per order plus $1 per additional blanket, across mixed designs and sizes. Maximum five blankets per order; the server checks this before any free-shipping override and again when creating Checkout. Admin → Products → Shipping calculation selects this group. Use matching $7/$1 rates on every grouped blanket. Other products retain the per-product calculation below.

The active checkout uses fixed rates saved on each product, without contacting USPS. In **Admin → Products**, set **First unit shipping ($)** and **Each additional unit ($)**. The form accepts dollars; the server stores integer cents.

For quantity `q` of a product, shipping is `first_unit + (q - 1) × additional_unit`. Charges for distinct products are added together. For example, a bracelet configured at $5 first / $1 additional costs $7 to ship for 3 bracelets. Adding 2 dishes configured at $7.99 first / $2 additional adds $9.99, making combined shipping $16.99. Set the additional charge to $0 to keep one fixed charge for any quantity of that product; set both to $0 to offer free shipping for that product.

New or migrated products have an unset first-unit charge. Configure it explicitly before selling; checkout blocks missing rates instead of silently offering free shipping. Seed products use illustrative $4.99/$1 rates for jewelry/crystals and $7.99/$2 for home goods. Replace these with your rates before launch. A configured order-level free-shipping threshold overrides all product charges.

Both the quote and Stripe session creation reload shipping charges from the database. The stock reservation transaction checks that those rates have not changed between calculation and reservation. Customers supply product IDs and quantities, never authoritative shipping amounts. The final shipping total is snapshotted on the checkout draft/order, so later product edits do not change existing orders.

Apply all migrations in order with `supabase db push`, including `20261021025428_product_shipping.sql`. Tests apply all migration files. **Use a separate Supabase project for this new storefront**: the existing DearPast database has a different schema. Do not apply this initial schema to an existing live store's database.

USPS client credentials are no longer required. The original USPS rate module and legacy settings are retained for a possible future carrier-rate mode, but active checkout does not call them. Shipping labels/postage purchase remain manual; enter USPS tracking in admin to send the shipping email.

### Resend and reliable notifications

Verify your domain in Resend, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, and configure support/alert recipients in admin. Resend's sandbox sender can only send to its allowed test recipient. Emails include item snapshots, total, destination, and tracking when applicable. Text emails avoid unsafe interpolation of customer HTML.

`email_jobs` is an RLS-protected server-only outbox. Order creation queues confirmation and admin alert atomically. A database trigger queues a shipping message whenever tracking is added/changed or a tracked order transitions to shipped. A unique dedupe key plus Resend idempotency avoids repeated notifications from webhook retries. The order page displays pending/sent delivery and provides a retry button. Resend idempotency keys are retained by Resend for 24 hours; a process crash after delivery but before updating the database can cause a duplicate after that period. Review long-pending jobs rather than retrying blindly.

Schedule an authenticated GET to `/api/cron` every 5 minutes with header `Authorization: Bearer YOUR_CRON_SECRET`, using your preferred external scheduler (for example a GitHub Actions scheduled workflow with a secret). The endpoint drains pending mail and reconciles reservations older than an hour with Stripe; it never releases a paid session. Do not rely only on webhook-triggered retries. Netlify's Next.js adapter handles the route; `netlify/functions` is reserved for optional additional functions. No platform-specific cron service is assumed.

A rare network ambiguity during Stripe session creation can leave a draft without a saved Stripe ID. The reconciliation job checks recent sessions for matching draft metadata. If no matching session is found, it conservatively retains the stock reservation. Inspect Stripe metadata `draft_id` and the `checkout_drafts` table; after verifying that no charge/session can complete, an operator may call `select public.release_checkout('DRAFT_UUID');` in the SQL editor. Do not release uncertain reservations automatically.

## Netlify deployment

1. Push this repository to Git and import it in Netlify. Set Node 22 (`NODE_VERSION=22` in Netlify's build settings). The lockfile makes `npm ci` reproducible.
2. `netlify.toml` sets build `npm run build`, publish `.next`, functions `netlify/functions`, and `@netlify/plugin-nextjs` for Next 14 App Router/SSR. Netlify installs the declared build plugin automatically.
3. Enter all `.env.example` variables in Netlify for both build and runtime. Set `SITE_URL` to the final HTTPS URL, without a trailing slash. Next's public Supabase variables are included at build time; rebuild after changing them. No service key may use `NEXT_PUBLIC_`.
4. Apply migrations and seed only once during initial setup, outside the build. Configure Auth redirects and the live Stripe endpoint for the final URL. Redeploy after changing environment variables.
5. Configure the authenticated retry scheduler. Set correct store identity, policies, contact address, tax, inventory, images, and each product’s shipping charges. Test a low-value live payment, webhook, email, and shipment workflow before inviting customers.
6. Isolate deploy previews from production credentials and database; the origin guard intentionally accepts only the canonical `SITE_URL`. Use a separate test project and Stripe test mode for previews.

Supabase backs up the database according to your plan; enable appropriate backups and monitor Stripe webhook delivery, Netlify function errors, and pending email jobs. Cancellation is an operational status, **not** a Stripe refund. Refunds happen in Stripe Dashboard; manually adjust stock when appropriate. Product deletion preserves historical item snapshots. Deletion during an active reserved checkout is blocked; deactivate instead.

## Validation

```sh
npm run typecheck
npm test
npm run build
```

Automated tests exercise tax, fallback rounding/minimums, duplicate cart tampering, invalid quantities/addresses, unsafe product images, and empty checkout rejection. `tests/database.test.ts` runs the full migration in an isolated Postgres/WASM instance (PGlite), mocking the Supabase-managed Auth/Storage schemas. It checks RLS, privilege escalation prevention, reservation exhaustion/release, webhook replay, immutable snapshots, category depth, and notification deduplication without touching a remote database. Actual concurrent transaction behavior still requires the sandbox manual check below.

Manual acceptance checklist with real sandbox credentials:

- Browse categories/search, product gallery, mobile bag, guest checkout; verify one-unit, multiple-unit, mixed-product, zero-additional-rate, and free-shipping-threshold totals.
- Verify Stripe test card succeeds, signed webhook creates exactly one order, repeat webhook delivery does not duplicate inventory/email, and confirmation eventually shows its number.
- Register/confirm/sign in; modify cart, reload, check database persistence; reset password and save profile. Verify one account cannot access another's orders and a regular account cannot enter admin or mutate products/settings.
- Have two sessions buy the final unit concurrently; only one may reserve it. Expire a test checkout and confirm the reservation is returned.
- Add a product with upload, category, reorder images, toggle active, adjust stock. Filter orders, print a slip, enter tracking, verify shipping notification, inspect customer totals.
- Run Lighthouse against a production deployment at mobile settings. Goals: performance >80, accessibility >90. Scores and real-provider end-to-end behavior cannot be asserted from an unconfigured local build. Replace placeholders with optimized source images and verify actual hosted metrics.

## Architecture and security boundaries

Browser components hold only cart/form state and call same-origin JSON routes. All mutations go through server routes, Zod validation and origin checks; standard customer/admin writes use a cookie-scoped Supabase client with RLS. Middleware refreshes Auth cookies and guards admin; admin layouts, page reads and every admin mutation independently re-check the user with `getUser()` and the database flag. Elevated server-only access is restricted to settings projection, Stripe customer assignment, paid-order/reservation transactions, email delivery, and reconciliation. Never grant customer execution of privileged reservation/order RPCs. Server-only modules prevent secret imports into client bundles. Uploads verify file signature, MIME, size, and admin authorization.

Guest carts use localStorage; logged-in carts are written transactionally to Supabase. On login the guest and saved carts merge by maximum quantity, then writes are serialized. Addresses are US-only and quantities limited to 99 per line. Server price, stock, tax and shipping calculation is authoritative. The original schema grants no client write permission for order creation or email jobs; users cannot self-promote. Product images are public by design. No payment card data passes through the application.

Optional GA4 is configured in admin (`G-…`). Tracking loads only after visitors explicitly allow it; consent is stored locally and can be reset in their browser. No tracking ID means no analytics script.


## Provisioned preview database

The dedicated project **Crystal Harbor Storefront** (`vwljlpiwbuxzvbrwfuar`) has all migrations recorded using the exact versions in `supabase/migrations/`. It is independent of the original DearPast database. When linking the CLI to this project, run `supabase migration list` before `supabase db push`; applied versions should already match. Do not reapply initial schema SQL manually.

Netlify preview: `https://deploy-preview-1--crystal-harbor.netlify.app`. Configure the **Deploy Previews** context only, preserving production credentials:

| Variable | Preview value/source |
| --- | --- |
| `SITE_URL` | `https://deploy-preview-1--crystal-harbor.netlify.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vwljlpiwbuxzvbrwfuar.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | New project's publishable key (the legacy variable name accepts a modern publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | New project's server-only secret key or legacy service role key |
| `STRIPE_SECRET_KEY` | Existing Stripe account's **test-mode** secret key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the new test endpoint `/api/webhooks/stripe` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend credentials and verified sender |
| `CRON_SECRET` | A new random secret |

The payment helper rejects live Stripe keys on deploy previews and branch deploys. Existing live keys stay scoped to the existing production deployment. Supabase dashboard: set Auth Site URL to the preview URL and allow `https://deploy-preview-1--crystal-harbor.netlify.app/auth/callback` and the reset callback URL `/auth/callback?next=/auth?mode=update`. Register/confirm the owner's account before granting its `profiles.is_admin` flag. Database access is configured, but this does not configure production SMTP or Auth redirects automatically.

The new project's security advisor has no warning/error findings after the security migration. Two informational notices about missing RLS policies on `checkout_drafts` and `email_jobs` are intentional: both are server-only with client grants revoked, so adding customer policies would weaken the boundary. Existing production-table findings are outside this migration and remain unchanged.


## Seasonal blanket catalog and sizes

The seasonal sample catalog now contains 4 original character-print designs (Space Pals, Dino Days, Forest Friends, Rainbow Bears), each in 3 sizes: kids/lap 30 × 40 in, throw 50 × 60 in, and oversized 60 × 80 in. Illustrations, prices, and stock are samples. Replace them with the actual designs, photographs, dimensions, materials, care instructions, and stock you sell.

Each size is an independently stocked product/SKU with its own price and first/additional-unit shipping charges. Products with the same optional `design_slug` appear as one design card with a size selector. The selected size's own product ID goes into the cart; checkout snapshots its size in the item name. Mixed sizes are separate product lines, so each size starts with its own first-unit shipping charge. These fields are optional: future items without sizes remain ordinary products, and categories can be changed in admin.

In the product editor, use the same **Design group slug** on the sizes of a design and a distinct **Size label** for each. Migration `20261021035922_product_design_sizes.sql` adds these optional fields without changing historical orders. The previous jewelry/crystal demo listings in the preview database were archived, not removed; existing live-store inventory was not changed.

### Address assistance

All address forms include a state/territory dropdown and a ZIP lookup through Zippopotam.us, which suggests the postal city and state. Known ZIP/state mismatches are rejected again by server-side checkout; lookup outages allow manual entry. Postal city aliases can differ, so a city mismatch prompts review rather than rejecting valid aliases. ZIP lookup is not delivery validation.

Optional street autocomplete and USPS delivery-point checks use Google Places API (New) and Google Address Validation API. In Google Cloud, enable both APIs and billing, restrict a server-side key to those APIs, and set `GOOGLE_MAPS_API_KEY` in the desired Netlify context, then redeploy. The key stays on the server. Requests are debounced and use Places session tokens. Without the key, manual street entry and free ZIP lookup continue to work. Full delivery confirmation is only shown when Address Validation reports USPS DPV Y and a complete address without unconfirmed components. Autocomplete alone never marks an address verified.

### Reuse original SMTP email

The new storefront also supports the original SMTP environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, and `SMTP_FROM`. Keep their working Production values in Netlify. SMTP takes priority when SMTP_HOST is set, so no Resend account or key is needed. Port 587 uses required STARTTLS; port 465 uses implicit TLS by default. Certificates are verified. Mark SMTP_PASS as secret and use the provider's authorized sender in SMTP_FROM. Missing sender defaults to the store name/store email in settings.

The order email outbox and manual retry remain in use with either provider. SMTP messages use a stable Message-ID per job, but SMTP has no provider idempotency guarantee: concurrent retries or a crash after SMTP acceptance can cause duplicate messages. Resend's idempotency behavior applies only when using Resend. End-to-end SMTP delivery must be verified after configuring Production; a successful build does not establish email delivery.

## Personalized blanket preview

See [PERSONALIZATION-PREVIEW.md](PERSONALIZATION-PREVIEW.md) for AI illustration activation, the separate review branch, private-photo handling, background processing, test-payment requirements, and print-production limitations.

## Production print files

See [PRODUCTION-PRINT.md](PRODUCTION-PRINT.md) for scalable SVG conversion, full-size PNG/JPEG/TIFF exports up to 60 × 80 inches, private background processing and the operator review workflow.
