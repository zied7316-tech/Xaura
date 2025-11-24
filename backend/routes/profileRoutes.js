const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getProfile, updateProfile, regenerateUserID } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('bio').optional().trim(),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experience').optional().trim(),
  body('education').optional().trim(),
  body('certifications').optional().isArray().withMessage('Certifications must be an array')
];

router.get('/', protect, getProfile);
router.put('/', protect, updateProfileValidation, updateProfile);
router.post('/regenerate-userid', protect, regenerateUserID);

module.exports = router;

