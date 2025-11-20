# 📧 How to Add Email Variables to Railway

## ⚠️ **IMPORTANT: Email variables are NOT in Railway yet!**

The error "Email service is not properly configured" means you need to add email variables to Railway.

---

## 🚀 **STEP-BY-STEP: Add Email Variables to Railway**

### **Step 1: Go to Railway Dashboard**
1. Visit: https://railway.app/dashboard
2. **Click on your project**
3. **Click on your BACKEND service** (not frontend)

### **Step 2: Open Variables Tab**
1. **Click on "Variables"** tab (top menu)
2. You'll see a list of existing variables

### **Step 3: Add Email Variables**
Click **"+ New Variable"** or **"Add Variable"** button and add these **6 variables** one by one:

#### **Variable 1:**
- **Name:** `EMAIL_HOST`
- **Value:** `smtp.gmail.com`
- Click **"Add"**

#### **Variable 2:**
- **Name:** `EMAIL_PORT`
- **Value:** `587`
- Click **"Add"**

#### **Variable 3:**
- **Name:** `EMAIL_USER`
- **Value:** `xaura.info@gmail.com`
- Click **"Add"**

#### **Variable 4:**
- **Name:** `EMAIL_PASS`
- **Value:** `axsfmkictpqfyivh` (your App Password - NO SPACES)
- Click **"Add"**

#### **Variable 5:**
- **Name:** `EMAIL_FROM`
- **Value:** `xaura.info@gmail.com`
- Click **"Add"**

#### **Variable 6:**
- **Name:** `EMAIL_FROM_NAME`
- **Value:** `Xaura`
- Click **"Add"**

### **Step 4: Verify Variables**
After adding all 6, you should see them in the list:
- ✅ EMAIL_HOST
- ✅ EMAIL_PORT
- ✅ EMAIL_USER
- ✅ EMAIL_PASS
- ✅ EMAIL_FROM
- ✅ EMAIL_FROM_NAME

### **Step 5: Redeploy**
1. Railway will **auto-redeploy** when you add variables
2. OR go to **"Deployments"** tab and click **"Redeploy"**
3. Wait 2-3 minutes for deployment

### **Step 6: Check Logs**
After deployment, go to **"Logs"** tab and look for:
```
[EMAIL] ✅ Email service configured
[EMAIL] Host: smtp.gmail.com:587
[EMAIL] From: Xaura <xaura.info@gmail.com>
```

If you see this, email is configured! ✅

---

## 🔍 **How to Check if Variables Are Set**

1. Go to Railway → Backend Service → **Variables** tab
2. Look for the 6 email variables listed above
3. If any are missing, add them

---

## ⚠️ **Common Issues**

### **Issue: "Variable already exists"**
- That's fine! Just make sure the value is correct

### **Issue: "Can't find Variables tab"**
- Make sure you're in the **BACKEND** service, not frontend
- Variables tab is in the top menu

### **Issue: "Still getting error after adding variables"**
- Wait 2-3 minutes for Railway to redeploy
- Check Railway logs to see if email service is configured
- Make sure `EMAIL_PASS` has NO SPACES

---

## ✅ **After Adding Variables**

1. ✅ Wait for Railway to redeploy (2-3 minutes)
2. ✅ Check Railway logs for email configuration message
3. ✅ Test forgot password again
4. ✅ Check your email inbox (and spam folder)

---

## 📝 **Quick Copy-Paste List**

If Railway has a bulk import feature, you can add all at once:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=xaura.info@gmail.com
EMAIL_PASS=axsfmkictpqfyivh
EMAIL_FROM=xaura.info@gmail.com
EMAIL_FROM_NAME=Xaura
```

---

**That's it! Once you add these variables, email will work! 🎉**

