# Crystal Harbor Trading Company - E-commerce Platform

A complete Next.js e-commerce website for custom printed products with tiered pricing, file uploads, and admin management.

## 🎨 Brand Identity

**Variation C - Dual Accent**
- **Primary:** Navy Blue (#1E3A8A) - trust and professionalism
- **Secondary:** Silver (#94A3B8) - modern sophistication  
- **Accent 1:** Lime Green (#84CC16) - energy and creativity
- **Accent 2:** Coral (#FF6B6B) - warmth and approachability
- **Neutrals:** Charcoal (#374151) + Off-White (#F8FAFC)

## 🚀 Features

### Customer Experience
- **Product Catalog** - 4 categories: T-Shirts, Blankets, Banners, Flags
- **Tiered Pricing** - Volume discounts: 1-49, 50-249, 250+ units
- **File Upload** - PNG, JPG, SVG, PDF support (50MB max)
- **Custom Text** - Add personalized text to products
- **Guest Checkout** - No account required to purchase
- **Member Accounts** - Order tracking and profile management
- **Shopping Cart** - Real-time pricing updates with tier discounts
- **Stripe Payments** - Secure payment processing
- **Order Tracking** - Status updates and history

### Admin Management
- **Dashboard** - Order stats, revenue tracking, recent activity
- **Order Management** - Status updates, customer info, downloadable order forms
- **Product Management** - CRUD operations for products and categories
- **Pricing Control** - Manage tiered pricing and shipping rates
- **Site Settings** - Configure contact info, business hours, policies
- **Large Order Alerts** - Telegram notifications for 100+ unit orders

### Technical Features
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Authentication** - Secure login with bcrypt password hashing
- **Database** - Supabase PostgreSQL with automated order numbering
- **File Storage** - Supabase storage for uploaded customer images
- **SEO Optimized** - Meta tags, semantic HTML, clean URLs
- **Performance** - Next.js App Router, image optimization

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe (test mode ready)
- **Styling:** Tailwind CSS + Custom Components
- **State:** Zustand (auth, cart, admin)
- **Forms:** React Hook Form
- **File Upload:** Supabase Storage
- **Typography:** Inter + Poppins fonts
- **Icons:** Heroicons

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (test mode)

### 1. Install Dependencies
```bash
cd ~/crystal-harbor
npm install
```

### 2. Environment Variables
Create `.env.local` with your credentials:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# Optional: Telegram Alerts
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
Run the SQL schema in your Supabase dashboard:
```bash
# Execute the contents of docs/schema.sql in Supabase SQL editor
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the website.

## 🔑 Default Credentials

### Admin Access
- **URL:** http://localhost:3000/admin/login
- **Email:** admin@crystalharbor.com
- **Password:** admin123

## 📁 Project Structure

```
crystal-harbor/
├── docs/
│   ├── wix-assessment.md      # Original site analysis
│   ├── build-plan.md          # Technical architecture
│   └── schema.sql             # Database schema
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/           # Authentication pages
│   │   ├── admin/            # Admin panel
│   │   ├── products/         # Product catalog
│   │   ├── checkout/         # Checkout flow
│   │   └── api/              # API routes
│   ├── components/           # Reusable components
│   │   ├── auth/             # Authentication components
│   │   ├── checkout/         # Checkout components
│   │   ├── layout/           # Layout components
│   │   └── products/         # Product components
│   ├── lib/                  # Utility libraries
│   │   ├── supabase.ts       # Database client
│   │   ├── auth.ts           # Authentication
│   │   ├── products.ts       # Product management
│   │   ├── orders.ts         # Order management
│   │   └── admin.ts          # Admin functions
│   ├── store/                # Zustand state management
│   │   ├── authStore.ts      # Authentication state
│   │   ├── cartStore.ts      # Shopping cart state
│   │   └── adminStore.ts     # Admin state
│   └── types/                # TypeScript definitions
├── public/                   # Static assets
└── package.json             # Dependencies
```

## 🧪 Testing Checklist

### Customer Flow
- [ ] Browse product categories
- [ ] View individual product pages
- [ ] Upload custom image (test file formats)
- [ ] Add custom text
- [ ] Add items to cart with different quantities
- [ ] Verify tier pricing changes
- [ ] Complete guest checkout
- [ ] Create customer account
- [ ] Complete member checkout
- [ ] Test Stripe payment (use 4242 4242 4242 4242)
- [ ] View order confirmation

### Admin Flow
- [ ] Login to admin panel
- [ ] View dashboard statistics
- [ ] Browse orders list
- [ ] Update order status
- [ ] View/edit products
- [ ] Update site settings
- [ ] Test large order notification (100+ units)

## 🚧 Known Limitations

### Phase 1 (Current)
- **Design Preview:** No interactive product preview (Phase 2)
- **Email Notifications:** Framework ready, service integration needed
- **Design Catalog:** Empty framework (Phase 2)
- **Inventory Tracking:** Not implemented
- **Tax Calculation:** Removed per client request

### Phase 2 (Future)
- Interactive design customization tool
- Design catalog with stock graphics
- Email notification service
- Advanced analytics
- SEO optimization
- Performance optimization

## 🔐 Security Features

- **Password Hashing:** bcrypt with salt rounds
- **SQL Injection Prevention:** Supabase parameterized queries  
- **File Upload Validation:** Type and size restrictions
- **Row Level Security:** Database policies for data isolation
- **Stripe Security:** PCI compliant payment processing
- **Environment Variables:** Sensitive keys in .env.local

## 📈 Deployment Recommendations

### For Production Launch
1. **Domain & Hosting:** Deploy to Vercel, Netlify, or similar
2. **SSL Certificate:** Automatic with most hosts
3. **Stripe Live Mode:** Switch to live API keys
4. **Email Service:** Integrate SendGrid, Mailgun, or similar  
5. **Analytics:** Add Google Analytics or similar
6. **Monitoring:** Set up error tracking (Sentry)
7. **Backup Strategy:** Configure database backups
8. **Legal Review:** Update terms, privacy, return policies

### Environment Setup
```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=prod_url
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 📞 Support

For development questions or customization needs:
- **Documentation:** Check `/docs` folder for technical details
- **Database Schema:** See `docs/schema.sql` for full structure
- **API Reference:** Review `/src/lib` files for function documentation

## 📝 License

This project was built as a custom development project. All rights reserved.

---

**Built with ❤️ using Next.js, Supabase, and Stripe**