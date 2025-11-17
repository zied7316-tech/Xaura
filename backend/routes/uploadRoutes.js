const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  uploadSalonImage,
  uploadServiceImage,
  uploadWorkerImage,
  uploadUserImage,
  deleteSalonImage,
  deleteServiceImage,
  deleteWorkerImage,
  deleteUserImage
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Upload routes - all require authentication
router.post('/salon/:id', protect, authorize('Owner'), uploadSingle('image'), uploadSalonImage);
router.post('/service/:id', protect, authorize('Owner'), uploadSingle('image'), uploadServiceImage);
router.post('/worker/:id', protect, uploadSingle('image'), uploadWorkerImage);
router.post('/user/:id', protect, uploadSingle('image'), uploadUserImage); // For all user roles (Client, Owner, Worker)

// Delete routes
router.delete('/salon/:id', protect, authorize('Owner'), deleteSalonImage);
router.delete('/service/:id', protect, authorize('Owner'), deleteServiceImage);
router.delete('/worker/:id', protect, deleteWorkerImage);
router.delete('/user/:id', protect, deleteUserImage); // For all user roles

module.exports = router;

