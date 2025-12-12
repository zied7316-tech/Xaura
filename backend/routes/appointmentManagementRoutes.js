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
  createWalkInAppointment,
  editWalkInAppointment,
  deleteWalkInAppointment,
  editWalkInAppointmentOwner,
  voidWalkInAppointment,
  getWorkerAdjustments
} = require('../controllers/appointmentManagementController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Worker appointment management
router.get('/worker/pending', protect, authorize('Worker'), getWorkerPendingAppointments);
router.get('/worker/active', protect, authorize('Worker'), getWorkerActiveAppointments);

// Walk-in appointments - Worker and Owner (if worksAsWorker is enabled)
router.post('/walk-in', protect, authorize('Worker', 'Owner'), (req, res, next) => {
  console.log('[ROUTE] ========== WALK-IN ROUTE HIT ==========');
  console.log('[ROUTE] Method:', req.method);
  console.log('[ROUTE] Path:', req.path);
  console.log('[ROUTE] Body:', JSON.stringify(req.body));
  console.log('[ROUTE] User:', req.user ? { id: req.user.id, role: req.user.role, worksAsWorker: req.user.worksAsWorker } : 'NO USER');
  console.log('[ROUTE] Headers origin:', req.headers.origin);
  console.log('[ROUTE] Calling createWalkInAppointment controller...');
  createWalkInAppointment(req, res, next);
});

// Accept/Reject - Both Worker and Owner can do these
router.put('/:id/accept', protect, authorize('Worker', 'Owner'), acceptAppointment);
router.put('/:id/reject', protect, authorize('Worker', 'Owner'), rejectAppointment);

// Start/Complete - Only Worker
router.put('/:id/start', protect, authorize('Worker'), startAppointment);
router.put('/:id/complete', protect, authorize('Worker'), completeAppointment);

// Reassign - Only Owner
router.put('/:id/reassign', protect, authorize('Owner'), reassignAppointment);

// Walk-in corrections - Worker quick fix (15 min limit)
router.put('/walk-in/:id/edit', protect, authorize('Worker'), editWalkInAppointment);
router.delete('/walk-in/:id', protect, authorize('Worker'), deleteWalkInAppointment);

// Walk-in corrections - Owner override (no time limit)
router.put('/walk-in/:id/edit-owner', protect, authorize('Owner'), editWalkInAppointmentOwner);
router.delete('/walk-in/:id/void', protect, authorize('Owner'), voidWalkInAppointment);

// Worker adjustment history
router.get('/adjustments', protect, authorize('Worker'), getWorkerAdjustments);

module.exports = router;

