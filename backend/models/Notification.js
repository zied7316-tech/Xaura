const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_appointment',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_reminder',
      'payment_received',
      'low_stock',
      'new_client',
      'worker_status',
      'birthday_reminder',
      'review_received',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // Related entities
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  // Data payload (for additional context)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Action URL (optional)
  actionUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ salonId: 1, createdAt: -1 });
// Compound indexes for duplicate prevention:
// 1. For workers/owners: check existing unread notifications (with isRead filter)
notificationSchema.index({ userId: 1, relatedAppointment: 1, type: 1, isRead: 1 });
// 2. For clients: check ANY notification (read or unread) - only one ever
notificationSchema.index({ userId: 1, relatedAppointment: 1, type: 1 });

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
