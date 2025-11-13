const mongoose = require('mongoose');

const workerStatusLogSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  // Status change
  previousStatus: {
    type: String,
    enum: ['available', 'on_break', 'offline'],
    required: true
  },
  newStatus: {
    type: String,
    enum: ['available', 'on_break', 'offline'],
    required: true
  },
  // Timestamp
  changedAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  // Duration in previous status (minutes)
  durationInPreviousStatus: {
    type: Number,
    default: 0
  },
  // Date (for daily queries)
  date: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for faster queries
workerStatusLogSchema.index({ workerId: 1, date: 1 });
workerStatusLogSchema.index({ salonId: 1, date: 1 });
workerStatusLogSchema.index({ workerId: 1, changedAt: 1 });

module.exports = mongoose.model('WorkerStatusLog', workerStatusLogSchema);

