const ReminderSettings = require('../models/ReminderSettings');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const SMSService = require('../services/smsService');
const EmailService = require('../services/emailService');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * @desc    Get reminder settings for salon
 * @route   GET /api/reminders/settings
 * @access  Private (Owner)
 */
const getReminderSettings = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    let settings = await ReminderSettings.findOne({ salonId: salonData.salonId });

    if (!settings) {
      // Create default settings
      settings = await ReminderSettings.create({
        salonId: salonData.salonId
      });
    }

    // Don't expose sensitive credentials
    if (settings.sms) {
      settings.sms.authToken = settings.sms.authToken ? '********' : '';
    }
    if (settings.email) {
      settings.email.smtpPassword = settings.email.smtpPassword ? '********' : '';
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update reminder settings
 * @route   PUT /api/reminders/settings
 * @access  Private (Owner)
 */
const updateReminderSettings = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    let settings = await ReminderSettings.findOne({ salonId: salonData.salonId });

    if (!settings) {
      settings = await ReminderSettings.create({
        salonId: salonData.salonId,
        ...req.body
      });
    } else {
      // Update fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        }
      });
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Reminder settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send manual reminder for appointment
 * @route   POST /api/reminders/send/:appointmentId
 * @access  Private (Owner, Worker)
 */
const sendManualReminder = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { method } = req.body; // 'sms', 'email', or 'both'

    const appointment = await Appointment.findById(appointmentId)
      .populate('clientId', 'name email phone')
      .populate('serviceId', 'name')
      .populate('workerId', 'name')
      .populate('salonId', 'name address phone ownerId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const settings = await ReminderSettings.findOne({ salonId: appointment.salonId._id });

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Reminder settings not configured'
      });
    }

    const results = {
      sms: null,
      email: null
    };

    // Send SMS
    if ((method === 'sms' || method === 'both') && settings.sms.enabled) {
      const smsService = new SMSService(
        settings.sms.accountSid,
        settings.sms.authToken,
        settings.sms.phoneNumber
      );
      results.sms = await smsService.sendAppointmentReminder(appointment, settings);
    }

    // Send Email
    if ((method === 'email' || method === 'both') && settings.email.enabled) {
      const emailService = new EmailService({
        smtpHost: settings.email.smtpHost,
        smtpPort: settings.email.smtpPort,
        smtpUser: settings.email.smtpUser,
        smtpPassword: settings.email.smtpPassword,
        fromEmail: settings.email.fromEmail,
        fromName: settings.email.fromName
      });
      results.email = await emailService.sendAppointmentReminder(appointment, settings);
    }

    res.json({
      success: true,
      message: 'Reminder sent successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get upcoming appointments that need reminders
 * @route   GET /api/reminders/pending
 * @access  Private (Owner)
 */
const getPendingReminders = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = salonData.salonId;

    // Get appointments in next 24-48 hours that are confirmed
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const appointments = await Appointment.find({
      salonId,
      status: 'Confirmed',
      dateTime: { $gte: tomorrow, $lte: dayAfterTomorrow }
    })
      .populate('clientId', 'name email phone')
      .populate('serviceId', 'name')
      .populate('workerId', 'name')
      .sort({ dateTime: 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Test SMS/Email configuration
 * @route   POST /api/reminders/test
 * @access  Private (Owner)
 */
const testReminderConfig = async (req, res, next) => {
  try {
    const { method, testPhone, testEmail } = req.body;
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const settings = await ReminderSettings.findOne({ salonId: salonData.salonId });

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Reminder settings not found'
      });
    }

    const results = {};

    // Test SMS
    if (method === 'sms' && testPhone) {
      const smsService = new SMSService(
        settings.sms.accountSid,
        settings.sms.authToken,
        settings.sms.phoneNumber
      );
      results.sms = await smsService.sendSMS(
        testPhone,
        `Test message from ${salonData.salon.name}. Your SMS reminders are configured correctly!`
      );
    }

    // Test Email
    if (method === 'email' && testEmail) {
      const emailService = new EmailService({
        smtpHost: settings.email.smtpHost,
        smtpPort: settings.email.smtpPort,
        smtpUser: settings.email.smtpUser,
        smtpPassword: settings.email.smtpPassword,
        fromEmail: settings.email.fromEmail,
        fromName: settings.email.fromName
      });
      results.email = await emailService.sendEmail(
        testEmail,
        `Test Email from ${salonData.salon.name}`,
        `This is a test email to verify your email configuration is working correctly.\n\nIf you received this, your reminders are set up properly!`
      );
    }

    res.json({
      success: true,
      message: 'Test sent successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReminderSettings,
  updateReminderSettings,
  sendManualReminder,
  getPendingReminders,
  testReminderConfig
};




