# Email Configuration Guide

## Problem
If you're seeing "Email sent" but not receiving emails, it means the email service is not properly configured.

## Solution

### Step 1: Set Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
# Gmail Example (Recommended for testing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Xaura

# OR SendGrid Example (Recommended for production)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@xaura.pro
EMAIL_FROM_NAME=Xaura
```

### Step 2: Gmail Setup (For Testing)

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "App Passwords" (https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use this app password as `EMAIL_PASS` (NOT your regular Gmail password)

### Step 3: SendGrid Setup (For Production)

1. Sign up at https://sendgrid.com
2. Create an API key
3. Use `apikey` as `EMAIL_USER`
4. Use your API key as `EMAIL_PASS`
5. Verify your sender email address

### Step 4: Restart Server

After setting environment variables, restart your backend server:

```bash
cd backend
npm start
```

### Step 5: Verify Configuration

Check your server logs. You should see:

```
[EMAIL] ✅ Email service configured
[EMAIL] Host: smtp.gmail.com:587
[EMAIL] From: Xaura <your-email@gmail.com>
```

If you see warnings instead, check your environment variables.

## Troubleshooting

### Error: "Email service is not configured"
- Check that all required environment variables are set
- Make sure there are no typos in variable names
- Restart the server after changing `.env` file

### Error: "EAUTH - Authentication failed"
- For Gmail: Make sure you're using an App Password, not your regular password
- For SendGrid: Verify your API key is correct

### Error: "ECONNECTION - Could not connect"
- Check your EMAIL_HOST and EMAIL_PORT
- Make sure your firewall allows outbound connections on port 587
- Try port 465 with `secure: true` if 587 doesn't work

### Error: "ETIMEDOUT"
- Check your internet connection
- Verify EMAIL_HOST is correct
- Some networks block SMTP ports - try a different network

## Testing

After configuration, test by:
1. Going to the login page
2. Clicking "Forgot Password"
3. Entering your email
4. Checking your inbox (and spam folder)

You should receive the password reset email within a few seconds.

