const path = require('path');
const fsp = require('fs/promises');
const { UPLOAD_DIR } = require('../middleware/upload');

const Profile = require('../models/Profile');
const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');
const Testimonial = require('../models/Testimonial');
const Availability = require('../models/Availability');
const BlockedDate = require('../models/BlockedDate');

// Must be sent exactly as-is in the request body to confirm this is
// intentional — auth alone doesn't protect against a mistaken/stray call.
const CONFIRM_PHRASE = 'RESET_CONTENT';

/**
 * Wipes everything seed.js is responsible for (Profile, Service, Portfolio,
 * Testimonial, Availability, BlockedDate) so it can be re-run with real
 * content. Deliberately does NOT touch User (your login), Booking, or
 * Inquiry — those are never demo data, even early on.
 */
async function resetContent(req, res) {
  if (req.body.confirm !== CONFIRM_PHRASE) {
    return res.status(400).json({
      error: `This is irreversible. To confirm, POST with a JSON body of { "confirm": "${CONFIRM_PHRASE}" }.`,
    });
  }

  // Clean up locally-uploaded portfolio image files before removing the
  // records that point to them, so nothing orphaned is left on disk.
  const portfolioItems = await Portfolio.find().select('imageUrl');
  const uploadedItems = portfolioItems.filter(
    (item) => item.imageUrl && item.imageUrl.startsWith('/assets/uploads/')
  );
  const unlinkResults = await Promise.allSettled(
    uploadedItems.map((item) => fsp.unlink(path.join(UPLOAD_DIR, path.basename(item.imageUrl))))
  );
  const filesDeleted = unlinkResults.filter((r) => r.status === 'fulfilled').length;

  const [profile, services, portfolio, testimonials, availability, blockedDates] = await Promise.all([
    Profile.deleteMany({}),
    Service.deleteMany({}),
    Portfolio.deleteMany({}),
    Testimonial.deleteMany({}),
    Availability.deleteMany({}),
    BlockedDate.deleteMany({}),
  ]);

  res.json({
    ok: true,
    deleted: {
      profile: profile.deletedCount,
      services: services.deletedCount,
      portfolio: portfolio.deletedCount,
      testimonials: testimonials.deletedCount,
      availability: availability.deletedCount,
      blockedDates: blockedDates.deletedCount,
      localImageFiles: filesDeleted,
    },
    untouched: ['User (your login)', 'Booking (real appointments)', 'Inquiry (real customer requests)'],
    note: 'Edit server/seed.js with your real content, then run npm run seed to repopulate.',
  });
}

module.exports = { resetContent, CONFIRM_PHRASE };