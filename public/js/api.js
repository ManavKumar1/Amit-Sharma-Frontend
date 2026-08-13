/**
 * api.js — single point of contact with the backend.
 *
 * STAGE 1: every function below resolves mock data locally so the
 * frontend can be built and reviewed with zero backend running.
 *
 * STAGE 5: swap each function body for a real fetch() call to the
 * Express API (e.g. `return (await fetch('/api/services')).json();`).
 * Nothing in main.js / booking.js / admin.js needs to change, since
 * they only ever call these named functions and await a plain object.
 *
 * Every function returns a Promise so the swap is a no-op for callers.
 */

const MOCK_LATENCY = 250; // ms, simulates network so loading states are visible

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY));
}

/* ---------------------------------------------------------
   MOCK DATA
   (this block disappears once the Express API is connected)
--------------------------------------------------------- */

const MOCK_PROFILE = {
  name: 'Maya Ellison',
  title: 'Makeup Artist & Hairstylist',
  tagline: "Beauty and hair for weddings, editorial shoots, and nights you'll want to remember.",
  bio: "Maya trained at the Cinema Makeup School in Los Angeles before spending six years on bridal and editorial teams across the Bay Area.",
  phone: '+14155550148',
  phoneDisplay: '(415) 555-0148',
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
};

const MOCK_SERVICES = [
  { id: 'svc_bridal', name: 'Bridal Makeup', description: 'Full bridal beat with trial run included, false lashes, and touch-up kit.', price: 285, currency: 'USD', duration: 120, category: 'Bridal', isActive: true, sortOrder: 1 },
  { id: 'svc_party', name: 'Party Makeup', description: 'Event-ready makeup for weddings, galas, and nights out.', price: 135, currency: 'USD', duration: 60, category: 'Makeup', isActive: true, sortOrder: 2 },
  { id: 'svc_engagement', name: 'Engagement Makeup', description: 'Soft, camera-ready look for engagement and pre-wedding shoots.', price: 165, currency: 'USD', duration: 75, category: 'Makeup', isActive: true, sortOrder: 3 },
  { id: 'svc_hairstyle', name: 'Hair Styling', description: 'Blowout, updo, or editorial styling — built to last through the event.', price: 110, currency: 'USD', duration: 60, category: 'Hair', isActive: true, sortOrder: 4 },
  { id: 'svc_haircut', name: 'Precision Haircut', description: 'Consultation and cut tailored to face shape and hair texture.', price: 95, currency: 'USD', duration: 45, category: 'Haircut', isActive: true, sortOrder: 5 },
  { id: 'svc_grooming', name: "Groom's Grooming", description: 'Skin prep, light contour, and hair styling for the groom or groomsmen.', price: 85, currency: 'USD', duration: 40, category: 'Grooming', isActive: true, sortOrder: 6 },
];

const MOCK_PORTFOLIO = [
  { id: 'p1', imageUrl: 'https://picsum.photos/seed/port-bridal1/800/1000', title: 'Garden Ceremony Bridal', category: 'bridal', caption: 'Soft glam for an outdoor June wedding.', isFeatured: true, size: 'tall' },
  { id: 'p2', imageUrl: 'https://picsum.photos/seed/port-makeup1/800/800', title: 'Editorial Skin', category: 'editorial', caption: 'Dewy base for a beauty editorial.', isFeatured: false, size: '' },
  { id: 'p3', imageUrl: 'https://picsum.photos/seed/port-hair1/900/700', title: 'Undone Updo', category: 'hair', caption: 'Textured low bun with face-framing pieces.', isFeatured: false, size: 'wide' },
  { id: 'p4', imageUrl: 'https://picsum.photos/seed/port-haircut1/800/1000', title: 'Blunt Bob', category: 'haircut', caption: 'Precision cut with a soft interior layer.', isFeatured: false, size: 'tall' },
  { id: 'p5', imageUrl: 'https://picsum.photos/seed/port-makeup2/800/800', title: 'Bronze Evening', category: 'makeup', caption: 'Warm smoked eye for an evening gala.', isFeatured: true, size: '' },
  { id: 'p6', imageUrl: 'https://picsum.photos/seed/port-bridal2/900/700', title: 'Vineyard Bride', category: 'bridal', caption: 'Natural bridal look, matte skin, soft brow.', isFeatured: false, size: 'wide' },
  { id: 'p7', imageUrl: 'https://picsum.photos/seed/port-editorial1/800/1000', title: 'Studio Editorial', category: 'editorial', caption: 'Graphic liner for a fashion shoot.', isFeatured: false, size: 'tall' },
  { id: 'p8', imageUrl: 'https://picsum.photos/seed/port-hair2/800/800', title: 'Glass Hair', category: 'hair', caption: 'Sleek straight styling with high shine.', isFeatured: false, size: '' },
];

const MOCK_TESTIMONIALS = [
  { id: 't1', clientName: 'Priya S.', rating: 5, service: 'Bridal Makeup', imageUrl: 'https://picsum.photos/seed/client1/100/100', review: "Maya made my entire wedding morning feel calm. My makeup didn't move for fourteen hours, through tears and a lot of dancing.", isActive: true },
  { id: 't2', clientName: 'Elena R.', rating: 5, service: 'Editorial Shoot', imageUrl: 'https://picsum.photos/seed/client2/100/100', review: 'Booked her for a shoot and she read the mood board perfectly on the first try. No back and forth needed.', isActive: true },
  { id: 't3', clientName: 'Jordan T.', rating: 5, service: 'Hair Styling', imageUrl: 'https://picsum.photos/seed/client3/100/100', review: 'Best blowout I have ever had. Still looked good three days later, which never happens with my hair.', isActive: true },
  { id: 't4', clientName: 'Amara K.', rating: 5, service: 'Party Makeup', imageUrl: 'https://picsum.photos/seed/client4/100/100', review: 'Professional, punctual, and genuinely fun to sit with for an hour. Already rebooked for next month.', isActive: true },
];

// dayOfWeek: 0=Sunday ... 6=Saturday, matches Date.getDay()
const MOCK_AVAILABILITY = [
  { dayOfWeek: 0, isAvailable: false },
  { dayOfWeek: 1, isAvailable: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 2, isAvailable: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 3, isAvailable: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 4, isAvailable: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 5, isAvailable: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 6, isAvailable: true, startTime: '10:00', endTime: '19:00' },
];

// Slots already booked, keyed by 'YYYY-MM-DD', for double-booking demo only.
// The real check happens server-side once the API is connected — see note above.
const MOCK_BOOKED_SLOTS = {};

/* ---------------------------------------------------------
   PUBLIC API — call sites use only these functions
--------------------------------------------------------- */

const Api = {
  getProfile() {
    return delay({ ...MOCK_PROFILE });
  },

  getServices({ activeOnly = true } = {}) {
    const list = activeOnly ? MOCK_SERVICES.filter((s) => s.isActive) : MOCK_SERVICES;
    return delay([...list].sort((a, b) => a.sortOrder - b.sortOrder));
  },

  getPortfolio({ category = 'all' } = {}) {
    const list = category === 'all' ? MOCK_PORTFOLIO : MOCK_PORTFOLIO.filter((p) => p.category === category);
    return delay([...list]);
  },

  getTestimonials() {
    return delay(MOCK_TESTIMONIALS.filter((t) => t.isActive));
  },

  getAvailability() {
    return delay([...MOCK_AVAILABILITY]);
  },

  getBookedSlots(dateStr) {
    return delay(MOCK_BOOKED_SLOTS[dateStr] || []);
  },

  /**
   * Submits a booking inquiry. Server-side (Stage 2+) this becomes
   * POST /api/inquiries, and the backend re-validates availability
   * before accepting it — never trust the client's slot selection alone.
   */
  submitInquiry(payload) {
    console.log('[mock submitInquiry]', payload);
    const dateKey = payload.preferredDate;
    if (!MOCK_BOOKED_SLOTS[dateKey]) MOCK_BOOKED_SLOTS[dateKey] = [];
    MOCK_BOOKED_SLOTS[dateKey].push(payload.preferredTime);
    return delay({ ok: true, inquiryId: 'inq_' + Date.now() });
  },
};
