const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllSalons,
  updateSalonStatus,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getGrowthAnalytics
} = require('../controllers/superAdminController');
const {
  getAllSubscriptions,
  getSubscriptionDetails,
  updateSubscriptionPlan,
  extendTrial,
  cancelSubscription,
  reactivateSubscription,
  createSubscription
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require SuperAdmin role
router.get('/dashboard', protect, authorize('SuperAdmin'), getDashboardStats);
router.get('/salons', protect, authorize('SuperAdmin'), getAllSalons);
router.put('/salons/:id/status', protect, authorize('SuperAdmin'), updateSalonStatus);
router.get('/users', protect, authorize('SuperAdmin'), getAllUsers);
router.get('/users/:id', protect, authorize('SuperAdmin'), getUserDetails);
router.put('/users/:id/status', protect, authorize('SuperAdmin'), updateUserStatus);
router.delete('/users/:id', protect, authorize('SuperAdmin'), deleteUser);
router.get('/analytics/growth', protect, authorize('SuperAdmin'), getGrowthAnalytics);

// Subscription routes
router.get('/subscriptions', protect, authorize('SuperAdmin'), getAllSubscriptions);
router.post('/subscriptions', protect, authorize('SuperAdmin'), createSubscription);
router.get('/subscriptions/:id', protect, authorize('SuperAdmin'), getSubscriptionDetails);
router.put('/subscriptions/:id/plan', protect, authorize('SuperAdmin'), updateSubscriptionPlan);
router.post('/subscriptions/:id/extend-trial', protect, authorize('SuperAdmin'), extendTrial);
router.put('/subscriptions/:id/cancel', protect, authorize('SuperAdmin'), cancelSubscription);
router.put('/subscriptions/:id/reactivate', protect, authorize('SuperAdmin'), reactivateSubscription);

module.exports = router;

