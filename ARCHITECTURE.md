# DearPast — Architecture Map

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NETLIFY (CDN + Hosting)                        │
│                     crystal-harbor.netlify.app                          │
│                     Auto-deploys from GitHub main                       │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                      NEXT.JS 14 (App Router)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    PUBLIC PAGES (SSR/Static)                     │    │
│  │                                                                 │    │
│  │  / ─────────── Homepage (hero, categories, features)            │    │
│  │  /products ─── Catalog → /products/[category]/[product]         │    │
│  │  /cart ─────── Shopping cart (Zustand → localStorage)            │    │
│  │  /checkout ─── Shipping → Payment → Success                     │    │
│  │  /account ──── Customer profile, orders, reorder                │    │
│  │  /auth ─────── Login, Register, Forgot/Reset password           │    │
│  │  /orders ───── Order lookup by order number                     │    │
│  │  /contact ──── Contact form (sends email)                       │    │
│  │  /about ────── About page                                       │    │
│  │  /terms, /privacy, /returns, /refunds ── Policy pages           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    ADMIN PORTAL (/admin/*)                      │    │
│  │              Own layout, sidebar nav, separate auth             │    │
│  │                                                                 │    │
│  │  /admin ──────────── Dashboard (stats, recent orders)           │    │
│  │  /admin/orders ───── Order management + status updates          │    │
│  │  /admin/customers ── Customer CRUD + password reset             │    │
│  │  /admin/products ─── Product CRUD (add/edit/delete)             │    │
│  │  /admin/subscribers─ Email subscriber management                │    │
│  │  /admin/newsletter ─ Compose + send + history                   │    │
│  │  /admin/shipping ─── Package types, settings, test calc         │    │
│  │  /admin/reports ──── Sales reports                              │    │
│  │  /admin/analytics ── Analytics dashboard                        │    │
│  │  /admin/seo ──────── SEO settings                               │    │
│  │  /admin/policies ─── Store policies editor                      │    │
│  │  /admin/refund-policies ── Refund rules config                  │    │
│  │  /admin/export ───── CSV data export                            │    │
│  │  /admin/settings ─── Site settings                              │    │
│  │  /admin/email-test ─ Email testing tool                         │    │
│  │  /admin/customization/[id] ── Product template/text/pricing     │    │
│  │  /admin/design-catalog ─────── Design catalog management        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    CUSTOMIZATION MODULE                          │    │
│  │              src/modules/customization/                          │    │
│  │                                                                 │    │
│  │  Canvas Editor (Fabric.js v6) ── Layers, undo/redo, text tools  │    │
│  │  AI Services (mock/OpenAI) ───── Image gen, upscale, style xfer │    │
│  │  Design Templates ────────────── Pre-made starting layouts      │    │
│  │  Social Sharing ──────────────── Public share page + feedback   │    │
│  │  Print-Ready Export ──────────── 300 DPI canvas → Supabase      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    API ROUTES (src/app/api/)                     │    │
│  │              All use supabaseAdmin (service role key)            │    │
│  │                                                                 │    │
│  │  AUTH                          ORDERS & PAYMENTS                 │    │
│  │  ├─ /api/auth/login            ├─ /api/create-payment-intent    │    │
│  │  ├─ /api/auth/register         ├─ /api/webhooks/stripe          │    │
│  │  ├─ /api/auth/check-admin      ├─ /api/orders/[orderNumber]     │    │
│  │  ├─ /api/auth/forgot-password  ├─ /api/orders/cancel            │    │
│  │  ├─ /api/auth/reset-password   ├─ /api/calculate-tax            │    │
│  │  └─ /api/admin/auth/login      └─ /api/refunds/process          │    │
│  │                                                                  │    │
│  │  PRODUCTS                      EMAIL                             │    │
│  │  ├─ /api/products              ├─ /api/send-email                │    │
│  │  └─ /api/admin/products/*      ├─ /api/subscribe-email           │    │
│  │                                ├─ /api/test-email                 │    │
│  │  ADMIN                         ├─ /api/admin/newsletter/*         │    │
│  │  ├─ /api/admin/dashboard       └─ /api/admin/daily-reminder      │    │
│  │  ├─ /api/admin/orders                                            │    │
│  │  ├─ /api/admin/customers       CUSTOMER                          │    │
│  │  ├─ /api/admin/categories      ├─ /api/customer/profile          │    │
│  │  ├─ /api/admin/subscribers                                       │    │
│  │  ├─ /api/admin/reports         SEO                               │    │
│  │  ├─ /api/admin/analytics-rpts  ├─ /robots.txt                    │    │
│  │  ├─ /api/admin/site-settings   └─ /sitemap.xml                   │    │
│  │  ├─ /api/admin/shipping/*                                        │    │
│  │  ├─ /api/admin/export-data                                       │    │
│  │  └─ /api/admin/refund-policies                                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    CLIENT-SIDE STATE (Zustand)                   │    │
│  │                   Persisted to localStorage                      │    │
│  │                                                                  │    │
│  │  cartStore ──── items, quantities, totals                        │    │
│  │  authStore ──── customer login state, profile data               │    │
│  │  adminStore ─── admin login state                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    BUSINESS LOGIC (src/lib/)                     │    │
│  │                                                                  │    │
│  │  supabase.ts ──── Dual client (anon + admin/service role)        │    │
│  │  auth.ts ──────── Customer auth (bcrypt, case-insensitive)       │    │
│  │  admin.ts ─────── Admin auth + dashboard + order management      │    │
│  │  products.ts ──── Product queries (slug, category, featured)     │    │
│  │  orders.ts ────── Order creation + order number gen (CH-YYYY-N)  │    │
│  │  email.ts ─────── Nodemailer + all HTML email templates          │    │
│  │  shipping.ts ──── Weight-based shipping calculation               │    │
│  │  sales-tax.ts ─── Indiana flat 7% (single nexus state)           │    │
│  │  refunds.ts ───── Policy-based refunds + Stripe SDK integration  │    │
│  │  packing.ts ───── Package-based packing algorithm                 │    │
│  │  carriers/ ────── USPS API (rates, labels, tracking, payments)    │    │
│  │  designs.ts ───── Pre-selected design catalog (6 designs)         │    │
│  │  analytics.ts ─── GA4 event tracking                              │    │
│  │  seo.ts ──────── SEO utilities + structured data                  │    │
│  │  pdf-generator.ts ── Order PDF for admin                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘

## External Services

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SUPABASE   │  │    STRIPE    │  │  NAMECHEAP   │  │     USPS     │
│  PostgreSQL  │  │  Payments    │  │ PrivateEmail  │  │  Rates/Labels│
│  + Storage   │  │  + Webhooks  │  │    SMTP       │  │  + Tracking  │
│              │  │              │  │              │  │              │
│ 20+ tables   │  │ LIVE keys    │  │ info@crystal │  │ OAuth2 REST  │
│ RLS enabled  │  │ PaymentIntent│  │ harbortc.com │  │ Ground/Prior │
│ No policies  │  │ Refunds      │  │ All outgoing │  │ ity/Express  │
│ Service role  │  │ Webhook sig  │  │ Reply-To rte │  │ Mock+Live    │
│ bypasses RLS │  │ verification │  │ IPv4 forced  │  │ EPS account  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                         │
              All accessed via API routes
              using service role / SDK calls

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   NETLIFY    │  │    GITHUB    │  │  GOOGLE      │
│  Hosting     │  │  Source Code │  │  Analytics   │
│  CDN + SSL   │  │  tbatman1960/│  │  GA4         │
│  Auto-deploy │  │  crystal-    │  │  (placeholder│
│  Env vars    │  │  harbor      │  │   ID)        │
│  Pro plan    │  │  main branch │  │              │
└──────────────┘  └──────────────┘  └──────────────┘


## Data Flow: Order Lifecycle

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ BROWSE   │───▶│   CART   │───▶│ CHECKOUT │───▶│ PAYMENT  │
│ Products │    │ Zustand  │    │ Shipping │    │ Stripe   │
│ Catalog  │    │ localStorage│ │ + Tax    │    │ Elements │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                      │
                 ┌────────────────────────────────────┘
                 ▼
┌──────────────────────┐    ┌──────────────────────┐
│ STRIPE CONFIRMS      │───▶│ ORDER CREATED        │
│ PaymentIntent        │    │ in Supabase          │
│ (client-side)        │    │ CH-YYYY-NNN number   │
└──────────────────────┘    └──────────┬───────────┘
                                       │
                 ┌─────────────────────┤
                 ▼                     ▼
┌──────────────────────┐    ┌──────────────────────┐
│ CONFIRMATION EMAIL   │    │ WEBHOOK VERIFIES     │
│ via Nodemailer SMTP  │    │ /api/webhooks/stripe │
│ (fire & forget, 5s)  │    │ Server-side backup   │
└──────────────────────┘    └──────────────────────┘
                                       │
                                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│ SUCCESS PAGE         │    │ ADMIN MANAGES        │
│ Cart clears after    │    │ Status updates       │
│ redirect             │    │ Shipping labels      │
│ Print files upload   │    │ Vendor forwarding    │
└──────────────────────┘    │ Refunds              │
                            └──────────────────────┘


## Authentication Model

┌───────────────────────────────────────────────────────┐
│                  NO SERVER SESSIONS                    │
│              Auth is 100% client-side                  │
│                                                        │
│  CUSTOMER                      ADMIN                   │
│  ┌─────────────────┐          ┌─────────────────┐     │
│  │ customers table  │          │ admin_users tbl  │     │
│  │ bcrypt hashed    │          │ bcrypt hashed    │     │
│  │ case-insensitive │          │ separate login   │     │
│  └────────┬────────┘          └────────┬────────┘     │
│           │ API validates               │              │
│           ▼                             ▼              │
│  ┌─────────────────┐          ┌─────────────────┐     │
│  │ authStore       │          │ adminStore      │     │
│  │ (Zustand)       │          │ (Zustand)       │     │
│  │ → localStorage  │          │ → localStorage  │     │
│  └─────────────────┘          └─────────────────┘     │
│                                                        │
│  ⚠️  No JWTs, no session tokens, no server validation  │
│  ⚠️  Anyone with a valid user ID in localStorage can    │
│     access protected pages                             │
└───────────────────────────────────────────────────────┘


## Database Schema (Key Tables)

┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ categories  │◄────│  products    │────▶│product_options│
│ 4 categories│     │ 4 products   │     │ size/color/  │
└─────────────┘     │ + customiz.  │     │ custom types │
                    │   flags      │     └──────────────┘
                    └──────┬───────┘
                           │            ┌──────────────┐
                           ├───────────▶│pricing_tiers │
                           │            │ volume pricing│
                           │            └──────────────┘
                           │
                           │            ┌──────────────────┐
                           ├───────────▶│product_templates │
                           │            │ print areas/color│
                           │            └──────────────────┘
                           │
┌─────────────┐     ┌──────┴───────┐     ┌──────────────┐
│ customers   │◄────│   orders     │────▶│ order_items   │
│ bcrypt auth │     │ CH-YYYY-NNN  │     │ + customiz.  │
│ addresses   │     │ Stripe PI    │     │   data/fee   │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴───────┐
                    │shipping_labels│
                    │ per package  │
                    │ USPS tracking│
                    └──────────────┘

Supporting: subscriber_emails, discount_codes, newsletter_sends,
password_reset_tokens, refund_policies, refund_requests,
shipping_packages, site_settings, saved_designs, shared_designs,
design_templates, template_categories, ai_prompt_examples


## Security Model

┌─────────────────────────────────────────────────────────┐
│  Row Level Security: ENABLED on ALL tables              │
│  Policies: NONE (intentional)                           │
│                                                          │
│  anon key (client-side) ──▶ BLOCKED from all DB ops     │
│  service role key (API routes) ──▶ BYPASSES RLS         │
│                                                          │
│  Client components ──fetch()──▶ API routes ──▶ Supabase │
│  (never query Supabase directly from client)            │
│                                                          │
│  Stripe webhook ──▶ Signature verification (whsec_*)    │
│  USPS labels ──▶ Guarded behind USPS_ENV=production     │
│  Print files ──▶ Payment validated before upload        │
│  Admin portal ──▶ Hidden (no public links)              │
└─────────────────────────────────────────────────────────┘
```
