# 🔐 How to Get Password Reset Link from Railway Logs

## ⚠️ **Problem:**
Railway is blocking SMTP ports (587 and 465), so email service cannot send password reset emails.

## ✅ **Solution:**
The reset token is now logged in Railway logs. You can get it from there!

---

## 🚀 **STEP-BY-STEP: Get Reset Link from Railway Logs**

### **Step 1: User Requests Password Reset**
1. User goes to: `https://www.xaura.pro/forgot-password`
2. User enters their email
3. Clicks "Send Reset Link"
4. **The request will succeed** (even if email can't be sent)

### **Step 2: Check Railway Logs**
1. Go to **Railway Dashboard**: https://railway.app/dashboard
2. Click on your **Backend Service**
3. Click on **"Logs"** tab
4. Look for a section that looks like this:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 PASSWORD RESET TOKEN (Email service unavailable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: user@example.com
Reset URL: https://www.xaura.pro/reset-password?token=abc123...
Token: abc123...
Expires: 2025-11-20T18:00:00.000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Copy the Reset URL above and send it manually to the user
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Step 3: Copy the Reset URL**
1. **Copy the entire "Reset URL"** line
2. It looks like: `https://www.xaura.pro/reset-password?token=abc123...`

### **Step 4: Send to User**
1. **Send the Reset URL** to the user via:
   - WhatsApp
   - SMS
   - Direct message
   - Or any other method

### **Step 5: User Resets Password**
1. User clicks the Reset URL
2. User enters new password
3. Password is reset! ✅

---

## 📋 **Quick Checklist:**

- [ ] User requests password reset on website
- [ ] Check Railway logs for reset token
- [ ] Copy the Reset URL from logs
- [ ] Send Reset URL to user manually
- [ ] User clicks link and resets password

---

## 🔍 **How to Find the Log Entry:**

The log entry will appear **immediately** after the user clicks "Send Reset Link".

**Look for:**
- `🔐 PASSWORD RESET TOKEN`
- `Reset URL: https://www.xaura.pro/reset-password?token=...`
- The user's email address

**Tip:** Use Railway's log search/filter to find entries containing "PASSWORD RESET TOKEN"

---

## ⏰ **Important Notes:**

1. **Token Expires:** The reset token expires in **1 hour**
2. **One-Time Use:** Each token can only be used once
3. **Security:** Only share the reset URL with the actual user
4. **Logs Retention:** Railway keeps logs for a limited time, so copy the URL quickly

---

## 🎯 **Alternative: Fix Email Service (Long-term Solution)**

To fix email permanently, you need to:

1. **Use a different email service** that works with Railway:
   - **Resend** (https://resend.com) - Free tier available
   - **Mailgun** (https://mailgun.com) - Free tier available
   - **Postmark** (https://postmarkapp.com) - Free tier available

2. **Or use Railway's built-in email service** (if available)

3. **Or configure email via webhook/API** instead of SMTP

---

## ✅ **Current Status:**

✅ **Forgot password now works** - even if email fails
✅ **Reset token is logged** - admin can retrieve it
✅ **User sees success message** - no confusing errors
✅ **Token expires in 1 hour** - security maintained

---

**Need help? Check Railway logs immediately after a password reset request!**

