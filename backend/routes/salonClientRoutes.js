const express = require('express');
const router = express.Router();
const {
  getMySalons,
  getSalonClients,
  getClientDetails,
  updateClientNotes,
  updateClientStatus
} = require('../controllers/salonClientController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Client routes
router.get('/my-salons', protect, authorize('Client'), getMySalons);

// Owner routes
router.get('/', protect, authorize('Owner'), getSalonClients);
router.get('/:clientId', protect, authorize('Owner'), getClientDetails);
router.put('/:clientId/notes', protect, authorize('Owner'), updateClientNotes);
router.put('/:clientId/status', protect, authorize('Owner'), updateClientStatus);

module.exports = router;

