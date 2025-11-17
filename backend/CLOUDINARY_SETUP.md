# Cloudinary Setup Guide

## Why Cloudinary?

On Railway and other cloud platforms, the filesystem is **ephemeral** - files get deleted when:
- The container restarts
- The container is redeployed  
- After periods of inactivity

**Cloudinary provides persistent cloud storage** so your images never disappear!

## Setup Steps

### 1. Create a Cloudinary Account (Free)

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account
3. You'll get:
   - 25GB storage
   - 25GB bandwidth per month
   - Automatic image optimization
   - CDN delivery

### 2. Get Your Credentials

After signing up, go to your Dashboard:
- **Cloud Name**: Found at the top of the dashboard
- **API Key**: Found in "Account Details"
- **API Secret**: Found in "Account Details" (click "Reveal")

### 3. Add to Railway Environment Variables

In your Railway project settings, add these environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Deploy

Once the environment variables are set, redeploy your backend. The system will automatically:
- ✅ Use Cloudinary for all new uploads
- ✅ Store images permanently in the cloud
- ✅ Serve images via Cloudinary's CDN (faster loading)
- ✅ Automatically optimize images

## How It Works

- **With Cloudinary**: Images are uploaded directly to Cloudinary and stored permanently
- **Without Cloudinary**: Falls back to local storage (files may be lost on Railway)

## Image URLs

- **Cloudinary**: Full URLs like `https://res.cloudinary.com/your-cloud/image/upload/v1234567890/xaura/salons/image.jpg`
- **Local**: Paths like `/uploads/salons/image-123456.jpg`

The frontend automatically handles both formats!

## Benefits

✅ **Permanent Storage** - Images never disappear  
✅ **Fast CDN** - Images load faster worldwide  
✅ **Auto Optimization** - Images are automatically optimized  
✅ **Free Tier** - 25GB storage and bandwidth (plenty for most apps)  
✅ **Automatic Backups** - Cloudinary handles backups  

## Troubleshooting

**Images still disappearing?**
- Check that all 3 environment variables are set in Railway
- Check Railway logs for Cloudinary errors
- Verify your Cloudinary credentials are correct

**Want to test locally?**
- Add the same environment variables to your local `.env` file
- Restart your backend server

