# Crystal Harbor Trading Company - Build Plan

## Project Overview
**Business:** Custom-printed goods e-commerce platform  
**Framework:** Next.js with Supabase database, Stripe payments, Tailwind CSS  
**Timeline:** Phase 1 (MVP) → Phase 2 (design customization tools)  
**Deployment:** Local development only

## Site Map & Pages

### Public Pages
1. **Homepage** (`/`)
   - Hero section with strong CTA
   - Featured product categories
   - "How It Works" section (Choose → Design → Print → Ship)
   - Social proof section (testimonials/reviews placeholder)
   - Footer with business info

2. **About Page** (`/about`)
   - Company story and mission
   - Why choose Crystal Harbor
   - Quality commitment
   - Manufacturing partnership info

3. **Contact Page** (`/contact`)
   - Contact form (name, email, message)
   - Business details (address, phone, hours)
   - Customer support info

4. **Product Catalog** (`/products`)
   - Category listing page with 4 categories
   - Category pages (`/products/t-shirts`, `/products/blankets`, etc.)
   - Product detail pages with options and tiered pricing
   - Upload interface for customer images (Phase 1: basic upload only)

5. **Shopping Cart** (`/cart`)
   - Line items with product details and selected options
   - Quantity adjustment with live tier pricing updates
   - Order subtotal, shipping, total
   - Guest and member checkout options

6. **Checkout Flow** (`/checkout`)
   - Login/guest selection
   - Shipping address form
   - Stripe Elements payment form (test mode)
   - Order confirmation page with order number

7. **Customer Account** (`/account`)
   - Registration/login/logout
   - Password reset functionality
   - Order history dashboard
   - Order status tracking
   - Profile management

8. **Legal Pages**
   - Terms of Service (`/terms`)
   - Privacy Policy (`/privacy`)  
   - Return/Refund Policy (`/returns`)

### Admin Panel (`/admin`)
- Admin authentication (admin@crystalharbor.com / admin123)
- Dashboard with order/revenue summaries
- Product management (CRUD operations)
- Category management
- Pricing tier management per product
- Color/size option management
- Order management and status updates
- Downloadable manufacturer order forms (PDF)
- Shipping rate configuration
- Site settings and content management
- Design catalog management (empty framework for Phase 2)

## Database Schema

### Core Tables
```sql
-- Users/Customers
customers (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Product Categories
categories (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE,
  description TEXT,
  display_order INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

-- Products
products (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE,
  description TEXT,
  material VARCHAR,
  base_price DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  image_url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Product Options (sizes, colors)
product_options (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  option_type VARCHAR, -- 'size' or 'color'
  option_value VARCHAR, -- 'Medium', 'Red', etc.
  display_order INTEGER,
  active BOOLEAN DEFAULT true
)

-- Pricing Tiers
pricing_tiers (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  tier_name VARCHAR, -- 'Tier 1', 'Tier 2', etc.
  min_quantity INTEGER,
  max_quantity INTEGER, -- NULL for unlimited
  price_per_unit DECIMAL(10,2),
  discount_percentage DECIMAL(5,2)
)

-- Orders
orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR UNIQUE,
  customer_id UUID REFERENCES customers(id), -- NULL for guest orders
  guest_email VARCHAR, -- For guest orders
  status VARCHAR DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  subtotal DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR,
  shipping_address JSONB,
  special_instructions TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Order Items
order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  product_name VARCHAR, -- Snapshot for order history
  selected_size VARCHAR,
  selected_color VARCHAR,
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  line_total DECIMAL(10,2),
  uploaded_image_url VARCHAR,
  custom_text TEXT,
  custom_text_options JSONB, -- font, size, color, position
  tier_applied VARCHAR,
  created_at TIMESTAMP
)

-- Uploaded Images
uploaded_images (
  id UUID PRIMARY KEY,
  order_item_id UUID REFERENCES order_items(id),
  original_filename VARCHAR,
  file_url VARCHAR,
  file_size INTEGER,
  file_type VARCHAR,
  upload_timestamp TIMESTAMP
)

-- Design Catalog (Phase 2 framework)
design_catalog (
  id UUID PRIMARY KEY,
  name VARCHAR,
  description TEXT,
  image_url VARCHAR,
  category VARCHAR,
  tags TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

-- Admin Users
admin_users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR DEFAULT 'admin',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)

-- Site Settings
site_settings (
  id UUID PRIMARY KEY,
  key VARCHAR UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP
)
```

## Product Specifications

### Initial Product Lineup (1 per category)

**T-Shirts**
- Sizes: S, M, L, XL, 2XL, 3XL
- Material: Cotton/Polyester Blend
- Base Price: $18.99 (Tier 1)

**Blankets/Throws**
- Sizes: Throw (50"x60"), Queen (60"x80"), King (68"x88")
- Material: Fleece
- Base Price: $34.99 (Tier 1)

**Banners/Signs**  
- Sizes: Small (2'x4'), Medium (3'x6'), Large (4'x8'), XL (5'x10')
- Material: Vinyl
- Base Price: $29.99 (Tier 1)

**Flags**
- Sizes: Garden (12"x18"), House (28"x40"), Commercial (3'x5')
- Material: Polyester
- Base Price: $24.99 (Tier 1)

### Pricing Tiers (All Products)
- **Tier 1:** 1-49 units (base price)
- **Tier 2:** 50-249 units (18% discount)
- **Tier 3:** 250+ units (32% discount)

### Color Palette (Initial Set)
Black, White, Navy Blue, Red, Heather Gray, Royal Blue, Forest Green, Maroon, Purple, Orange

## Brand Identity Proposal

### Brand Variations (Client Requested)
**FOUNDATION:** Navy Blue + Silver (clean, trustworthy base)
**ACCENT OPTIONS:** Vibrant colors for energy and fun

**Variation A - Coral Pop**
- Primary: Navy Blue (#1E3A8A)
- Secondary: Silver (#94A3B8)
- Accent: Bright Coral (#FF6B6B)
- Neutrals: Charcoal (#374151), Off-White (#F8FAFC)

**Variation B - Electric Energy**  
- Primary: Navy Blue (#1E3A8A)
- Secondary: Silver (#94A3B8)
- Accent: Electric Orange (#FF8C00)
- Neutrals: Charcoal (#374151), Off-White (#F8FAFC)

**Variation C - Dual Accent**
- Primary: Navy Blue (#1E3A8A)
- Secondary: Silver (#94A3B8)  
- Accent 1: Lime Green (#84CC16)
- Accent 2: Coral (#FF6B6B)
- Neutrals: Charcoal (#374151), Off-White (#F8FAFC)

### Typography
**Primary Font:** Inter (clean, modern, highly readable)
**Accent Font:** Poppins (friendly, approachable for headings)
**Body Font:** Inter (consistent experience)

### Logo Concepts
**Option A:** "Crystal Harbor" with wave underline
**Option B:** "CRYSTAL HARBOR" bold caps with colorful accent
**Option C:** "Crystal Harbor" with small harbor icon

## Technical Architecture

### Framework Stack
- **Frontend:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe (test mode)
- **Styling:** Tailwind CSS
- **File Upload:** Supabase Storage
- **PDF Generation:** jsPDF or Puppeteer
- **Notifications:** Message tool for Telegram alerts

### Key Features

#### Phase 1 Included
✅ **Product Catalog** with categories, options, tiered pricing  
✅ **Shopping Cart** with live price updates  
✅ **Guest & Member Checkout** with Stripe payments  
✅ **Order Management** with status tracking  
✅ **Admin Panel** with full CRUD operations  
✅ **File Upload** for customer images (basic)  
✅ **PDF Order Forms** for manufacturer  
✅ **Telegram Alerts** for 100+ unit orders  
✅ **Responsive Design** (mobile-first)  

#### Phase 2 Deferred
❌ **Interactive Design Preview** (image overlay on products)  
❌ **Email Notifications** (framework only)  
❌ **Design Catalog Content** (empty framework)  
❌ **Advanced Customization Tools**  
❌ **SEO Optimization**  
❌ **Performance Optimization**  

### File Structure
```
~/crystal-harbor/
├── docs/
│   ├── wix-assessment.md
│   ├── build-plan.md
│   └── schema.sql
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   ├── (auth)/
│   │   ├── products/
│   │   ├── cart/
│   │   └── checkout/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── utils/
├── public/
├── package.json
└── README.md
```

## Order Processing Flow

1. **Customer Places Order**
   - Stripe processes payment
   - Order created in database
   - Order confirmation displayed

2. **Large Order Detection**
   - If any item quantity ≥ 100 units
   - Telegram alert sent with order details
   - Order flagged for manual review

3. **Manufacturer Order Form**
   - Downloadable PDF generated
   - Includes all specs and uploaded files
   - Admin can download from order management

4. **Order Status Updates**
   - Admin updates status (processing → shipped → delivered)
   - Customer can track via order number
   - Email framework ready for Phase 2 integration

## Technical Decisions & Trade-offs

### Decisions Made
1. **Order Numbers:** Format "CH-{YYYY}-{sequential}" (e.g., CH-2026-001)
2. **File Storage:** Supabase Storage (free tier sufficient)
3. **Image Formats:** PNG, JPG, SVG, PDF (50MB max)
4. **Database:** UUID primary keys for scalability
5. **Authentication:** Supabase Auth for customers and custom for admin

### Trade-offs
1. **Shipping:** Flat rate only (vs. calculated shipping) - simpler for MVP
2. **Inventory:** No inventory tracking initially - trust manufacturer capacity
3. **Tax:** Simple flat tax rate (vs. geo-based) - easier implementation
4. **Search:** Basic filtering only (vs. full-text search) - Phase 2 feature

## Risk Mitigation
- **Stripe Test Mode:** All payments are test transactions
- **Data Backup:** Supabase handles automatic backups
- **File Validation:** Size and type restrictions on uploads
- **SQL Injection:** Supabase client handles parameterization
- **Large Orders:** Manual review process via Telegram alerts

## Post-Launch Considerations
1. **Email Service Integration** (SendGrid/Mailgun)
2. **Real Product Photos** replacement
3. **Design Catalog Population**
4. **Performance Monitoring**
5. **SEO Implementation**
6. **Analytics Setup**

---

**Ready for Phase C (Build) pending client approval.**