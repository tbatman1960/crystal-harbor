# 📧 Email Setup Guide - Crystal Harbor

## 🎯 **Quick Setup (Gmail - Recommended)**

### **Step 1: Gmail App Password**
1. **Go to:** https://myaccount.google.com/security
2. **Enable:** 2-Factor Authentication (if not already enabled)
3. **Click:** "App passwords" (in 2-Step Verification section)
4. **Generate:** App password for "Mail"
5. **Copy:** The 16-character password generated

### **Step 2: Add to .env.local**
Add these lines to your `.env.local` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=Crystal Harbor Trading Company <your-email@gmail.com>
```

Replace:
- `your-email@gmail.com` with your Gmail address
- `your-16-char-app-password` with the app password from Step 1

---

## 🔧 **Alternative Email Providers**

### **Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=Crystal Harbor Trading Company <your-email@outlook.com>
```

### **Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_FROM=Crystal Harbor Trading Company <your-email@yahoo.com>
```

### **Custom Domain/Business Email:**
```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=orders@your-domain.com
SMTP_PASS=your-password
SMTP_FROM=Crystal Harbor Trading Company <orders@your-domain.com>
```

---

## ✅ **Testing Email**

Once configured, test with:
1. **Complete an order** with "Skip Payment"
2. **Check email** at the address you provided during checkout
3. **Should receive:** Professional order confirmation with:
   - Order number and details
   - Item list with pricing
   - Shipping information
   - Company branding

---

## 🚀 **Production Email Services (Optional)**

For high-volume production:
- **SendGrid:** Professional email service
- **Mailgun:** Developer-friendly email API  
- **AWS SES:** Amazon Simple Email Service
- **Postmark:** Transactional email service

(Current Gmail setup is perfect for development and small business use)

---

## 🔒 **Security Notes**

- **Never commit** .env.local to version control
- **Use app passwords** (not your main password)
- **Enable 2FA** on your email account
- **Monitor email** for suspicious activity

---

## 📧 **Email Template Features**

Your order confirmation emails include:
- **Professional HTML** design with company branding
- **Order details:** Number, date, items, totals
- **Customer information:** Shipping address, contact info
- **Order status:** Current status and expected delivery
- **Responsive design:** Looks great on mobile and desktop