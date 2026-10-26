# Blanket production exports

This workflow is available in the separate personalized-store preview. It does not replace the live storefront or regenerate customer artwork with AI.

## Operator workflow

1. Sign in as administrator. Open **Artwork**, or a personalized order's detail page.
2. Expand **Create production print files** for the customer-approved design.
3. Select the blanket size, format, print resolution, bleed and fit. Verify the size against the order and the printer's specification.
4. Create the file. The private background job processes the immutable approved master; two jobs can run at once. Repeating an identical request reuses the same job/file. Failed jobs can be retried up to three times. Stalled jobs can be removed after 20 minutes.
5. Inspect the proof, then download the full file for close inspection. Check faces, lettering, crop, colors, dimensions, bleed and printer requirements.
6. Check the production-review confirmation and click **Approve for production**. This records the operator and time against the exact export. Customer approval and production review remain separate.
7. Download the production file and optional JSON print specification. Signed download links expire after 60 seconds; request a new link if needed. Large files download directly from private storage rather than through Netlify's response-size limit.

Exports can be removed from the same panel. The source artwork cannot be deleted while print exports reference it. Remove unwanted exports before deleting an unordered source design. Paid-order retention and existing checkout protections still apply.

## Formats and limits

**Scalable SVG** creates actual filled vector paths using ImageTracer.js, with no embedded raster photo or external fonts. The canvas declares the requested physical size in inches. Vector conversion approximates curves and a 64-color palette; it can simplify faces, text, gradients and other small details. Scaling does not add missing source detail. Always inspect the full vector file before printing. This is a derived production master; it never replaces the original customer-approved artwork.

**PNG, JPEG and TIFF** enlarge the approved artwork with Lanczos resampling and embed the requested density and sRGB color metadata. These preserve the source composition within the chosen fit, but a larger pixel count does not mean new fine detail has been recovered. No generative enhancement or face regeneration is performed.

Default raster resolution is 150 PPI:

| Blanket size | Pixels, without bleed |
|---|---|
| 30 × 40 inches | 4,500 × 6,000 |
| 40 × 50 inches | 6,000 × 7,500 |
| 50 × 60 inches | 7,500 × 9,000 |
| 60 × 80 inches | 9,000 × 12,000 |

100 PPI and 300 PPI are available where the selected raster dimensions fit the 120-million-pixel processing limit. The maximum single dimensions are 12,500 × 16,500 pixels. Larger raster settings fail validation with a useful message; SVG remains resolution independent. All four advertised sizes work at the default 150 PPI with ordinary bleed values.

Bleed is added to both sides of the outer canvas. The default is zero; select the printer's required allowance rather than assuming a universal bleed. **Contain** keeps all artwork with a light background where aspect ratios differ; **Cover** fills the canvas and may crop edges. Inspect the printer's trim area. Choosing another export size does not change the customer's ordered size.

Files are limited to 48 MB, within a private 50 MB Supabase bucket. If a detailed TIFF/PNG exceeds the limit, choose JPEG, SVG or lower raster PPI. The background worker uses temporary disk files, a single Sharp processing thread and bounded source resolution rather than buffering a full large raster in JavaScript.

## Security and operations

- New table `print_exports` has RLS and no customer/anonymous grants. Admin routes verify Supabase Auth and `profiles.is_admin` on every request.
- The private `print-production-private` bucket has no public object policy. Full downloads use short-lived signed URLs only after an admin check. Proof thumbnails are served through an admin-protected endpoint.
- The Netlify `generate-print-background` function authenticates a short-lived HMAC scoped to job and attempt, then claims the queued job exactly once. Provider-image signatures cannot authorize print jobs.
- Export metadata includes the approved source SHA-256, output SHA-256, physical size, intended raster dimensions, pipeline settings, file bytes and vector path count where applicable.
- Source locks and references prevent deleting approved artwork during export. Removal cleans up all deterministic attempt paths, including interrupted uploads. Completed files remain private until an administrator removes them; there is no automatic print-file deletion schedule.
- Files become **ready for review**, not automatically approved for production. Operator review is stored separately from the static creation specification.
- No new environment variables or paid image-service credentials are needed. The existing Supabase URL/service key must be available to Netlify Functions. `sharp` and pinned `imagetracerjs` are runtime dependencies.
- This workflow uses sRGB. A printer-specific CMYK profile, external professional detail enhancement or other specialist prepress work is not performed automatically.

## Validation

Automated checks cover geometry for every advertised size, memory bounds, bleed, source fitting, real vector paths without embedded images, raster pixels/density, worker authentication, idempotent jobs, service-only access and source-deletion protection. A full 60 × 80 inch PNG was generated locally at 9,000 × 12,000 pixels and 150 PPI; the synthetic fixture used approximately 131 MB RSS and completed in about five seconds. Complex customer artwork may take longer and produce larger files.

## Deployed verification

The preview admin workflow was verified with an isolated temporary test login, which was signed out and removed afterward. The existing approved design produced a 60 × 80 inch SVG with 89,829 actual vector paths (14,721,975 bytes) and a 9,000 × 12,000 PNG tagged at 150 PPI (49,078,722 bytes). Both downloads matched their stored SHA-256 hashes and remain available to the owner for review. Neither file was automatically approved for production. Repeated identical requests reused the same job, incomplete production-review confirmations were rejected, unauthenticated downloads were denied, and the mobile admin panel had no horizontal overflow or JavaScript errors. A separate TIFF smoke test verified 3,000 × 4,000 pixels at 100 PPI. No image-generation API call was made for production exports.
