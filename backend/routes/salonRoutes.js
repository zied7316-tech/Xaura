const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createSalon,
  getSalonById,
  getSalonByQRCode,
  getSalonBySlug,
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
  body('userID')
    .notEmpty().withMessage('Worker ID is required')
    .isLength({ min: 4, max: 4 }).withMessage('Worker ID must be exactly 4 digits')
    .matches(/^\d{4}$/).withMessage('Worker ID must contain only digits')
];

// Public routes
router.get('/qr/:qrCode', getSalonByQRCode);
router.get('/slug/:slug', getSalonBySlug);
router.get('/:id', getSalonById);
router.get('/:id/services', getSalonServices);
router.get('/:id/schedule', getSalonSchedule);
router.get('/:id/qr-image', getQRCodeImage);

// Protected routes - Owner only
router.post('/', protect, authorize('Owner'), createSalonValidation, createSalon);
const { checkSubscriptionLimit } = require('../middleware/subscriptionMiddleware');

router.put('/:id', protect, authorize('Owner'), checkSalonOwnership, updateSalon);
router.post('/:id/workers', protect, authorize('Owner'), checkSalonOwnership, checkSubscriptionLimit('maxWorkers'), addWorkerValidation, addWorker);

module.exports = router;

