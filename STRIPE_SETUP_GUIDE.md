# 🔐 Stripe Setup Guide for Xaura Billing

## ✅ **Feature #2: Automated Billing - COMPLETED!**

You now have a **fully functional billing system** with Stripe integration! Here's how to set it up:

---

## 📋 **What's Been Built:**

✅ **Backend:**
- BillingHistory model - tracks all transactions
- PaymentMethod model - stores customer payment info
- Stripe service - handles all Stripe API calls
- Billing service - automated billing logic with retry
- Billing controller - API endpoints for Super Admin and Owners
- Activity logging integration

✅ **Frontend:**
- Super Admin Billing page with revenue stats
- Payment method management (future)
- CSV export capability
- Manual charge and retry functions

---

## 🚀 **Setup Instructions:**

### **Step 1: Get Your Stripe API Keys**

1. Go to https://dashboard.stripe.com/register
2. Create a free Stripe account
3. Go to **Developers** → **API keys**
4. Copy your **Secret Key** (starts with `sk_test_...` for testing)

### **Step 2: Add to Your `.env` File**

Add this line to `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
FRONTEND_URL=http://localhost:3000
```

### **Step 3: Test Mode vs Live Mode**

**Test Mode (Development):**
- Use test API keys (sk_test_...)
- No real charges are made
- Use test card: `4242 4242 4242 4242`

**Live Mode (Production):**
- Use live API keys (sk_live_...)
- Real charges are made
- Stripe takes 2.9% + $0.30 per transaction

---

## 💳 **How the Billing System Works:**

### **1. Salon Setup (Owner):**
```
Owner adds payment method → Stripe creates customer → Saved in database
```

### **2. Automated Monthly Billing:**
```
Daily cron job runs → Finds due subscriptions → Charges each salon → Sends receipts
```

### **3. Failed Payment Retry Logic:**
```
Payment fails → Retry next day → Max 3 attempts → Suspend salon if all fail
```

### **4. Email Notifications:**
- ✅ Payment receipt (success)
- ⚠️ Payment failure notice
- 🚫 Account suspension alert

---

## 📊 **Super Admin Features:**

### **Billing Page (`/super-admin/billing`):**
- 💰 Total revenue dashboard
- 📈 MRR (Monthly Recurring Revenue)
- 💳 All transactions with filters
- 🔄 Manual charge button
- 🔁 Retry failed payments
- 📅 Process monthly billing

### **Revenue Stats:**
- Total revenue (all time)
- Monthly recurring revenue
- Transaction count
- Failed payment count
- Revenue by plan breakdown
- Revenue trend (12 months)

---

## 🤖 **Automated Billing (Cron Job):**

### **Option 1: Node-Cron (Simple)**

Install:
```bash
cd backend
npm install node-cron
```

Add to `backend/server.js`:
```javascript
const cron = require('node-cron');
const billingService = require('./services/billingService');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running monthly billing...');
  await billingService.processMonthlyBilling();
});
```

### **Option 2: External Cron (Production)**

Use a service like:
- **Heroku Scheduler** (if on Heroku)
- **AWS EventBridge** (if on AWS)
- **Vercel Cron** (if on Vercel)
- **EasyCron.com** (general purpose)

Call this endpoint daily:
```
POST /api/billing/admin/process-monthly
Authorization: Bearer [Super Admin Token]
```

---

## 🧪 **Testing the Billing System:**

### **Test Cards (Stripe Test Mode):**

✅ **Success:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

❌ **Declined:**
```
Card: 4000 0000 0000 0002
```

⚠️ **Insufficient Funds:**
```
Card: 4000 0000 0000 9995
```

### **Test Flow:**

1. Create test salon
2. Add payment method (use test card)
3. Create subscription
4. Run "Process Monthly Billing" from Super Admin
5. Check billing history
6. Verify email was sent

---

## 💻 **API Endpoints:**

### **Super Admin:**
```
GET    /api/billing/admin/all               - All billing history
GET    /api/billing/admin/revenue           - Revenue statistics
POST   /api/billing/admin/charge/:id        - Manual charge
POST   /api/billing/admin/retry/:id         - Retry failed payment
POST   /api/billing/admin/process-monthly   - Run monthly billing
```

### **Owner:**
```
GET    /api/billing/history                 - My billing history
POST   /api/billing/payment-method          - Add payment method
GET    /api/billing/payment-methods         - My payment methods
DELETE /api/billing/payment-methods/:id     - Remove payment method
```

---

## 📧 **Email Notifications:**

The system sends 3 types of emails:

1. **Payment Receipt** (success)
   - Amount paid
   - Transaction ID
   - Next billing date

2. **Payment Failure** (warning)
   - Reason for failure
   - Retry attempt number
   - Link to update payment

3. **Account Suspended** (urgent)
   - Final suspension notice
   - Steps to reactivate
   - Support contact

---

## 🔒 **Security Best Practices:**

✅ **Never expose API keys:**
- Keep in .env file only
- Never commit to git
- Use environment variables in production

✅ **Webhook signature verification:**
- Validate all webhook events
- Use Stripe webhook secret
- Prevents fake payment confirmations

✅ **PCI Compliance:**
- Never store card numbers
- Use Stripe Elements for card input
- Let Stripe handle sensitive data

---

## 🌐 **Production Deployment:**

### **1. Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=https://yourdomain.com
```

### **2. Webhooks Setup:**

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourapi.com/api/billing/webhook`
3. Select events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy webhook secret to .env

### **3. Set Up Cron Job:**
- Use production scheduler (see options above)
- Run daily at off-peak hours
- Monitor for errors

---

## 📈 **Subscription Plans & Pricing:**

Current plans in your system:

| Plan | Price/Month | Features |
|------|-------------|----------|
| Free | $0 | Basic features, 1 worker |
| Basic | $29 | 5 workers, basic analytics |
| Professional | $79 | Unlimited workers, advanced features |
| Enterprise | $199 | White-label, priority support |

---

## 🎯 **Next Steps:**

1. ✅ Add Stripe key to `.env`
2. ✅ Test with Stripe test cards
3. ✅ Set up cron job
4. ✅ Configure webhooks
5. ✅ Test complete billing flow
6. ✅ Switch to live mode when ready

---

## 🆘 **Troubleshooting:**

**Error: "No such customer"**
→ Run the payment method setup again

**Error: "Authentication required"**
→ Check your Stripe API key

**Payments not processing**
→ Verify cron job is running

**Emails not sending**
→ Check email service configuration

---

## 📚 **Resources:**

- Stripe Documentation: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing
- Webhooks Guide: https://stripe.com/docs/webhooks

---

**🎉 Your billing system is ready! Add your Stripe key and start testing!**


