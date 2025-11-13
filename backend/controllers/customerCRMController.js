const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const CustomerProfile = require('../models/CustomerProfile');

/**
 * @desc    Get all customers for salon with analytics
 * @route   GET /api/customers
 * @access  Private (Owner)
 */
const getCustomers = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

    // Get all clients who have booked at this salon
    const appointments = await Appointment.find({ salonId })
      .distinct('clientId');

    // Get client details with statistics
    const customersData = await Promise.all(
      appointments.map(async (clientId) => {
        const client = await User.findById(clientId);
        if (!client) return null;

        // Get customer profile
        let profile = await CustomerProfile.findOne({ userId: clientId, salonId });

        // Calculate statistics
        const totalAppointments = await Appointment.countDocuments({
          salonId,
          clientId,
          status: 'Completed'
        });

        const payments = await Payment.find({
          salonId,
          clientId,
          status: 'completed'
        });

        const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
        const averageSpent = totalAppointments > 0 ? totalSpent / totalAppointments : 0;

        const lastAppointment = await Appointment.findOne({
          salonId,
          clientId,
          status: 'Completed'
        }).sort({ completedAt: -1 });

        const firstAppointment = await Appointment.findOne({
          salonId,
          clientId
        }).sort({ createdAt: 1 });

        // Update or create profile with stats
        if (profile) {
          profile.stats = {
            totalVisits: totalAppointments,
            totalSpent,
            averageSpent,
            lastVisit: lastAppointment?.completedAt || null,
            firstVisit: firstAppointment?.createdAt || null
          };
          await profile.save();
        } else {
          profile = await CustomerProfile.create({
            userId: clientId,
            salonId,
            stats: {
              totalVisits: totalAppointments,
              totalSpent,
              averageSpent,
              lastVisit: lastAppointment?.completedAt || null,
              firstVisit: firstAppointment?.createdAt || null
            }
          });
        }

        return {
          _id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          status: client.status,
          avatar: client.avatar,
          profile,
          stats: {
            totalVisits: totalAppointments,
            totalSpent,
            averageSpent,
            lastVisit: lastAppointment?.completedAt || null,
            firstVisit: firstAppointment?.createdAt || null
          }
        };
      })
    );

    // Filter out nulls and sort by total spent
    const customers = customersData
      .filter(c => c !== null)
      .sort((a, b) => b.stats.totalSpent - a.stats.totalSpent);

    // Calculate summary stats
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter(c => c.status === 'VIP').length;
    const activeCustomers = customers.filter(c => {
      const lastVisit = c.stats.lastVisit;
      if (!lastVisit) return false;
      const daysSinceVisit = (Date.now() - new Date(lastVisit)) / (1000 * 60 * 60 * 24);
      return daysSinceVisit <= 90; // Active = visited in last 90 days
    }).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.stats.totalSpent, 0);

    res.json({
      success: true,
      data: customers,
      summary: {
        totalCustomers,
        vipCustomers,
        activeCustomers,
        totalRevenue,
        averageCustomerValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer details with full history
 * @route   GET /api/customers/:id
 * @access  Private (Owner)
 */
const getCustomerDetails = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const customerId = req.params.id;

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

    // Get customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get profile
    const profile = await CustomerProfile.findOne({ userId: customerId, salonId })
      .populate('preferences.favoriteServices', 'name price')
      .populate('preferences.favoriteWorkers', 'name')
      .populate('notes.createdBy', 'name');

    // Get appointment history
    const appointments = await Appointment.find({ salonId, clientId: customerId })
      .populate('serviceId', 'name price')
      .populate('workerId', 'name')
      .sort({ dateTime: -1 });

    // Get payment history
    const payments = await Payment.find({ salonId, clientId: customerId })
      .sort({ paidAt: -1 });

    res.json({
      success: true,
      data: {
        customer,
        profile,
        appointments,
        payments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer profile
 * @route   PUT /api/customers/:id/profile
 * @access  Private (Owner)
 */
const updateCustomerProfile = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const customerId = req.params.id;

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

    // Find or create profile
    let profile = await CustomerProfile.findOne({ userId: customerId, salonId });
    
    if (!profile) {
      profile = await CustomerProfile.create({
        userId: customerId,
        salonId,
        ...req.body
      });
    } else {
      // Update fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && key !== 'stats') {
          profile[key] = req.body[key];
        }
      });
      await profile.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add note to customer profile
 * @route   POST /api/customers/:id/notes
 * @access  Private (Owner)
 */
const addCustomerNote = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const customerId = req.params.id;
    const { content, category, isImportant } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

    // Find or create profile
    let profile = await CustomerProfile.findOne({ userId: customerId, salonId });
    
    if (!profile) {
      profile = await CustomerProfile.create({
        userId: customerId,
        salonId
      });
    }

    // Add note
    profile.notes.push({
      content,
      category: category || 'General',
      isImportant: isImportant || false,
      createdBy: ownerId,
      createdAt: new Date()
    });

    await profile.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get birthday reminders (customers with birthdays in next 30 days)
 * @route   GET /api/customers/reminders/birthdays
 * @access  Private (Owner)
 */
const getBirthdayReminders = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

    // Get all profiles with birthdays
    const profiles = await CustomerProfile.find({
      salonId,
      birthday: { $ne: null }
    }).populate('userId', 'name email phone');

    // Filter for upcoming birthdays (next 30 days)
    const today = new Date();
    const upcomingBirthdays = profiles.filter(profile => {
      if (!profile.birthday) return false;
      
      const birthday = new Date(profile.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 30;
    }).map(profile => ({
      customer: profile.userId,
      birthday: profile.birthday,
      daysUntil: Math.ceil((new Date(today.getFullYear(), new Date(profile.birthday).getMonth(), new Date(profile.birthday).getDate()) - today) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({
      success: true,
      count: upcomingBirthdays.length,
      data: upcomingBirthdays
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerDetails,
  updateCustomerProfile,
  addCustomerNote,
  getBirthdayReminders
};




