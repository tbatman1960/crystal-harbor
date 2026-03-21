# Email Troubleshooting for Crystal Harbor

## Current Configuration (Updated)
```bash
SMTP_HOST=mail.privateemail.com  # Changed from mail.privatemail.com
SMTP_PORT=587
SMTP_USER=info@crystalharbortc.com
SMTP_PASS=B@tm@n14425589
```

## Alternative SMTP Servers to Try

If current settings don't work, try these in your .env.local:

### Option A: Standard Namecheap
```bash
SMTP_HOST=mail.privateemail.com
SMTP_PORT=26
SMTP_SECURE=false
```

### Option B: Alternative Port
```bash 
SMTP_HOST=mail.privateemail.com
SMTP_PORT=465
SMTP_SECURE=true
```

### Option C: Legacy Server
```bash
SMTP_HOST=mail.privatemail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Option D: Direct Server IP
```bash
SMTP_HOST=198.54.117.215  # Namecheap SMTP IP
SMTP_PORT=587
SMTP_SECURE=false
```

## Testing Steps

1. Update .env.local with new settings
2. Restart dev server: `npm run dev`
3. Test at: http://localhost:3000/admin/email-test
4. Check server logs for specific errors

## Common Issues

- **IPv6 Connection Failed**: Fixed with family:4 setting
- **Firewall Blocking**: Try port 26 instead of 587
- **Auth Failed**: Double-check email password
- **DNS Issues**: Try IP address instead of hostname

## Verification Commands

Test SMTP connection manually:
```bash
# Test if server is reachable
telnet mail.privateemail.com 587

# Test DNS resolution
nslookup mail.privateemail.com
```

## Alternative: SendGrid Setup

If Namecheap continues to have issues:
1. Sign up at sendgrid.com (100 free emails/day)
2. Get API key
3. Update .env.local:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```