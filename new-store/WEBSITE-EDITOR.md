
# Website editor and design collaborators

Open /studio on the Photo Gift Studio preview, or Admin → Website editor. Existing administrator accounts retain access. This is separate from the original site's code and PR #4.

## Roles and access

Store administrators (existing profiles.is_admin) manage design access. Add a collaborator's email in Collaborators; they must sign in with that verified email. Draft-only access is the default. Optionally allow publishing. Revocation is checked on every request, not from user-editable metadata or a stale role claim. The design role never grants is_admin or access to orders, customers, pricing, credentials, or store operations.

Invitation email is optional and sent only by an administrator explicitly selecting it. Supabase Auth generates a one-time credential, and the configured store SMTP (or Resend fallback) sends a direct link to this deploy’s /auth/activate. The credential stays in the URL fragment and is verified server-side only when the recipient submits a password, so mail scanners cannot consume it merely by opening the page. This invitation does not depend on Supabase’s default Site URL or redirect allowlist. New accounts use invite verification; existing accounts use recovery verification. Successful setup opens /studio; legacy administrator setup links retain /admin. Resend from Collaborators with the invitation checkbox selected, and use the newest email. Existing account holders can also sign in with their current password at /auth?next=/studio. No invitation token is returned to the requesting browser or recorded in history. Ordinary customer signup/reset emails still require the correct Supabase Site URL and redirect allowlist.

## Design workflow

Appearance: display brand name, primary/background/text/secondary colors, fonts, button shape, corners, mascot and announcement. Layout: desktop/phone image columns, aspect and fit, spacing, section visibility/order and product order. Shopping flow: product details vs direct customization, where sizes are selected, mobile preview/options order, and one-page vs guided delivery/review checkout.

Save draft → Save & preview → Publish saved draft. Full-site preview uses a private HTTP-only cookie plus a fresh authenticated design-access check. An unsigned-in or revoked user can never read drafts via that cookie. Public pages read only published config. The quick editor mockup is approximate; full preview is authoritative. Version conflicts reject overwrites. Version history records actor email, timestamp, note and snapshot; restore loads into the controls and must be saved/published as a new version.

No existing design is automatically published on installation. The existing visual design remains until a saved configuration is published. Tables use channel photo-gift-studio; older previews do not read them. If this branch is later released to production, this editor becomes part of that storefront.

Approval of personalized artwork, photo consent, guest support, payment verification, prices, taxes and shipping restrictions remain enforced by existing server code. This editor offers supported flows; arbitrary new checkout steps or features still need code.

## AI suggestions

Administrator-only, optional. Uses existing server OPENAI_API_KEY and a text model (default gpt-4.1-mini). Optional WEBSITE_ASSIST_MODEL overrides it. The key must allow text-model calls; an image-only key may need permission changes. No key is exposed to browsers.

A request sends only the administrator's prompt and current design settings. No customer orders or photographs are included. Model output is a strict, validated settings patch; it never becomes executable CSS/HTML/JS. A suggestion changes only local editor controls until saved and published. Unsupported code changes are explained rather than performed. This is not a bridge to the current ChatGPT conversation.

Limits: five requests per administrator per hour, twenty store-wide per UTC day; no automatic retries. Paid API usage applies. A request ID cannot be submitted twice.

## Deployment and verification

Apply supabase/migrations/20261115154550_website_editor_and_collaborators.sql. All four new tables have RLS and no anonymous/authenticated grants. Service-only routes verify roles; database functions also enforce design/publish permission and version locks. Old admin protection stays unchanged. No environment variable is required for manual editing. Optional WEBSITE_ASSIST_MODEL is server-only.

Run npm test and npm run build. Verify owner access, editor draft access, denied editor publishing unless granted, denied editor team/admin access, draft privacy, conflict protection, and rollback. The managed execution workspace was unavailable during this implementation; Netlify's build and deployed API checks are used for release validation. Full interactive browser testing must be completed before production release.

Validation completed: Netlify production build passed. Transactional database checks passed for draft-only editing, owner publishing, version conflicts, revocation and service-only permissions; all fixtures rolled back. Authenticated HTTP/browser checks could not run because the managed workspace was unavailable and the web fetch tool could not reach these preview URLs. A temporary verification function was disabled (JWT required, 410 response); no test accounts or collaborator grants remain. The real text-model suggestion call remains unverified. Review in the preview before production release.
