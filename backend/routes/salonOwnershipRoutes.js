const express = require('express');
const router = express.Router();
const {
  getMySalons,
  getMySalon,
  setPrimarySalon,
  addSalon,
  transferSalonOwnership,
  grantSalonAccess,
  revokeSalonAccess,
  checkSalonAccess,
} = require('../controllers/salonOwnershipController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionLimit } = require('../middleware/subscriptionMiddleware');

// All routes require Owner authentication
router.use(protect);
router.use(authorize('Owner'));

// Salon management routes
router.get('/', getMySalons);
router.post('/', checkSubscriptionLimit('maxLocations'), addSalon);
router.get('/:id', getMySalon);
router.get('/:id/check-access', checkSalonAccess);
router.put('/:id/set-primary', setPrimarySalon);

// Ownership management
router.post('/:id/transfer', transferSalonOwnership);
router.post('/:id/grant-access', grantSalonAccess);
router.delete('/:id/revoke-access/:userId', revokeSalonAccess);

module.exports = router;

