/**
 * Run with: npm run seed:portfolio
 * Seeds/repairs ONLY the Portfolio collection — does not touch Users,
 * Profile, Services, Testimonials, or Availability.
 * Upserts by `title`, so re-running is always safe: existing items with
 * a matching title get updated in place, missing ones get created,
 * nothing gets duplicated.
 */
require('dotenv').config();
const connectDB = require('./config/db');
const Portfolio = require('./models/Portfolio');

const portfolio = [
  { imageUrl: 'https://picsum.photos/seed/port-bridal1/800/1000', title: 'Garden Ceremony Bridal', category: 'bridal', caption: 'Soft glam for an outdoor June wedding.', isFeatured: true },
  { imageUrl: 'https://picsum.photos/seed/port-makeup1/800/800', title: 'Editorial Skin', category: 'editorial', caption: 'Dewy base for a beauty editorial.' },
  { imageUrl: 'https://picsum.photos/seed/port-hair1/900/700', title: 'Undone Updo', category: 'hair', caption: 'Textured low bun with face-framing pieces.' },
  { imageUrl: 'https://picsum.photos/seed/port-haircut1/800/1000', title: 'Blunt Bob', category: 'haircut', caption: 'Precision cut with a soft interior layer.' },
  { imageUrl: 'https://picsum.photos/seed/port-makeup2/800/800', title: 'Bronze Evening', category: 'makeup', caption: 'Warm smoked eye for an evening gala.', isFeatured: true },
  { imageUrl: 'https://picsum.photos/seed/port-bridal2/900/700', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.' },
];

async function seedPortfolio() {
  await connectDB();

  for (const item of portfolio) {
    await Portfolio.findOneAndUpdate({ title: item.title }, item, { upsert: true, setDefaultsOnInsert: true });
  }

  console.log(`Portfolio seeded/verified: ${portfolio.length} items. Nothing else was touched.`);
  process.exit(0);
}

seedPortfolio().catch((err) => {
  console.error('Portfolio seed failed:', err);
  process.exit(1);
});