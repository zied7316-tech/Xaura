const SupportTicket = require('../models/SupportTicket');
const TicketMessage = require('../models/TicketMessage');
const { createActivityLog } = require('../middleware/activityLogger');
const emailService = require('../services/emailService');

/**
 * @desc    Get all tickets (Super Admin)
 * @route   GET /api/super-admin/tickets
 * @access  Private/SuperAdmin
 */
exports.getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, category } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('salon', 'name email')
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SupportTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message,
    });
  }
};

/**
 * @desc    Get my tickets (Salon Owner)
 * @route   GET /api/tickets
 * @access  Private/Owner
 */
exports.getMyTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { salon: req.user.salonId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SupportTicket.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single ticket
 * @route   GET /api/tickets/:id
 * @access  Private
 */
exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('salon', 'name email')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check permissions
    if (req.user.role !== 'SuperAdmin' && ticket.salon.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new ticket
 * @route   POST /api/tickets
 * @access  Private/Owner
 */
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    const ticket = await SupportTicket.create({
      salon: req.user.salonId,
      createdBy: req.user._id,
      subject,
      description,
      category,
      priority: priority || 'medium',
    });

    await ticket.populate('salon', 'name');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Update ticket status
 * @route   PUT /api/super-admin/tickets/:id/status
 * @access  Private/SuperAdmin
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'resolved' && { resolvedAt: new Date() }),
        ...(status === 'closed' && { closedAt: new Date() }),
      },
      { new: true }
    ).populate('salon', 'name');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Log activity
    await createActivityLog(
      req,
      status === 'resolved' ? 'ticket_resolved' : 'ticket_closed',
      'Ticket',
      ticket._id,
      ticket.ticketNumber,
      { subject: ticket.subject }
    );

    res.json({
      success: true,
      message: 'Ticket status updated',
      data: ticket,
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message,
    });
  }
};

/**
 * @desc    Assign ticket to admin
 * @route   POST /api/super-admin/tickets/:id/assign
 * @access  Private/SuperAdmin
 */
exports.assignTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: req.user._id,
        status: 'in_progress',
      },
      { new: true }
    ).populate('salon', 'name');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Log activity
    await createActivityLog(
      req,
      'ticket_assigned',
      'Ticket',
      ticket._id,
      ticket.ticketNumber,
      { subject: ticket.subject }
    );

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket,
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket messages
 * @route   GET /api/tickets/:id/messages
 * @access  Private
 */
exports.getTicketMessages = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check permissions
    if (req.user.role !== 'SuperAdmin' && ticket.salon.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket',
      });
    }

    // Filter out internal messages if not admin
    const query = {
      ticket: req.params.id,
      ...(req.user.role !== 'SuperAdmin' && { isInternal: false }),
    };

    const messages = await TicketMessage.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 })
      .lean();

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
 * @desc    Add message to ticket
 * @route   POST /api/tickets/:id/messages
 * @access  Private
 */
exports.addMessage = async (req, res) => {
  try {
    const { message, isInternal } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check permissions
    if (req.user.role !== 'SuperAdmin' && ticket.salon.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reply to this ticket',
      });
    }

    // Only admins can create internal messages
    const newMessage = await TicketMessage.create({
      ticket: req.params.id,
      sender: req.user._id,
      message,
      isInternal: req.user.role === 'SuperAdmin' && isInternal,
    });

    await newMessage.populate('sender', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket statistics
 * @route   GET /api/super-admin/tickets/stats
 * @access  Private/SuperAdmin
 */
exports.getTicketStats = async (req, res) => {
  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResponseTime,
      ticketsByCategory,
      ticketsByPriority,
    ] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'in_progress' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
      SupportTicket.aggregate([
        { $match: { lastResponseAt: { $exists: true } } },
        {
          $project: {
            responseTime: {
              $divide: [
                { $subtract: ['$lastResponseAt', '$createdAt'] },
                1000 * 60 * 60, // Convert to hours
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' },
          },
        },
      ]),
      SupportTicket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      SupportTicket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        avgResponseTime: avgResponseTime[0]?.avgResponseTime || 0,
        byCategory: ticketsByCategory,
        byPriority: ticketsByPriority,
      },
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket statistics',
      error: error.message,
    });
  }
};


