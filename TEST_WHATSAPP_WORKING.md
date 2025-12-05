# ✅ Verify WhatsApp Integration is Working

## 🎉 **Great! Deployment is done and variables are set. Now let's test it!**

---

## 🔍 **STEP 1: Check Railway Logs**

1. **Go to Railway Dashboard** → **Your Backend Service** → **Logs** tab
2. **Look for startup messages** (scroll to when the server started)

### ✅ **SUCCESS - You should see:**
```
✅ Server running in production mode on port 5000
✅ MongoDB Connected
```

### ❌ **IF YOU SEE ERRORS:**
```
[WhatsApp] Twilio not configured
[WhatsApp] Twilio not configured. Would send: ...
```
→ Check that all 4 Twilio variables are set correctly in Railway:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `TWILIO_WHATSAPP_NUMBER`

---

## 🧪 **STEP 2: Test WhatsApp by Booking an Appointment**

The easiest way to test is to **book an appointment** through your app!

### **Test Steps:**

1. **Open your app** (web or mobile)
2. **Log in as a CLIENT** (or create a test client account)
3. **Book an appointment:**
   - Select a salon
   - Select a service
   - Select a worker
   - Choose date/time
   - Click "Book Appointment"

4. **Check WhatsApp** on the phone number associated with:
   - ✅ **Client's account** (should receive booking confirmation)
   - ✅ **Worker's account** (should receive notification about new appointment)

### **What messages you should receive:**

#### **Client receives:**
```
Your appointment at [Salon Name] has been booked!
Service: [Service Name]
Date: [Date and Time]
Worker: [Worker Name]
```

#### **Worker receives:**
```
New appointment scheduled!
Client: [Client Name]
Service: [Service Name]
Date: [Date and Time]
```

---

## 🧪 **STEP 3: Test Status Updates**

After booking, test status updates:

1. **Accept the appointment** (as worker or salon owner)
   - Client should receive: "Your appointment at [Salon] has been confirmed!"

2. **Complete the appointment** (as worker)
   - Client should receive: "Thank you for visiting [Salon]! We hope you enjoyed your [Service]..."

---

## 📊 **STEP 4: Check Twilio Console**

1. **Go to Twilio Console:** https://console.twilio.com/
2. **Click "Monitor" → "Logs" → "Messaging"**
3. **You should see:**
   - ✅ List of WhatsApp messages sent
   - ✅ Status: "delivered" or "sent"
   - ✅ Phone numbers (to/from)
   - ✅ Message content
   - ✅ Timestamps

**This confirms messages are being sent!** ✅

---

## 📊 **STEP 5: Check Railway Logs for WhatsApp Activity**

1. **Go to Railway → Backend → Logs**
2. **Filter/search for:** `[WhatsApp]` or `WhatsApp`
3. **You should see:**
   - ✅ `[WhatsApp]` log messages when sending
   - ✅ No error messages

### **Example good logs:**
```
[WhatsApp] Sending message to whatsapp:+1234567890
```

### **Example error logs (if something is wrong):**
```
[WhatsApp] Error sending message: [error description]
```

---

## 🆘 **Troubleshooting:**

### **Problem 1: No WhatsApp message received after booking**

**Check 1: Railway Logs**
- Look for `[WhatsApp]` messages
- Check for errors like "Twilio not configured"

**Check 2: Phone Number Format**
- Make sure phone numbers in your database have country code (e.g., `+216123456789`)
- Format should be: `+[country code][number]` (no spaces)

**Check 3: Twilio WhatsApp Sandbox**
- If using Twilio Sandbox, make sure:
  - Your phone number is registered with Twilio WhatsApp
  - You joined the sandbox by sending the code to Twilio
  - See: Twilio Console → Messaging → Try it out → Send a WhatsApp message

**Check 4: Twilio Console**
- Check if messages appear in Twilio Console → Monitor → Logs → Messaging
- If messages appear here but not delivered → Twilio configuration issue
- If messages DON'T appear here → Backend not sending (check Railway logs)

---

### **Problem 2: Railway logs show "Twilio not configured"**

1. **Verify variables in Railway:**
   - Go to Railway → Backend → Variables
   - Check all 4 variables are present:
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
     - `TWILIO_PHONE_NUMBER`
     - `TWILIO_WHATSAPP_NUMBER`

2. **Check variable VALUES:**
   - Make sure no extra spaces
   - Make sure `TWILIO_WHATSAPP_NUMBER` includes `whatsapp:` prefix
   - Format: `whatsapp:+1234567890`

3. **Redeploy after adding variables:**
   - Go to Railway → Deployments
   - Click "Redeploy" (latest deployment)
   - Wait 2-3 minutes

---

### **Problem 3: Error in Railway logs like "Invalid phone number"**

**Check phone number format in database:**
- Should be: `+216123456789` (with country code, no spaces)
- NOT: `216123456789` (missing +)
- NOT: `+216 12 345 6789` (has spaces)

**Fix:** Update phone numbers in your database or User model to include country code.

---

### **Problem 4: "Message failed to send" in Twilio Console**

**Common causes:**
1. **Phone number not registered with Twilio WhatsApp:**
   - If using sandbox: Join the sandbox first
   - If using production: Number must be approved/verified

2. **Twilio account balance low:**
   - Check: Twilio Console → Billing
   - Add credits if needed

3. **Invalid WhatsApp number format:**
   - Twilio expects: `whatsapp:+[country code][number]`
   - Check your `TWILIO_WHATSAPP_NUMBER` variable

---

## ✅ **Success Checklist:**

After testing, you should have:

- [ ] ✅ Railway logs show server started successfully
- [ ] ✅ Booked an appointment as a client
- [ ] ✅ Received WhatsApp confirmation on client's phone
- [ ] ✅ Worker received WhatsApp notification
- [ ] ✅ Twilio Console shows messages in "Messaging" logs
- [ ] ✅ Railway logs show `[WhatsApp]` activity (no errors)
- [ ] ✅ Status updates (accept/complete) trigger WhatsApp messages

---

## 🎯 **Next Steps After Verification:**

Once everything is working:

1. ✅ **Test with real users** (have clients book appointments)
2. ✅ **Monitor Twilio costs** (check billing dashboard)
3. ✅ **Set up WhatsApp Business API** (for production - optional)
4. ✅ **Customize message templates** (if needed)

---

## 💡 **Pro Tips:**

1. **For testing:** Use Twilio WhatsApp Sandbox (free for testing)
2. **For production:** Get WhatsApp Business API approval from Twilio
3. **Monitor costs:** Twilio charges per message sent
4. **Rate limits:** Twilio has rate limits, check their documentation

---

**Need help?** Share your Railway logs or Twilio Console screenshots and I'll help troubleshoot! 🚀

