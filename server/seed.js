/**
 * Run with: npm run seed
 * Creates the one owner account (from .env, or sensible defaults below)
 * plus starter Profile / Services / Portfolio / Testimonials / Availability
 * so the dashboard and public site aren't empty on first run.
 * Safe to re-run — it upserts rather than duplicating.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const User = require('./models/User');
const Profile = require('./models/Profile');
const Service = require('./models/Service');
const Portfolio = require('./models/Portfolio');
const Testimonial = require('./models/Testimonial');
const Availability = require('./models/Availability');

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || 'owner@example.com';
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || 'changeme123';

async function seed() {
  await connectDB();

  // Owner account
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 10);
  await User.findOneAndUpdate(
    { email: OWNER_EMAIL },
    { name: 'Amit Sharma', email: OWNER_EMAIL, passwordHash },
    { upsert: true }
  );
  console.log(`Owner account ready: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log('Change this password after your first login (or before deploying).');

  // Profile
  await Profile.findOneAndUpdate(
    {},
    {
      name: 'Amit Sharma',
      title: 'Makeup Artist & Hairstylist',
      tagline: "Beauty and hair for weddings, editorial shoots, and nights you'll want to remember.",
      bio: 'Amit began assisting bridal makeup artists in Mumbai before training at the Cinema Makeup School in Los Angeles, and now spends six years (and counting) blending Indian bridal tradition — bold eyes, rich color, jewellery-ready skin — with modern editorial polish across bridal and editorial teams in the Bay Area.',
      profileImage: 'https://picsum.photos/seed/amit-portrait/700/900',
      heroImages: [
        'https://picsum.photos/seed/amit-work-1/500/650',
        'https://picsum.photos/seed/amit-work-2/460/600',
        'https://picsum.photos/seed/amit-work-3/560/720',
        'https://picsum.photos/seed/amit-work-4/460/600',
        'https://picsum.photos/seed/amit-work-5/480/620',
      ],
      showPrices: true,
      accentColor: 'violet',
      phone: '+14155550148',
      whatsapp: '14155550148',
      email: 'hello@amitsharmamakeup.com',
      address: '548 Sutter Street, Suite 3',
      city: 'San Francisco, CA 94102',
      mapsUrl: 'https://maps.google.com/?q=548+Sutter+Street+San+Francisco',
      instagramUrl: 'https://instagram.com',
      facebookUrl: 'https://facebook.com',
      businessHours: [
        { day: 'Monday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Tuesday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Wednesday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Thursday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Friday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Saturday', open: '10:00 AM', close: '7:00 PM', closed: false },
        { day: 'Sunday', open: '', close: '', closed: true },
      ],
    },
    { upsert: true }
  );

  // Services — upsert by name so re-running seed repairs anything missing
  // without duplicating what's already there.
  const services = [
    { name: 'Bridal Makeup', description: 'Full bridal beat with trial run included, false lashes, and touch-up kit.', price: 18500, currency: 'INR', duration: 120, category: 'Bridal', sortOrder: 1 },
    { name: 'Sangeet & Mehndi Glam', description: 'Bold, festive makeup and hair for sangeet, mehndi, and pre-wedding celebrations.', price: 9500, currency: 'INR', duration: 90, category: 'Bridal', sortOrder: 2 },
    { name: 'Party Makeup', description: 'Event-ready makeup for weddings, galas, and nights out.', price: 6500, currency: 'INR', duration: 60, category: 'Makeup', sortOrder: 3 },
    { name: 'Engagement Makeup', description: 'Soft, camera-ready look for engagement and pre-wedding shoots.', price: 8500, currency: 'INR', duration: 75, category: 'Makeup', sortOrder: 4 },
    { name: 'Hair Styling', description: 'Blowout, updo, or editorial styling — built to last through the event.', price: 4500, currency: 'INR', duration: 60, category: 'Hair', sortOrder: 5 },
    { name: 'Precision Haircut', description: 'Consultation and cut tailored to face shape and hair texture.', price: 2500, currency: 'INR', duration: 45, category: 'Haircut', sortOrder: 6 },
    { name: "Groom's Grooming", description: 'Skin prep, light contour, and hair styling for the groom or groomsmen.', price: 3500, currency: 'INR', duration: 40, category: 'Grooming', sortOrder: 7 },
  ];
  for (const item of services) {
    await Service.findOneAndUpdate({ name: item.name }, item, { upsert: true, setDefaultsOnInsert: true });
  }
  console.log(`Services seeded/verified: ${services.length}.`);

  // Portfolio (placeholder images — replace via the dashboard's image upload)
  const portfolio = [
    { imageUrl: 'https://picsum.photos/seed/port-bridal1/800/1000', title: 'Garden Ceremony Bridal', category: 'bridal', caption: 'Soft glam for an outdoor June wedding.', isFeatured: true },
    { imageUrl: 'https://picsum.photos/seed/port-makeup1/800/800', title: 'Editorial Skin', category: 'editorial', caption: 'Dewy base for a beauty editorial.' },
    { imageUrl: 'https://picsum.photos/seed/port-hair1/900/700', title: 'Undone Updo', category: 'hair', caption: 'Textured low bun with face-framing pieces.' },
    { imageUrl: 'https://picsum.photos/seed/port-haircut1/800/1000', title: 'Blunt Bob', category: 'haircut', caption: 'Precision cut with a soft interior layer.' },
    { imageUrl: 'https://picsum.photos/seed/port-makeup2/800/800', title: 'Bronze Evening', category: 'makeup', caption: 'Warm smoked eye for an evening gala.', isFeatured: true },
    { imageUrl: 'https://picsum.photos/seed/port-bridal2/900/700', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
    { imageUrl: 'https://picsum.photos/seed/port-sangeet1/800/1000', title: 'Sangeet Glam', category: 'bridal', caption: 'Festive gold and copper eye for a sangeet night.', isFeatured: true },
  ];
  for (const item of portfolio) {
    await Portfolio.findOneAndUpdate({ title: item.title }, item, { upsert: true, setDefaultsOnInsert: true });
  }
  console.log(`Portfolio seeded/verified: ${portfolio.length}.`);

  // Testimonials — upsert by clientName + service so re-running is safe.
  const testimonials = [
    { clientName: 'Priya S.', rating: 5, service: 'Bridal Makeup', imageUrl: 'https://picsum.photos/seed/client1/100/100', review: "Amit made my entire wedding morning feel calm. My makeup didn't move through the ceremony or reception, fourteen hours straight." },
    { clientName: 'Elena R.', rating: 5, service: 'Editorial Shoot', imageUrl: 'https://picsum.photos/seed/client2/100/100', review: 'Booked her for a shoot and she read the mood board perfectly on the first try.' },
    { clientName: 'Jordan T.', rating: 5, service: 'Hair Styling', imageUrl: 'https://picsum.photos/seed/client3/100/100', review: 'Best blowout I have ever had. Still looked good three days later.' },
  ];
  for (const item of testimonials) {
    await Testimonial.findOneAndUpdate(
      { clientName: item.clientName, service: item.service },
      item,
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Testimonials seeded/verified: ${testimonials.length}.`);

  // Availability — upsert by dayOfWeek (same pattern the dashboard's Save Hours uses).
  const availabilityDefaults = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    startTime: '10:00',
    endTime: '19:00',
    isAvailable: dayOfWeek !== 0,
  }));
  for (const day of availabilityDefaults) {
    await Availability.findOneAndUpdate({ dayOfWeek: day.dayOfWeek }, day, { upsert: true, setDefaultsOnInsert: true });
  }
  console.log('Weekly availability seeded/verified.');

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});