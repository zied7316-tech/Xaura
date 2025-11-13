const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createSalonAccount,
  getSalonAccount,
  updateOperatingMode
} = require('../controllers/salonAccountController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Validation for salon account creation
const salonAccountValidation = [
  // Salon details
  body('salonName').notEmpty().withMessage('Salon name is required'),
  body('salonPhone').notEmpty().withMessage('Salon phone is required'),
  body('operatingMode').optional().isIn(['solo', 'team']).withMessage('Invalid operating mode'),
  
  // Owner credentials
  body('ownerName').notEmpty().withMessage('Owner name is required'),
  body('ownerEmail').isEmail().withMessage('Valid owner email is required'),
  body('ownerPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('ownerPhone').notEmpty().withMessage('Owner phone is required')
];

// Public route - create salon account
router.post('/register', salonAccountValidation, createSalonAccount);

// Protected routes
router.get('/', protect, authorize('Owner'), getSalonAccount);
router.put('/mode', protect, authorize('Owner'), updateOperatingMode);

module.exports = router;

