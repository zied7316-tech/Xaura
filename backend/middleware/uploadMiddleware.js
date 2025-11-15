const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadsDir;
    
    // Determine subdirectory based on route
    // Check both baseUrl and path since routes use singular forms
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

