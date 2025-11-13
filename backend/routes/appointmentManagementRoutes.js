const express = require('express');
const router = express.Router();
const {
  acceptAppointment,
  rejectAppointment,
  startAppointment,
  completeAppointment,
  getWorkerPendingAppointments,
  getWorkerActiveAppointments,
  reassignAppointment,
  createWalkInAppointment
} = require('../controllers/appointmentManagementController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Worker appointment management
router.get('/worker/pending', protect, authorize('Worker'), getWorkerPendingAppointments);
router.get('/worker/active', protect, authorize('Worker'), getWorkerActiveAppointments);

// Walk-in appointments - Only Worker
router.post('/walk-in', protect, authorize('Worker'), createWalkInAppointment);

// Accept/Reject - Both Worker and Owner can do these
router.put('/:id/accept', protect, authorize('Worker', 'Owner'), acceptAppointment);
router.put('/:id/reject', protect, authorize('Worker', 'Owner'), rejectAppointment);

// Start/Complete - Only Worker
router.put('/:id/start', protect, authorize('Worker'), startAppointment);
router.put('/:id/complete', protect, authorize('Worker'), completeAppointment);

// Reassign - Only Owner
router.put('/:id/reassign', protect, authorize('Owner'), reassignAppointment);

module.exports = router;

