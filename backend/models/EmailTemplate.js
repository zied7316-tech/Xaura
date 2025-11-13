const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      enum: [
        'announcement',
        'newsletter',
        'promotion',
        'update',
        'tips',
        'welcome',
        'other',
      ],
      default: 'other',
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String, // HTML content
      required: true,
    },
    variables: [
      {
        name: String, // e.g., 'salonName', 'ownerName'
        description: String,
        example: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emailTemplateSchema.index({ category: 1, isActive: 1 });
emailTemplateSchema.index({ createdAt: -1 });

// Method to replace variables in template
emailTemplateSchema.methods.renderContent = function (data = {}) {
  let rendered = this.content;
  
  this.variables.forEach((variable) => {
    const placeholder = `{{${variable.name}}}`;
    const value = data[variable.name] || variable.example || '';
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
  });

  return rendered;
};

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);


