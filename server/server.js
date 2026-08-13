require('dotenv').config();
require('express-async-errors'); // lets async controllers throw and still hit errorHandler

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const serviceRoutes = require('./routes/services');
const portfolioRoutes = require('./routes/portfolio');
const testimonialRoutes = require('./routes/testimonials');
const inquiryRoutes = require('./routes/inquiries');
const bookingRoutes = require('./routes/bookings');
const availabilityRoutes = require('./routes/availability');
const blockedDateRoutes = require('./routes/blockedDates');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

/* ---------------- SECURITY & PARSING ---------------- */
app.use(
  helmet({
    // Static HTML/CSS/JS pages served same-origin; keep CSP permissive enough
    // for the Google Fonts + picsum placeholder images used by the frontend.
    contentSecurityPolicy: false,
  })
);

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// General API rate limit, on top of the stricter per-route limits (login, inquiries).
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

/* ---------------- API ROUTES ---------------- */
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/blocked-dates', blockedDateRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

/* ---------------- STATIC FRONTEND ---------------- */
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Any non-API, non-file route falls back to index.html (keeps deep links working).
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

/* ---------------- ERRORS ---------------- */
app.use('/api', notFound);
app.use(errorHandler);

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
