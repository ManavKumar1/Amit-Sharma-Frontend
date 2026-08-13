const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6, unique: true }, // 0=Sunday
    startTime: { type: String, default: '10:00' }, // 24h 'HH:mm'
    endTime: { type: String, default: '19:00' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
