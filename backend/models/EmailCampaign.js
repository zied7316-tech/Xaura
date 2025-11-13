const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String, // HTML content
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
      default: 'draft',
    },
    // Segmentation
    segmentation: {
      plan: {
        type: [String], // ['Free', 'Basic', 'Professional', 'Enterprise']
        default: [],
      },
      status: {
        type: [String], // ['active', 'suspended', 'trial']
        default: [],
      },
      joinedAfter: Date,
      joinedBefore: Date,
      hasWorkers: Boolean,
      minRevenue: Number,
      maxRevenue: Number,
    },
    // Scheduling
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    // Recipients
    totalRecipients: {
      type: Number,
      default: 0,
    },
    recipientList: [
      {
        salon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Salon',
        },
        email: String,
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        opened: {
          type: Boolean,
          default: false,
        },
        openedAt: Date,
        clicked: {
          type: Boolean,
          default: false,
        },
        clickedAt: Date,
        failed: {
          type: Boolean,
          default: false,
        },
        failureReason: String,
      },
    ],
    // Statistics
    stats: {
      sent: {
        type: Number,
        default: 0,
      },
      delivered: {
        type: Number,
        default: 0,
      },
      opened: {
        type: Number,
        default: 0,
      },
      clicked: {
        type: Number,
        default: 0,
      },
      failed: {
        type: Number,
        default: 0,
      },
      bounced: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailCampaignSchema.index({ createdBy: 1, createdAt: -1 });
emailCampaignSchema.index({ status: 1 });
emailCampaignSchema.index({ scheduledFor: 1 });

// Virtual for open rate
emailCampaignSchema.virtual('openRate').get(function () {
  if (this.stats.delivered === 0) return 0;
  return ((this.stats.opened / this.stats.delivered) * 100).toFixed(2);
});

// Virtual for click rate
emailCampaignSchema.virtual('clickRate').get(function () {
  if (this.stats.delivered === 0) return 0;
  return ((this.stats.clicked / this.stats.delivered) * 100).toFixed(2);
});

// Method to mark email as opened
emailCampaignSchema.methods.markAsOpened = async function (salonId) {
  const recipient = this.recipientList.find(
    (r) => r.salon.toString() === salonId.toString()
  );

  if (recipient && !recipient.opened) {
    recipient.opened = true;
    recipient.openedAt = new Date();
    this.stats.opened += 1;
    await this.save();
  }
};

// Method to mark email as clicked
emailCampaignSchema.methods.markAsClicked = async function (salonId) {
  const recipient = this.recipientList.find(
    (r) => r.salon.toString() === salonId.toString()
  );

  if (recipient) {
    if (!recipient.clicked) {
      recipient.clicked = true;
      recipient.clickedAt = new Date();
      this.stats.clicked += 1;
    }
    // Also mark as opened if not already
    if (!recipient.opened) {
      recipient.opened = true;
      recipient.openedAt = new Date();
      this.stats.opened += 1;
    }
    await this.save();
  }
};

// Set toJSON to include virtuals
emailCampaignSchema.set('toJSON', { virtuals: true });
emailCampaignSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);


