# Production Website Editor

Open https://crystal-harbor.netlify.app/studio or Admin → Website editor. Store administrators can grant design access under Collaborators. Existing verified collaborator accounts work here; no Supabase dashboard account is needed. The role grants only website design access, with publishing disabled by default. Orders, customers, products, payments and other administrator tools remain protected by is_admin.

## Editing and publishing

Controls cover brand display name, color presets and custom colors, typography, announcement, optional mascot, button shape, card corners, image fitting and shape, gallery columns and spacing, homepage section order/visibility, product order, product details vs size selection entry, and one-page vs guided delivery/review checkout. Prices, maximum quantities, Indiana shipping restrictions and payment confirmation remain enforced server-side.

Save draft → Save & preview → Publish saved draft. Full-site draft previews require fresh authenticated design access and an HTTP-only cookie. Customers see only published settings. Publishing is explicit and version checked; a stale editor cannot overwrite another editor. History restores load a snapshot for review and a new save/publish. Nothing is automatically published by deployment.

## Invitations

Select Send a password-setup invitation email when granting access. Supabase Auth generates a one-time invite or recovery credential, then the store SMTP transport (Resend fallback) emails a direct /auth/activate link on this deployment. Credentials remain in the URL fragment, are removed immediately in the browser, and are verified server-side only after password submission. Mail scanners cannot consume the credential just by fetching the page. Supabase's default localhost Site URL cannot redirect these invitations. Setup opens /studio. Legacy administrator activation links retain /admin. Use the newest email when resending. Existing account holders can sign in at /auth?next=/studio. Ordinary customer signup/password-reset emails still require correct Supabase Auth redirect configuration.

## Production versus preview

This release selectively adds the Website Editor to the production storefront based on main at 67f3dfe. It does not release the photo-gift preview's redesign, photo customization, saved artwork, reviews, coupons, cart drawer or print-generation workflow. Those remain on preview/photo-gift-studio (PR #5). The production controls reflect production's supported pages and checkout; customizer-only controls are omitted.

Production uses website_design.channel=storefront-production, its own history and snuggle-live-design-preview cookie. The experimental preview retains photo-gift-studio and its existing cookie/function. Collaborator grants and AI quotas are shared between the two, but drafts and published presentation are isolated.

## AI suggestions

Administrators may request a supported settings change with a prompt. Optional server OPENAI_API_KEY must permit a text model; WEBSITE_ASSIST_MODEL defaults to gpt-4.1-mini. Only the prompt and design settings are sent, never customer orders or photos. Five requests per administrator per hour and twenty store-wide per UTC day. Output is strictly validated JSON; it cannot execute code or change business rules. Suggestions do not save or publish automatically. This helper does not connect to an ongoing ChatGPT conversation.

## Database and validation

Include migrations 20261115154550_website_editor_and_collaborators.sql and 20261115193121_production_website_editor.sql when setting up a fresh database. The first already existed on the shared Supabase project. The second adds an isolated empty production row and service-only production save/publish RPC. All editor tables have RLS, with no anonymous or customer grants. Every API verifies authentication and current permissions.

Run npm test and npm run build. Permission tests cover draft access, denied collaborator publication, immediate revocation, stale version rejection, separate production/preview state and denied anonymous/customer access. Invitation tests cover direct preview/production URLs, existing-account recovery, invalid tokens and safe destinations. No test email is sent automatically and no real payment is charged. The production appearance stays unchanged until an authorized editor explicitly publishes a design.

Rollback: restore main to the previous code using a normal revert commit, or load a previous design snapshot in History and save/publish it. Schema additions are additive; retain the preview row and collaborator accounts.
