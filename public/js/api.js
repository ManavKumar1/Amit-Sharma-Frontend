/**
 * api.js — single point of contact with the backend.
 *
 * STAGE 5: this now calls the real Express API instead of mock data.
 * Every function keeps the exact shape it had in Stage 1, so main.js and
 * booking.js don't need to change at all — only this file's internals did.
 *
 * Mongo documents come back with `_id`; everything here maps that to `id`
 * so the rest of the frontend never has to know the difference.
 */

async function request(path, options = {}) {
  const res = await fetch('/api' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

function withId(item) {
  return { ...item, id: item._id };
}

// Shared by main.js and booking.js so a service's price always renders with
// the right symbol, regardless of which currency it was saved in.
const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
function currencySymbol(code) {
  return CURRENCY_SYMBOLS[code] || (code ? code + ' ' : '₹');
}

const Api = {
  async getProfile() {
    const p = await request('/profile');
    return {
      name: p.name,
      title: p.title,
      tagline: p.tagline,
      bio: p.bio,
      phone: p.phone,
      phoneDisplay: p.phone,
      whatsapp: p.whatsapp,
      email: p.email,
      address: p.address,
      city: p.city,
      mapsUrl: p.mapsUrl,
      instagramUrl: p.instagramUrl,
      facebookUrl: p.facebookUrl,
      profileImage: p.profileImage,
      heroImages: p.heroImages || [],
      showPrices: p.showPrices !== false,
      accentColor: p.accentColor || 'violet',
      lightSurface: p.lightSurface || 'warm',
      businessHours: (p.businessHours || []).map((h) => ({
        day: h.day, open: h.open, close: h.close, closed: h.closed,
      })),
    };
  },

  async getServices() {
    const list = await request('/services');
    return list.map(withId);
  },

  async getPortfolio({ category = 'all' } = {}) {
    const qs = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const list = await request('/portfolio' + qs);
    return list.map(withId);
  },

  async getTestimonials() {
    const list = await request('/testimonials');
    return list.map(withId);
  },

  async getAvailability() {
    return request('/availability');
  },

  async getBookedSlots(dateStr) {
    return request(`/bookings/slots?date=${encodeURIComponent(dateStr)}`);
  },

  /**
   * Submits a booking inquiry. The backend independently re-validates
   * availability before accepting it — never trust the client's slot
   * selection alone, even though book.html already checked it too.
   */
  async submitInquiry(payload) {
    const body = {
      customerName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      serviceId: payload.serviceId,
      preferredDate: payload.preferredDate,
      preferredTime: payload.preferredTime,
      message: payload.message,
    };
    return request('/inquiries', { method: 'POST', body: JSON.stringify(body) });
  },

  async subscribeNewsletter(email) {
    return request('/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
  },
};

// Shared theme toggle — wired here (rather than main.js) so book.html,
// which doesn't load main.js, still gets working light/dark switching.
(function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (err) { /* private mode etc — non-fatal */ }
  });
})();