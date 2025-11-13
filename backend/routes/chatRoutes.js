const express = require('express');
const router = express.Router();
const {
  getOrCreateChat,
  getMyChats,
  getChat,
  getChatMessages,
  sendMessage,
  getUnreadCount,
  deleteChat,
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication and Client/Worker role
router.use(protect);
router.use(authorize('Client', 'Worker'));

// Chat routes
router.post('/', getOrCreateChat);
router.get('/', getMyChats);
router.get('/unread/count', getUnreadCount);
router.get('/:id', getChat);
router.delete('/:id', deleteChat);

// Message routes
router.get('/:id/messages', getChatMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;

