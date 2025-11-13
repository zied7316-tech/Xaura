# Deployment Guide

## Quick Deploy to Railway.app

### Step 1: Push to GitHub (Already Done! ✅)
Repository: https://github.com/chaimahannechi114455-prog/BZ.git

### Step 2: Sign Up for Railway
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with your GitHub account
4. Authorize Railway to access your repositories

### Step 3: Deploy Backend

1. **Create New Project** in Railway
2. **Select "Deploy from GitHub repo"**
3. Choose `BZ` repository
4. **Select backend folder**

5. **Configure Backend Settings:**
   - Root Directory: `/backend`
   - Start Command: `node server.js`
   
6. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generate-random-32-char-string>
   JWT_EXPIRE=7d
   MONGODB_URI=<see-step-4>
   ```

### Step 4: Add MongoDB Database

**Option A: Railway MongoDB**
1. Click "+ New" in your Railway project
2. Select "Database" → "MongoDB"
3. Copy the connection URL
4. Add to backend's `MONGODB_URI` variable

**Option B: MongoDB Atlas (Free)**
1. Go to https://mongodb.com/atlas
2. Create free account
3. Create free cluster (M0)
4. Create database user
5. Whitelist all IPs (0.0.0.0/0)
6. Get connection string
7. Replace `<password>` with your database user password
8. Add to backend's `MONGODB_URI`

### Step 5: Deploy Frontend

1. Click "+ New" in Railway project
2. Select "GitHub Repo" → `BZ`
3. **Select web folder**

4. **Configure Frontend Settings:**
   - Root Directory: `/web`
   - Build Command: `npm run build`
   - Start Command: (auto-detected)

5. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
   (Get backend URL from backend service in Railway)

### Step 6: Update CORS

After deployment, add your frontend URL to backend CORS:

Edit `backend/server.js`:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.railway.app'
  ],
  credentials: true
}
```

Then commit and push:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

### Step 7: Test Your Deployment

1. Visit your frontend URL
2. Create test accounts
3. Test all features
4. Check logs in Railway dashboard for errors

## Generate JWT Secret

Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### Build Fails
- Check logs in Railway dashboard
- Verify all environment variables are set
- Make sure `package.json` scripts are correct

### Backend Can't Connect to MongoDB
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist
- Verify database user credentials

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` has correct backend URL
- Check CORS settings in backend
- Verify backend is running (check logs)

## Estimated Costs

### Railway.app
- **Free Trial**: $5 credit
- **Hobby Plan**: ~$5-10/month
- **Pro Plan**: ~$20/month

### MongoDB Atlas
- **Free Tier (M0)**: $0/month (512MB)
- **Shared Cluster (M2)**: $9/month
- **Dedicated**: $57+/month

## Alternative Hosting Options

### Render.com
- Free tier available
- Similar setup to Railway
- Backend: $7/month for always-on
- Frontend: Free

### Vercel + Railway
- Vercel: Free for frontend
- Railway: $5-10/month for backend
- Best performance for React apps

### DigitalOcean (VPS)
- $5-10/month droplet
- Full control
- Requires manual setup (Nginx, PM2, SSL)

## Support

For deployment issues, check:
1. Railway dashboard logs
2. Backend terminal output
3. Browser console errors
4. MongoDB Atlas connection status





