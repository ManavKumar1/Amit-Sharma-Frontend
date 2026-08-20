const Profile = require('../models/Profile');

const DEFAULT_HOURS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
  (day) => ({ day, open: '10:00 AM', close: '7:00 PM', closed: day === 'Sunday' })
);

// There is only ever one Profile document. Create it on first read if missing.
async function getOrCreateProfile() {
  let profile = await Profile.findOne();
  if (!profile) {
    profile = await Profile.create({
      name: 'Your Name',
      title: 'Makeup Artist & Hairstylist',
      businessHours: DEFAULT_HOURS,
    });
  }
  return profile;
}

async function getProfile(req, res) {
  const profile = await getOrCreateProfile();
  res.json(profile);
}

async function updateProfile(req, res) {
  const profile = await getOrCreateProfile();
  const editableFields = [
    'name', 'title', 'tagline', 'bio', 'profileImage', 'heroImages',
    'phone', 'whatsapp', 'email', 'address', 'city',
    'mapsUrl', 'instagramUrl', 'facebookUrl', 'businessHours',
    'showPrices', 'accentColor', 'lightSurface',
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });
  await profile.save();
  res.json(profile);
}

module.exports = { getProfile, updateProfile };