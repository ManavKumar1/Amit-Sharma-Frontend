const mongoose = require('mongoose');

const businessHourSchema = new mongoose.Schema(
  {
    day: { type: String, required: true }, // 'Monday' ... 'Sunday'
    open: { type: String, default: '' }, // '10:00 AM'
    close: { type: String, default: '' },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: 'Makeup Artist & Hairstylist' },
    tagline: { type: String, default: '' },
    bio: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    heroImages: { type: [String], default: [] },
    showPrices: { type: Boolean, default: true },
    accentColor: { type: String, enum: ['violet', 'orange'], default: 'violet' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    mapsUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
    businessHours: { type: [businessHourSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
