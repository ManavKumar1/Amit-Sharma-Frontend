const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceNameSnapshot: { type: String, required: true },
    preferredDate: { type: String, required: true }, // 'YYYY-MM-DD'
    preferredTime: { type: String, required: true }, // '10:00 AM'
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'rejected', 'archived'],
      default: 'new',
    },
  },
  { timestamps: true }
);

inquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
