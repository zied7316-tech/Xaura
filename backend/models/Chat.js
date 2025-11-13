const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCount: {
      client: {
        type: Number,
        default: 0,
      },
      worker: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
chatSchema.index({ client: 1, worker: 1 });
chatSchema.index({ appointment: 1 });
chatSchema.index({ salon: 1 });
chatSchema.index({ lastMessageAt: -1 });

// Prevent duplicate chats for same client-worker pair
chatSchema.index({ client: 1, worker: 1, appointment: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Chat', chatSchema);


