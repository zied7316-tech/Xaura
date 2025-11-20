# 📧 Resend Email Setup - Works on Railway! ✅

## 🎯 **Why Resend?**
- ✅ **Works on Railway** - No SMTP ports needed (uses HTTP API)
- ✅ **Free tier** - 3,000 emails/month free
- ✅ **Fast & Reliable** - Modern email API
- ✅ **Easy setup** - Just one API key!

---

## 🚀 **STEP-BY-STEP SETUP:**

### **Step 1: Sign Up for Resend (FREE)**
1. Go to: **https://resend.com**
2. Click **"Sign Up"** (free account)
3. Verify your email
4. You'll get **3,000 emails/month FREE** ✅

### **Step 2: Get Your API Key**
1. After login, go to **"API Keys"** in the dashboard
2. Click **"Create API Key"**
3. Name it: `Xaura Production`
4. Give it **"Sending access"** permission
5. **Copy the API key** (starts with `re_`)
   - ⚠️ **You won't see it again!** Copy it now!

### **Step 3: Add to Railway**
1. Go to **Railway Dashboard** → Your **Backend Service** → **Variables**
2. Click **"+ New Variable"**
3. Add these variables:

#### **Variable 1: RESEND_API_KEY**
- **Name:** `RESEND_API_KEY`
- **Value:** `re_xxxxxxxxxxxxx` (your API key from Step 2)
- Click **"Add"**

#### **Variable 2: EMAIL_FROM** (Optional but recommended)
- **Name:** `EMAIL_FROM`
- **Value:** `noreply@xaura.pro` (or use `onboarding@resend.dev` for testing)
- Click **"Add"**

#### **Variable 3: EMAIL_FROM_NAME** (Optional)
- **Name:** `EMAIL_FROM_NAME`
- **Value:** `Xaura`
- Click **"Add"**

### **Step 4: Verify Domain (For Production)**
1. In Resend dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Add your domain: `xaura.pro`
4. Add the DNS records Resend provides to your domain
5. Wait for verification (usually 5-10 minutes)
6. Once verified, update `EMAIL_FROM` to use your domain:
   - `EMAIL_FROM=noreply@xaura.pro`

### **Step 5: Test It!**
1. Railway will auto-redeploy (wait 2-3 minutes)
2. Check Railway logs - you should see:
   ```
   [EMAIL] ✅ Email service configured (Resend API)
   [EMAIL] From: Xaura <noreply@xaura.pro>
   ```
3. Try **Forgot Password** - it should work! ✅
4. Try **Email Verification** - it should work! ✅

---

## 📋 **Quick Checklist:**

- [ ] Signed up for Resend (free account)
- [ ] Created API key
- [ ] Added `RESEND_API_KEY` to Railway
- [ ] Added `EMAIL_FROM` to Railway (optional)
- [ ] Added `EMAIL_FROM_NAME` to Railway (optional)
- [ ] Railway redeployed
- [ ] Tested forgot password ✅
- [ ] Tested email verification ✅

---

## 🎯 **For Testing (Quick Start):**

If you want to test immediately without domain verification:

1. Use Resend's default sender: `onboarding@resend.dev`
2. Set in Railway:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=onboarding@resend.dev
   EMAIL_FROM_NAME=Xaura
   ```
3. This works immediately! ✅

---

## 💰 **Pricing:**

- **Free:** 3,000 emails/month
- **Pro:** $20/month for 50,000 emails
- **Enterprise:** Custom pricing

**For Xaura, the free tier should be enough for testing and small salons!**

---

## ✅ **After Setup:**

Your emails will work perfectly:
- ✅ Forgot password emails
- ✅ Email verification
- ✅ Welcome emails
- ✅ Appointment reminders
- ✅ All other emails

**No more Railway SMTP blocking issues!** 🎉

---

## 🆘 **Troubleshooting:**

### **Error: "Invalid API key"**
- Check that `RESEND_API_KEY` is correct
- Make sure there are no extra spaces
- Regenerate the API key in Resend dashboard

### **Error: "Domain not verified"**
- Use `onboarding@resend.dev` for testing
- Or verify your domain in Resend dashboard

### **Emails not sending**
- Check Railway logs for error messages
- Verify API key is set correctly
- Check Resend dashboard for delivery status

---

**That's it! Your email service will work smoothly on Railway! 🚀**

