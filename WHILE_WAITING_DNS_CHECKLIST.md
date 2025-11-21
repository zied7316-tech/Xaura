# ✅ While Waiting for DNS Verification - Checklist

## 🕐 **DNS Verification Usually Takes: 5-15 minutes** (can take up to 48 hours)

While waiting, check these things:

---

## ✅ **1. Verify DNS Records Are Added Correctly**

### **Check Your Domain DNS:**
1. Go to your domain registrar (where you bought `xaura.pro`)
2. Go to **DNS Management** or **DNS Settings**
3. Verify these records are added:

#### **Required Records:**
- ✅ **SPF Record** (TXT) - Should include `include:resend.com`
- ✅ **DKIM Record** (TXT) - Should have `resend._domainkey` in name
- ✅ **DMARC Record** (TXT) - Optional but recommended

### **Use DNS Checker Tools:**
1. Go to: **https://mxtoolbox.com/SuperTool.aspx**
2. Enter: `xaura.pro`
3. Select: **"TXT Lookup"**
4. Check if your DNS records are visible
5. If not visible yet → DNS is still propagating (wait more)

---

## ✅ **2. Check Resend Dashboard Status**

1. Go to: **https://resend.com/domains**
2. Check your domain `xaura.pro` status:
   - ⏳ **"Pending"** = Still verifying (wait more)
   - ✅ **"Verified"** = Ready to use!
   - ❌ **"Failed"** = Check DNS records

### **What to Look For:**
- Status should change from "Pending" to "Verified"
- All DNS records should show as "Valid"
- If any show "Invalid" → Fix that record

---

## ✅ **3. Verify Railway Variables Are Ready**

1. Railway Dashboard → **Backend Service** → **Variables**
2. Check these variables are set:

### **Current (for testing):**
- ✅ `RESEND_API_KEY` = `re_xxxxxxxxxxxxx`
- ✅ `EMAIL_FROM` = `onboarding@resend.dev` (temporary)
- ✅ `EMAIL_FROM_NAME` = `Xaura`

### **After Domain Verification:**
- ✅ `RESEND_API_KEY` = `re_xxxxxxxxxxxxx` (same)
- 🔄 `EMAIL_FROM` = `noreply@xaura.pro` (UPDATE THIS!)
- ✅ `EMAIL_FROM_NAME` = `Xaura` (same)

**Note:** Don't update `EMAIL_FROM` yet - wait until domain is verified!

---

## ✅ **4. Test Current Setup (Limited)**

While waiting, you can test with your account email:

1. Go to: **https://www.xaura.pro/forgot-password**
2. Enter: `xaura.info@gmail.com` (your Resend account email)
3. Click "Send Reset Link"
4. **This should work** (even without domain verification)
5. Check your inbox for the email

**This confirms:**
- ✅ Resend API is working
- ✅ Email service is configured correctly
- ✅ Once domain is verified, it will work for all emails

---

## ✅ **5. Check Railway Logs**

1. Railway Dashboard → **Backend Service** → **Logs**
2. Look for:
   - ✅ `[EMAIL] ✅ Email service configured (Resend API)`
   - ✅ `[EMAIL] From: Xaura <onboarding@resend.dev>`
   - ✅ No error messages

**If you see errors:**
- Copy the error message
- Check if it's the domain verification error (expected until verified)

---

## ✅ **6. Prepare for Domain Verification**

Once domain is verified, you'll need to:

1. **Update Railway Variable:**
   - Change `EMAIL_FROM` from `onboarding@resend.dev`
   - To: `noreply@xaura.pro`

2. **Wait for Railway Redeploy:**
   - Railway will auto-redeploy (2-3 minutes)

3. **Test with Any Email:**
   - Try forgot password with any email address
   - Should work! ✅

---

## 📋 **Quick Checklist:**

- [ ] DNS records added to domain registrar
- [ ] DNS records visible in DNS checker (mxtoolbox.com)
- [ ] Resend dashboard shows domain as "Pending" or "Verified"
- [ ] Railway variables are set correctly
- [ ] Tested with account email (`xaura.info@gmail.com`) - should work
- [ ] Railway logs show no errors
- [ ] Ready to update `EMAIL_FROM` once verified

---

## ⏰ **Timeline:**

- **0-5 minutes:** DNS records propagating
- **5-15 minutes:** Resend should verify domain (most common)
- **15-60 minutes:** Still normal, wait more
- **1-48 hours:** Maximum time (rare)

---

## 🎯 **What to Do Right Now:**

1. ✅ **Check Resend dashboard** - Is domain status "Pending" or "Verified"?
2. ✅ **Check DNS records** - Are they added correctly?
3. ✅ **Test with account email** - Does it work?
4. ✅ **Monitor Resend dashboard** - Check every 5-10 minutes

---

## ✅ **When Domain is Verified:**

You'll see in Resend dashboard:
- ✅ Status: **"Verified"**
- ✅ All DNS records: **"Valid"**

**Then:**
1. Update `EMAIL_FROM` in Railway to `noreply@xaura.pro`
2. Wait for Railway redeploy
3. Test with any email address
4. Should work perfectly! 🎉

---

**Check Resend dashboard every 5-10 minutes until it shows "Verified"!** ⏰

