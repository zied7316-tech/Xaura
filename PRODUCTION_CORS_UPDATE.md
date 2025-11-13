# 🔒 Production CORS Configuration

## ⚠️ IMPORTANT - Update AFTER Frontend Deployment

Once you have your frontend URL from Railway, you need to update the backend CORS settings.

---

## 📝 What to Update

In `backend/server.js`, replace this line:

```javascript
app.use(cors());
```

With this configuration:

```javascript
// CORS Configuration for Production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',                          // Local development
      'http://localhost:3000',                          // Alternative local
      'https://your-frontend-url.up.railway.app',       // Production frontend
      'https://xaura-production.up.railway.app',        // If you use custom subdomain
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🎯 Steps to Apply:

### Option 1: Manual Update (After Deployment)

1. **Get your frontend URL from Railway**
   - Example: `https://xaura-web-production.up.railway.app`

2. **Update the file locally:**
   - Open `backend/server.js`
   - Replace the CORS configuration
   - Update `'https://your-frontend-url.up.railway.app'` with your actual URL

3. **Commit and push:**
   ```bash
   git add backend/server.js
   git commit -m "Update CORS for production deployment"
   git push
   ```

4. **Railway will auto-deploy** the changes

---

## 🚀 Quick Copy-Paste Template

**Replace `YOUR_FRONTEND_URL` with your actual Railway frontend URL:**

```javascript
// CORS Configuration for Production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'YOUR_FRONTEND_URL',  // ← Replace this!
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🧪 Testing CORS

After updating:

1. Visit your frontend URL
2. Open browser console (F12)
3. Try to login/register
4. Should work without CORS errors

If you see CORS errors:
- Double-check the frontend URL in backend code
- Make sure you committed and pushed
- Check Railway logs for any errors

---

## 📌 When to Update This

- ✅ **After** you deploy frontend and get the URL
- ✅ **Before** you test the production app
- ✅ Whenever you change frontend URL/domain

---

**I'll help you make this update once you have your frontend URL!** 🎯

