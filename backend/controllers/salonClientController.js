const SalonClient = require('../models/SalonClient');
const Salon = require('../models/Salon');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

/**
 * @desc    Get client's joined salons
 * @route   GET /api/salon-clients/my-salons
 * @access  Private (Client)
 */
const getMySalons = async (req, res, next) => {
  try {
    const mySalons = await SalonClient.find({ clientId: req.user.id })
      .populate({
        path: 'salonId',
        select: 'name description logo phone email address qrCode slug'
      })
      .sort({ joinedAt: -1 });

    res.json({
      success: true,
      count: mySalons.length,
      data: mySalons
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all clients for owner's salon
 * @route   GET /api/salon-clients
 * @access  Private (Owner)
 */
const getSalonClients = async (req, res, next) => {
  try {
    const { status, search, sortBy = 'newest' } = req.query;

    // Get owner's salon
    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Build filter
    const filter = { salonId: salon._id };
    
    if (status) {
      filter.status = status;
    }

    // Get clients
    let clients = await SalonClient.find(filter)
      .populate('clientId', 'name email phone avatar')
      .sort(sortBy === 'newest' ? { joinedAt: -1 } : { totalAppointments: -1 });

    // Apply text search if provided
    if (search) {
      clients = clients.filter(c => 
        c.clientId.name.toLowerCase().includes(search.toLowerCase()) ||
        c.clientId.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get appointment count for each client (more accurate)
    const clientsWithDetails = await Promise.all(
      clients.map(async (client) => {
        const appointmentCount = await Appointment.countDocuments({
          clientId: client.clientId._id,
          salonId: salon._id
        });

        return {
          ...client.toObject(),
          actualAppointmentCount: appointmentCount
        };
      })
    );

    res.json({
      success: true,
      count: clientsWithDetails.length,
      data: clientsWithDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single client details
 * @route   GET /api/salon-clients/:clientId
 * @access  Private (Owner)
 */
const getClientDetails = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    // Get owner's salon
    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get client relationship
    const salonClient = await SalonClient.findOne({
      salonId: salon._id,
      clientId
    }).populate('clientId', 'name email phone avatar createdAt');

    if (!salonClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found in your salon'
      });
    }

    // Get appointments history
    const appointments = await Appointment.find({
      clientId,
      salonId: salon._id
    })
      .populate('serviceId', 'name price')
      .sort({ startTime: -1 })
      .limit(10);

    // Calculate total spent
    const totalSpent = appointments.reduce((sum, apt) => {
      return sum + (apt.serviceId?.price || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        client: salonClient,
        appointments,
        totalSpent,
        appointmentCount: appointments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update client notes
 * @route   PUT /api/salon-clients/:clientId/notes
 * @access  Private (Owner)
 */
const updateClientNotes = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { notes } = req.body;

    // Get owner's salon
    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonClient = await SalonClient.findOneAndUpdate(
      { salonId: salon._id, clientId },
      { notes },
      { new: true }
    ).populate('clientId', 'name email');

    if (!salonClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: 'Client notes updated',
      data: salonClient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update client status (active/inactive/vip)
 * @route   PUT /api/salon-clients/:clientId/status
 * @access  Private (Owner)
 */
const updateClientStatus = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'vip'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get owner's salon
    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonClient = await SalonClient.findOneAndUpdate(
      { salonId: salon._id, clientId },
      { status },
      { new: true }
    ).populate('clientId', 'name email');

    if (!salonClient) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      message: `Client status updated to ${status}`,
      data: salonClient
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySalons,
  getSalonClients,
  getClientDetails,
  updateClientNotes,
  updateClientStatus
};
