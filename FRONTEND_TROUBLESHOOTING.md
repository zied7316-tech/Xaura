# 🔍 Frontend Troubleshooting - xaura.pro Not Working

## ✅ What's Already Configured:
- ✅ Backend: `api.xaura.pro` → Port 5000
- ✅ Frontend: `xaura.pro` → Should be configured
- ✅ Both services running

## 🔍 Check These Issues:

### Issue 1: Frontend Environment Variable Not Set
**Check:**
1. Go to Railway → FRONTEND service → Variables
2. Look for: `VITE_API_URL`
3. Value should be: `https://api.xaura.pro/api`

**If missing or wrong:**
- Add/Update: `VITE_API_URL=https://api.xaura.pro/api`
- **IMPORTANT:** Redeploy frontend after adding/updating!

### Issue 2: Frontend Not Rebuilt After Setting Variable
**Problem:** Vite environment variables are baked into the build at BUILD TIME, not runtime.

**Solution:**
1. After setting `VITE_API_URL` in Railway
2. Go to FRONTEND service → Deployments
3. Click "Redeploy" or trigger a new deployment
4. Wait for build to complete

### Issue 3: DNS Not Propagated
**Check:**
```bash
# Test if DNS is working
nslookup xaura.pro
nslookup api.xaura.pro
```

**If DNS not working:**
- Wait 5-60 minutes (can take up to 24 hours)
- Check your domain provider DNS settings
- Verify CNAME records point to Railway

### Issue 4: Frontend Build Failing
**Check Railway Logs:**
1. Go to FRONTEND service → Deployments
2. Click latest deployment
3. Check "Build Logs"
4. Look for errors

### Issue 5: Wrong Service Port
**Check:**
- Frontend should be on port 8080 (from your logs)
- Backend should be on port 5000
- Railway networking should route correctly

## 🧪 Testing Steps:

### Test 1: Backend Direct Access
```bash
curl https://api.xaura.pro/health
```
Should return: `{"status":"ok",...}`

### Test 2: Frontend Railway URL
1. Go to Railway → FRONTEND service → Settings → Networking
2. Copy the Railway URL (e.g., `https://xaura-web-xxx.up.railway.app`)
3. Visit it in browser
4. Does it work? If yes, DNS issue. If no, build issue.

### Test 3: Frontend Custom Domain
```bash
curl https://xaura.pro/health
```
Should return frontend health check.

### Test 4: Check Browser Console
1. Visit `https://xaura.pro` in browser
2. Open Developer Tools (F12)
3. Check Console tab for errors
4. Check Network tab for failed requests

## 🛠️ Quick Fixes:

### Fix 1: Verify and Redeploy Frontend
1. Check `VITE_API_URL` is set to `https://api.xaura.pro/api`
2. Redeploy frontend service
3. Wait for build to complete
4. Test again

### Fix 2: Check Build Logs
Look for:
- `VITE_API_URL` in build logs
- Build errors
- Missing dependencies

### Fix 3: Test Railway URL First
Before testing custom domain, test the Railway-generated URL:
- If Railway URL works → DNS issue
- If Railway URL doesn't work → Build/Config issue

## 📋 Checklist:

- [ ] `VITE_API_URL` set in frontend variables
- [ ] Frontend redeployed after setting variable
- [ ] Build logs show no errors
- [ ] Backend accessible at `https://api.xaura.pro/health`
- [ ] Frontend Railway URL works
- [ ] DNS records correct
- [ ] Browser console shows no errors
- [ ] Network tab shows API calls going to correct URL

## 🚨 Most Common Issue:

**VITE_API_URL not set or frontend not rebuilt!**

Vite environment variables must be:
1. Set BEFORE build
2. Available during `npm run build`
3. Frontend must be redeployed after setting

**Solution:**
1. Set `VITE_API_URL=https://api.xaura.pro/api` in Railway
2. Redeploy frontend (this triggers a new build)
3. Wait for deployment
4. Test again

