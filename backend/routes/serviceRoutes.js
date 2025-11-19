const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createService,
  getServiceById,
  updateService,
  deleteService,
  getAllServices,
  getMyServices
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Validation rules
const serviceValidation = [
  body('name').notEmpty().withMessage('Service name is required'),
  body('duration').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('salonId').notEmpty().withMessage('Salon ID is required'),
  body('category').optional().isIn([
    'Haircut', 'Coloring', 'Styling', 'Manicure', 'Pedicure', 
    'Facial', 'Massage', 'Waxing', 'Other'
  ]).withMessage('Invalid category')
];

// Public routes
router.get('/', getAllServices);

// Protected routes - Worker (must be before /:id to avoid route conflict)
router.get('/my-services', protect, authorize('Worker'), getMyServices);

// Public routes (must be after specific routes)
router.get('/:id', getServiceById);

// Protected routes - Owner only
router.post('/', protect, authorize('Owner'), serviceValidation, createService);
router.put('/:id', protect, authorize('Owner'), updateService);
router.delete('/:id', protect, authorize('Owner'), deleteService);

module.exports = router;

