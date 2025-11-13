const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // User actions
        'user_banned',
        'user_unbanned',
        'user_deleted',
        'user_updated',
        'user_viewed',
        
        // Salon actions
        'salon_suspended',
        'salon_activated',
        'salon_deleted',
        'salon_updated',
        'salon_viewed',
        
        // Subscription actions
        'subscription_created',
        'subscription_updated',
        'subscription_cancelled',
        'subscription_charged',
        
        // Report actions
        'report_generated',
        'report_downloaded',
        
        // Campaign actions
        'campaign_created',
        'campaign_sent',
        'campaign_scheduled',
        
        // Ticket actions
        'ticket_assigned',
        'ticket_resolved',
        'ticket_closed',
        
        // System actions
        'login',
        'logout',
        'settings_updated',
        'bulk_action',
      ],
    },
    targetType: {
      type: String,
      enum: ['User', 'Salon', 'Subscription', 'Report', 'Campaign', 'Ticket', 'System'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    targetName: {
      type: String, // Store the name for quick display
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Flexible object for any extra data
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'warning'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index to auto-delete logs older than 90 days (optional)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Virtual for formatted action
activityLogSchema.virtual('actionFormatted').get(function () {
  return this.action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});

// Method to get readable description
activityLogSchema.methods.getDescription = function () {
  const actions = {
    user_banned: `banned user ${this.targetName || this.targetId}`,
    user_unbanned: `unbanned user ${this.targetName || this.targetId}`,
    user_deleted: `deleted user ${this.targetName || this.targetId}`,
    salon_suspended: `suspended salon ${this.targetName || this.targetId}`,
    salon_activated: `activated salon ${this.targetName || this.targetId}`,
    subscription_updated: `updated subscription for ${this.targetName || this.targetId}`,
    campaign_sent: `sent email campaign "${this.targetName || 'Untitled'}"`,
    report_generated: `generated ${this.targetName || 'report'}`,
    login: 'logged in to Super Admin',
    bulk_action: this.details?.description || 'performed bulk action',
  };

  return actions[this.action] || this.action.replace(/_/g, ' ');
};

// Set toJSON to include virtuals
activityLogSchema.set('toJSON', { virtuals: true });
activityLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);


