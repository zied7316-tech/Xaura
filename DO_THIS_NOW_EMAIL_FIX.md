# 🚀 DO THIS NOW: Fix Email Service

## ✅ **STEP 1: Remove Old Gmail Variables (2 minutes)**

1. Go to: **https://railway.app/dashboard**
2. Click your **Backend Service**
3. Click **"Variables"** tab
4. **Delete these 6 variables** (click trash icon 🗑️):
   - ❌ `EMAIL_HOST`
   - ❌ `EMAIL_PORT`
   - ❌ `EMAIL_USER`
   - ❌ `EMAIL_PASS`
   - ❌ `EMAIL_FROM` (old one)
   - ❌ `EMAIL_FROM_NAME` (old one)

---

## ✅ **STEP 2: Get Resend API Key (3 minutes)**

1. Go to: **https://resend.com**
2. Click **"Sign Up"** (free account)
3. Verify your email
4. After login:
   - Go to **"API Keys"** in dashboard
   - Click **"Create API Key"**
   - Name: `Xaura Production`
   - Permission: **"Sending access"**
   - **Copy the API key** (starts with `re_`)
   - ⚠️ **Save it!** You won't see it again!

---

## ✅ **STEP 3: Add Resend Variables to Railway (2 minutes)**

1. Still in Railway **Variables** tab
2. Click **"+ New Variable"**
3. Add these **3 variables**:

### **Variable 1:**
- **Name:** `RESEND_API_KEY`
- **Value:** `re_xxxxxxxxxxxxx` (paste your API key from Step 2)
- Click **"Add"**

### **Variable 2:**
- **Name:** `EMAIL_FROM`
- **Value:** `onboarding@resend.dev`
- Click **"Add"**

### **Variable 3:**
- **Name:** `EMAIL_FROM_NAME`
- **Value:** `Xaura`
- Click **"Add"**

---

## ✅ **STEP 4: Fix Railway Build (1 minute)**

Railway is failing because of `package-lock.json`. Quick fix:

1. In Railway Dashboard → **Backend Service**
2. Go to **"Settings"** tab
3. Find **"Build Command"** or **"Deploy"** section
4. Change from: `npm ci`
5. To: `npm install`
6. Click **"Save"**

**OR** if you see **"Root Directory"**:
- Set it to: `backend`

---

## ✅ **STEP 5: Wait & Test (3 minutes)**

1. Railway will **auto-redeploy** (wait 2-3 minutes)
2. Go to **"Logs"** tab
3. Look for:
   ```
   [EMAIL] ✅ Email service configured (Resend API)
   [EMAIL] From: Xaura <onboarding@resend.dev>
   ```
4. Test **Forgot Password** - should work! ✅
5. Test **Email Verification** - should work! ✅

---

## 📋 **Quick Checklist:**

- [ ] Removed 6 old Gmail variables from Railway
- [ ] Signed up for Resend (free)
- [ ] Created Resend API key
- [ ] Added `RESEND_API_KEY` to Railway
- [ ] Added `EMAIL_FROM` to Railway
- [ ] Added `EMAIL_FROM_NAME` to Railway
- [ ] Fixed Railway build command (npm ci → npm install)
- [ ] Railway redeployed
- [ ] Checked logs - see "Resend API" message
- [ ] Tested forgot password ✅
- [ ] Tested email verification ✅

---

## 🎯 **That's It!**

After these 5 steps, your email service will work perfectly on Railway! 🎉

**Total time: ~10 minutes**

---

## 🆘 **If Something Goes Wrong:**

1. **Can't find API Keys in Resend?**
   - Make sure you're logged in
   - Look in left sidebar → "API Keys"

2. **Railway still failing?**
   - Check if Root Directory is set to `backend`
   - Or change build command to `npm install`

3. **Email still not working?**
   - Check Railway logs for error messages
   - Verify `RESEND_API_KEY` is correct (no spaces)
   - Make sure Railway redeployed after adding variables

---

**Start with Step 1 and work through each step!** 🚀

