# 📧 Gmail Email Setup - Step by Step Guide (FREE)

This guide will help you configure Gmail to send emails from your Xaura application **completely FREE**.

---

## ✅ **STEP 1: Enable 2-Step Verification on Your Gmail Account**

1. **Go to your Google Account**: https://myaccount.google.com
2. **Click on "Security"** (left sidebar)
3. **Find "2-Step Verification"** and click on it
4. **Click "Get Started"** and follow the prompts
5. **Verify your phone number** (Google will send you a code)
6. **Complete the setup** - 2-Step Verification must be ON ✅

**Why?** Google requires 2-Step Verification to generate App Passwords (for security)

---

## ✅ **STEP 2: Generate an App Password**

1. **Go to App Passwords**: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App Passwords
2. **Select "Mail"** from the dropdown
3. **Select "Other (Custom name)"** and type: `Xaura App`
4. **Click "Generate"**
5. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **IMPORTANT**: Copy this password NOW - you won't see it again!
   - Remove all spaces when using it (should be 16 characters without spaces)

---

## ✅ **STEP 3: Update Your .env File**

1. **Open** `backend/.env` file in your code editor
2. **Find the Email Configuration section** (around line 17-24)
3. **Update these lines** with your Gmail information:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Xaura
```

**Example** (replace with YOUR info):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=john.doe@gmail.com
EMAIL_FROM_NAME=Xaura
```

**Important Notes:**
- ✅ Use your **Gmail address** for `EMAIL_USER` and `EMAIL_FROM`
- ✅ Use the **16-character App Password** (no spaces) for `EMAIL_PASS`
- ❌ **DO NOT** use your regular Gmail password
- ❌ **DO NOT** include spaces in the App Password

---

## ✅ **STEP 4: Save and Restart Your Server**

1. **Save** the `.env` file
2. **Stop** your backend server (if running) - Press `Ctrl+C`
3. **Start** your backend server again:
   ```bash
   cd backend
   npm start
   ```

---

## ✅ **STEP 5: Verify Configuration**

After starting your server, check the console logs. You should see:

```
[EMAIL] ✅ Email service configured
[EMAIL] Host: smtp.gmail.com:587
[EMAIL] From: Xaura <your-email@gmail.com>
```

✅ **If you see this** = Email is configured correctly!

❌ **If you see warnings** = Check your `.env` file and try again

---

## ✅ **STEP 6: Test Email Sending**

1. **Go to your application** (http://localhost:5173)
2. **Click "Forgot Password"** on the login page
3. **Enter your email address**
4. **Click "Send Reset Link"**
5. **Check your email inbox** (and spam folder)
6. **You should receive the password reset email** within a few seconds! 🎉

---

## 🆘 **TROUBLESHOOTING**

### ❌ **Error: "EAUTH - Authentication failed"**
- **Problem**: Wrong password or App Password not generated
- **Solution**: 
  1. Make sure 2-Step Verification is enabled
  2. Generate a NEW App Password
  3. Copy it without spaces
  4. Update `.env` file
  5. Restart server

### ❌ **Error: "ECONNECTION - Could not connect"**
- **Problem**: Network or firewall blocking port 587
- **Solution**: 
  1. Check your internet connection
  2. Try a different network
  3. Check if your firewall allows port 587

### ❌ **Error: "Email service is not configured"**
- **Problem**: Missing environment variables
- **Solution**: 
  1. Check your `.env` file has all 5 email variables
  2. Make sure there are no typos
  3. Restart the server after changes

### ❌ **No email received**
- **Check spam/junk folder**
- **Wait 1-2 minutes** (sometimes there's a delay)
- **Verify the email address is correct**
- **Check server logs** for error messages

---

## 📝 **QUICK REFERENCE**

**Required Environment Variables:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-16-chars
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Xaura
```

**App Password Generator:** https://myaccount.google.com/apppasswords

**Gmail SMTP Settings:**
- Host: `smtp.gmail.com`
- Port: `587` (TLS) or `465` (SSL)
- Security: TLS (for port 587)

---

## ✅ **YOU'RE DONE!**

Once you see the ✅ confirmation in your server logs, your email service is configured and ready to use!

Your application will now be able to send:
- ✅ Email verification emails
- ✅ Password reset emails
- ✅ Welcome emails
- ✅ All other notification emails

---

**Need Help?** Check the server console logs for detailed error messages.

