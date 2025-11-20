# 🔄 Update Railway Variables: Remove Gmail, Add Resend

## ⚠️ **IMPORTANT: Remove Old Gmail Variables First!**

Before adding Resend, remove the old Gmail SMTP variables to avoid conflicts.

---

## 🗑️ **STEP 1: Remove Old Gmail Variables**

Go to **Railway Dashboard** → **Backend Service** → **Variables** tab

**Delete these 6 variables:**
1. ❌ `EMAIL_HOST` (delete)
2. ❌ `EMAIL_PORT` (delete)
3. ❌ `EMAIL_USER` (delete)
4. ❌ `EMAIL_PASS` (delete)
5. ❌ `EMAIL_FROM` (delete - we'll add a new one)
6. ❌ `EMAIL_FROM_NAME` (delete - we'll add a new one)

**How to delete:**
- Click the **trash icon** 🗑️ next to each variable
- Or click the variable → **Delete**

---

## ✅ **STEP 2: Add Resend Variables**

After removing old variables, add these **3 new variables:**

### **Variable 1: RESEND_API_KEY** (REQUIRED)
- **Name:** `RESEND_API_KEY`
- **Value:** `re_xxxxxxxxxxxxx` (your Resend API key)
- **How to get it:**
  1. Go to https://resend.com
  2. Sign up / Login
  3. Go to **"API Keys"** in dashboard
  4. Click **"Create API Key"**
  5. Name: `Xaura Production`
  6. Permission: **"Sending access"**
  7. **Copy the key** (starts with `re_`)

### **Variable 2: EMAIL_FROM** (REQUIRED)
- **Name:** `EMAIL_FROM`
- **Value:** `onboarding@resend.dev` (for testing)
  - OR: `noreply@xaura.pro` (after domain verification)
- **Note:** Use `onboarding@resend.dev` for quick testing!

### **Variable 3: EMAIL_FROM_NAME** (OPTIONAL)
- **Name:** `EMAIL_FROM_NAME`
- **Value:** `Xaura`
- **Note:** This is optional, defaults to "Xaura" if not set

---

## 📋 **Quick Checklist:**

- [ ] Removed `EMAIL_HOST`
- [ ] Removed `EMAIL_PORT`
- [ ] Removed `EMAIL_USER`
- [ ] Removed `EMAIL_PASS`
- [ ] Removed old `EMAIL_FROM`
- [ ] Removed old `EMAIL_FROM_NAME`
- [ ] Added `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
- [ ] Added `EMAIL_FROM` = `onboarding@resend.dev`
- [ ] Added `EMAIL_FROM_NAME` = `Xaura` (optional)

---

## 🚀 **STEP 3: Wait for Redeploy**

1. Railway will **auto-redeploy** after you add variables
2. Wait **2-3 minutes**
3. Check **Logs** tab - you should see:
   ```
   [EMAIL] ✅ Email service configured (Resend API)
   [EMAIL] From: Xaura <onboarding@resend.dev>
   ```

---

## ✅ **STEP 4: Test**

1. Try **Forgot Password** - should work! ✅
2. Try **Email Verification** - should work! ✅

---

## 🎯 **Final Variables (After Update):**

Your Railway Variables should look like this:

```
✅ RESEND_API_KEY = re_xxxxxxxxxxxxx
✅ EMAIL_FROM = onboarding@resend.dev
✅ EMAIL_FROM_NAME = Xaura
```

**That's it! Only 3 variables needed for Resend!** 🎉

---

## ⚠️ **Important Notes:**

- **Don't keep both** Gmail and Resend variables - remove Gmail first!
- **Resend API key** is the only required variable
- **Use `onboarding@resend.dev`** for immediate testing (no domain verification needed)
- **Later:** Verify your domain in Resend to use `noreply@xaura.pro`

---

**After removing old variables and adding Resend, your emails will work perfectly!** ✅

