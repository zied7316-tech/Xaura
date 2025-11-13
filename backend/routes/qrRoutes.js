const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  registerViaQR,
  getSalonInfoForQR,
  joinSalonViaQR
} = require('../controllers/qrRegistrationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const qrRegisterValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
];

// Public routes - no authentication needed
router.get('/info/:qrCode', getSalonInfoForQR);
router.post('/register/:qrCode', qrRegisterValidation, registerViaQR);

// Private route - existing client joins salon
router.post('/join/:qrCode', protect, authorize('Client'), joinSalonViaQR);

module.exports = router;

