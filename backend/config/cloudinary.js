const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Determine folder based on route
    let folder = 'xaura';
    const routePath = req.path || req.originalUrl || req.baseUrl || '';
    
    if (routePath.includes('/salon') || routePath.includes('salons')) {
      folder = 'xaura/salons';
    } else if (routePath.includes('/service') || routePath.includes('services')) {
      folder = 'xaura/services';
    } else if (routePath.includes('/worker') || routePath.includes('workers')) {
      folder = 'xaura/workers';
    } else if (routePath.includes('/user') || routePath.includes('users') || routePath.includes('/profile')) {
      folder = 'xaura/profiles';
    } else {
      folder = 'xaura/profiles';
    }
    
    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit', quality: 'auto' },
        { fetch_format: 'auto' }
      ],
      resource_type: 'image',
      public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`, // Unique filename
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};

