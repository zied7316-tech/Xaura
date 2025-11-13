const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  uploadSalonImage,
  uploadServiceImage,
  uploadWorkerImage
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Upload routes - all require authentication
router.post('/salon/:id', protect, authorize('Owner'), uploadSingle('image'), uploadSalonImage);
router.post('/service/:id', protect, authorize('Owner'), uploadSingle('image'), uploadServiceImage);
router.post('/worker/:id', protect, uploadSingle('image'), uploadWorkerImage);

module.exports = router;

