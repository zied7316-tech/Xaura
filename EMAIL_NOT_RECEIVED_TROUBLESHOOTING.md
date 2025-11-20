# 🔍 Email Not Received - Troubleshooting Guide

## ✅ **Step 1: Check Resend Dashboard**

1. Go to: **https://resend.com/emails**
2. Login to your Resend account
3. Check the **"Emails"** tab
4. Look for emails sent to your address

### **What to look for:**
- ✅ **"Sent"** status = Email was sent successfully
- ✅ **"Delivered"** status = Email reached recipient
- ❌ **"Bounced"** = Email address invalid
- ❌ **"Failed"** = Sending error
- ⏳ **"Pending"** = Still processing

**If you see emails here but not in inbox → Check spam folder!**

---

## ✅ **Step 2: Check Railway Logs**

1. Railway Dashboard → **Backend Service** → **Logs**
2. Look for these messages when you click "Forgot Password":

### **✅ SUCCESS - Should see:**
```
[EMAIL] Sending via Resend to your@email.com
[EMAIL] From: Xaura <onboarding@resend.dev>
[EMAIL] Subject: Reset Your Password - Xaura
[EMAIL] ✅ Email sent successfully via Resend to your@email.com
[EMAIL] MessageId: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### **❌ ERROR - If you see:**
```
[EMAIL] Resend API error: ...
[EMAIL] Resend API exception: ...
[EMAIL] Error message: ...
```

**Copy the error message and check below!**

---

## ✅ **Step 3: Check Common Issues**

### **Issue 1: Email in Spam Folder**
- ✅ Check **spam/junk folder**
- ✅ Mark as "Not Spam" if found
- ✅ Add `onboarding@resend.dev` to contacts

### **Issue 2: Invalid API Key**
**Error in logs:** `Invalid API key` or `Unauthorized`

**Fix:**
1. Go to Resend → API Keys
2. Verify key is active
3. Copy key again (no spaces)
4. Update in Railway Variables

### **Issue 3: Domain Not Verified**
**Error in logs:** `Domain not verified` or `Invalid sender`

**Fix:**
- Use `onboarding@resend.dev` for testing (no verification needed)
- OR verify your domain in Resend dashboard

### **Issue 4: Rate Limit**
**Error in logs:** `Rate limit exceeded`

**Fix:**
- Free tier: 3,000 emails/month
- Check Resend dashboard for usage
- Wait a bit and try again

### **Issue 5: Invalid Email Address**
**Error in logs:** `Invalid recipient` or `Bounced`

**Fix:**
- Check email address is correct
- Try a different email address
- Check Resend dashboard for bounce details

---

## ✅ **Step 4: Test with Different Email**

Try sending to a different email address:
1. Use Gmail, Outlook, or another provider
2. Check if that email receives it
3. If yes → Original email might be blocking it
4. If no → Check Resend dashboard and Railway logs

---

## ✅ **Step 5: Check Resend Account Status**

1. Go to: **https://resend.com/settings**
2. Check:
   - ✅ Account is active
   - ✅ No payment issues
   - ✅ API key is active
   - ✅ Domain is verified (if using custom domain)

---

## 🎯 **Quick Checklist:**

- [ ] Checked Resend dashboard - emails showing as "Sent"?
- [ ] Checked spam/junk folder
- [ ] Checked Railway logs for errors
- [ ] Verified API key is correct
- [ ] Tried different email address
- [ ] Checked Resend account status

---

## 🆘 **Still Not Working?**

**Share with me:**
1. What you see in **Resend dashboard** (screenshot or status)
2. What you see in **Railway logs** (copy error messages)
3. What email address you're testing with
4. Any error messages from Railway logs

---

## 💡 **Most Common Fix:**

**90% of the time, emails are in spam folder!**

1. Check spam/junk folder
2. Mark as "Not Spam"
3. Add sender to contacts
4. Try again

---

**Check Resend dashboard first - that will tell us if emails are being sent!** 🔍

