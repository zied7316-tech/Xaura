# 🚨 Fix 502 Bad Gateway Error

## The Problem
502 Bad Gateway means Railway can't reach your frontend service. The domain might be pointing to the wrong service.

## 🔍 Critical Checks

### Check 1: Which Service is `xaura.pro` Pointing To?

**This is the most important check!**

1. Go to Railway Dashboard
2. Click on your **FRONTEND service**
3. Go to **Settings** → **Networking**
4. Look for `xaura.pro` in the list
5. **Is it there?** 
   - ✅ If YES → Continue to Check 2
   - ❌ If NO → The domain is pointing to BACKEND! This is the problem!

### Check 2: Is Domain Pointing to Backend Instead?

1. Go to Railway Dashboard
2. Click on your **BACKEND service**
3. Go to **Settings** → **Networking**
4. **Do you see `xaura.pro` listed here?**
   - ❌ If YES → **THIS IS THE PROBLEM!** 
   - The domain should point to FRONTEND, not BACKEND!

## 🛠️ Solution: Move Domain to Frontend

### Step 1: Remove Domain from Backend (if it's there)
1. Go to **BACKEND service** → **Settings** → **Networking**
2. If you see `xaura.pro`, click the delete/remove icon next to it
3. Confirm removal

### Step 2: Add Domain to Frontend
1. Go to **FRONTEND service** → **Settings** → **Networking**
2. Click **"+ Custom Domain"**
3. Enter: `xaura.pro`
4. Railway will show DNS records
5. Add those DNS records in your domain provider

### Step 3: Also Add www.xaura.pro
Since the browser is trying `www.xaura.pro`:
1. In **FRONTEND service** → **Settings** → **Networking**
2. Click **"+ Custom Domain"** again
3. Enter: `www.xaura.pro`
4. Add DNS records for this too

### Step 4: Verify Port Configuration
1. Go to **FRONTEND service** → **Settings** → **Networking**
2. Make sure the domain shows: `→ Port 8080` (not 5000!)
3. If it shows port 5000, that's wrong - it should be 8080

## 🧪 Testing

### Test 1: Check Frontend Service Directly
1. Go to **FRONTEND service** → **Settings** → **Networking**
2. Copy the Railway URL (e.g., `https://xaura-web-xxx.up.railway.app`)
3. Visit it in browser
4. **Does it work?**
   - ✅ If YES → Domain routing issue
   - ❌ If NO → Frontend service issue

### Test 2: Check Frontend Logs
1. Go to **FRONTEND service** → **Deployments**
2. Click latest deployment
3. Check **Deploy Logs**
4. Look for errors or crashes

### Test 3: Check Health Check
```bash
curl https://your-frontend-railway-url.railway.app/health
```
Should return: `{"status":"ok",...}`

## 📋 Quick Checklist

- [ ] `xaura.pro` is in **FRONTEND** service networking (not backend)
- [ ] `www.xaura.pro` is also added to **FRONTEND** service
- [ ] Domain shows port **8080** (not 5000)
- [ ] Frontend Railway URL works directly
- [ ] Frontend service is running (check logs)
- [ ] DNS records are correct
- [ ] Waited for DNS propagation (5-60 minutes)

## 🚨 Most Common Issue

**Domain `xaura.pro` is pointing to BACKEND service instead of FRONTEND!**

**Solution:**
1. Remove `xaura.pro` from BACKEND service
2. Add `xaura.pro` to FRONTEND service
3. Add `www.xaura.pro` to FRONTEND service
4. Wait for DNS propagation
5. Test again

## ⚠️ Important Notes

- **Backend** should have: `api.xaura.pro` → Port 5000 ✅
- **Frontend** should have: `xaura.pro` → Port 8080 ✅
- **Frontend** should have: `www.xaura.pro` → Port 8080 ✅

If `xaura.pro` is pointing to backend (port 5000), that's why you get 502!

