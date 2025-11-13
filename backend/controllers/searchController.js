const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Product = require('../models/Product');

/**
 * @desc    Global search across all entities
 * @route   GET /api/search?q=query
 * @access  Private
 */
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          clients: [],
          workers: [],
          appointments: [],
          services: [],
          products: []
        }
      });
    }

    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');

    // Get user's salon
    const currentUser = await User.findById(userId).populate('salonId');
    let salonId = null;

    if (currentUser.role === 'Owner' && currentUser.salonId) {
      salonId = currentUser.salonId._id;
    } else if (currentUser.role === 'Worker' && currentUser.salonId) {
      salonId = currentUser.salonId;
    }

    const results = {
      clients: [],
      workers: [],
      appointments: [],
      services: [],
      products: []
    };

    // Search based on role
    if (currentUser.role === 'Owner') {
      // Search clients
      const clientIds = await Appointment.find({ salonId }).distinct('clientId');
      results.clients = await User.find({
        _id: { $in: clientIds },
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).limit(10).select('name email phone avatar status');

      // Search workers
      results.workers = await User.find({
        salonId,
        role: 'Worker',
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).limit(10).select('name email phone avatar currentStatus');

      // Search appointments
      results.appointments = await Appointment.find({
        salonId
      })
        .populate('clientId', 'name phone')
        .populate('workerId', 'name')
        .populate('serviceId', 'name')
        .then(appointments => 
          appointments.filter(apt => 
            apt.clientId?.name.match(searchRegex) ||
            apt.workerId?.name.match(searchRegex) ||
            apt.serviceId?.name.match(searchRegex)
          ).slice(0, 10)
        );

      // Search services
      results.services = await Service.find({
        salonId,
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      }).limit(10);

      // Search products
      results.products = await Product.find({
        salonId,
        $or: [
          { name: searchRegex },
          { sku: searchRegex },
          { description: searchRegex }
        ]
      }).limit(10);
    } else if (currentUser.role === 'Client') {
      // Search appointments
      results.appointments = await Appointment.find({
        clientId: userId
      })
        .populate('workerId', 'name')
        .populate('serviceId', 'name')
        .populate('salonId', 'name')
        .then(appointments => 
          appointments.filter(apt => 
            apt.workerId?.name.match(searchRegex) ||
            apt.serviceId?.name.match(searchRegex) ||
            apt.salonId?.name.match(searchRegex)
          ).slice(0, 10)
        );
    }

    res.json({
      success: true,
      query: searchTerm,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  globalSearch
};




