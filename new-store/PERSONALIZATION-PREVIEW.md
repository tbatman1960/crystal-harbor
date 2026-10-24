# Personalized blanket preview

Branch: `preview/personalized-blankets`. This builds on the playful theme preview and must not be merged to production without review. Existing live carts, catalog inventory flags, prices, shipping rules, and Stripe settings are unchanged. The preview uses its own local-storage cart and `personalization_carts` table, sharing the existing Supabase project and account system.

## What works

- Original disco, cosmic, and sunshine illustration templates. No copied artwork from the reference retailer.
- Four existing blanket sizes and prices ($13 / $19 / $25 / $32), selected from the existing active blanket SKUs. Personalization replaces the printed design for that line; the size SKU remains the inventory/price source. Personalization snapshot and artwork determine fulfillment.
- JPEG / PNG / WebP uploads, local orientation handling and JPEG conversion (which removes original EXIF metadata), face-position/zoom controls, name and body-skin-tone choices, live preview, explicit photo permission and proof approval.
- Deterministic portrait placement into an oval in original vector artwork. **This is not AI-generated identity transfer or automatic face detection.** No external AI service, API key, or per-generation fee is involved.
- Private immutable approved portrait and print SVG, stored in the `personalization-private` bucket. No public bucket policy, public signed photo URL, or user photo sent to Stripe. Access checks the creator's HTTP-only cookie, linked account, paid-order ownership, or verified administrator role.
- Guest cart persistence, separate account cart, multiple independently personalized copies of the same size, authoritative server pricing and shipping, order snapshots, admin artwork queue/downloads, customer artwork downloads, deletion of unordered uploads, and guarded expiry housekeeping.
- Existing catalog, accounts, admin tools, billing/shipping address forms, Stripe webhook/payment flow, shipping notifications and order emails remain in the application.

## Limits and review requirements

- Preview payments require Stripe **test** credentials and a matching test webhook destination at the preview URL `/api/webhooks/stripe`. Inherited `sk_live_` credentials are deliberately rejected. Do not create real payments to test this branch.
- No preview Stripe credentials are added by this change. Without test keys, browsing, personalization, saving, cart and shipping can be reviewed; hosted payment cannot complete.
- SVG artwork embeds a sanitized JPEG portrait and declares the selected physical dimensions. Open in the printer/RIP software and check fonts, cropping, bleed, colors, and effective photo resolution before printing. A preview approval is not a guarantee that a low-resolution face is suitable for a large print. Original illustrations are vector, portrait pixels are not.
- Photo thumbnails are not public. Artwork is delivered as an attachment with a restrictive CSP. Never embed private source paths in public catalog images or emails.
- Source photos are at most 2400 pixels on their long side; using a close-up face is important. No fabric/material/production-time claims have been invented.
- Unordered designs become unavailable after 30 days. The admin Artwork page has a manual housekeeping action (up to 100 records per run), retaining paid and active-checkout designs. **Automatic scheduled cleanup is not configured.** Ordered artwork is retained for fulfillment/support; the operator handles post-order deletion requests.
- Clearing a guest browser's cookies loses access to that guest's saved artwork. A signed-in customer can access designs created while signed in. No public recovery link is created for guest artwork.
- Saving is bounded to 20 designs/hour per server-derived hashed request identity. Deploy-level abuse protection and capacity should be reviewed before a public personalization launch.
- Google address assistance remains optional, as in the current storefront.

## Database

Apply the committed `personalized_blanket_preview` migration once. It adds private `personalizations`, owner-protected `personalization_carts`, nullable order-item snapshot fields, a private bucket, and three service-only RPCs. It does not replace the live store's checkout or cart RPCs. Reservation/deletion locks prevent deleting artwork attached to an active checkout, and paid-order snapshots are idempotent on webhook replay.

## Review

1. Open `/customize` on a phone and desktop. Upload a photo you have permission to use.
2. Try each template and size. Position the face, add a name, and approve.
3. Save to cart. Repeat with a different face using the same size; both lines should remain separate.
4. Quote shipping for an address outside Indiana. Two blankets cost $8 shipping; six blankets and Indiana destinations are rejected.
5. Download the approved SVG and check its physical size and portrait placement.
6. In another private browser session, the artwork endpoint must deny access.
7. Log in as admin and open `/admin/personalizations`; view saved artwork and its eventual paid-order link.
8. Configure test Stripe credentials and webhook to test payment completion, order history, notifications, and downloads after payment.

## Verified preview checks

On the deployed PR #4 preview, a headless Chromium desktop/mobile check uploaded a synthetic test portrait, approved two designs for the same size, preserved both cart lines, quoted $8 shipping, rejected Indiana delivery, downloaded matching 30 × 40 inch artwork, denied artwork access from a separate browser session, and removed both test uploads. No client JavaScript errors or mobile horizontal overflow were observed. No real customer photo or payment was used. Next.js production build, TypeScript, and 47 automated tests passed.

Supabase verification confirmed both new tables have RLS, the storage bucket is private, and anonymous/authenticated roles cannot call the service-only payment RPCs. The existing Supabase Auth warning about disabled leaked-password protection remains; see [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Server-only tables intentionally have no public RLS policy.
