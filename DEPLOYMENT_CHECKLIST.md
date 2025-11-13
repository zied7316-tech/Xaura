# ✅ Xaura Deployment Checklist

## 📋 Pre-Deployment (COMPLETED ✅)

- [x] Code pushed to GitHub: `https://github.com/zied7316-tech/Xaura`
- [x] MongoDB Atlas account created
- [x] MongoDB connection string obtained
- [x] Railway account created and funded ($5)
- [x] JWT secret generated
- [x] Deployment configurations created

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend on Railway

**Time: ~5 minutes**

1. **Go to Railway:**
   - Visit: https://railway.app/dashboard
   - Click: **"+ New Project"**
   - Select: **"Deploy from GitHub repo"**
   - Choose: `zied7316-tech/Xaura`

2. **Configure Backend:**
   - Go to **"Settings"** tab
   - Set **Root Directory**: `backend`
   - Set **Start Command**: `node server.js`

3. **Add Environment Variables:**
   Go to **"Variables"** tab and add:

   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=2af48ebff06564c34082e131c2075c6a661e3d1b4bf6a4314fe24ed75768d599
   JWT_EXPIRE=30d
   MONGODB_URI=mongodb+srv://zied7316_db_user:rJ6t9moUD85ZpxPe@cluster0.j5aqcsq.mongodb.net/xaura?retryWrites=true&w=majority
   ```

4. **Generate Domain:**
   - Go to **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - Copy your backend URL (e.g., `https://xaura-backend-xxx.up.railway.app`)

5. **Verify Backend is Running:**
   - Visit: `https://your-backend-url.up.railway.app`
   - Should see: `{"success":true,"message":"Beauty Platform API is running","version":"1.0.0"}`

**✅ Backend Status: [ ]**  
**Backend URL: ________________________________**

---

### Step 2: Deploy Frontend on Railway

**Time: ~5 minutes**

1. **Add Frontend Service:**
   - In same Railway project
   - Click: **"+ New"**
   - Select: **"GitHub Repo"**
   - Choose: `zied7316-tech/Xaura`

2. **Configure Frontend:**
   - Go to **"Settings"** tab
   - Set **Root Directory**: `web`
   - Set **Build Command**: `npm run build`
   - Set **Start Command**: `npm run preview`

3. **Add Environment Variable:**
   Go to **"Variables"** tab and add:

   ```
   VITE_API_URL=<YOUR_BACKEND_URL_FROM_STEP_1>/api
   ```

   **Example:**
   ```
   VITE_API_URL=https://xaura-backend-production.up.railway.app/api
   ```

4. **Generate Domain:**
   - Go to **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - Copy your frontend URL

5. **Verify Frontend is Running:**
   - Visit your frontend URL
   - Should see the Xaura landing page

**✅ Frontend Status: [ ]**  
**Frontend URL: ________________________________**

---

### Step 3: Update CORS (CRITICAL!)

**Time: ~3 minutes**

After both services are deployed, you MUST update CORS:

1. **Note your frontend URL**

2. **I'll update the code for you** - Tell me your frontend URL and I'll:
   - Update `backend/server.js` with proper CORS
   - Commit and push the changes
   - Railway will auto-redeploy

**✅ CORS Updated: [ ]**

---

### Step 4: Create Super Admin Account

**Time: ~2 minutes**

Once deployed, create your super admin:

1. **Via Railway Shell:**
   - Go to backend service in Railway
   - Click **"Shell"** tab
   - Run: `node scripts/createSuperAdmin.js`

2. **Or manually via MongoDB Atlas:**
   - Login to MongoDB Atlas
   - Go to Collections
   - Create user with role: `super-admin`

**Super Admin Credentials:**
- Email: `superadmin@xaura.com` (or your choice)
- Password: (set your own secure password)

**✅ Super Admin Created: [ ]**

---

### Step 5: Test Everything

**Time: ~10 minutes**

Test these features:

- [ ] Visit frontend URL - loads correctly
- [ ] Register new account (as salon owner)
- [ ] Login with new account
- [ ] Create a salon
- [ ] Add a service
- [ ] Add a worker
- [ ] Book an appointment
- [ ] Test language switcher (EN/FR)
- [ ] Test super admin login
- [ ] Check super admin dashboard

---

## 🐛 Troubleshooting Guide

### Issue: Backend Won't Start

**Check:**
1. Railway logs (click backend service → Logs tab)
2. All environment variables are set correctly
3. MongoDB connection string is correct (no spaces, correct password)

**Common fixes:**
- Verify `MONGODB_URI` has database name (`/xaura`)
- Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Ensure Railway has latest code (check last deploy time)

### Issue: Frontend Can't Connect to Backend

**Check:**
1. `VITE_API_URL` has correct backend URL
2. Backend URL ends with `/api`
3. CORS is updated with frontend URL
4. Backend is running (check logs)

**Common fixes:**
- Rebuild frontend after updating `VITE_API_URL`
- Update CORS in `backend/server.js`
- Check browser console for specific error

### Issue: CORS Errors

**Check:**
1. Backend has correct frontend URL in CORS config
2. Frontend URL matches exactly (no trailing slash)
3. Changes are committed and pushed
4. Railway redeployed after push

**Fix:**
- Update `backend/server.js` CORS configuration
- Add your frontend URL to allowed origins
- Commit and push changes

### Issue: 404 on Frontend Routes

**Check:**
1. Vite preview server is running
2. Build completed successfully
3. Check Railway logs for build errors

**Fix:**
- Ensure `npm run build` succeeds locally
- Check `dist` folder is created
- Verify Railway build logs

---

## 📊 Deployment Verification

### Backend Health Check

Visit: `https://your-backend-url.up.railway.app/`

Expected response:
```json
{
  "success": true,
  "message": "Beauty Platform API is running",
  "version": "1.0.0"
}
```

### Frontend Health Check

Visit: `https://your-frontend-url.up.railway.app/`

Expected: Landing page loads with:
- ✅ No console errors (press F12)
- ✅ Language switcher visible
- ✅ Login/Register buttons work
- ✅ Styling looks correct

### Database Connection Check

Check Railway backend logs for:
```
MongoDB Connected: <cluster-url>
```

---

## 💰 Cost Tracking

**Monthly costs:**

| Service | Plan | Cost |
|---------|------|------|
| MongoDB Atlas | Free (M0) | $0 |
| Railway Backend | Hobby | ~$5 |
| Railway Frontend | Hobby | ~$5 |
| **Total** | | **~$5-10/month** |

**Your $5 credit covers about 1 month of usage!**

---

## 🎉 Post-Deployment

After successful deployment:

1. **Custom Domain (Optional):**
   - Buy domain from Namecheap/GoDaddy
   - Configure DNS in Railway
   - Add SSL certificate (automatic)

2. **Email Service Setup:**
   - Configure Gmail SMTP or SendGrid
   - Add email credentials to Railway
   - Test email notifications

3. **Monitoring:**
   - Set up Railway alerts
   - Monitor usage in Railway dashboard
   - Check MongoDB Atlas metrics

4. **Backups:**
   - MongoDB Atlas does automatic backups
   - Consider exporting database weekly

---

## 📞 Support

If you need help:

1. **Check Railway logs first**
2. **Check browser console (F12)**
3. **Verify all environment variables**
4. **Tell me the exact error message**

---

## ✨ Success Criteria

Your deployment is successful when:

- ✅ Backend responds at its URL
- ✅ Frontend loads at its URL
- ✅ Can register new account
- ✅ Can login successfully
- ✅ Can create salon and services
- ✅ Language switcher works
- ✅ Super admin can access dashboard
- ✅ No errors in browser console
- ✅ No errors in Railway logs

---

## 🚀 Ready to Deploy!

**Current Status:**
- ✅ GitHub: Ready
- ✅ MongoDB: Ready
- ✅ Railway: Ready
- ✅ Configurations: Ready

**You're all set to deploy Xaura! 🇹🇳**

Follow the steps above and let me know when:
1. Backend is deployed (share URL)
2. Frontend is deployed (share URL)
3. I'll help with CORS update and testing!

**Let's make Xaura live! 🎉**

