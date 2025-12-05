# 🔄 How to Restart Backend on Railway & Add WhatsApp Variables

## 📋 **STEP 1: Add Twilio WhatsApp Variables to Railway**

Since you added the variables to your local `.env` file, you also need to add them to Railway so the deployed backend can use them!

### **1.1 Go to Railway Dashboard**
1. Visit: https://railway.app/dashboard
2. **Click on your project** (the one with your backend)
3. **Click on your BACKEND service** (not frontend)

### **1.2 Open Variables Tab**
1. Click on **"Variables"** tab (top menu)
2. You'll see a list of existing environment variables

### **1.3 Add Twilio WhatsApp Variables**

Click **"+ New Variable"** and add these **4 variables** one by one:

#### **Variable 1:**
- **Name:** `TWILIO_ACCOUNT_SID`
- **Value:** Your Twilio Account SID (from Twilio Console → Dashboard)
- Click **"Add"**

#### **Variable 2:**
- **Name:** `TWILIO_AUTH_TOKEN`
- **Value:** Your Twilio Auth Token (from Twilio Console → Dashboard)
- Click **"Add"**

#### **Variable 3:**
- **Name:** `TWILIO_PHONE_NUMBER`
- **Value:** Your Twilio phone number (format: +1234567890, include country code)
- Click **"Add"**

#### **Variable 4:**
- **Name:** `TWILIO_WHATSAPP_NUMBER`
- **Value:** Your Twilio WhatsApp number (format: whatsapp:+1234567890)
  - Get this from: Twilio Console → Messaging → Try it out → Send a WhatsApp message
  - Use sandbox number for testing or your verified WhatsApp Business number for production
- Click **"Add"**

### **1.4 Verify All Variables**
After adding, you should see in the Variables list:
- ✅ TWILIO_ACCOUNT_SID
- ✅ TWILIO_AUTH_TOKEN
- ✅ TWILIO_PHONE_NUMBER
- ✅ TWILIO_WHATSAPP_NUMBER

---

## 🔄 **STEP 2: Restart/Redeploy Backend**

Railway has **3 ways** to restart your backend:

### **Method 1: Manual Redeploy (RECOMMENDED)** ⭐

1. **Go to "Deployments" tab** (in your backend service)
2. **Click the "Redeploy" button** (or three dots menu → Redeploy)
3. **Select the latest deployment** (usually "main" branch)
4. **Click "Redeploy"**
5. **Wait 2-3 minutes** for deployment to complete
6. **Watch the logs** to see it restart

**This is the BEST method because it:**
- ✅ Loads new environment variables
- ✅ Pulls latest code
- ✅ Restarts with fresh configuration

---

### **Method 2: Trigger via Code Push** (Alternative)

If you want to trigger a redeploy automatically:

1. **Make a small commit** (even just updating a comment)
2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update: Add Twilio WhatsApp variables"
   git push
   ```
3. **Railway will auto-deploy** when it detects the push (usually takes 3-5 minutes)

---

### **Method 3: Restart Service** (Quick Restart - Doesn't load new vars)

⚠️ **Note:** This method restarts the service but **doesn't reload new environment variables**.

1. Go to your backend service
2. Click **"Settings"** tab
3. Scroll down to find **"Restart"** button
4. Click **"Restart"**

**Use this only if:**
- You just want to restart the running process
- You haven't changed environment variables
- You want a quick restart

---

## ✅ **STEP 3: Verify It Worked**

After redeploying, check if WhatsApp variables are loaded:

1. **Go to "Logs" tab** (in your backend service)
2. **Look for startup messages:**
   ```
   ✅ Server running in production mode on port 5000
   ✅ MongoDB Connected
   ```

3. **Test WhatsApp:**
   - Try sending a WhatsApp message through your app
   - Check logs for `[WhatsApp]` messages
   - Verify in Twilio Console that messages are being sent

---

## 🚨 **Important Notes:**

### **About Environment Variables:**
- ✅ **Railway Variables = Production** (what your deployed app uses)
- ✅ **Local .env = Development** (what your local dev uses)
- ⚠️ **They are SEPARATE!** You must add variables to BOTH places

### **Why Redeploy is Needed:**
- Environment variables are loaded when the server **starts**
- Changing variables requires a **restart/redeploy** to take effect
- Railway auto-redeploys when you add new variables, but it's good to verify

### **Where to Find Your Twilio Credentials:**
1. **Account SID & Auth Token:** Twilio Console → Dashboard (top right)
2. **WhatsApp Number:** Twilio Console → Messaging → Try it out → Send a WhatsApp message
3. **Phone Number:** Twilio Console → Phone Numbers → Manage → Active Numbers

---

## 📝 **Quick Checklist:**

- [ ] Added `TWILIO_ACCOUNT_SID` to Railway Variables
- [ ] Added `TWILIO_AUTH_TOKEN` to Railway Variables  
- [ ] Added `TWILIO_PHONE_NUMBER` to Railway Variables
- [ ] Added `TWILIO_WHATSAPP_NUMBER` to Railway Variables
- [ ] Clicked "Redeploy" in Deployments tab
- [ ] Waited for deployment to complete (2-3 minutes)
- [ ] Checked logs to verify server restarted
- [ ] Tested WhatsApp sending functionality

---

## 🆘 **Troubleshooting:**

### **"Variables not found" error:**
- Make sure variables are added in Railway (not just local .env)
- Redeploy after adding variables
- Check variable names are EXACT (case-sensitive)

### **"Service not restarting":**
- Try Method 1 (Manual Redeploy) instead
- Check Railway status page for outages
- Verify your Railway subscription is active

### **"WhatsApp still not working":**
- Double-check variable values are correct
- Verify phone number format (include + and country code)
- Check Twilio Console for error messages
- Look at Railway logs for detailed error messages

---

**Need help?** Share your Railway logs or error messages and I'll help troubleshoot! 🚀
