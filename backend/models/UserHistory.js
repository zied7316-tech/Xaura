const mongoose = require('mongoose');

const userHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userRole: {
      type: String,
      enum: ['Owner', 'Worker', 'Client'],
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Owner actions
        'plan_changed',
        'plan_upgraded',
        'plan_downgraded',
        'trial_started',
        'trial_ended',
        'subscription_activated',
        'subscription_cancelled',
        'worker_added',
        'worker_removed',
        'worker_updated',
        'salon_created',
        'salon_updated',
        'service_added',
        'service_removed',
        'appointment_created',
        'appointment_cancelled',
        'payment_received',
        'sms_credits_purchased',
        'addon_purchased',
        
        // Worker actions
        'joined_salon',
        'left_salon',
        'appointment_completed',
        'appointment_cancelled_by_worker',
        'commission_earned',
        'profile_updated',
        'availability_updated',
        
        // Client actions
        'account_created',
        'first_appointment',
        'appointment_booked',
        'appointment_cancelled_by_client',
        'appointment_completed',
        'salon_changed',
        'barber_changed',
        'payment_made',
        'review_submitted',
        'profile_updated'
      ]
    },
    description: {
      type: String,
      required: true
    },
    relatedEntity: {
      type: {
        type: String,
        enum: ['Salon', 'Worker', 'Appointment', 'Payment', 'Subscription', 'Service', 'Review']
      },
      id: {
        type: mongoose.Schema.Types.ObjectId
      },
      name: {
        type: String
      }
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed // Flexible object for additional data
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast queries
userHistorySchema.index({ userId: 1, createdAt: -1 });
userHistorySchema.index({ userRole: 1, createdAt: -1 });
userHistorySchema.index({ action: 1, createdAt: -1 });
userHistorySchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
userHistorySchema.index({ createdAt: -1 });

// Virtual for formatted action
userHistorySchema.virtual('actionFormatted').get(function () {
  return this.action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});

// Set toJSON to include virtuals
userHistorySchema.set('toJSON', { virtuals: true });
userHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserHistory', userHistorySchema);

