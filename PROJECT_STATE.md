# Project State: Crystal Harbor Trading Company

**Project Type:** Code (E-commerce Web Application)
**Last Updated:** 2026-03-31

---

## Stack & Infrastructure

- **Framework:** Next.js 14.0.4 (App Router) with TypeScript
- **Frontend:** React 18, Tailwind CSS 3.4.19, Heroicons, Zustand (state management)
- **Database:** Supabase (PostgreSQL) — hosted, accessed via `@supabase/supabase-js`
- **Hosting/Deployment:** Netlify Pro (auto-deploys from GitHub push to `main`)
- **Payment Processing:** Stripe (LIVE keys active — `pk_live_*` / `sk_live_*`)
- **Email:** Nodemailer via Namecheap PrivateEmail SMTP (`mail.privateemail.com`, user: `info@crystalharbortc.com`)
- **Analytics:** Google Analytics 4 (placeholder `G-XXXXXXXXXX` — needs real ID)
- **Forms:** react-hook-form
- **PDF:** jsPDF + html2canvas (for order PDFs in admin)
- **Dev Environment:** macOS (ARM64), Node v24.13.1, npm, zsh

## Architecture Summary

Crystal Harbor is a custom product printing e-commerce site built as a **Next.js App Router** application. The frontend and backend are unified — React Server Components and client components handle the UI, while Next.js API routes (`src/app/api/`) serve as the backend. There is no separate backend server.

**Data flow:** User interactions on client components (product browsing, cart, checkout) are managed by three Zustand stores persisted to localStorage: `cartStore` (shopping cart), `authStore` (customer auth), and `adminStore` (admin auth). When data needs to persist to the database, client components call API routes which use the Supabase JS client to read/write PostgreSQL. Authentication is custom — NOT Supabase Auth. Customer and admin passwords are bcrypt-hashed and stored in `customers` and `admin_users` tables respectively. Login endpoints compare hashes and return user objects; the client stores them in Zustand/localStorage. There are no JWTs or session tokens — auth state is purely client-side localStorage.

**Supabase client architecture (CRITICAL):** Two Supabase clients exist in `src/lib/supabase.ts`:
- `supabase` — uses the **anon key**, for client-side use only. **Blocked by RLS** from all direct DB operations.
- `supabaseAdmin` — uses the **service role key**, bypasses RLS. **Must be used in ALL API routes and server-side lib files.**
- All API routes import as: `import { supabaseAdmin as supabase } from '@/lib/supabase'`
- Client-side components must NEVER import supabase directly — they must fetch from API routes.

**Payment flow:** Cart → Checkout → Stripe Elements form → API route creates a PaymentIntent → Stripe.js confirms payment client-side → on success, order is created in Supabase via `createOrder()` in `src/lib/orders.ts` → order confirmation email sent via SMTP → redirect to success page. **Live Stripe keys are active** (as of 2026-03-24). The `dev_test_payment` bypass has been removed. A webhook endpoint at `/api/webhooks/stripe` verifies payments server-side and handles `payment_intent.succeeded`, `payment_intent.payment_failed`, and `charge.refunded` events.

**Email system:** All outgoing emails use a single sender address (`info@crystalharbortc.com`) with `Reply-To` headers for routing. Email types: order confirmation, order status updates, cancellation notices, welcome/newsletter, vendor order forwarding, admin daily reminders, password reset, mass newsletter. Emails are sent non-blocking (fire-and-forget with 5s timeout) to prevent checkout hanging. SMTP forces IPv4 (`family: 4`) to avoid IPv6 connectivity issues.

**Admin portal:** A full admin panel at `/admin/*` with its own layout (sidebar nav), separate auth system (`admin_users` table), and 15 sections (including Newsletter). The admin panel is completely hidden from the public site — no admin links are exposed. When a customer enters an admin email on the customer login page, a prompt offers to redirect to the admin portal.

**Row Level Security (RLS):** Enabled on ALL tables with NO policies. This means the anon key is blocked from all direct DB operations, while the service role key (used in API routes) bypasses RLS completely. This is the intended security posture.

## Directory Structure

```
crystal-harbor/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout (fonts, meta, Header/Footer/PWA)
│   │   ├── page.tsx                  # Homepage (hero with background image, categories, features, how-it-works)
│   │   ├── globals.css               # Global styles, CSS variables, component classes
│   │   ├── admin/                    # Admin portal (15 pages)
│   │   │   ├── layout.tsx            # Admin layout with responsive sidebar
│   │   │   ├── login/page.tsx        # Admin login (separate from customer login)
│   │   │   ├── page.tsx              # Dashboard (stats, recent orders)
│   │   │   ├── orders/               # Order management (list + detail)
│   │   │   ├── customers/            # Customer management (list + detail)
│   │   │   ├── products/             # Product CRUD (list, add, edit — fully functional)
│   │   │   ├── subscribers/          # Email subscriber management
│   │   │   ├── newsletter/           # Newsletter compose + send + history
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
│   │   │   ├── auth/                 # Customer auth (login, register, check-admin, forgot-password, reset-password)
│   │   │   ├── admin/                # Admin APIs (auth, customers, products, orders, vendor, export, shipping, subscribers, newsletter, categories, reports, analytics-reports, site-settings)
│   │   │   ├── orders/               # Order lookup + cancellation
│   │   │   ├── products/             # Public product listing
│   │   │   ├── customer/             # Customer profile (GET + PUT)
│   │   │   ├── create-payment-intent/ # Stripe payment intent creation
│   │   │   ├── calculate-tax/        # Sales tax calculation
│   │   │   ├── send-email/           # Email dispatch (order confirmation, status updates)
│   │   │   ├── subscribe-email/      # Newsletter subscription
│   │   │   ├── test-email/           # Email testing endpoint
│   │   │   ├── refunds/              # Refund processing
│   │   │   ├── webhooks/stripe/      # Stripe webhook endpoint
│   │   │   └── migrate/              # One-time migration scripts
│   │   ├── auth/                     # Customer login, registration, forgot-password, reset-password pages
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
│   ├── components/                   # React components
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Site header with nav (hidden on /admin/*)
│   │   │   └── Footer.tsx            # Site footer with newsletter + real business info
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx         # Customer login with admin detection + forgot password link
│   │   │   └── RegisterForm.tsx      # Customer registration
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.tsx      # Shipping/billing form (uses API routes, not direct Supabase)
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
│   ├── lib/                          # Business logic & utilities
│   │   ├── supabase.ts              # Supabase clients (anon + admin/service role)
│   │   ├── auth.ts                  # Customer auth functions (login, register, profile, password reset)
│   │   ├── admin.ts                 # Admin auth + dashboard stats + order management
│   │   ├── products.ts             # Product queries (by slug, category, featured)
│   │   ├── orders.ts               # Order creation + order number generation
│   │   ├── email.ts                # Nodemailer transport + email templates (confirmation, status, welcome, vendor, password reset, newsletter)
│   │   ├── email-capture.ts        # Discount code generation + email validation
│   │   ├── shipping.ts             # Weight-based shipping calculation
│   │   ├── shipping-methods.ts     # Configurable shipping methods (DB-backed)
│   │   ├── sales-tax.ts            # Indiana flat 7% sales tax (single nexus state)
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
│   │   │   └── hero-banner.jpg     # Homepage hero background (wired in, 20% opacity)
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

All tables are in Supabase (PostgreSQL). **RLS is enabled on all tables with no policies** — the anon key is blocked, service role key bypasses.

### Core Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `customers` | id (uuid), email, password_hash, first_name, last_name, phone, address_line_1, address_line_2, city, state, postal_code, country, active (boolean), created_at, updated_at | Customer accounts |
| `admin_users` | id, email, password_hash, first_name, last_name, role, active, last_login, created_at, updated_at | Admin accounts (separate from customers) |
| `categories` | id, name, slug, description, display_order, active, created_at, updated_at | Product categories (t-shirts, blankets, flags, banners) |
| `products` | id, category_id (FK→categories), name, slug, description, material, base_price, active, image_url, size_class (default 'small'), shipping_method (default 'flat_rate'), created_at, updated_at | Product listings |
| `product_options` | id, product_id (FK→products), option_type ('size'\|'color'), option_value, display_order, active | Size/color options per product |
| `pricing_tiers` | id, product_id (FK→products), tier_name, min_quantity, max_quantity, price_per_unit, discount_percentage | Volume pricing tiers |
| `orders` | id, order_number, customer_id (FK→customers, nullable), guest_email, status, subtotal, shipping_cost, total_amount, stripe_payment_intent_id, shipping_address (JSONB), special_instructions, large_order_alert_sent, created_at, updated_at | Orders |
| `order_items` | id, order_id (FK→orders), product_id, product_name, quantity, unit_price, line_total, selected_size, selected_color, custom_text, tier_applied | Line items |

### Supporting Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `subscriber_emails` | id (uuid), email (unique), source ('footer'\|'popup'\|'checkout'), active, discount_code, discount_code_sent, created_at, updated_at | Newsletter subscribers |
| `discount_codes` | id (uuid), code (unique), type, value, min_order_amount, usage_limit, times_used, expires_at, active, created_at | Discount codes |
| `newsletter_sends` | id (uuid), subject, body_html, body_text, attachment_url, attachment_name, recipient_count, sent_by, status ('draft'\|'sending'\|'sent'\|'failed'), created_at, sent_at | Newsletter send history |
| `password_reset_tokens` | id (uuid), customer_id (FK→customers), token (unique), expires_at, used, created_at | Password reset tokens (1hr expiry) |
| `refund_policies` | id, status, refund_percentage, conditions, processing_fee_percentage, restocking_fee_percentage | Refund rules by order status |
| `refund_requests` | id, order_id, order_number, requested_amount, refund_reason, refund_type, status, processed_amount, stripe_refund_id, admin_notes, created_at, processed_at | Refund tracking |
| `shipping_methods` | (DEPRECATED — data wiped, replaced by v2 system) | Legacy table, empty |
| `shipping_size_classes` | id, name (unique), label, description, display_order | Size classes for shipping tiers (small/medium/large) |
| `shipping_rate_tiers` | id, size_class_name, min_quantity, max_quantity, rate, display_order | Flat rate shipping by quantity bracket × size class |
| `site_settings` | key, value, category, updated_at | Key-value site configuration |
| `uploaded_images` | (exists in DB) | Image uploads |
| `design_catalog` | (exists in DB) | Design catalog |
| `shipping_rates` | (exists in DB) | Shipping rates |

### Tables that DO NOT exist (referenced in code but never created)
- None currently — all referenced tables have been created.

### Relationships
- `products` → `categories` (many-to-one via category_id)
- `product_options` → `products` (many-to-one via product_id)
- `pricing_tiers` → `products` (many-to-one via product_id)
- `orders` → `customers` (many-to-one via customer_id, nullable for guest checkout)
- `order_items` → `orders` (many-to-one via order_id)
- `refund_requests` → `orders` (many-to-one via order_id)
- `password_reset_tokens` → `customers` (many-to-one via customer_id, CASCADE delete)

### Current Data
- **4 products:** Custom T-Shirt, Custom Fleece Blanket, Custom Vinyl Banner, Custom Polyester Flag
- **4 categories:** T-Shirts, Blankets, Flags, Banners
- **6 pre-selected designs:** Vintage Logo, Modern Minimal, Bold Typography, Nature Theme, Geometric Pattern, Retro Sunset
- **1 admin user:** `tim.batman@mctwo.net` / `B@tm@n14425589`
- **3 subscribers** (1 real + 2 test)

## API Routes

### Authentication
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Customer login (bcrypt verify, case-insensitive email via `ilike`) |
| POST | `/api/auth/register` | Customer registration (bcrypt hash + store) |
| POST | `/api/auth/check-admin` | Check if email belongs to admin_users (used on login form blur) |
| POST | `/api/auth/forgot-password` | Send password reset email with token (1hr expiry) |
| POST | `/api/auth/reset-password` | Verify token + update password (bcrypt hash) |
| POST | `/api/admin/auth/login` | Admin login (separate table, bcrypt verify) |

### Products
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/products` | List all active products |
| GET | `/api/admin/products` | Admin product list (includes inactive) |
| POST | `/api/admin/products` | Create product |
| GET | `/api/admin/products/[id]` | Get single product with options |
| PUT | `/api/admin/products/[id]` | Update product with sizes/colors |
| DELETE | `/api/admin/products/[id]` | Delete product |
| GET | `/api/admin/categories` | List all categories (for admin forms) |

### Orders & Payments
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/create-payment-intent` | Create Stripe PaymentIntent |
| POST | `/api/webhooks/stripe` | Stripe webhook (payment_intent.succeeded/failed, charge.refunded) |
| GET | `/api/orders/[orderNumber]` | Look up order by order number |
| POST | `/api/orders/cancel` | Customer order cancellation (triggers refund if applicable) |
| POST | `/api/refunds/process` | Admin refund processing |
| POST | `/api/calculate-tax` | Sales tax calculation (7% Indiana, 0% elsewhere) |

### Email & Newsletter
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/send-email` | Dispatch email by type (order_confirmation, status_update) |
| POST | `/api/subscribe-email` | Newsletter subscription (generates discount code for popups) |
| POST | `/api/test-email` | Admin email testing |
| POST | `/api/admin/daily-reminder` | Admin daily summary email (cron-triggered) |
| POST | `/api/admin/send-to-vendor` | Forward order details to vendor email |
| GET | `/api/admin/subscribers` | List all subscribers |
| POST | `/api/admin/newsletter/send` | Send newsletter to all active subscribers (batched) |
| GET | `/api/admin/newsletter/history` | Newsletter send history |
| POST | `/api/admin/newsletter/generate` | AI newsletter generation (requires OPENAI_API_KEY, not configured) |

### Admin Management
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/customers` | List customers (with search) |
| PATCH | `/api/admin/customers` | Update customer / reset password |
| DELETE | `/api/admin/customers` | Delete customer |
| GET | `/api/admin/customer-detail` | Single customer with orders + subscriber status |
| POST | `/api/admin/export-data` | Export data as CSV |
| GET/POST/DELETE | `/api/admin/shipping/size-classes` | Manage shipping size classes |
| GET/PUT | `/api/admin/shipping/rate-tiers` | Manage flat rate shipping tiers |
| GET | `/api/admin/reports` | Sales reports data (orders with items) |
| GET | `/api/admin/analytics-reports` | Analytics data (orders, customers, products with date filtering) |
| GET/POST/PUT | `/api/admin/site-settings` | Read/write site settings (PUT for single upsert) |
| GET | `/api/admin/dashboard` | Dashboard stats (orders, revenue, recent orders, top products) |
| GET/PUT | `/api/admin/orders` | List orders (GET with filters) / Update order status (PUT) |
| GET | `/api/admin/orders/[id]` | Get single order with items |
| GET/PUT | `/api/admin/refund-policies` | List/update refund policies |

### Customer
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/customer/profile` | Get customer data by ID |
| PUT | `/api/customer/profile` | Update customer profile |

### Migrations (one-time use)
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/migrate/customer-address` | Add address columns to customers table |
| POST | `/api/migrate/customer-addresses` | Variant of above |
| POST | `/api/migrate/shipping-methods` | Seed shipping methods table |
| GET | `/api/migrate/create-newsletter-table` | Check/return SQL for newsletter_sends table |
| GET | `/api/migrate/create-reset-tokens-table` | Check/return SQL for password_reset_tokens table |

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
- **Password reset:** Full flow — forgot password page, email with secure token (1hr expiry), reset page, bcrypt hashing
- **Checkout flow:** Guest and member checkout, Stripe Elements integration, shipping calculation, sales tax
- **Order management:** Order creation, order number generation (CH-YYYY-NNN), customer order lookup
- **Admin portal:** 15-section admin panel with responsive mobile sidebar, order management with status updates, customer management (CRUD + password reset), product management (full CRUD including edit page), subscriber management, newsletter compose/send, reports, analytics, SEO settings, data export, email testing, refund policies, shipping configuration
- **Product edit page:** Fully functional — loads real data from API, saves changes, manages sizes/colors
- **Newsletter system:** Admin page with manual compose, file attachments, preview, mass send to all subscribers (batched), send history
- **Email system:** Order confirmations, status updates, cancellation notices, welcome emails, vendor forwarding, daily reminders, password reset, mass newsletter — all via SMTP (info@crystalharbortc.com)
- **Newsletter/email capture:** Footer signup + 30-second popup with exit intent, 10% discount code generation
- **Refund system:** Policy-based refunds by order status, Stripe refund integration, customer self-service cancellation
- **SEO:** Dynamic sitemap, robots.txt, Open Graph tags, structured data (Organization schema), meta tags
- **Google Analytics:** GA4 integration with e-commerce event tracking (page views, add to cart, begin checkout, purchase)
- **PWA:** Service worker, manifest, offline page, install prompt with Safari fallback
- **Branding:** Deep blue + silver + gold color palette, Dancing Script font for brand name, stock product photos
- **Homepage hero:** hero-banner.jpg wired in as subtle background image (20% opacity)
- **Footer:** Real business address (2307 Willow Lakes East Blvd, Greenwood, IN 46143) and phone ((317) 997-5503)
- **Deployment:** Netlify Pro (upgraded from free tier), auto-deploy from GitHub, security headers, @netlify/plugin-nextjs
- **Admin security:** No default credentials exposed, admin detection via email blur on customer login
- **Mobile optimization:** Responsive admin sidebar (hamburger menu), card view for orders/customers on mobile
- **Admin login email prefill:** When customer login detects admin email and redirects to `/admin/login`, email is passed via URL param and pre-filled
- **Stripe live payments:** Live keys active, `dev_test_payment` bypass removed, webhook endpoint created
- **Stripe webhook:** `/api/webhooks/stripe` handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- **Customer detail links:** Tappable phone (`tel:`) and email (`mailto:`) links, plus per-order "Email About Order" button with pre-populated subject/body
- **Row Level Security:** RLS enabled on ALL tables with no policies. Service role key bypasses RLS in API routes. Anon key blocked from direct DB access.
- **Sales tax:** Simplified to flat 7% Indiana only (single nexus state). No county/local variations. Shipping is taxable.
- **Supabase client split:** `supabase` (anon, client-side) and `supabaseAdmin` (service role, server-side) properly separated. All API routes and lib files use `supabaseAdmin`.
- **Admin RLS fixes (2026-03-30):** Dashboard, orders, order detail, settings, analytics, refund policies pages all migrated from direct lib imports to API routes. Created `/api/admin/dashboard`, `/api/admin/orders` (GET/PUT), `/api/admin/orders/[id]`, `/api/admin/refund-policies` (GET/PUT), PUT on `/api/admin/site-settings`.
- **Sitemap fix (2026-03-30):** `sitemap.xml/route.ts` switched from anon key to `supabaseAdmin` — products and categories now appear in sitemap.
- **Contact page fix (2026-03-30):** Placeholder phone, address, and non-functional form replaced with real data and working email submission via `/api/send-email`.
- **Email consistency (2026-03-30):** All customer-facing email references changed from `support@crystalharbortc.com` to `info@crystalharbortc.com`. Email template colors updated to gold/silver-blue brand palette.
- **Fallback domain fix (2026-03-30):** SEO metadata fallback `crystalharbor.com` corrected to `crystal-harbor.netlify.app` across 12 files.
- **Customer cancel/refund (2026-03-30):** Cancel Order buttons added to account page, checkout success page, and order confirmation email. Pending orders auto-refund via Stripe. Non-pending route to admin email.
- **Admin refund button (2026-03-30):** Dedicated Refund/Cancel card added to admin order detail sidebar. Refund button added to admin orders list.
- **Stripe refund fix (2026-03-30):** `processStripeRefund()` in `lib/refunds.ts` changed from `fetch('/api/refunds/process')` (broken server-side) to direct Stripe SDK call.
- **Cancelled order UX (2026-03-30):** Customer account page hides Return/Cancel buttons for cancelled orders, shows "Refund processed" message instead.
- **Shipping v2 (2026-03-31):** Complete shipping system rewrite. Old system (flat_rate/weight_based/calculated/free methods, product_shipping_methods join table, ShipStation scaffolding) replaced with size-class + quantity-bracket flat rate tiers. New tables: `shipping_size_classes`, `shipping_rate_tiers`. Products have `size_class` and `shipping_method` columns. Admin shipping page: size class CRUD, inline tier editor, ship-from ZIP, carrier API status. Product add/edit pages: size class dropdown, shipping method dropdown (flat_rate, USPS, FedEx coming soon, UPS coming soon). Mixed carts sum per-item shipping. USPS falls back to flat rate silently.
- **Account page enhancements (2026-03-31):** "Start Shopping" button at top right of account page. "Reorder" button on every order — fetches order items, matches to current products, adds to cart, redirects to cart page.

### In Progress
- **USPS shipping API integration:** Tim has no ShipStation account (doesn't want monthly subscription). Plan is to integrate USPS API directly (free). Waiting on Tim to register for USPS Web Tools account and provide User ID. UPS/FedEx can be added later.

### Known Issues
- **Footer newsletter input:** Email input may appear cut off on some viewports
- **Order detail PDF:** Admin order detail page has TODO for PDF generation
- **Calculated shipping method:** `src/lib/shipping-methods.ts` has TODO — `calculated` type exists in UI but doesn't call any shipping API yet. Will be wired to USPS.
- **No email verification:** Customer registration doesn't verify email addresses
- **No rate limiting:** API routes have no rate limiting or abuse prevention
- **Auth is client-side only:** No server-side session validation — anyone with a valid user ID in localStorage can access protected pages
- **Photo upload placeholder:** Product edit page photo upload is a stub — doesn't actually upload to storage
- **AI newsletter generation:** Requires OPENAI_API_KEY which is not configured. Tim prefers to ask the assistant to write newsletters instead.
- **Terms & Privacy pages:** Still have "placeholder legal content" warning banners — need real legal text
- **MobilePaymentMethods:** Apple Pay / Google Pay environment hardcoded to `'TEST'` — needs switch to `'PRODUCTION'`

### Planned / Not Yet Started
- **Custom domain:** Point `crystalharbortc.com` to Netlify via DNS
- **Real GA4 measurement ID:** Replace `G-XXXXXXXXXX` placeholder
- **Real product images:** Current images are stock photos (Unsplash) — need actual product photography
- **USPS shipping rates:** Pending USPS Web Tools registration
- **Inventory management:** No stock tracking system exists
- **Coupon/promo code system:** Discount codes are generated but there's no redemption flow in checkout
- **Customer reviews/ratings:** Not implemented
- **Wishlist:** Not implemented
- **Multi-image product galleries:** Gallery images are generated from filename convention, not database-backed
- **Search functionality:** No site-wide product search

## Key Design Decisions

1. **Custom auth instead of Supabase Auth:** Customer and admin passwords are bcrypt-hashed and stored directly in Supabase tables. Auth state is managed client-side via Zustand persisted to localStorage. No JWTs or server sessions.

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

18. **Stripe webhook for server-side verification (2026-03-24):** Added `/api/webhooks/stripe` to verify payments independently of client-side confirmation. Handles succeeded, failed, and refunded events. Signing secret stored in `STRIPE_WEBHOOK_SECRET` env var.

19. **RLS with no policies (2026-03-25):** Row Level Security enabled on all tables with no allow policies. The anon key (exposed in frontend) is completely blocked from direct DB access. All server-side operations use the service role key which bypasses RLS. This is simpler than writing per-table policies and equally secure since all DB access goes through API routes.

20. **Dual Supabase client pattern (2026-03-25):** `supabaseAdmin` (service role key) for all API routes/server code, `supabase` (anon key) reserved for any future client-side needs with proper RLS policies. Client components must use fetch() to API routes instead of querying Supabase directly.

21. **Indiana-only flat sales tax (2026-03-25):** Simplified from a complex county-level tax system (which had incorrect county rates) to a flat 7% for Indiana orders only. Indiana has no local/county sales tax variations. Shipping is taxable in Indiana.

22. **USPS over ShipStation (2026-03-25):** Tim decided against ShipStation's monthly subscription. Will integrate USPS API directly (free) for calculated shipping rates. UPS/FedEx APIs can be added later as needed.

23. **Newsletter workflow (2026-03-25):** AI newsletter generation is available in the admin UI but requires an OpenAI API key. Tim prefers option 3: ask the assistant to write newsletters, then paste into the manual compose. No API key needed.

24. **Server-side lib files must call SDKs directly (2026-03-30):** `fetch('/api/...')` with relative URLs fails when called from server-side lib code (no host to resolve). Discovered three times: email sending in orders.ts, refund processing in refunds.ts, and potentially any future server-to-server calls. Rule: lib files must import and call SDKs (Stripe, Nodemailer) directly, never via fetch() to own API routes.

25. **Atomic commits for code changes (2026-03-30):** Tim mandated one-fix-at-a-time workflow after batched changes caused regressions. Codified in AGENTS.md as "Code Change Discipline": single change → build → test → commit → next fix. No exceptions.

26. **Customer cancel/refund UX (2026-03-30):** Pending orders can be cancelled by customers for full automatic refund via Stripe SDK. Non-pending orders route to email for manual admin review. Cancelled orders show "refund processed" message with no further action buttons. Admin order detail has dedicated refund card in sidebar.

27. **Shipping v2: size-class + flat-rate tiers (2026-03-31):** Replaced the over-engineered multi-type shipping system (flat_rate/weight_based/calculated/free methods, product_shipping_methods join table, ShipStation scaffolding, shipping zones) with a simple size-class model. Three size classes (small/medium/large) assigned per product. Flat rate tiers are quantity brackets × size classes (e.g., small 1-5 items = $7.99). Each product has a `shipping_method` field (flat_rate, usps, fedex, ups) controlling which calculation method applies. Mixed carts sum per-item shipping. Carrier APIs (USPS/FedEx/UPS) fall back to flat rate silently when unconfigured. Admin controls tiers and size classes; customer sees one shipping price at checkout determined by product settings.

28. **Reorder from order history (2026-03-31):** Reorder button on account page fetches order items via `/api/orders/{orderNumber}`, matches to current products by name via `/api/products`, adds to cart with generated IDs, redirects to cart. Falls back to products page if items no longer exist. Product matching is by name since `order_items` doesn't store `product_slug` or `category_slug`.

## Conventions & Preferences

- **File organization:** Pages in `src/app/`, components in `src/components/` (grouped by feature), business logic in `src/lib/`, state stores in `src/store/`
- **API routes:** Next.js Route Handlers in `src/app/api/` — export named functions (GET, POST, PUT, PATCH, DELETE). ALL use `supabaseAdmin`.
- **Styling:** Tailwind CSS utility classes. Custom color palette defined in `tailwind.config.ts`. Global component classes (`.btn-primary`, `.card`, `.form-label`, etc.) in `globals.css`
- **Fonts:** Three font families — Inter (body), Poppins (display headings), Dancing Script (brand name script)
- **Color palette:** Primary = deep navy blue (#1E3A8A), Secondary = silver grays, Accent 1 = gold (#C4942A, referenced as `accent-lime` in code for legacy reasons), Accent 2 = silver blue (#8A9DB8, referenced as `accent-coral` in code)
- **State management:** Zustand with `persist` middleware for client-side state. Each store in its own file.
- **Error handling:** API routes use try-catch with console.error logging. Client-side uses state variables for error display. No centralized error reporting service.
- **Database access:** Server-side uses `supabaseAdmin` from `src/lib/supabase.ts`. Client-side uses fetch() to API routes. No direct Supabase queries from client components.
- **Email pattern:** All email templates are HTML strings generated by functions in `src/lib/email.ts`. Sent via `sendEmail()` which wraps nodemailer.
- **Build/deploy workflow:** Edit code → `npm run build` (local test) → `git add -A && git commit && git push` → Netlify auto-deploys

## External Integrations

| Service | Purpose | Config Location | Key Files |
|---------|---------|----------------|-----------|
| **Supabase** | PostgreSQL database + API | `.env.local` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) | `src/lib/supabase.ts` — dual client (anon + admin) |
| **Stripe** | Payment processing | `.env.local` (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) — LIVE keys active | `src/app/api/create-payment-intent/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/components/checkout/StripePayment.tsx`, `src/lib/refunds.ts` |
| **Namecheap PrivateEmail** | SMTP email sending | `.env.local` (SMTP_HOST=mail.privateemail.com, SMTP_PORT=587, SMTP_USER=info@crystalharbortc.com) | `src/lib/email.ts` |
| **Google Analytics 4** | Website analytics | `.env.local` (NEXT_PUBLIC_GA_MEASUREMENT_ID) — placeholder value | `src/components/GoogleAnalytics.tsx`, `src/lib/analytics.ts` |
| **Netlify** | Hosting + CDN + auto-deploy | `netlify.toml`, Netlify dashboard env vars | GitHub webhook triggers deploy on push to `main` |
| **GitHub** | Source code repository | `https://github.com/tbatman1960/crystal-harbor` | Remote: origin |

## Credentials & Access (SENSITIVE)

| Item | Value | Notes |
|------|-------|-------|
| **Admin login** | `tim.batman@mctwo.net` / `B@tm@n14425589` | Case-insensitive email, case-sensitive password |
| **Live site** | `https://crystal-harbor.netlify.app` | Netlify Pro, auto-deploys from GitHub |
| **GitHub repo** | `https://github.com/tbatman1960/crystal-harbor` | User: tbatman1960 |
| **SMTP** | `info@crystalharbortc.com` via `mail.privateemail.com:587` | Password in .env.local |
| **Stripe** | LIVE keys active | Webhook secret: `whsec_7NTvYz4dmQqyTgVOogI7UkJSEe1CF4oj` — all three env vars set in Netlify |
| **Business Address** | 2307 Willow Lakes East Blvd, Greenwood, Indiana 46143 | In footer |
| **Business Phone** | (317) 997-5503 | In footer, tappable link |

## Session Log

### 2026-03-31
- **Worked on:** Complete shipping system rewrite (v2), account page enhancements
- **Key changes:**
  - Created `shipping_size_classes` and `shipping_rate_tiers` tables in Supabase
  - Added `size_class` and `shipping_method` columns to products table
  - Rewrote `src/lib/shipping-methods.ts` and `src/lib/shipping.ts` for new tier system
  - Rewrote `/api/shipping/available` to calculate per-item shipping from product settings
  - Created `/api/admin/shipping/size-classes` (GET/POST/DELETE) and `/api/admin/shipping/rate-tiers` (GET/PUT)
  - New admin shipping page: size class management, inline tier editor, ship-from ZIP, carrier status
  - Added Shipping section to product add + edit pages (size class + shipping method dropdowns)
  - Removed: old add/edit shipping pages, `/api/admin/shipping-methods` route, all `product_shipping_methods` refs, ShipStation code
  - Added "Start Shopping" button to account page header
  - Added "Reorder" button to each order in order history (fetches items, adds to cart)
- **Decisions made:**
  - Flat rate tiers per size class, not per product — keeps management simple
  - Shipping quantity brackets independent from pricing tiers
  - One shipping method per product (admin-controlled), no customer choice at checkout
  - Mixed carts: per-item calculation, summed to single total
  - USPS/FedEx/UPS as dropdown options; FedEx/UPS disabled as "coming soon"
  - Reorder button matches by product name since order_items don't store product slugs
- **Lessons learned:**
  - `site_settings` table has `description` not `category` column — verify schema before SQL
  - Supabase SQL Editor rolls back entire query on any error
  - `Array.from(new Set())` instead of `[...new Set()]` for TypeScript compat
  - CartItem requires an `id` field for programmatic addItem calls

### 2026-03-30
- **Worked on:** Comprehensive site audit (18 issues), admin RLS fixes, placeholder data, contact form, email consistency, cancel/refund flows, Stripe refund fix
- **Key changes:**
  - Created 5 new API routes: `/api/admin/dashboard`, `/api/admin/orders` (GET/PUT), `/api/admin/orders/[id]`, `/api/admin/refund-policies` (GET/PUT), PUT on `/api/admin/site-settings`
  - Fixed 6 admin pages broken by RLS — migrated from direct supabaseAdmin lib imports to fetch() API routes
  - Fixed sitemap.xml (anon key → supabaseAdmin), fallback domain in 12 files, fake phone in 12 files, placeholder address
  - Contact form now sends email via API; email templates updated to brand colors; support@ → info@ in 11 files
  - Added cancel/refund buttons: customer account page, checkout success page, admin orders list, admin order detail sidebar, confirmation email
  - Fixed `processStripeRefund()` — was using relative `fetch('/api/refunds/process')` server-side (no host). Now calls Stripe SDK directly.
  - Fixed cancel API field mismatch (`orderNumber` → `order_id`)
  - Cancelled orders show "Refund processed" message, hide Return/Cancel buttons
  - Verified all markdown files are conflict-free across AGENTS.md, MEMORY.md, USER.md, SOUL.md
- **Decisions made:**
  - "Code Change Discipline" — one fix → build → test → commit → next fix. Added to AGENTS.md as permanent rule.
  - Server-side lib files must call SDKs directly — never use relative fetch() to own API routes
  - All customer-facing email uses `info@crystalharbortc.com` only
  - Customer cancel: pending → auto Stripe refund; non-pending → email to admin for review
- **Issues still open:**
  - Need Stripe test keys from Tim for safe testing
  - Terms & Privacy placeholder legal content
  - MobilePaymentMethods in TEST mode
  - GA4 measurement ID placeholder
  - Custom domain not configured

### 2026-03-25
- **Worked on:** Netlify upgrade, hero banner, footer info, RLS, newsletter system, product edit page, password reset, sales tax cleanup, admin page fixes
- **Key changes:**
  - Tim upgraded Netlify from free to Pro ($19/mo) — site back online
  - Wired hero-banner.jpg into homepage as background image (20% opacity)
  - Updated footer with real business address and phone number
  - Added `active` column to customers table (was already present)
  - Enabled Row Level Security on ALL tables (no policies — anon key blocked, service role key bypasses)
  - Created `supabaseAdmin` (service role key) client — updated all 20 API routes + 6 lib files to use it
  - Moved CheckoutForm's direct Supabase calls to use `/api/customer/profile` API route
  - Created `subscriber_emails` and `discount_codes` tables — newsletter signup now functional
  - Built full newsletter management system: admin page with compose, preview, mass send (batched), file attachments, send history, AI compose option
  - Added Newsletter link to admin sidebar
  - Created `newsletter_sends` table for send history
  - Fixed subscribers page column mismatch (`subscribed_at` → `created_at`)
  - Completed product edit page — loads real data from API, saves changes, manages sizes/colors
  - Built complete password reset flow: forgot password page, reset password page, secure token email (1hr expiry), bcrypt hashing
  - Added "Forgot Password?" link to customer login form
  - Created `password_reset_tokens` table
  - Fixed 3 broken admin pages (SEO, Reports, Analytics Reports) — moved from direct Supabase queries to API routes
  - Simplified sales tax from incorrect county-level rates to flat 7% Indiana only
  - Created API routes: `/api/admin/subscribers`, `/api/admin/newsletter/*`, `/api/admin/categories`, `/api/admin/reports`, `/api/admin/analytics-reports`, `/api/admin/site-settings`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/customer/profile` (GET)
- **Decisions made:**
  - RLS with no policies (simpler than per-table policies, equally secure)
  - Dual Supabase client pattern (anon for client, service role for server)
  - Indiana flat 7% — no county variations (previous county rates were incorrect)
  - USPS direct API over ShipStation (no monthly fee)
  - Newsletter AI compose via assistant conversation, not OpenAI API key
- **Open threads:**
  - USPS Web Tools registration pending — Tim will provide User ID
  - Custom domain, GA4 ID, real product photos still pending Tim's input

### 2026-03-24
- **Worked on:** Stripe live integration, webhook endpoint, AGENTS.md session protocols, Netlify issue
- **Key changes:**
  - Updated `.env.local` with live Stripe keys
  - Removed `dev_test_payment` bypass from CheckoutForm.tsx
  - Created Stripe webhook endpoint at `src/app/api/webhooks/stripe/route.ts`
  - Added `STRIPE_WEBHOOK_SECRET` to `.env.local`
  - Tim updated Netlify env vars with live Stripe keys + webhook secret
  - Updated `AGENTS.md` with Session Management Protocols
- **Decisions made:**
  - Webhook handles 3 events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
- **Issues discovered:**
  - Netlify free tier usage limit exceeded (resolved 2026-03-25 with Pro upgrade)

### 2026-03-23
- **Worked on:** Customer detail page enhancements, stock product images, logo integration, color rebrand, admin login email prefill, PROJECT_STATE.md generation
- **Key changes:**
  - Added tappable phone/email links and order-specific mailto on customer detail page
  - Downloaded 19 stock photos from Unsplash, replaced all placeholder camera icons
  - Updated product database image_url fields
  - Integrated Crystal Harbor logo, then reverted to styled text matching logo's font/colors
  - Added Dancing Script font for brand name
  - Rebranded accent colors from lime/coral to gold/silver-blue
  - Fixed admin login to accept prefilled email from customer login redirect
- **Decisions made:**
  - Use Dancing Script Google Font to match logo's handwriting style
  - Gold + Silver Blue accent palette replacing Lime + Coral
  - Stock photos as temporary product images until real photography available
