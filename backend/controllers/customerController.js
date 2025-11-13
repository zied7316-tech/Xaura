const Customer = require('../models/Customer');
const Salon = require('../models/Salon');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

/**
 * @desc    Get all customers for salon
 * @route   GET /api/customers
 * @access  Private (Owner, Worker)
 */
const getCustomers = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        count: 0,
        data: { customers: [] }
      });
    }

    const filter = { salonId: salon._id };
    if (status) filter.status = status;

    let customers = await Customer.find(filter)
      .populate('userId', 'name email phone avatar')
      .sort({ lastVisit: -1 });

    // Search by name or email
    if (search) {
      customers = customers.filter(c => 
        c.userId.name.toLowerCase().includes(search.toLowerCase()) ||
        c.userId.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      success: true,
      count: customers.length,
      data: { customers }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer details
 * @route   GET /api/customers/:id
 * @access  Private (Owner, Worker)
 */
const getCustomerDetails = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('userId', 'name email phone avatar')
      .populate('preferredWorkers', 'name')
      .populate('preferredServices', 'name price');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer appointment history
    const appointments = await Appointment.find({
      clientId: customer.userId._id,
      salonId: customer.salonId
    })
      .populate('serviceId', 'name')
      .populate('workerId', 'name')
      .sort({ dateTime: -1 })
      .limit(10);

    // Get payment history
    const payments = await Payment.find({
      clientId: customer.userId._id,
      salonId: customer.salonId
    }).sort({ paidAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        customer,
        appointmentHistory: appointments,
        paymentHistory: payments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer notes/preferences
 * @route   PUT /api/customers/:id
 * @access  Private (Owner, Worker)
 */
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone');

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer: updatedCustomer }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top customers by spending
 * @route   GET /api/customers/top
 * @access  Private (Owner)
 */
const getTopCustomers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        data: { customers: [] }
      });
    }

    const topCustomers = await Customer.find({ salonId: salon._id })
      .populate('userId', 'name email phone')
      .sort({ totalSpent: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { customers: topCustomers }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerDetails,
  updateCustomer,
  getTopCustomers
};

