# AI-illustrated blanket preview

Preview: https://deploy-preview-4--crystal-harbor.netlify.app/customize
Branch: `preview/personalized-blankets`, draft PR #4. Do not merge to production until the generated likeness and print-production quality are reviewed.

## Workflow

1. Choose one of the six actual active production blanket designs, its size, an optional name, and whether to personalize the main printed face or all prominent printed faces.
2. Upload a portrait and confirm photo permission, including parent/guardian permission for a child's photo, and consent to sending the photo to OpenAI.
3. With photo permission confirmed, uploading automatically requests an illustration. A Netlify background function sends the portrait and canonical product-image reference together to OpenAI's image-edit endpoint, asking for one fully redrawn character and scene with matching linework, shading, lighting and colors while preserving the selected print. The face is not pasted onto a drawing. Customer names are rendered deterministically after generation so their spelling does not depend on the model.
4. The page automatically polls progress and scrolls to the finished PNG preview. refresh or return in the same browser to resume the most recent job. There is no fabricated result when the provider is unavailable.
5. Review the actual generated artwork, regenerate if desired within limits, then approve it. Only that immutable generated file can be added as an AI-personalized cart line. Changing the style, size, name or portrait requires a new generation. After refresh, upload the photo again if you want to regenerate; original photo bytes are not stored in browser local storage.
6. Server pricing and shipping remain authoritative. The approved SVG follows the order into customer history and admin fulfillment downloads.

Existing catalog, accounts, carts, checkout, order emails and admin features remain. Existing $13 / $19 / $25 / $32 size pricing, $7 plus $1 combined shipping, five-blanket limit, untracked inventory, and Indiana shipping restriction are retained. This branch uses separate preview carts so the live store's saved carts remain unchanged. Earlier sample-style artwork remains downloadable from My saved designs; the customizer no longer starts with the three sample styles.

## Required activation

OpenAI API billing is separate from a ChatGPT subscription. Create a project API key with access to the configured image model and set an appropriate provider-side budget/usage limit. Some accounts/models require organization verification or additional access.

In Netlify **Deploy Previews**, set these server-only environment variables (Functions scope; using all scopes is also supported), then redeploy:

- `OPENAI_API_KEY`: secret API key. Mark it as containing secret values. Never use a `NEXT_PUBLIC_` prefix.
- `AI_ILLUSTRATION_ENABLED=true`: explicit activation flag. With either this flag or the API key missing, the preview displays a setup message and generation stays disabled.
- Optional `OPENAI_IMAGE_MODEL`: defaults to `gpt-image-2.5-sunburst`, verified against the current OpenAI image guide. Change only to an image-edit model supporting the configured parameters (`image[]`, portrait size, high quality, PNG output).
- Optional `AI_ILLUSTRATION_DAILY_LIMIT`: global attempts per UTC day, default 10, hard maximum 100. Per-request identity limit is three attempts/hour. Failed attempts count toward limits. No automatic provider retries are made.

The existing Supabase URL and service secret are also required in Functions scope for the background worker. The function validates a short-lived HMAC made with the server secret before doing any work. The API key is never returned to the browser. Configure spending alerts/limits in OpenAI as well; local attempt limits are not a dollar-budget guarantee.

Netlify deploys `generate-illustration-background` with background mode enabled, up to 15 minutes. Generation uses a four-minute provider timeout. Exactly-once database claiming prevents platform retries from repeating a billable image request. The customer API returns a job ID quickly; it does not hold a synchronous function open while drawing.

Preview payment completion separately requires `sk_test_` Stripe credentials and a matching test webhook destination at the preview URL `/api/webhooks/stripe`. Live keys are rejected on previews. No real payment is needed to test illustration generation.

## Private data and housekeeping

- Photos are locally re-encoded to JPEG (removing original metadata), then decoded and normalized again server-side. The source and complete generated artwork stay in `personalization-private`, with no public object policy.
- Only the creating browser cookie/account can generate, inspect, or approve a job. Phone-friendly PNG previews and PNG/JPEG downloads are rasterized server-side from the complete approved SVG; original SVG files remain available to admins. The download button reports errors and offers an explicit open/save link for mobile browsers. Approved proofs also follow the existing account/order/admin artwork access rules. Customer photos/artwork are not sent to Stripe.
- `illustration_jobs` has RLS and no public grants. Reservation, approval and cleanup RPCs are service-only. Atomic quotas count failed/queued/finished attempts; simultaneous requests cannot exceed the configured database ceilings.
- AI requests are sent to OpenAI only after the user clicks Generate with photo consent. Its processing is subject to OpenAI's applicable API terms/data controls, which the operator should review before launch.
- Unapproved jobs expire after seven days, approved unordered proofs after 30 days. Admin Artwork housekeeping removes expired files in batches; it preserves paid designs and active checkout artwork. Automatic scheduled cleanup is not configured. Job files shared with an approved proof cannot be purged while that proof exists.
- Job/approval/deletion locks prevent resurrecting deleted designs or deleting artwork needed for an active checkout.
- Clearing guest cookies loses guest access. Customer emails/order details carry the design name and chosen size; private image URLs are not embedded in email.

## Print-production review is required

The model is requested at 1024 × 1536 pixels and high quality. The downloaded SVG embeds the generated raster artwork and declares the chosen physical size. **A vector wrapper does not create extra image detail.** Native output alone may be insufficient for large blanket printing. The admin Artwork page shows native dimensions and a production-review warning. Review likeness, facial details, crop, fabric bleed, color, and printer requirements. Use a suitable professional upscaling/production workflow before selling large-format prints. The admin production workflow now supplies a true vector conversion and correctly dimensioned raster enlargement. It does not invent new fine detail or replace operator print review; see [PRODUCTION-PRINT.md](PRODUCTION-PRINT.md).

AI likeness/style consistency must be evaluated using an authorized real portrait after credentials are configured. Unit tests use synthetic fixtures and mock provider responses; they are not evidence of real likeness quality.

## Validation

Automated tests cover two-image provider requests, redraw prompts, sanitized provider errors, no automatic paid retries, HMAC authentication, atomic quota enforcement, job claiming, idempotent approval, private data access, and cleanup/approval locking, plus existing pricing, order, inventory, RLS, and shipping rules. The Next.js build and a standalone esbuild check cover the server app and background worker. Native `sharp` is a pinned runtime dependency and externalized for the Netlify background bundle.

The previous photo-placement preview was tested in desktop/mobile browsers, including private access denial, separate customized copies, $8 shipping for two blankets, and Indiana rejection. The deployed catalog workflow passed a real OpenAI generation using a synthetic portrait and the 90s Nostalgia Overload production design: one upload created one job, the completed PNG preview scrolled into view automatically, approval selected the correct catalog SKU, and PNG/SVG downloads succeeded. An existing approved artwork download and cross-browser access denial also passed. Test files and diagnostic rows were removed. Real-customer likeness review, print-quality review, and a complete test payment/email flow remain separate checks.

## Catalog preview and download correction

The customizer now uses all 24 active production blanket SKUs grouped into six designs, with four actual sizes each. The selected product ID determines price and shipping, and the server supplies the canonical product name and public product-image URL. References are restricted to the configured Supabase public products bucket; client-provided URLs cannot override the catalog image. Existing approved sample proofs are retained but are not automatically loaded as a new catalog preview.

After explicit photo permission, a newly uploaded photo starts processing once. Name, design and size changes invalidate approval but do not automatically incur another generation; the customer requests an updated preview. Once ready, the completed preview is brought into view automatically. Only that approved result can be added to the cart. PNG is the default customer download, with an explicit open/save link for phones and a retained SVG option for print production.
