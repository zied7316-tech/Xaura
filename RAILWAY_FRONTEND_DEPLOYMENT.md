# 🚀 Railway Frontend Deployment - Step by Step

## ✅ Configuration Files Ready!

All frontend deployment files are configured and ready:
- ✅ `web/nixpacks.toml` - Railway build configuration
- ✅ `web/railway.toml` - Railway deployment settings
- ✅ `web/server.js` - Production server
- ✅ `web/package.json` - Build scripts configured

---

## 📋 DEPLOYMENT STEPS

### Step 1: Create Frontend Service in Railway

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Open your project (where backend is deployed)

2. **Add New Service**
   - Click **"+ New"** button
   - Select **"GitHub Repo"**
   - Choose your repository: `zied7316-tech/Xaura` (or your repo name)
   - Railway will create a new service

---

### Step 2: Configure Frontend Service Settings

**⚠️ CRITICAL: These settings MUST be set correctly!**

1. **Click on the NEW frontend service** (not the backend one)

2. **Go to "Settings" tab**

3. **Set these values EXACTLY:**

   ```
   Root Directory: web
   Build Command: npm run build
   Start Command: node server.js
   ```

   **How to set:**
   - Scroll down to "Root Directory" → Type: `web`
   - Find "Build Command" → Type: `npm run build`
   - Find "Start Command" → Type: `node server.js`
   - Click **"Save"**

---

### Step 3: Add Environment Variable

**⚠️ REQUIRED: Frontend won't work without this!**

1. **Go to "Variables" tab** (in the frontend service)

2. **Click "+ New Variable"**

3. **Add this variable:**

   ```
   Name: VITE_API_URL
   Value: https://YOUR-BACKEND-URL.railway.app/api
   ```

   **⚠️ IMPORTANT:**
   - Replace `YOUR-BACKEND-URL` with your actual backend Railway URL
   - The URL MUST end with `/api`
   - Example: `https://xaura-backend-production.up.railway.app/api`

4. **Click "Add"**

---

### Step 4: Deploy

1. **Railway will auto-deploy** after you save settings
2. **Go to "Deployments" tab** to watch progress
3. **Wait 3-5 minutes** for build to complete

---

### Step 5: Get Frontend URL

1. **Go to "Settings" tab** → Scroll to **"Networking"**
2. **Click "Generate Domain"** (if not auto-generated)
3. **Copy your frontend URL** (e.g., `https://xaura-web-xxxx.up.railway.app`)

---

## 🔍 What to Check in Logs

### Successful Build Logs Should Show:

```
✅ Nixpacks detected Node.js
✅ Installing dependencies...
✅ npm install
✅ npm run build
✅ Building Vite project...
✅ Build complete
✅ dist folder created
✅ Starting server...
✅ Server listening on port 3000
✅ Health check: /health
```

### Successful Deployment Should Show:

```
✅ Server listening on http://0.0.0.0:3000
✅ Health check: http://0.0.0.0:3000/health
✅ Ready to serve requests!
```

---

## 🐛 Troubleshooting

### Issue 1: Build Fails

**Check:**
- Root Directory is set to `web` (not `backend`)
- Build Command is `npm run build`
- Check "Deployments" → Latest deployment → "Build Logs"

**Fix:**
- Verify settings in Railway dashboard
- Check if there are any build errors in logs

### Issue 2: "dist folder not found" Error

**Cause:** Build step failed

**Fix:**
- Check build logs for errors
- Ensure `npm run build` completes successfully
- Verify all dependencies are installed

### Issue 3: Frontend Shows Blank Page

**Check:**
- Browser console (F12) for errors
- Verify `VITE_API_URL` is set correctly
- Ensure backend is running

**Fix:**
- Update `VITE_API_URL` with correct backend URL
- Redeploy frontend after updating variable

### Issue 4: "Cannot connect to backend"

**Check:**
- `VITE_API_URL` has correct backend URL
- Backend is running (check backend logs)
- URL ends with `/api`

**Fix:**
- Update `VITE_API_URL` variable
- Redeploy frontend

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend service created in Railway
- [ ] Root Directory set to `web`
- [ ] Build Command: `npm run build`
- [ ] Start Command: `node server.js`
- [ ] `VITE_API_URL` environment variable added
- [ ] Deployment completed successfully
- [ ] Frontend URL generated
- [ ] Frontend loads in browser
- [ ] No errors in browser console (F12)
- [ ] Can access landing page

---

## 🎯 Quick Reference

### Railway Dashboard Settings:

| Setting | Value |
|---------|-------|
| Root Directory | `web` |
| Build Command | `npm run build` |
| Start Command | `node server.js` |
| Environment Variable | `VITE_API_URL=https://your-backend.railway.app/api` |

### Expected URLs:

- **Backend:** `https://xaura-backend-xxxx.up.railway.app`
- **Frontend:** `https://xaura-web-xxxx.up.railway.app`

---

## 🚀 After Deployment

1. **Visit your frontend URL**
2. **Test the landing page**
3. **Check browser console (F12)** for any errors
4. **Test registration/login** to verify backend connection

---

## 📞 Need Help?

If deployment fails:
1. Check Railway logs (Deployments → Latest → Logs)
2. Verify all settings are correct
3. Check browser console for errors
4. Share the error message and I'll help fix it!

---

**Your frontend is now ready to deploy! Follow the steps above.** ✨

