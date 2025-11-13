const mongoose = require('mongoose');

const reminderSettingsSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    unique: true
  },
  // SMS Settings
  sms: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['twilio', 'other'],
      default: 'twilio'
    },
    accountSid: String,
    authToken: String,
    phoneNumber: String, // Twilio phone number
    reminderHours: {
      type: Number,
      default: 24 // Send 24 hours before
    },
    template: {
      type: String,
      default: 'Hi {clientName}! Reminder: You have an appointment for {service} tomorrow at {time} with {worker} at {salon}. See you soon!'
    }
  },
  // Email Settings
  email: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['gmail', 'sendgrid', 'mailgun', 'other'],
      default: 'gmail'
    },
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String,
    fromName: String,
    reminderHours: {
      type: Number,
      default: 24
    },
    template: {
      subject: {
        type: String,
        default: 'Appointment Reminder - {salon}'
      },
      body: {
        type: String,
        default: 'Hi {clientName},\n\nThis is a friendly reminder about your appointment:\n\nService: {service}\nDate: {date}\nTime: {time}\nWorker: {worker}\nLocation: {salon}\n\nLooking forward to seeing you!\n\nBest regards,\n{salon}'
      }
    }
  },
  // General Settings
  sendConfirmation: {
    type: Boolean,
    default: true // Send confirmation when appointment is accepted
  },
  sendThankYou: {
    type: Boolean,
    default: true // Send thank you after service completed
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReminderSettings', reminderSettingsSchema);




