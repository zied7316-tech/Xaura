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
      .populate('userId', 'name email phone avatar birthday')
      .sort({ lastVisit: -1 });

    // Search by name or email
    if (search) {
      customers = customers.filter(c => 
        c.userId.name.toLowerCase().includes(search.toLowerCase()) ||
        c.userId.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Format customers with stats and birthday - calculate from actual data
    const formattedCustomers = await Promise.all(customers.map(async (customer) => {
      const customerObj = customer.toObject();
      
      // Get actual appointment count
      const appointmentCount = await Appointment.countDocuments({
        clientId: customer.userId._id,
        salonId: salon._id
      });
      
      // Get actual total spent from payments
      const payments = await Payment.find({
        clientId: customer.userId._id,
        salonId: salon._id,
        status: 'completed'
      });
      const actualTotalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
      
      // Get last visit from appointments
      const lastAppointment = await Appointment.findOne({
        clientId: customer.userId._id,
        salonId: salon._id
      }).sort({ dateTime: -1 });
      
      const lastVisit = lastAppointment?.dateTime || customerObj.lastVisit || null;
      
      return {
        ...customerObj,
        name: customerObj.userId.name,
        email: customerObj.userId.email,
        phone: customerObj.userId.phone,
        avatar: customerObj.userId.avatar,
        birthday: customerObj.userId.birthday || customerObj.birthday || null,
        stats: {
          totalVisits: appointmentCount || customerObj.totalVisits || 0,
          totalSpent: actualTotalSpent || customerObj.totalSpent || 0,
          averageSpent: appointmentCount > 0 ? (actualTotalSpent / appointmentCount) : (customerObj.averageSpending || 0),
          lastVisit: lastVisit
        }
      };
    }));

    // Calculate summary statistics
    const summary = {
      totalCustomers: formattedCustomers.length,
      vipCustomers: formattedCustomers.filter(c => c.status === 'VIP').length,
      activeCustomers: formattedCustomers.filter(c => {
        if (!c.stats.lastVisit) return false;
        const daysSinceVisit = (Date.now() - new Date(c.stats.lastVisit)) / (1000 * 60 * 60 * 24);
        return daysSinceVisit <= 90;
      }).length,
      totalRevenue: formattedCustomers.reduce((sum, c) => sum + (c.stats.totalSpent || 0), 0)
    };

    res.json({
      success: true,
      count: formattedCustomers.length,
      data: formattedCustomers,
      summary
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
      .populate('userId', 'name email phone avatar birthday')
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
      .populate('serviceId', 'name price')
      .populate('workerId', 'name')
      .sort({ dateTime: -1 });

    // Get payment history
    const payments = await Payment.find({
      clientId: customer.userId._id,
      salonId: customer.salonId,
      status: 'completed'
    }).sort({ paidAt: -1 });

    // Calculate total spent from payments
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get CustomerProfile if exists
    const CustomerProfile = require('../models/CustomerProfile');
    const profile = await CustomerProfile.findOne({
      userId: customer.userId._id,
      salonId: customer.salonId
    });

    res.json({
      success: true,
      data: {
        customer: {
          ...customer.toObject(),
          name: customer.userId.name,
          email: customer.userId.email,
          phone: customer.userId.phone,
          avatar: customer.userId.avatar,
          birthday: customer.userId.birthday || customer.birthday || null
        },
        profile: profile || null,
        appointments: appointments.map(apt => ({
          _id: apt._id,
          dateTime: apt.dateTime,
          status: apt.status,
          serviceId: apt.serviceId,
          workerId: apt.workerId,
          servicePriceAtBooking: apt.servicePriceAtBooking || apt.serviceId?.price || 0
        })),
        payments: payments.map(p => ({
          _id: p._id,
          amount: p.amount,
          paidAt: p.paidAt,
          paymentMethod: p.paymentMethod,
          status: p.status
        })),
        stats: {
          totalVisits: customer.totalVisits || appointments.filter(a => a.status === 'Completed' || a.status === 'completed').length,
          totalSpent: totalSpent || customer.totalSpent || 0,
          averageSpent: customer.averageSpending || (customer.totalVisits > 0 ? (totalSpent / customer.totalVisits) : 0),
          lastVisit: customer.lastVisit || (appointments.length > 0 ? appointments[0].dateTime : null)
        }
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

