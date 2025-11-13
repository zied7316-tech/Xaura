const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createSalon,
  getSalonById,
  getSalonByQRCode,
  updateSalon,
  addWorker,
  getSalonServices,
  getSalonSchedule,
  getQRCodeImage
} = require('../controllers/salonController');
const { protect, authorize, checkSalonOwnership } = require('../middleware/authMiddleware');

// Validation rules
const createSalonValidation = [
  body('name').notEmpty().withMessage('Salon name is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
];

const addWorkerValidation = [
  body('email').isEmail().withMessage('Please provide a valid worker email')
];

// Public routes
router.get('/qr/:qrCode', getSalonByQRCode);
router.get('/:id', getSalonById);
router.get('/:id/services', getSalonServices);
router.get('/:id/schedule', getSalonSchedule);
router.get('/:id/qr-image', getQRCodeImage);

// Protected routes - Owner only
router.post('/', protect, authorize('Owner'), createSalonValidation, createSalon);
router.put('/:id', protect, authorize('Owner'), checkSalonOwnership, updateSalon);
router.post('/:id/workers', protect, authorize('Owner'), checkSalonOwnership, addWorkerValidation, addWorker);

module.exports = router;

