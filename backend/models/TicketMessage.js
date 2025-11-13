const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String,
        fileSize: Number,
      },
    ],
    isInternal: {
      type: Boolean,
      default: false, // Internal notes only visible to admins
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ticketMessageSchema.index({ ticket: 1, createdAt: 1 });
ticketMessageSchema.index({ sender: 1 });

// Update ticket's lastResponseAt when message is created
ticketMessageSchema.post('save', async function () {
  try {
    const SupportTicket = mongoose.model('SupportTicket');
    await SupportTicket.findByIdAndUpdate(this.ticket, {
      lastResponseAt: new Date(),
      $inc: { responseCount: 1 },
    });
  } catch (error) {
    console.error('Error updating ticket lastResponseAt:', error);
  }
});

module.exports = mongoose.model('TicketMessage', ticketMessageSchema);


