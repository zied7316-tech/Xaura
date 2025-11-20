# 🔧 Fix: Railway Blocking SMTP Port 587

## ⚠️ **Problem:**
Railway is blocking outbound SMTP connections on port 587. This is a common Railway security restriction.

## ✅ **Solution: Use Port 465 (SSL) Instead**

Railway allows port 465 (SSL) but blocks 587 (TLS). We need to change the port.

---

## 🚀 **STEP-BY-STEP FIX:**

### **Step 1: Update EMAIL_PORT in Railway**

1. Go to **Railway Dashboard** → Your **Backend Service** → **Variables** tab
2. Find the variable: `EMAIL_PORT`
3. **Change the value from `587` to `465`**
4. Click **"Update"** or **"Save"**

### **Step 2: Wait for Redeploy**

Railway will auto-redeploy. Wait 2-3 minutes.

### **Step 3: Test Again**

Try forgot password again. It should work now!

---

## 🔄 **Alternative: Use SendGrid (Recommended for Production)**

If port 465 also doesn't work, use SendGrid (free tier available):

### **Step 1: Sign Up for SendGrid**
1. Go to: https://sendgrid.com
2. Sign up for free account (100 emails/day free)
3. Verify your email

### **Step 2: Create API Key**
1. Go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name it: `Xaura Production`
4. Give it **"Full Access"** permissions
5. **Copy the API key** (you won't see it again!)

### **Step 3: Update Railway Variables**

Update these variables in Railway:

```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key-here
EMAIL_FROM=noreply@xaura.pro
EMAIL_FROM_NAME=Xaura
```

**Important:**
- `EMAIL_USER` must be exactly: `apikey` (not your email)
- `EMAIL_PASS` is your SendGrid API key
- `EMAIL_FROM` should be a verified sender email in SendGrid

### **Step 4: Verify Sender in SendGrid**
1. Go to **Settings** → **Sender Authentication**
2. Verify your sender email address
3. This is required for SendGrid to send emails

---

## 📊 **Which Solution to Use?**

### **Option 1: Port 465 (Quick Fix)**
- ✅ Fastest solution
- ✅ Works with existing Gmail setup
- ⚠️ May still have issues if Railway blocks it

### **Option 2: SendGrid (Best for Production)**
- ✅ More reliable
- ✅ Better deliverability
- ✅ Free tier (100 emails/day)
- ✅ Designed for production use
- ⚠️ Requires new account setup

---

## 🎯 **Recommended: Try Port 465 First**

1. Change `EMAIL_PORT` from `587` to `465` in Railway
2. Wait for redeploy
3. Test forgot password
4. If it still doesn't work, switch to SendGrid

---

## ✅ **After Fixing:**

You should see in Railway logs:
```
[EMAIL] ✅ Email service configured
[EMAIL] Host: smtp.gmail.com:465
[EMAIL] From: Xaura <xaura.info@gmail.com>
```

And when sending:
```
[EMAIL] ✅ Email sent successfully to user@email.com
```

---

**Let me know which solution you want to try!**

