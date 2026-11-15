
# Website editor and design collaborators

Open /studio on the live SnuggleBug website, or Admin → Website editor. Existing administrator and verified collaborator accounts retain access. This release also publishes the latest photo-gift storefront from just before the collaboration tools were added.

## Roles and access

Store administrators (existing profiles.is_admin) manage design access. Add a collaborator's email in Collaborators; they must sign in with that verified email. Draft-only access is the default. Optionally allow publishing. Revocation is checked on every request, not from user-editable metadata or a stale role claim. Collaborators can manage the complete catalog at /catalog/products: photos, names, descriptions, sizes, prices, shipping rates, stock options and active status, plus categories. Products only grants the same catalog tools without website editing. Neither role grants is_admin, access to orders, customer data, payment credentials or access management. Catalog saves apply immediately; website design uses drafts and publishing. Existing collaborators automatically retain design access and gain catalog access.

Invitation email is optional and sent only by an administrator explicitly selecting it. Supabase Auth generates a one-time credential, and the configured store SMTP (or Resend fallback) sends a direct link to this deploy’s /auth/activate. The credential stays in the URL fragment and is verified server-side only when the recipient submits a password, so mail scanners cannot consume it merely by opening the page. This invitation does not depend on Supabase’s default Site URL or redirect allowlist. New accounts use invite verification; existing accounts use recovery verification. Successful setup opens /studio; legacy administrator setup links retain /admin. Resend from Collaborators with the invitation checkbox selected, and use the newest email. Existing account holders can also sign in with their current password at /auth?next=/studio. No invitation token is returned to the requesting browser or recorded in history. Ordinary customer signup/reset emails still require the correct Supabase Site URL and redirect allowlist.

## Design workflow

Appearance: display brand name, primary/background/text/secondary colors, fonts, button shape, corners, mascot and announcement. Layout: desktop/phone image columns, aspect and fit, spacing, section visibility/order and product order. Shopping flow: product details vs direct customization, where sizes are selected, mobile preview/options order, and one-page vs guided delivery/review checkout.

Save draft → Save & preview → Publish saved draft. Full-site preview uses a private HTTP-only cookie plus a fresh authenticated design-access check. An unsigned-in or revoked user can never read drafts via that cookie. Public pages read only published config. The quick editor mockup is approximate; full preview is authoritative. Version conflicts reject overwrites. Version history records actor email, timestamp, note and snapshot; restore loads into the controls and must be saved/published as a new version.

No existing design is automatically published on installation. The existing visual design remains until a saved configuration is published. Production uses channel storefront-production and its own private preview cookie. The experimental site retains photo-gift-studio, so its drafts and published settings stay separate. Collaborator grants and AI quotas are shared.

Approval of personalized artwork, photo consent, guest support, payment verification, prices, taxes and shipping restrictions remain enforced by existing server code. This editor offers supported flows; arbitrary new checkout steps or features still need code.

## AI suggestions

Administrator-only, optional. Uses existing server OPENAI_API_KEY and a text model (default gpt-4.1-mini). Optional WEBSITE_ASSIST_MODEL overrides it. The key must allow text-model calls; an image-only key may need permission changes. No key is exposed to browsers.

A request sends only the administrator's prompt and current design settings. No customer orders or photographs are included. Model output is a strict, validated settings patch; it never becomes executable CSS/HTML/JS. A suggestion changes only local editor controls until saved and published. Unsupported code changes are explained rather than performed. This is not a bridge to the current ChatGPT conversation.

Limits: five requests per administrator per hour, twenty store-wide per UTC day; no automatic retries. Paid API usage applies. A request ID cannot be submitted twice.

## Deployment and verification

Apply supabase/migrations/20261115154550_website_editor_and_collaborators.sql. All four new tables have RLS and no anonymous/authenticated grants. Service-only routes verify roles; database functions also enforce design/publish permission and version locks. Old admin protection stays unchanged. No environment variable is required for manual editing. Optional WEBSITE_ASSIST_MODEL is server-only.

Run npm test and npm run build. Verify owner access, editor draft access, denied editor publishing unless granted, denied editor team/admin access, draft privacy, conflict protection, and rollback. 

Validation: the combined release passes 77 automated tests and the production Next.js build. Database checks confirm private artwork storage and the required production editor and checkout functions. No real payment or invitation email is generated by these automated checks.

Production rollout: the full image-first storefront, photo customization, saved designs, reviews, coupon tools and cart drawer are now included. The production save/publish RPC and 20261115193121_production_website_editor.sql migration are retained. No high-resolution print job starts automatically; printing remains an explicit administrator action.

## Catalog team access

Administrators choose Products only or Collaborator under Website Editor → Collaborators. Publishing permission applies to website design only. Product-only invitations open /catalog; collaborator invitations open /studio with a Manage products & photos link. Existing collaborators need no new account or invitation. Role switching and revocation are available alongside each member. Only administrators manage grants or send setup invitations.

The /catalog portal reuses the same product, category and photo forms as /admin, with a narrow /api/catalog endpoint accepting only catalog actions. /api/upload accepts authorized catalog users and always targets the public products bucket with existing size/type/signature validation. RLS protects product/category/image writes and Storage uploads. A narrow SECURITY DEFINER helper in the non-exposed private schema checks the current verified auth.users identity and roster; product save remains SECURITY INVOKER. No service key is returned to a browser. Product-only entries have website active=false and catalog_active=true, so retained older website-editor deploys also deny them design access. The database enforces this separation. Revocation is checked on every request and SQL statement.

Apply 20261115212903_catalog_team_access.sql. No environment variables change. Tests exercise catalog create/update/images, inactive products, categories, bucket restrictions, administrator-data isolation, verified-email enforcement, immediate revocation, preserved administrator access, and product-only invite destinations. Automated fixtures roll back or use local Postgres/WASM; no invitation is sent automatically.
