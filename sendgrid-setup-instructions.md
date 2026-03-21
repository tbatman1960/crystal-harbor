# SendGrid Email Setup (Production Recommended)

## Why SendGrid?
- 100 free emails per day (forever)
- Professional email delivery
- Better deliverability than Gmail
- Detailed analytics and monitoring
- No risk of Gmail blocking your domain

## Setup Steps:

### 1. Create SendGrid Account
- Go to [sendgrid.com](https://sendgrid.com)
- Sign up for free account
- Verify your email

### 2. Create API Key
- Go to Settings → API Keys
- Click "Create API Key"
- Choose "Restricted Access"
- Give it name: "Crystal Harbor"
- Select "Mail Send" permissions
- Copy the API key (starts with SG.)

### 3. Domain Authentication (Recommended)
- Go to Settings → Sender Authentication
- Click "Authenticate Your Domain" 
- Follow DNS setup for your domain
- This improves email deliverability

### 4. Update .env.local
Replace Gmail settings with:

```bash
# SendGrid Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key-here
SMTP_FROM=Crystal Harbor Trading Company <orders@crystalharbortc.com>
```

### 5. Verify Setup
- Test with an order
- Check SendGrid Activity dashboard
- Monitor bounce/spam rates

## Alternative: SendGrid Web API
For even better performance, you can use SendGrid's Web API instead of SMTP.