# 🚀 Xaura - Railway Deployment Guide

## ✅ Prerequisites Completed:
- ✅ Code on GitHub: `https://github.com/zied7316-tech/Xaura`
- ✅ MongoDB Atlas setup with connection string
- ✅ Railway account created and funded

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Deploy Backend on Railway

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Click **"+ New Project"**
   - Select **"Deploy from GitHub repo"**

2. **Select Repository**
   - Choose: `zied7316-tech/Xaura`
   - Click on the repository

3. **Configure Backend Service**
   - Railway will auto-detect the project
   - Click **"Add variables"** or go to **"Variables"** tab

4. **Add Environment Variables** (Copy these exactly):

```
NODE_ENV=production
PORT=5000
JWT_SECRET=2af48ebff06564c34082e131c2075c6a661e3d1b4bf6a4314fe24ed75768d599
JWT_EXPIRE=30d
MONGODB_URI=mongodb+srv://zied7316_db_user:rJ6t9moUD85ZpxPe@cluster0.j5aqcsq.mongodb.net/xaura?retryWrites=true&w=majority
```

5. **Configure Service Settings**
   - Go to **"Settings"** tab
   - **Root Directory**: `backend`
   - **Start Command**: `node server.js`
   - **Build Command**: (leave empty or `npm install`)

6. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment (2-5 minutes)
   - You'll get a URL like: `https://xaura-backend-production.up.railway.app`

7. **Generate Domain** (if not auto-generated)
   - Go to **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - Copy the backend URL

---

### Step 2: Deploy Frontend on Railway

1. **Add Frontend Service**
   - In the same Railway project
   - Click **"+ New"**
   - Select **"GitHub Repo"**
   - Choose: `zied7316-tech/Xaura` again

2. **Configure Frontend Service**
   - Go to **"Variables"** tab
   - Add this environment variable:

```
VITE_API_URL=https://YOUR-BACKEND-URL.up.railway.app/api
```

   **⚠️ Replace `YOUR-BACKEND-URL` with your actual backend URL from Step 1!**

3. **Configure Frontend Settings**
   - Go to **"Settings"** tab
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview` or leave empty (auto-detect)

4. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment (3-5 minutes)
   - You'll get a URL like: `https://xaura-frontend-production.up.railway.app`

5. **Generate Domain** (if not auto-generated)
   - Go to **"Settings"** → **"Networking"**
   - Click **"Generate Domain"**
   - This is your **PUBLIC APP URL** ✨

---

### Step 3: Update Backend CORS

**⚠️ CRITICAL STEP - Your frontend won't work without this!**

After you have your frontend URL, you need to update the backend to accept requests from it.

You'll need to:
1. Update `backend/server.js` CORS configuration
2. Add your frontend URL to allowed origins
3. Commit and push changes
4. Railway will auto-redeploy

**I'll help you with this after you get your frontend URL!**

---

## 🔐 Environment Variables Reference

### Backend Variables:
| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `5000` | Server port |
| `JWT_SECRET` | `2af48e...d599` | Secret key for JWT tokens |
| `JWT_EXPIRE` | `30d` | Token expiration time |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB connection string |

### Frontend Variables:
| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api` | Backend API URL |

---

## 🎯 Quick Checklist

- [ ] Deploy backend on Railway
- [ ] Copy backend URL
- [ ] Deploy frontend on Railway
- [ ] Add backend URL to frontend environment variable
- [ ] Update CORS in backend (with my help)
- [ ] Test the deployment
- [ ] Create super admin account

---

## 🧪 Testing Your Deployment

After deployment, test these:

1. **Visit Frontend URL**
   - Should load the landing page
   - No errors in browser console (F12)

2. **Test Registration**
   - Try registering a new account
   - Check if it works

3. **Test Login**
   - Login with test account
   - Should redirect to dashboard

4. **Check Backend**
   - Visit: `https://your-backend-url.up.railway.app/api/health`
   - Should return: `{"status":"ok"}`

---

## 📊 Expected Deployment Times

| Service | Time |
|---------|------|
| Backend | 2-5 minutes |
| Frontend | 3-5 minutes |
| Total | ~5-10 minutes |

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check Railway logs: Click on backend service → "Logs"
- Verify all environment variables are set
- Check MongoDB connection string is correct

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` has correct backend URL
- Make sure backend is running (check logs)
- Update CORS settings (I'll help you)

### Build Failed
- Check the logs for specific error
- Verify `package.json` exists in root directories
- Check node version compatibility

---

## 💰 Cost Estimate

- **Railway Hobby Plan**: ~$5-10/month
- **MongoDB Atlas (Free)**: $0/month
- **Total**: ~$5-10/month

Your $5 credit covers about a month! 🎉

---

## 🎉 What You'll Have After Deployment

✅ **Backend API** running 24/7  
✅ **Frontend App** accessible worldwide  
✅ **Database** storing all data  
✅ **HTTPS** automatically enabled  
✅ **Auto-deploy** on every git push  
✅ **Professional URLs** for your business  

---

## 📞 Need Help?

If you encounter any issues:
1. Check Railway logs first
2. Check browser console (F12)
3. Verify environment variables
4. Let me know and I'll help debug!

---

## 🚀 Ready to Deploy?

Follow the steps above, and let me know:
1. ✅ When backend is deployed (share the URL)
2. ✅ When frontend is deployed (share the URL)
3. I'll help you update CORS and test everything!

**Let's make Xaura live! 🇹🇳** ✨

