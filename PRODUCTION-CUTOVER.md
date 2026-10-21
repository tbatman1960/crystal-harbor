# SnuggleBug production cutover

Target production URL: https://crystal-harbor.netlify.app
Review PR: https://github.com/tbatman1960/crystal-harbor/pull/1

The user has authorized replacing the original site. Do not merge until Netlify's Production context is configured for the new storefront. A Netlify subdomain is publicly accessible without a custom domain.

## Required Netlify production configuration

In the crystal-harbor project's Environment variables, preserve the existing values for rollback and configure these values in **Production**:

| Variable | Production value |
| --- | --- |
| SITE_URL | https://crystal-harbor.netlify.app |
| NEXT_PUBLIC_SUPABASE_URL | https://vwljlpiwbuxzvbrwfuar.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Copy the new storefront's working Deploy Preview value into Production. This is the publishable key, not the original database's key. |
| SUPABASE_SERVICE_ROLE_KEY | Copy the new storefront's working Deploy Preview value into Production; mark as secret. Never put the value in GitHub or chat. |
| STRIPE_SECRET_KEY | Existing Stripe account's live secret key, stored as a secret. |
| STRIPE_WEBHOOK_SECRET | Secret for a LIVE Stripe endpoint delivering checkout.session.completed and checkout.session.expired to https://crystal-harbor.netlify.app/api/webhooks/stripe |
| RESEND_API_KEY | Resend key, marked secret; needed for customer and administrator emails. |
| RESEND_FROM_EMAIL | Sender on a verified Resend domain. |
| CRON_SECRET | Random secret used for email retries and checkout reconciliation. |

Do not use the original Supabase project bdcqyconjwevyzjlubce for the new application. The new storefront project vwljlpiwbuxzvbrwfuar already contains the actual products, prices, shipping settings and administrator account.

GOOGLE_MAPS_API_KEY is optional. Leave it unset until ready: manual street entry, state selection and ZIP lookup work without it. USPS API credentials are unnecessary for fixed-rate blanket shipping.

## Code promotion and verification

1. Confirm production environment values. Do not publish a preview deploy directly: its canonical URL and API keys were built for the preview context.
2. Merge PR #1 into main. Root netlify.toml points Netlify to new-store/ and produces a production build.
3. Verify https://crystal-harbor.netlify.app/api/health returns ready:true.
4. Check the shop has six designs with four sizes each, no samples, and no stock limits. Check the existing new-store administrator can sign in at /admin.
5. Check prices $13 / $19 / $25 / $32 by increasing size, $7 shipping plus $1 each additional across designs, and the five-blanket limit.
6. Confirm the live Stripe webhook is delivering successfully and that an authorized low-value payment creates exactly one order and sends the expected customer/admin emails. Payment and email end-to-end verification are still outstanding; passing catalog/quote checks does not establish payment readiness.
7. When attaching a custom domain later, update SITE_URL, Supabase Auth redirect URLs and the Stripe webhook endpoint for that domain, then redeploy.

## Rollback

Original source is preserved on backup/original-before-snugglebug-2026-10-21 at c5c7b1a78445e914ee7fc542a231d3e0944f0d82. The original database and storage were not modified. The private backup ZIP contains the original source, logical database export and seven uploaded files, with restore instructions. Netlify settings and secrets are not included in that archive; preserve them privately before replacing production values.

If needed, republish the last original production deploy and restore its corresponding Netlify environment values. Keep both Supabase projects intact.
