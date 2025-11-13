const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['Client', 'Worker'],
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
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
chatMessageSchema.index({ chat: 1, createdAt: 1 });
chatMessageSchema.index({ sender: 1 });

// Update chat's lastMessage when message is created
chatMessageSchema.post('save', async function () {
  try {
    const Chat = mongoose.model('Chat');
    
    // Update lastMessage and increment unread count for receiver
    const updateData = {
      lastMessage: this.message.substring(0, 100),
      lastMessageAt: new Date(),
    };

    // Increment unread count for the receiver
    if (this.senderRole === 'Client') {
      updateData.$inc = { 'unreadCount.worker': 1 };
    } else {
      updateData.$inc = { 'unreadCount.client': 1 };
    }

    await Chat.findByIdAndUpdate(this.chat, updateData);
  } catch (error) {
    console.error('Error updating chat lastMessage:', error);
  }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);


