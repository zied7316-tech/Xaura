const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  uploadSalonImage,
  uploadServiceImage,
  uploadWorkerImage,
  deleteSalonImage,
  deleteServiceImage,
  deleteWorkerImage
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Upload routes - all require authentication
router.post('/salon/:id', protect, authorize('Owner'), uploadSingle('image'), uploadSalonImage);
router.post('/service/:id', protect, authorize('Owner'), uploadSingle('image'), uploadServiceImage);
router.post('/worker/:id', protect, uploadSingle('image'), uploadWorkerImage);

// Delete routes
router.delete('/salon/:id', protect, authorize('Owner'), deleteSalonImage);
router.delete('/service/:id', protect, authorize('Owner'), deleteServiceImage);
router.delete('/worker/:id', protect, deleteWorkerImage);

module.exports = router;

