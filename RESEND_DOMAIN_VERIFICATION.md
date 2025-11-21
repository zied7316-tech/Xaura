# 🔐 Resend Domain Verification - REQUIRED!

## ⚠️ **Problem:**
Resend free tier only allows sending emails to **your own email address** (the one you used to sign up).

**Error:** "You can only send testing emails to your own email address"

## ✅ **Solution: Verify Your Domain**

To send emails to **any recipient**, you need to verify your domain in Resend.

---

## 🚀 **STEP-BY-STEP: Verify Domain**

### **Step 1: Go to Resend Domains**
1. Go to: **https://resend.com/domains**
2. Login to your Resend account
3. Click **"Add Domain"** button

### **Step 2: Add Your Domain**
1. Enter your domain: **`xaura.pro`**
2. Click **"Add Domain"**
3. Resend will show you **DNS records** to add

### **Step 3: Add DNS Records**
You need to add these DNS records to your domain (`xaura.pro`):

#### **Record 1: SPF Record**
- **Type:** `TXT`
- **Name:** `@` (or root domain)
- **Value:** `v=spf1 include:resend.com ~all`
- **TTL:** `3600` (or default)

#### **Record 2: DKIM Record**
- **Type:** `TXT`
- **Name:** `resend._domainkey` (or similar)
- **Value:** (Resend will provide this - copy exactly)
- **TTL:** `3600` (or default)

#### **Record 4: DMARC Record (Optional but recommended)**
- **Type:** `TXT`
- **Name:** `_dmarc`
- **Value:** `v=DMARC1; p=none; rua=mailto:dmarc@xaura.pro`
- **TTL:** `3600` (or default)

### **Step 4: Add DNS Records to Your Domain**
1. Go to your domain registrar (where you bought `xaura.pro`)
2. Go to **DNS Management** or **DNS Settings**
3. Add the DNS records Resend provided
4. **Save** the changes

### **Step 5: Wait for Verification**
1. Go back to Resend dashboard
2. Wait **5-15 minutes** for DNS propagation
3. Resend will automatically verify your domain
4. Status will change to **"Verified"** ✅

### **Step 6: Update Railway Variables**
1. Railway Dashboard → Backend Service → Variables
2. Update `EMAIL_FROM`:
   - **Old:** `onboarding@resend.dev`
   - **New:** `noreply@xaura.pro` (or `hello@xaura.pro`)
3. Click **"Update"**
4. Railway will auto-redeploy

### **Step 7: Test Again**
1. Wait for Railway to redeploy (2-3 minutes)
2. Try **Forgot Password** again
3. Email should work! ✅

---

## 📋 **Quick Checklist:**

- [ ] Added domain `xaura.pro` in Resend
- [ ] Added SPF DNS record
- [ ] Added DKIM DNS record (from Resend)
- [ ] Added DMARC DNS record (optional)
- [ ] Waited 5-15 minutes for verification
- [ ] Domain status is "Verified" in Resend
- [ ] Updated `EMAIL_FROM` in Railway to `noreply@xaura.pro`
- [ ] Railway redeployed
- [ ] Tested forgot password ✅

---

## 🎯 **Alternative: Quick Testing Solution**

If you need to test **immediately** without domain verification:

1. **Only send to your account email:**
   - Use: `xaura.info@gmail.com` (your Resend account email)
   - This will work without domain verification

2. **For production:**
   - You MUST verify your domain
   - Then you can send to any email address

---

## 🆘 **Troubleshooting:**

### **DNS Records Not Working?**
- Wait longer (DNS can take up to 48 hours)
- Check DNS records are correct (no typos)
- Use DNS checker: https://mxtoolbox.com/

### **Domain Not Verifying?**
- Double-check DNS records match exactly
- Make sure TTL is set correctly
- Contact Resend support if still not working

### **Still Getting Error?**
- Make sure `EMAIL_FROM` uses your verified domain
- Example: `noreply@xaura.pro` (not `onboarding@resend.dev`)

---

## ✅ **After Verification:**

You'll be able to:
- ✅ Send emails to **any recipient**
- ✅ Use your own domain (`@xaura.pro`)
- ✅ Better email deliverability
- ✅ Professional email addresses

---

**Verify your domain now to fix the email issue!** 🚀

