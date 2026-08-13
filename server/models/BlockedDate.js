const mongoose = require('mongoose');

const blockedDateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlockedDate', blockedDateSchema);
