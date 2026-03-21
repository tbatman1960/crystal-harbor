# 🚀 Crystal Harbor → Netlify Deployment Guide

## 📋 Prerequisites Checklist

Before deploying to Netlify, ensure you have:

- [ ] **Netlify Account** - Sign up at netlify.com
- [ ] **GitHub Repository** - Push your code to GitHub  
- [ ] **Domain Name** - crystalharbortc.com or custom domain
- [ ] **Stripe Live Keys** - Get from Stripe dashboard
- [ ] **Email SMTP Settings** - Working email configuration
- [ ] **Supabase Database** - Already configured ✅

## 🏗️ Step 1: Prepare Your Repository

### A. Push to GitHub
```bash
cd ~/crystal-harbor
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### B. Add Netlify Plugin (if not installed)
```bash
npm install --save-dev @netlify/plugin-nextjs
```

## 🌐 Step 2: Deploy to Netlify

### A. Connect Repository
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"New site from Git"**
3. Choose **GitHub** and authorize Netlify
4. Select your **crystal-harbor** repository
5. Configure build settings:
   - **Branch:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Functions directory:** `.netlify/functions`

### B. Configure Environment Variables
Go to **Site settings → Environment variables** and add all variables from `.env.netlify.example`:

**🔑 Critical Variables:**
```
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
SMTP_HOST=mail.privateemail.com
SMTP_USER=info@crystalharbortc.com
SMTP_PASS=your_email_password
```

## 📧 Step 3: Update Email Configuration

### A. Update SMTP Settings
Replace test SMTP with your production settings:
```
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_USER=info@crystalharbortc.com
SMTP_PASS=your_actual_password
SMTP_FROM=Crystal Harbor Trading Company <info@crystalharbortc.com>
```

### B. Test Email Functionality
1. Deploy site and visit: `https://your-site.netlify.app/admin/email-test`
2. Send test email to verify SMTP is working
3. Place test order to verify order confirmations

## 💳 Step 4: Configure Stripe for Production

### A. Get Live Stripe Keys
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle to **Live mode** (top right)
3. Go to **Developers → API keys**
4. Copy **Publishable key** and **Secret key**

### B. Set Up Webhooks
1. In Stripe Dashboard: **Developers → Webhooks**
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://your-site.netlify.app/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the **Signing secret** and add as `STRIPE_WEBHOOK_SECRET`

## 🌍 Step 5: Custom Domain Setup

### A. Add Custom Domain
1. In Netlify: **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Enter `crystalharbortc.com`
4. Follow DNS configuration instructions

### B. Update Environment Variables
```
NEXT_PUBLIC_APP_URL=https://crystalharbortc.com
```

### C. SSL Certificate
- Netlify automatically provides free SSL via Let's Encrypt
- Certificate will be provisioned within 24 hours

## 🗄️ Step 6: Database Migration (If Needed)

Your Supabase database is already cloud-hosted, so no migration needed! ✅

**But ensure:**
- [ ] Run the refund system schema: `~/crystal-harbor/refund-system-schema.sql`
- [ ] Run the email capture schema: `~/crystal-harbor/email-capture-schema.sql`
- [ ] Verify all tables exist in Supabase dashboard

## 🔍 Step 7: Testing & Verification

### A. Core Functionality Test
- [ ] **Homepage loads** correctly
- [ ] **Product pages** display properly  
- [ ] **Shopping cart** works
- [ ] **Checkout process** completes
- [ ] **Order confirmations** are sent
- [ ] **Admin panel** accessible
- [ ] **Email system** working

### B. Payment Processing Test
- [ ] **Test payments** work (use Stripe test cards)
- [ ] **Live payments** work (small amount test)
- [ ] **Webhooks** receive events correctly
- [ ] **Refunds** process correctly

### C. Performance Test
- [ ] **Page speed** acceptable (< 3 seconds)
- [ ] **Mobile responsive** design
- [ ] **SEO** meta tags present
- [ ] **Analytics** tracking working

## ⚙️ Step 8: Production Optimizations

### A. Performance
```bash
# Enable Next.js bundle analyzer (optional)
npm install --save-dev @next/bundle-analyzer
```

### B. Monitoring
Set up monitoring for:
- **Uptime monitoring** (Netlify provides basic monitoring)
- **Error tracking** (consider Sentry integration)
- **Analytics** (Google Analytics already configured)

### C. Backup Strategy
- **Code:** Already backed up in GitHub ✅
- **Database:** Supabase provides automatic backups ✅
- **Images:** Stored in Supabase storage ✅

## 🚨 Security Checklist

- [ ] **Environment variables** are secure (no test keys in production)
- [ ] **API endpoints** have proper authentication
- [ ] **Admin panel** requires login
- [ ] **HTTPS** is enabled (automatic with Netlify)
- [ ] **CORS** is configured properly
- [ ] **Webhook signatures** are verified

## 📈 Step 9: Go Live!

### A. Final Pre-Launch
1. **Test complete customer journey** (browse → order → receive email)
2. **Verify admin functions** (order management, refunds)
3. **Check all email templates** are working
4. **Test refund system** with small amounts

### B. Launch
1. **Update DNS** to point to Netlify
2. **Monitor for 24 hours** for any issues
3. **Announce launch** to your audience

## 🛠️ Ongoing Maintenance

### Daily
- [ ] Check **admin dashboard** for new orders
- [ ] Monitor **email delivery** rates

### Weekly  
- [ ] Review **site performance** metrics
- [ ] Check **error logs** in Netlify dashboard

### Monthly
- [ ] **Security updates** for dependencies
- [ ] **Backup verification** (download Supabase backup)
- [ ] **Performance optimization** review

## 🆘 Troubleshooting Common Issues

### Build Failures
```bash
# Check build logs in Netlify dashboard
# Common fixes:
npm install  # Ensure all dependencies are installed
npm run build  # Test build locally first
```

### API Route Issues
- Verify **environment variables** are set correctly
- Check **function logs** in Netlify dashboard
- Ensure **CORS** headers are configured

### Email Not Working
- Test **SMTP credentials** locally first
- Check **Netlify function logs** for email API
- Verify **email templates** render correctly

---

## 📞 Support Resources

- **Netlify Docs:** [docs.netlify.com](https://docs.netlify.com)
- **Next.js on Netlify:** [nextjs.org/docs/deployment/netlify](https://nextjs.org/docs/deployment/netlify)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Stripe Docs:** [stripe.com/docs](https://stripe.com/docs)

---

## 🎉 Congratulations!

Once deployed, your Crystal Harbor e-commerce platform will be:
- **Globally distributed** via Netlify's CDN
- **Automatically scalable** for high traffic
- **Secure** with HTTPS and proper authentication  
- **Professional** with custom domain and email
- **Feature-complete** with payments, refunds, and admin tools

**Your customers will have the same experience as shopping with major e-commerce companies!** 🚀