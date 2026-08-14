const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true }, // local static path, e.g. /assets/uploads/xyz.jpg
    title: { type: String, default: '' },
    caption: { type: String, default: '' },
    category: {
      type: String,
      enum: ['makeup', 'hair', 'haircut', 'bridal', 'editorial'],
      required: true,
    },
    size: { type: String, enum: ['', 'tall', 'wide'], default: '' }, // grid layout hint
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);