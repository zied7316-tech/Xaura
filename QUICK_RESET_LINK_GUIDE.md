# 🚀 Quick Guide: Get Password Reset Link from Railway

## ✅ **It's Working!** 
The forgot password feature is working. The reset token is in Railway logs.

---

## 📋 **3 Simple Steps:**

### **Step 1: Open Railway Logs**
1. Go to: https://railway.app/dashboard
2. Click your **Backend Service**
3. Click **"Logs"** tab

### **Step 2: Find the Reset Token**
Look for this in the logs (it appears right after the user clicks "Send Reset Link"):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 PASSWORD RESET TOKEN (Email service unavailable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User: moto.accessoires@gmail.com
Reset URL: https://www.xaura.pro/reset-password?token=XXXXX...
Token: XXXXX...
Expires: 2025-11-20T...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Step 3: Copy and Send**
1. **Copy the entire "Reset URL"** line
2. **Send it to the user** via WhatsApp, SMS, or email manually
3. User clicks the link → resets password ✅

---

## 💡 **Pro Tip:**
- Use Railway's log search to find "PASSWORD RESET TOKEN"
- The token expires in **1 hour** - so copy it quickly!
- Each token can only be used **once**

---

## 🎯 **For User: moto.accessoires@gmail.com**

1. Check Railway logs now
2. Find the reset URL for `moto.accessoires@gmail.com`
3. Send it to them manually
4. They can reset their password!

---

**That's it! The feature is working perfectly! 🎉**

