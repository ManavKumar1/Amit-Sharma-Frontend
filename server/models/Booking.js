const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry', default: null },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceNameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true },
    bookingDate: { type: String, required: true }, // 'YYYY-MM-DD'
    startTime: { type: String, required: true }, // '10:00 AM'
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    customerNotes: { type: String, default: '' },
    internalNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

// A given date+time can only be held by one LIVE booking (pending or confirmed).
// Cancelled/completed/no-show bookings don't block the slot, so they're excluded
// from the partial filter — this is the backend's real double-booking guard,
// independent of anything the frontend does.
bookingSchema.index(
  { bookingDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } },
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
