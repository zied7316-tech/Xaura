const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerDetails,
  updateCustomerProfile,
  addCustomerNote,
  getBirthdayReminders
} = require('../controllers/customerCRMController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Birthday reminders
router.get('/reminders/birthdays', protect, authorize('Owner'), getBirthdayReminders);

// Customer CRM
router.get('/', protect, authorize('Owner'), getCustomers);
router.get('/:id', protect, authorize('Owner'), getCustomerDetails);
router.put('/:id/profile', protect, authorize('Owner'), updateCustomerProfile);
router.post('/:id/notes', protect, authorize('Owner'), addCustomerNote);

module.exports = router;

