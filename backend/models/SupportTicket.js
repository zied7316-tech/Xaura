const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['bug', 'feature', 'billing', 'technical', 'general', 'other'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    lastResponseAt: {
      type: Date,
    },
    responseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
supportTicketSchema.index({ salon: 1, status: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
supportTicketSchema.index({ ticketNumber: 1 });

// Auto-generate ticket number
supportTicketSchema.pre('save', async function (next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for response time (in hours)
supportTicketSchema.virtual('responseTime').get(function () {
  if (!this.lastResponseAt) return null;
  const diff = this.lastResponseAt - this.createdAt;
  return Math.round(diff / (1000 * 60 * 60)); // Convert to hours
});

// Virtual for resolution time
supportTicketSchema.virtual('resolutionTime').get(function () {
  if (!this.resolvedAt) return null;
  const diff = this.resolvedAt - this.createdAt;
  return Math.round(diff / (1000 * 60 * 60)); // Convert to hours
});

// Method to mark as resolved
supportTicketSchema.methods.resolve = async function () {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  await this.save();
};

// Method to close ticket
supportTicketSchema.methods.close = async function () {
  this.status = 'closed';
  this.closedAt = new Date();
  await this.save();
};

// Set toJSON to include virtuals
supportTicketSchema.set('toJSON', { virtuals: true });
supportTicketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);


