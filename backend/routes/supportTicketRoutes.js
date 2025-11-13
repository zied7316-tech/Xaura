const express = require('express');
const router = express.Router();
const {
  getAllTickets,
  getMyTickets,
  getTicket,
  createTicket,
  updateTicketStatus,
  assignTicket,
  getTicketMessages,
  addMessage,
  getTicketStats,
} = require('../controllers/supportTicketController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Super Admin routes
router.get('/admin/all', protect, authorize('SuperAdmin'), getAllTickets);
router.get('/admin/stats', protect, authorize('SuperAdmin'), getTicketStats);
router.post('/admin/:id/assign', protect, authorize('SuperAdmin'), assignTicket);
router.put('/admin/:id/status', protect, authorize('SuperAdmin'), updateTicketStatus);

// Owner routes
router.get('/my-tickets', protect, authorize('Owner'), getMyTickets);
router.post('/', protect, authorize('Owner'), createTicket);

// Shared routes (both Owner and SuperAdmin)
router.get('/:id', protect, getTicket);
router.get('/:id/messages', protect, getTicketMessages);
router.post('/:id/messages', protect, addMessage);

module.exports = router;

