# Firebase Push Notifications Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for web push notifications.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name: "Xaura" (or your preferred name)
   - Enable Google Analytics (optional)
   - Click "Create project"

## Step 2: Add Web App to Firebase

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Register app:
   - App nickname: "Xaura Web"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"
3. **Copy the Firebase configuration** - You'll see something like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

## Step 3: Get VAPID Key

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click on **Cloud Messaging** tab
3. Scroll down to **Web configuration**
4. Under **Web Push certificates**, click **Generate key pair**
5. **Copy the key** - This is your VAPID key

## Step 4: Get Service Account (for Backend)

1. In Firebase Console, go to **Project Settings**
2. Click on **Service accounts** tab
3. Click **Generate new private key**
4. Download the JSON file - **Keep this secure!**
5. This file contains your service account credentials

## Step 5: Configure Environment Variables

### Frontend (web/.env or .env.local)

Add these variables to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

### Backend (backend/.env)

Add this variable:

```env
# Firebase Service Account (paste the entire JSON as a string, or use file path)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**OR** save the service account JSON file and use:

```env
FIREBASE_SERVICE_ACCOUNT=./path/to/service-account-key.json
```

## Step 6: Update Service Worker

1. Open `web/public/firebase-messaging-sw.js`
2. Replace the placeholder values with your Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: 'YOUR_API_KEY',
     authDomain: 'YOUR_AUTH_DOMAIN',
     // ... etc
   }
   ```

## Step 7: Test

1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd web && npm run dev`
3. Log in to the web app
4. Go to Profile page
5. Click "Enable Notifications"
6. Allow notification permission
7. You should see "Push notifications are enabled!"

## Troubleshooting

### "Firebase not initialized"
- Check that all environment variables are set correctly
- Restart the backend server after adding env variables

### "Notification permission denied"
- Check browser settings
- Make sure you're using HTTPS (required for push notifications)
- For localhost, HTTP works but HTTPS is recommended

### "VAPID key not found"
- Make sure `VITE_FIREBASE_VAPID_KEY` is set in frontend `.env`
- Restart the dev server after adding env variables

### Service Worker not registering
- Check browser console for errors
- Make sure `firebase-messaging-sw.js` is in `web/public/` folder
- Clear browser cache and reload

## Next Steps

Once web push notifications are working:
1. Test sending a notification from the backend
2. Set up mobile push notifications (similar process)
3. Integrate with your notification system

## Cost

- **Free tier**: Unlimited messages
- **No credit card required** for basic setup
- Only pay if you exceed very high limits (millions per day)

## Security Notes

- **Never commit** `.env` files or service account keys to Git
- Keep service account JSON file secure
- VAPID key can be public (it's meant for client-side)


