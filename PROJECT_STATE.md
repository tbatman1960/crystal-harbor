# Project State: Crystal Harbor Trading Company

**Project Type:** Code (E-commerce Web Application)
**Last Updated:** 2026-03-23 — Initial generation from codebase scan + development history

---

## Stack & Infrastructure

- **Framework:** Next.js 14.0.4 (App Router) with TypeScript
- **Frontend:** React 18, Tailwind CSS 3.4.19, Heroicons, Zustand (state management)
- **Database:** Supabase (PostgreSQL) — hosted, accessed via `@supabase/supabase-js`
- **Hosting/Deployment:** Netlify (auto-deploys from GitHub push to `main`)
- **Payment Processing:** Stripe (currently TEST keys — `pk_test_*` / `sk_test_*`)
- **Email:** Nodemailer via Namecheap PrivateEmail SMTP (`mail.privateemail.com`, user: `info@crystalharbortc.com`)
- **Analytics:** Google Analytics 4 (placeholder `G-XXXXXXXXXX` — needs real ID)
- **Forms:** react-hook-form
- **PDF:** jsPDF + html2canvas (for order PDFs in admin)
- **Dev Environment:** macOS (ARM64), Node v24.13.1, npm, zsh

## Architecture Summary

Crystal Harbor is a custom product printing e-commerce site built as a **Next.js App Router** application. The frontend and backend are unified — React Server Components and client components handle the UI, while Next.js API routes (`src/app/api/`) serve as the backend. There is no separate backend server.

**Data flow:** User interactions on client components (product browsing, cart, checkout) are managed by three Zustand stores persisted to localStorage: `cartStore` (shopping cart), `authStore` (customer auth), and `adminStore` (admin auth). When data needs to persist to the database, client components call API routes which use the Supabase JS client to read/write PostgreSQL. Authentication is custom — NOT Supabase Auth. Customer and admin passwords are bcrypt-hashed and stored in `customers` and `admin_users` tables respectively. Login endpoints compare hashes and return user objects; the client stores them in Zustand/localStorage. There are no JWTs or session tokens — auth state is purely client-side localStorage.

**Payment flow:** Cart → Checkout → Stripe Elements form → API route creates a PaymentIntent → Stripe.js confirms payment client-side → on success, order is created in Supabase via `createOrder()` in `src/lib/orders.ts` → order confirmation email sent via SMTP → redirect to success page. The current Stripe keys are TEST keys and will not process real payments. There is no Stripe webhook handler yet — order creation relies on client-side payment confirmation. **Important:** There is a `dev_test_payment` fallback in the checkout flow where if Stripe fails (e.g., placeholder keys), the order still gets created with a fake payment ID. This MUST be removed before going live.

**Email system:** All outgoing emails use a single sender address (`info@crystalharbortc.com`) with `Reply-To` headers for routing. Email types: order confirmation, order status updates, cancellation notices, welcome/newsletter, vendor order forwarding, admin daily reminders. Emails are sent non-blocking (fire-and-forget with 5s timeout) to prevent checkout hanging. SMTP forces IPv4 (`family: 4`) to avoid IPv6 connectivity issues.

**Admin portal:** A full admin panel at `/admin/*` with its own layout (sidebar nav), separate auth system (`admin_users` table), and 14 sections. The admin panel is completely hidden from the public site — no admin links are exposed. When a customer enters an admin email on the customer login page, a prompt offers to redirect to the admin portal.

## Directory Structure

```
crystal-harbor/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (fonts, meta, Header/Footer/PWA)
│   │   ├── page.tsx                  # Homepage (hero, categories, features, how-it-works)
│   │   ├── globals.css               # Global styles, CSS variables, component classes
│   │   ├── admin/                    # Admin portal (14 pages)
│   │   │   ├── layout.tsx            # Admin layout with responsive sidebar
│   │   │   ├── login/page.tsx        # Admin login (separate from customer login)
│   │   │   ├── page.tsx              # Dashboard (stats, recent orders)
│   │   │   ├── orders/               # Order management (list + detail)
│   │   │   ├── customers/            # Customer management (list + detail)
│   │   │   ├── products/             # Product CRUD (list, add, edit)
│   │   │   ├── subscribers/          # Email subscriber management
│   │   │   ├── shipping/             # Shipping method configuration
│   │   │   ├── reports/              # Sales reports
│   │   │   ├── analytics/            # Analytics dashboard + advanced reports
│   │   │   ├── seo/                  # SEO settings
│   │   │   ├── policies/             # Store policies editor
│   │   │   ├── refund-policies/      # Refund policy configuration
│   │   │   ├── export/               # Data export (CSV)
│   │   │   ├── settings/             # Site settings
│   │   │   └── email-test/           # Email testing tool
│   │   ├── api/                      # API routes (backend)
│   │   │   ├── auth/                 # Customer auth (login, register, check-admin)
│   │   │   ├── admin/                # Admin APIs (auth, customers, products, orders, vendor, export, shipping)
│   │   │   ├── orders/               # Order lookup + cancellation
│   │   │   ├── products/             # Public product listing
│   │   │   ├── customer/             # Customer profile update
│   │   │   ├── create-payment-intent/ # Stripe payment intent creation
│   │   │   ├── calculate-tax/        # Sales tax calculation
│   │   │   ├── send-email/           # Email dispatch (order confirmation, status updates)
│   │   │   ├── subscribe-email/      # Newsletter subscription
│   │   │   ├── test-email/           # Email testing endpoint
│   │   │   ├── refunds/              # Refund processing
│   │   │   └── migrate/              # One-time migration scripts (address fields, shipping methods)
│   │   ├── auth/                     # Customer login + registration pages
│   │   ├── products/                 # Product catalog ([category]/[product] dynamic routes)
│   │   ├── cart/                     # Shopping cart page
│   │   ├── checkout/                 # Checkout + success page
│   │   ├── account/                  # Customer account page
│   │   ├── orders/                   # Customer order lookup
│   │   ├── contact/                  # Contact page
│   │   ├── about/                    # About page
│   │   ├── terms/                    # Terms of service
│   │   ├── privacy/                  # Privacy policy
│   │   ├── returns/                  # Return policy
│   │   ├── refunds/                  # Refund policy
│   │   ├── offline/                  # PWA offline fallback page
│   │   ├── robots.txt/route.ts       # Dynamic robots.txt generation
│   │   ├── sitemap.xml/route.ts      # Dynamic sitemap generation
│   │   └── debug-cart/               # Cart debugging page (dev only)
│   ├── components/                   # React components (16 files)
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Site header with nav (hidden on /admin/*)
│   │   │   └── Footer.tsx            # Site footer with newsletter (hidden on /admin/*)
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx         # Customer login with admin detection
│   │   │   └── RegisterForm.tsx      # Customer registration
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.tsx      # Shipping/billing form
│   │   │   ├── OrderSummary.tsx      # Cart summary during checkout
│   │   │   └── StripePayment.tsx     # Stripe Elements payment form
│   │   ├── products/
│   │   │   ├── ProductCard.tsx       # Product card with image
│   │   │   ├── ProductDetailClient.tsx # Full product page (gallery, options, design upload, cart)
│   │   │   └── PricingDisplay.tsx    # Volume pricing tier display
│   │   ├── mobile/
│   │   │   ├── MobilePaymentMethods.tsx # Mobile payment method display
│   │   │   └── TouchGestures.tsx     # Touch interaction helpers
│   │   ├── EmailCapturePopup.tsx     # Newsletter popup (30s delay + exit intent)
│   │   ├── GoogleAnalytics.tsx       # GA4 script injection
│   │   ├── NewsletterSignup.tsx      # Footer newsletter form
│   │   ├── PWAProvider.tsx           # Progressive Web App service worker registration
│   │   └── SEOHead.tsx               # Dynamic SEO meta tags
│   ├── lib/                          # Business logic & utilities (16 files)
│   │   ├── supabase.ts              # Supabase client + TypeScript database types
│   │   ├── auth.ts                  # Customer auth functions (login, register, profile)
│   │   ├── admin.ts                 # Admin auth + dashboard stats + order management
│   │   ├── products.ts             # Product queries (by slug, category, featured)
│   │   ├── orders.ts               # Order creation + order number generation
│   │   ├── email.ts                # Nodemailer transport + email templates (confirmation, status, welcome, vendor)
│   │   ├── email-capture.ts        # Discount code generation + email validation
│   │   ├── shipping.ts             # Weight-based shipping calculation
│   │   ├── shipping-methods.ts     # Configurable shipping methods (DB-backed)
│   │   ├── sales-tax.ts            # US state sales tax calculation (estimated rates)
│   │   ├── refunds.ts              # Refund policies + processing + Stripe refund integration
│   │   ├── designs.ts              # Pre-selected design catalog (6 designs)
│   │   ├── analytics.ts            # GA4 event tracking (page views, add to cart, purchases)
│   │   ├── seo.ts                  # SEO utilities + structured data generation
│   │   ├── mobile-detection.ts     # Device detection utilities
│   │   ├── pwa.ts                  # PWA install prompt handling
│   │   └── pdf-generator.ts        # Order PDF generation for admin
│   └── store/                       # Zustand state stores (3 files)
│       ├── cartStore.ts            # Shopping cart (persisted to localStorage)
│       ├── authStore.ts            # Customer auth state (persisted)
│       └── adminStore.ts           # Admin auth state (persisted)
├── public/
│   ├── icons/                       # PWA icons (72px to 512px + SVG)
│   ├── images/
│   │   ├── logo/crystal-harbor-logo.jpg  # Company logo (silver script on deep blue)
│   │   ├── products/               # Product images (19 stock photos from Unsplash)
│   │   │   ├── *-main.jpg          # Main product images (4)
│   │   │   ├── custom-*-alt*.jpg   # Gallery alternates (10)
│   │   │   ├── category-*.jpg      # Category card images (4)
│   │   │   └── hero-banner.jpg     # Homepage hero (not yet wired in)
│   │   └── designs/                # Pre-selected design thumbnails (6 JPGs)
│   ├── manifest.json               # PWA manifest
│   └── sw.js                       # Service worker
├── tailwind.config.ts              # Tailwind theme (deep blue/silver/gold palette)
├── netlify.toml                    # Netlify build config + security headers
├── tsconfig.json                   # TypeScript config with @/ path alias
├── postcss.config.mjs              # PostCSS config
├── .env.local                      # Environment variables (NOT in git)
├── prepare-netlify.js              # Pre-build script for Netlify
└── PROJECT_STATE.md                # This file
```

## Database Schema

All tables are in Supabase (PostgreSQL). The schema is inferred from TypeScript types in `src/lib/supabase.ts` and usage across API routes:

### Core Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `customers` | id (uuid), email, password_hash, first_name, last_name, phone, address_line_1, address_line_2, city, state, postal_code, country, created_at, updated_at | Customer accounts |
| `admin_users` | id, email, password_hash, first_name, last_name, role, active, last_login, created_at, updated_at | Admin accounts (separate from customers) |
| `categories` | id, name, slug, description, display_order, active, created_at, updated_at | Product categories (t-shirts, blankets, flags, banners) |
| `products` | id, category_id (FK→categories), name, slug, description, material, base_price, active, image_url, created_at, updated_at | Product listings |
| `product_options` | id, product_id (FK→products), option_type ('size'\|'color'), option_value, display_order, active | Size/color options per product |
| `pricing_tiers` | id, product_id (FK→products), tier_name, min_quantity, max_quantity, price_per_unit, discount_percentage | Volume pricing tiers |
| `orders` | id, order_number, customer_id (FK→customers, nullable), guest_email, status, subtotal, shipping_cost, total_amount, stripe_payment_intent_id, shipping_address (JSONB), special_instructions, large_order_alert_sent, created_at, updated_at | Orders |
| `order_items` | id, order_id (FK→orders), product_id, product_name, quantity, unit_price, line_total, selected_size, selected_color, custom_text, tier_applied | Line items |

### Supporting Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `subscriber_emails` | id, email, source ('footer'\|'popup'\|'checkout'), active, discount_code, discount_code_sent, created_at, updated_at | Newsletter subscribers |
| `discount_codes` | id, code, type ('percentage'), value, min_order_amount, usage_limit, expires_at, active | Discount codes (generated for popup signups) |
| `refund_policies` | id, status, refund_percentage, conditions, processing_fee_percentage, restocking_fee_percentage | Refund rules by order status |
| `refund_requests` | id, order_id, order_number, requested_amount, refund_reason, refund_type, status, processed_amount, stripe_refund_id, admin_notes, created_at, processed_at | Refund tracking |
| `shipping_methods` | [VERIFY - fields unclear] | Configurable shipping options |
| `site_settings` | key, value, updated_at | Key-value site configuration |

### Relationships
- `products` → `categories` (many-to-one via category_id)
- `product_options` → `products` (many-to-one via product_id)
- `pricing_tiers` → `products` (many-to-one via product_id)
- `orders` → `customers` (many-to-one via customer_id, nullable for guest checkout)
- `order_items` → `orders` (many-to-one via order_id)
- `refund_requests` → `orders` (many-to-one via order_id)

### Current Data
- **4 products:** Custom T-Shirt, Custom Fleece Blanket, Custom Vinyl Banner, Custom Polyester Flag
- **4 categories:** T-Shirts, Blankets, Flags, Banners
- **6 pre-selected designs:** Vintage Logo, Modern Minimal, Bold Typography, Nature Theme, Geometric Pattern, Retro Sunset
- **1 admin user:** `tim.batman@mctwo.net` / `B@tm@n14425589`

## API Routes

### Authentication
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Customer login (bcrypt verify, case-insensitive email via `ilike`) |
| POST | `/api/auth/register` | Customer registration (bcrypt hash + store) |
| POST | `/api/auth/check-admin` | Check if email belongs to admin_users (used on login form blur) |
| POST | `/api/admin/auth/login` | Admin login (separate table, bcrypt verify) |

### Products
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/products` | List all active products |
| GET | `/api/admin/products` | Admin product list (includes inactive) |
| POST | `/api/admin/products` | Create product |
| GET | `/api/admin/products/[id]` | Get single product |
| PUT | `/api/admin/products/[id]` | Update product |
| DELETE | `/api/admin/products/[id]` | Delete product |

### Orders & Payments
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/create-payment-intent` | Create Stripe PaymentIntent |
| GET | `/api/orders/[orderNumber]` | Look up order by order number |
| POST | `/api/orders/cancel` | Customer order cancellation (triggers refund if applicable) |
| POST | `/api/refunds/process` | Admin refund processing |
| POST | `/api/calculate-tax` | Sales tax calculation by state |

### Email
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/send-email` | Dispatch email by type (order_confirmation, status_update) |
| POST | `/api/subscribe-email` | Newsletter subscription (generates discount code for popups) |
| POST | `/api/test-email` | Admin email testing |
| POST | `/api/admin/daily-reminder` | Admin daily summary email (cron-triggered) |
| POST | `/api/admin/send-to-vendor` | Forward order details to vendor email |

### Admin Management
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/customers` | List customers (with search) |
| PATCH | `/api/admin/customers` | Update customer / reset password |
| DELETE | `/api/admin/customers` | Delete customer |
| GET | `/api/admin/customer-detail` | Single customer with orders + subscriber status |
| POST | `/api/admin/export-data` | Export data as CSV |
| GET/POST | `/api/admin/shipping-methods` | Manage shipping methods |

### Customer
| Method | Route | Purpose |
|--------|-------|---------|
| PUT | `/api/customer/profile` | Update customer profile |

### Migrations (one-time use)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/migrate/customer-address` | Add address columns to customers table |
| POST | `/api/migrate/customer-addresses` | Variant of above |
| POST | `/api/migrate/shipping-methods` | Seed shipping methods table |

### SEO
| Route | Purpose |
|-------|---------|
| `/robots.txt` | Dynamic robots.txt generation |
| `/sitemap.xml` | Dynamic sitemap generation |

## Current Status

### Completed
- **Product catalog:** 4 products across 4 categories with volume pricing, size/color options, design upload/selection
- **Shopping cart:** Zustand-based, localStorage-persisted, supports quantity changes
- **Customer auth:** Registration, login (case-insensitive), profile management with address fields
- **Checkout flow:** Guest and member checkout, Stripe Elements integration, shipping calculation, sales tax
- **Order management:** Order creation, order number generation (CH-YYYY-NNN), customer order lookup
- **Admin portal:** 14-section admin panel with responsive mobile sidebar, order management with status updates, customer management (CRUD + password reset), product management, subscriber management, reports, analytics, SEO settings, data export, email testing, refund policies, shipping configuration
- **Email system:** Order confirmations, status updates, cancellation notices, welcome emails, vendor forwarding, daily reminders — all via SMTP (info@crystalharbortc.com)
- **Newsletter/email capture:** Footer signup + 30-second popup with exit intent, 10% discount code generation
- **Refund system:** Policy-based refunds by order status, Stripe refund integration, customer self-service cancellation
- **SEO:** Dynamic sitemap, robots.txt, Open Graph tags, structured data (Organization schema), meta tags
- **Google Analytics:** GA4 integration with e-commerce event tracking (page views, add to cart, begin checkout, purchase)
- **PWA:** Service worker, manifest, offline page, install prompt with Safari fallback
- **Branding:** Deep blue + silver + gold color palette, Dancing Script font for brand name, stock product photos
- **Deployment:** Netlify auto-deploy from GitHub, security headers, @netlify/plugin-nextjs
- **Admin security:** No default credentials exposed, admin detection via email blur on customer login
- **Mobile optimization:** Responsive admin sidebar (hamburger menu), card view for orders/customers on mobile

### In Progress
- **Admin login email prefill:** Code committed but not yet deployed — passes email from customer login redirect to admin login via URL param (commit pending push)

### Known Issues
- **`active` column missing on `customers` table:** Customer management code references `active` boolean but the column doesn't exist in the database. Needs `ALTER TABLE customers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true` run in Supabase SQL editor.
- **Footer placeholder data:** Still shows `[City, State]` and `(555) 123-4567` — needs real Crystal Harbor business contact info
- **Footer newsletter input:** Email input may appear cut off on some viewports
- **hero-banner.jpg unused:** Downloaded but not wired into the homepage hero section
- **Password reset not functional:** `requestPasswordReset()` in `src/lib/auth.ts` is a stub — logs to console, doesn't send email or generate tokens
- **Product edit page incomplete:** `src/app/admin/products/[id]/page.tsx` has TODO comments — product loading, file upload to storage, and update API are not fully implemented
- **Order detail PDF:** Admin order detail page has TODO for PDF generation
- **No Stripe webhook handler:** Order creation relies on client-side confirmation. No `/api/webhooks/stripe` endpoint exists yet.
- **`dev_test_payment` fallback in checkout:** If Stripe payment fails, orders are created with fake payment IDs — MUST be removed before accepting real payments [VERIFY - need to locate exact code]
- **Shipping method API integration:** `src/lib/shipping-methods.ts` has TODO for ShipStation/carrier API integration
- **Sales tax recording:** `src/lib/sales-tax.ts` has TODO for database storage of tax records
- **No email verification:** Customer registration doesn't verify email addresses
- **No rate limiting:** API routes have no rate limiting or abuse prevention
- **Auth is client-side only:** No server-side session validation — anyone with a valid user ID in localStorage can access protected pages

### Planned / Not Yet Started
- **Live Stripe keys:** Replace test keys with production keys in Netlify env vars
- **Stripe webhook endpoint:** Create `/api/webhooks/stripe` for payment verification
- **Custom domain:** Point `crystalharbortc.com` to Netlify via DNS
- **Real GA4 measurement ID:** Replace `G-XXXXXXXXXX` placeholder
- **Real product images:** Current images are stock photos (Unsplash) — need actual product photography
- **Inventory management:** No stock tracking system exists
- **Coupon/promo code system:** Discount codes are generated but there's no redemption flow in checkout
- **Customer reviews/ratings:** Not implemented
- **Wishlist:** Not implemented
- **Multi-image product galleries:** Gallery images are generated from filename convention, not database-backed
- **Search functionality:** No site-wide product search
- **Forgot password flow:** Needs full implementation (token generation, email, reset page)

## Key Design Decisions

1. **Custom auth instead of Supabase Auth:** Customer and admin passwords are bcrypt-hashed and stored directly in Supabase tables. Auth state is managed client-side via Zustand persisted to localStorage. No JWTs or server sessions. [VERIFY — was there a specific reason for not using Supabase Auth? Security implications exist: no server-side session validation, no token expiration]

2. **Separate admin_users table from customers:** Admin accounts are completely isolated from customer accounts. Different login pages, different API routes, different Zustand stores. This prevents privilege escalation through the customer system.

3. **Single email address for all outgoing mail:** `info@crystalharbortc.com` is used as the sender for all email types. `Reply-To` headers route replies to appropriate departments. Rationale: simpler SMTP configuration, single mailbox to manage.

4. **Non-blocking email sending:** Emails fire in the background with 5-second timeouts. If email fails, the primary action (order creation, status update) still succeeds. Rationale: prevent checkout from hanging on SMTP issues.

5. **IPv4-forced SMTP connections:** `family: 4` in nodemailer config. Rationale: IPv6 connectivity issues were causing email failures.

6. **sessionStorage flag for order completion:** `sessionStorage.setItem('orderCompleted')` prevents the checkout page from redirecting to cart after a successful order. `router.replace()` prevents back navigation to checkout.

7. **Delayed cart clearing:** Cart clears after redirect to success page, not during checkout processing. Rationale: ensures success page can still access cart data for display.

8. **TailwindCSS v3 (not v4):** Downgraded from v4 to v3 because existing `tailwind.config.ts` used v3 API and v4 has incompatible configuration format.

9. **NPM_FLAGS="--include=dev" for Netlify:** Required because `@netlify/plugin-nextjs` and other build tools are devDependencies.

10. **Git history reset:** Complete git history was reset to purge accidentally committed secret keys from early commits.

11. **Admin detection via email blur:** Rather than exposing admin links on the public site, the customer login form checks if an entered email belongs to an admin (on blur) and offers a redirect to the admin portal. Keeps admin access hidden from casual visitors.

12. **Mobile-first admin pattern:** Uses `lg:hidden`/`hidden lg:block` to show cards on mobile and tables on desktop. Admin sidebar collapses to hamburger menu on mobile.

13. **Site chrome hidden on admin routes:** Header, Footer, and EmailCapturePopup components return `null` when `pathname?.startsWith('/admin')` to prevent overlap with the admin panel's own navigation.

14. **React hooks ordering:** Conditional returns must come AFTER all hook declarations. This was a bug fix — `EmailCapturePopup.tsx` had a conditional return between hooks causing a React error.

15. **Color rebrand (2026-03-23):** Changed from lime green + coral accent colors to gold (#C4942A) + silver blue (#8A9DB8) to match the Crystal Harbor logo (silver script on deep blue). Added Dancing Script as the brand name font.

16. **Stock photos from Unsplash:** Product images are royalty-free stock photos used as placeholders. Gallery images follow a naming convention (`{product-slug}-alt{n}.jpg`) that the `ProductDetailClient` component auto-discovers.

17. **Volume pricing via database tiers:** Each product has multiple pricing_tiers rows defining quantity ranges and per-unit prices. The `calculatePrice()` function finds the matching tier for a given quantity.

## Conventions & Preferences

- **File organization:** Pages in `src/app/`, components in `src/components/` (grouped by feature), business logic in `src/lib/`, state stores in `src/store/`
- **API routes:** Next.js Route Handlers in `src/app/api/` — export named functions (GET, POST, PUT, PATCH, DELETE)
- **Styling:** Tailwind CSS utility classes. Custom color palette defined in `tailwind.config.ts`. Global component classes (`.btn-primary`, `.card`, `.form-label`, etc.) in `globals.css`
- **Fonts:** Three font families — Inter (body), Poppins (display headings), Dancing Script (brand name script)
- **Color palette:** Primary = deep navy blue (#1E3A8A), Secondary = silver grays, Accent 1 = gold (#C4942A, referenced as `accent-lime` in code for legacy reasons), Accent 2 = silver blue (#8A9DB8, referenced as `accent-coral` in code)
- **State management:** Zustand with `persist` middleware for client-side state. Each store in its own file.
- **Error handling:** API routes use try-catch with console.error logging. Client-side uses state variables for error display. No centralized error reporting service.
- **Database access:** All DB operations use `supabase` client from `src/lib/supabase.ts`. No ORM — direct Supabase query builder.
- **Email pattern:** All email templates are HTML strings generated by functions in `src/lib/email.ts`. Sent via `sendEmail()` which wraps nodemailer.
- **Build/deploy workflow:** Edit code → `npm run build` (local test) → `git add -A && git commit && git push` → Netlify auto-deploys

## External Integrations

| Service | Purpose | Config Location | Key Files |
|---------|---------|----------------|-----------|
| **Supabase** | PostgreSQL database + API | `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) | `src/lib/supabase.ts` — all lib files use this client |
| **Stripe** | Payment processing | `.env.local` (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY) — currently TEST keys | `src/app/api/create-payment-intent/route.ts`, `src/components/checkout/StripePayment.tsx`, `src/lib/refunds.ts` |
| **Namecheap PrivateEmail** | SMTP email sending | `.env.local` (SMTP_HOST=mail.privateemail.com, SMTP_PORT=587, SMTP_USER=info@crystalharbortc.com) | `src/lib/email.ts` |
| **Google Analytics 4** | Website analytics | `.env.local` (NEXT_PUBLIC_GA_MEASUREMENT_ID) — placeholder value | `src/components/GoogleAnalytics.tsx`, `src/lib/analytics.ts` |
| **Netlify** | Hosting + CDN + auto-deploy | `netlify.toml`, Netlify dashboard env vars | GitHub webhook triggers deploy on push to `main` |
| **GitHub** | Source code repository | `https://github.com/tbatman1960/crystal-harbor` | Remote: origin |

## Credentials & Access (SENSITIVE)

| Item | Value | Notes |
|------|-------|-------|
| **Admin login** | `tim.batman@mctwo.net` / `B@tm@n14425589` | Case-insensitive email, case-sensitive password |
| **Live site** | `https://crystal-harbor.netlify.app` | Netlify auto-deploys from GitHub |
| **GitHub repo** | `https://github.com/tbatman1960/crystal-harbor` | User: tbatman1960 |
| **SMTP** | `info@crystalharbortc.com` via `mail.privateemail.com:587` | Password in .env.local |
| **Stripe** | Currently TEST keys | Owner has live Stripe account, keys pending |

## Session Log

### 2026-03-23
- **Worked on:** Customer detail page enhancements, stock product images, logo integration, color rebrand, admin login email prefill, PROJECT_STATE.md generation
- **Key changes:**
  - Added tappable phone/email links and order-specific mailto on customer detail page
  - Downloaded 19 stock photos from Unsplash, replaced all placeholder camera icons
  - Updated product database image_url fields
  - Integrated Crystal Harbor logo (silver script on deep blue), then reverted to styled text matching logo's font/colors
  - Added Dancing Script font for brand name
  - Rebranded accent colors from lime/coral to gold/silver-blue
  - Fixed admin login to accept prefilled email from customer login redirect
- **Decisions made:**
  - Use Dancing Script Google Font to match logo's handwriting style
  - Gold + Silver Blue accent palette replacing Lime + Coral
  - Logo image saved but brand name rendered as styled text (not image) in the UI
  - Stock photos as temporary product images until real photography available
- **Open threads:**
  - [VERIFY] Reason for custom auth vs Supabase Auth
  - [VERIFY] Exact location of dev_test_payment fallback in checkout — needs to be removed before going live
  - [VERIFY] Shipping methods table schema
  - Stripe live keys pending from user
  - `active` column needs to be added to customers table via Supabase SQL editor
  - Footer placeholder data needs real business info
  - hero-banner.jpg not yet used on homepage
