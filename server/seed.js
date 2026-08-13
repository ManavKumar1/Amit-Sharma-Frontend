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
    { name: 'Maya Ellison', email: OWNER_EMAIL, passwordHash },
    { upsert: true }
  );
  console.log(`Owner account ready: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log('Change this password after your first login (or before deploying).');

  // Profile
  await Profile.findOneAndUpdate(
    {},
    {
      name: 'Maya Ellison',
      title: 'Makeup Artist & Hairstylist',
      tagline: "Beauty and hair for weddings, editorial shoots, and nights you'll want to remember.",
      bio: 'Maya trained at the Cinema Makeup School in Los Angeles before spending six years on bridal and editorial teams across the Bay Area.',
      phone: '+14155550148',
      whatsapp: '14155550148',
      email: 'hello@mayaellison.com',
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

  // Services
  const services = [
    { name: 'Bridal Makeup', description: 'Full bridal beat with trial run included, false lashes, and touch-up kit.', price: 285, duration: 120, category: 'Bridal', sortOrder: 1 },
    { name: 'Party Makeup', description: 'Event-ready makeup for weddings, galas, and nights out.', price: 135, duration: 60, category: 'Makeup', sortOrder: 2 },
    { name: 'Engagement Makeup', description: 'Soft, camera-ready look for engagement and pre-wedding shoots.', price: 165, duration: 75, category: 'Makeup', sortOrder: 3 },
    { name: 'Hair Styling', description: 'Blowout, updo, or editorial styling — built to last through the event.', price: 110, duration: 60, category: 'Hair', sortOrder: 4 },
    { name: 'Precision Haircut', description: 'Consultation and cut tailored to face shape and hair texture.', price: 95, duration: 45, category: 'Haircut', sortOrder: 5 },
    { name: "Groom's Grooming", description: 'Skin prep, light contour, and hair styling for the groom or groomsmen.', price: 85, duration: 40, category: 'Grooming', sortOrder: 6 },
  ];
  if ((await Service.countDocuments()) === 0) {
    await Service.insertMany(services);
    console.log(`Seeded ${services.length} services.`);
  }

  // Portfolio (placeholder images — replace via dashboard once Cloudinary is wired up)
  const portfolio = [
    { imageUrl: 'https://picsum.photos/seed/port-bridal1/800/1000', title: 'Garden Ceremony Bridal', category: 'bridal', caption: 'Soft glam for an outdoor June wedding.', isFeatured: true },
    { imageUrl: 'https://picsum.photos/seed/port-makeup1/800/800', title: 'Editorial Skin', category: 'editorial', caption: 'Dewy base for a beauty editorial.' },
    { imageUrl: 'https://picsum.photos/seed/port-hair1/900/700', title: 'Undone Updo', category: 'hair', caption: 'Textured low bun with face-framing pieces.' },
    { imageUrl: 'https://picsum.photos/seed/port-haircut1/800/1000', title: 'Blunt Bob', category: 'haircut', caption: 'Precision cut with a soft interior layer.' },
    { imageUrl: 'https://picsum.photos/seed/port-makeup2/800/800', title: 'Bronze Evening', category: 'makeup', caption: 'Warm smoked eye for an evening gala.', isFeatured: true },
    { imageUrl: 'https://picsum.photos/seed/port-bridal2/900/700', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
  ];
  if ((await Portfolio.countDocuments()) === 0) {
    await Portfolio.insertMany(portfolio);
    console.log(`Seeded ${portfolio.length} portfolio items.`);
  }

  // Testimonials
  const testimonials = [
    { clientName: 'Priya S.', rating: 5, service: 'Bridal Makeup', imageUrl: 'https://picsum.photos/seed/client1/100/100', review: "Maya made my entire wedding morning feel calm. My makeup didn't move for fourteen hours." },
    { clientName: 'Elena R.', rating: 5, service: 'Editorial Shoot', imageUrl: 'https://picsum.photos/seed/client2/100/100', review: 'Booked her for a shoot and she read the mood board perfectly on the first try.' },
    { clientName: 'Jordan T.', rating: 5, service: 'Hair Styling', imageUrl: 'https://picsum.photos/seed/client3/100/100', review: 'Best blowout I have ever had. Still looked good three days later.' },
  ];
  if ((await Testimonial.countDocuments()) === 0) {
    await Testimonial.insertMany(testimonials);
    console.log(`Seeded ${testimonials.length} testimonials.`);
  }

  // Availability
  if ((await Availability.countDocuments()) === 0) {
    await Availability.insertMany(
      [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '10:00',
        endTime: '19:00',
        isAvailable: dayOfWeek !== 0,
      }))
    );
    console.log('Seeded weekly availability.');
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
