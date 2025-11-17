const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is configured
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

let storage;

if (useCloudinary) {
  // Use Cloudinary for persistent storage
  console.log('📦 Using Cloudinary for image storage');
  const { storage: cloudinaryStorage } = require('../config/cloudinary');
  storage = cloudinaryStorage;
} else {
  // Fallback to local storage (for development)
  console.log('⚠️  Cloudinary not configured, using local storage (files may be lost on Railway)');
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create subdirectories for different upload types
  const subdirs = ['salons', 'services', 'workers', 'profiles'];
  subdirs.forEach(dir => {
    const fullPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  // Configure local storage
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath = uploadsDir;
      
      // Determine subdirectory based on route
      const routePath = req.path || req.originalUrl || req.baseUrl || '';
      
      if (routePath.includes('/salon') || routePath.includes('salons')) {
        uploadPath = path.join(uploadsDir, 'salons');
      } else if (routePath.includes('/service') || routePath.includes('services')) {
        uploadPath = path.join(uploadsDir, 'services');
      } else if (routePath.includes('/worker') || routePath.includes('workers') || routePath.includes('/user') || routePath.includes('users')) {
        uploadPath = path.join(uploadsDir, 'workers');
      } else {
        uploadPath = path.join(uploadsDir, 'profiles');
      }
      
      console.log('Upload destination:', uploadPath, 'Route path:', routePath);
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });
}

// File filter - accept all image types
const fileFilter = (req, file, cb) => {
  // Accept any file that starts with 'image/'
  if (file.mimetype.startsWith('image/')) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Middleware for single image upload
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Middleware for multiple images upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple
};

