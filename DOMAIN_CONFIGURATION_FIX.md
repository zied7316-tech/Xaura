# 🔧 Domain Configuration Fix - xaura.pro Not Responding

## ✅ Both Services Are Running Successfully!

- ✅ Backend: Running on port 5000
- ✅ Frontend: Running on port 8080
- ✅ All routes loaded
- ✅ MongoDB connected

## 🔍 The Problem

The domain `xaura.pro` is showing "Application failed to respond" because:
1. **Domain not configured** - Railway doesn't know which service to route to
2. **Frontend missing API URL** - Frontend doesn't know where backend is
3. **CORS might block** - Backend needs to allow the domain

## 🛠️ Fix Steps

### Step 1: Get Your Backend URL

1. Go to Railway Dashboard
2. Click on your **BACKEND service**
3. Go to **Settings** → **Networking**
4. Copy the **Railway URL** (e.g., `https://xaura-backend-production.up.railway.app`)
5. **Save this URL** - you'll need it!

### Step 2: Configure Frontend Environment Variable

1. Go to Railway Dashboard
2. Click on your **FRONTEND service**
3. Go to **Variables** tab
4. Add this variable:

```
VITE_API_URL=https://YOUR-BACKEND-URL.railway.app/api
```

**Replace `YOUR-BACKEND-URL` with your actual backend URL from Step 1!**

**Example:**
```
VITE_API_URL=https://xaura-backend-production.up.railway.app/api
```

5. Click **Save**

### Step 3: Configure Custom Domain in Railway

1. Go to Railway Dashboard
2. Click on your **FRONTEND service** (not backend!)
3. Go to **Settings** → **Networking**
4. Click **"Custom Domain"** or **"Generate Domain"**
5. Add your domain: `xaura.pro`
6. Railway will give you DNS records to add

### Step 4: Update DNS Records

Railway will show you DNS records like:
- Type: `CNAME`
- Name: `@` or `xaura.pro`
- Value: `your-service.railway.app`

Add these records in your domain provider (where you bought xaura.pro).

### Step 5: Redeploy Frontend

After adding the environment variable:
1. Go to your **FRONTEND service** in Railway
2. Click **"Redeploy"**
3. Wait for deployment to complete

### Step 6: Verify Backend CORS

The backend already allows `xaura.pro` in CORS settings ✅

But verify in `backend/server.js` that these are in the allowed origins:
- `https://xaura.pro`
- `https://www.xaura.pro`

## 🧪 Testing

### Test 1: Backend Health Check
```bash
curl https://your-backend-url.railway.app/health
```
Should return: `{"status":"ok",...}`

### Test 2: Frontend Health Check
```bash
curl https://your-frontend-url.railway.app/health
```
Should return: `{"status":"ok",...}`

### Test 3: Domain
After DNS propagates (can take 5-60 minutes):
```bash
curl https://xaura.pro/health
```
Should return the frontend health check.

## 📋 Checklist

- [ ] Backend URL copied from Railway
- [ ] `VITE_API_URL` set in frontend service variables
- [ ] Frontend service redeployed
- [ ] Custom domain added in Railway (frontend service)
- [ ] DNS records added in domain provider
- [ ] Waited for DNS propagation (5-60 minutes)
- [ ] Tested backend URL directly
- [ ] Tested frontend URL directly
- [ ] Tested custom domain

## ⚠️ Common Issues

### Issue: "Application failed to respond" still shows
**Solutions:**
1. Check if domain is pointing to **FRONTEND** service (not backend)
2. Verify DNS records are correct
3. Wait longer for DNS propagation (can take up to 24 hours)
4. Check Railway logs for errors

### Issue: Frontend loads but API calls fail
**Solutions:**
1. Verify `VITE_API_URL` is set correctly in frontend variables
2. Check browser console for CORS errors
3. Verify backend CORS allows your domain
4. Check backend logs for CORS rejections

### Issue: Domain shows Railway default page
**Solutions:**
1. Make sure domain is added to **FRONTEND** service
2. Verify DNS records point to Railway
3. Check Railway networking settings

## 🚀 Quick Fix Summary

1. **Backend URL:** Copy from Railway backend service
2. **Frontend Variable:** Add `VITE_API_URL=https://backend-url.railway.app/api`
3. **Custom Domain:** Add `xaura.pro` to frontend service in Railway
4. **DNS:** Add CNAME record pointing to Railway
5. **Redeploy:** Redeploy frontend service
6. **Wait:** Wait for DNS propagation (5-60 minutes)

## 📞 Still Not Working?

1. Check Railway logs for both services
2. Test backend URL directly in browser
3. Test frontend URL directly in browser
4. Check browser console for errors
5. Verify all environment variables are set
6. Check DNS propagation status

