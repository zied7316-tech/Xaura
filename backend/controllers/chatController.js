const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const Appointment = require('../models/Appointment');

/**
 * @desc    Get or create chat between client and worker
 * @route   POST /api/chats
 * @access  Private/Client/Worker
 */
exports.getOrCreateChat = async (req, res) => {
  try {
    const { workerId, clientId, appointmentId } = req.body;

    // Determine IDs based on user role
    let finalClientId = clientId;
    let finalWorkerId = workerId;

    if (req.user.role === 'Client') {
      finalClientId = req.user._id;
      if (!workerId) {
        return res.status(400).json({
          success: false,
          message: 'Worker ID is required',
        });
      }
    } else if (req.user.role === 'Worker') {
      finalWorkerId = req.user._id;
      if (!clientId) {
        return res.status(400).json({
          success: false,
          message: 'Client ID is required',
        });
      }
    }

    // Get appointment to verify and get salon
    let salon = req.user.salonId;
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment) {
        salon = appointment.salonId;
      }
    }

    // Find or create chat
    let chat = await Chat.findOne({
      client: finalClientId,
      worker: finalWorkerId,
      ...(appointmentId && { appointment: appointmentId }),
    })
      .populate('client', 'name email profilePicture')
      .populate('worker', 'name email profilePicture')
      .populate('appointment', 'serviceId date status');

    if (!chat) {
      chat = await Chat.create({
        client: finalClientId,
        worker: finalWorkerId,
        salon,
        appointment: appointmentId || null,
      });

      await chat.populate('client', 'name email profilePicture');
      await chat.populate('worker', 'name email profilePicture');
      if (appointmentId) {
        await chat.populate('appointment', 'serviceId date status');
      }
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Error getting or creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get or create chat',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all chats for current user
 * @route   GET /api/chats
 * @access  Private/Client/Worker
 */
exports.getMyChats = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'Client') {
      query.client = req.user._id;
    } else if (req.user.role === 'Worker') {
      query.worker = req.user._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only clients and workers can access chats',
      });
    }

    const chats = await Chat.find(query)
      .populate('client', 'name email profilePicture')
      .populate('worker', 'name email profilePicture')
      .populate('appointment', 'serviceId date status')
      .sort({ lastMessageAt: -1 })
      .lean();

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single chat
 * @route   GET /api/chats/:id
 * @access  Private/Client/Worker
 */
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('client', 'name email profilePicture')
      .populate('worker', 'name email profilePicture')
      .populate('appointment', 'serviceId date status')
      .lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check permissions
    if (
      chat.client._id.toString() !== req.user._id.toString() &&
      chat.worker._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this chat',
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat',
      error: error.message,
    });
  }
};

/**
 * @desc    Get messages for a chat
 * @route   GET /api/chats/:id/messages
 * @access  Private/Client/Worker
 */
exports.getChatMessages = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check permissions
    if (
      chat.client.toString() !== req.user._id.toString() &&
      chat.worker.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this chat',
      });
    }

    const messages = await ChatMessage.find({ chat: req.params.id })
      .populate('sender', 'name email profilePicture role')
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read
    const updateField =
      req.user.role === 'Client' ? 'unreadCount.client' : 'unreadCount.worker';
    await Chat.findByIdAndUpdate(req.params.id, { [updateField]: 0 });

    // Mark unread messages as read
    await ChatMessage.updateMany(
      {
        chat: req.params.id,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

/**
 * @desc    Send a message
 * @route   POST /api/chats/:id/messages
 * @access  Private/Client/Worker
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check permissions
    if (
      chat.client.toString() !== req.user._id.toString() &&
      chat.worker.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this chat',
      });
    }

    const newMessage = await ChatMessage.create({
      chat: req.params.id,
      sender: req.user._id,
      senderRole: req.user.role,
      message: message.trim(),
    });

    await newMessage.populate('sender', 'name email profilePicture role');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/chats/unread/count
 * @access  Private/Client/Worker
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'Client') {
      query.client = req.user._id;
    } else if (req.user.role === 'Worker') {
      query.worker = req.user._id;
    }

    const chats = await Chat.find(query).lean();

    const totalUnread = chats.reduce((sum, chat) => {
      if (req.user.role === 'Client') {
        return sum + (chat.unreadCount?.client || 0);
      } else {
        return sum + (chat.unreadCount?.worker || 0);
      }
    }, 0);

    res.json({
      success: true,
      unreadCount: totalUnread,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete chat
 * @route   DELETE /api/chats/:id
 * @access  Private/Client/Worker
 */
exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // Check permissions
    if (
      chat.client.toString() !== req.user._id.toString() &&
      chat.worker.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this chat',
      });
    }

    // Delete all messages
    await ChatMessage.deleteMany({ chat: req.params.id });

    // Delete chat
    await chat.deleteOne();

    res.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat',
      error: error.message,
    });
  }
};


