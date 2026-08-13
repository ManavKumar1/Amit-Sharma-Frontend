# Maya Ellison — Makeup Artist & Hairstylist

Single-repo site: static frontend (HTML/CSS/vanilla JS) served by one Express app,
backed by MongoDB via Mongoose. No React, no separate backend service, no browser
code ever talks to MongoDB directly — the browser only ever calls the Express API.

```
makeup-artist/
├── public/          static frontend (served by Express)
│   ├── index.html   homepage — still runs on MOCK DATA (js/api.js)
│   ├── book.html     booking flow — still runs on MOCK DATA (js/api.js)
│   └── admin/        owner dashboard — LIVE, talks to the real API
└── server/           Express + Mongoose backend
```

## Current build status

| Stage | What | Status |
|---|---|---|
| 1 | Public frontend (mock data) | Done |
| 2 | Backend (Express, Mongoose, REST API) | Done |
| 3 | Auth (bcrypt + JWT + httpOnly cookie) | Done |
| 4 | Dashboard — Overview, Bookings, Inquiries | Done, live |
| 4 | Dashboard — Services, Portfolio, Testimonials, Availability, Settings | Placeholder panels only — API routes exist, UI doesn't yet |
| 5 | Connect public site (index.html/book.html) to the real API | Not started — still mock data |
| 6 | Cloudinary image upload for Portfolio | Not started |

The dashboard already talks to a real, running backend. The public marketing
site (`index.html`, `book.html`) intentionally still runs on the mock `js/api.js`
from Stage 1 — swapping that to real `fetch()` calls is Stage 5.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — a MongoDB Atlas connection string (free tier is fine)
- `JWT_SECRET` — any long random string, e.g. `openssl rand -hex 32`
- Leave `CLOUDINARY_*` blank until the Portfolio-upload stage

## Seed starter data + owner login

```bash
npm run seed
```

Creates the one owner account plus starter services/portfolio/testimonials/hours
so the dashboard isn't empty. Prints the login email/password to the console —
by default `owner@example.com` / `changeme123` unless you set `SEED_OWNER_EMAIL`
/ `SEED_OWNER_PASSWORD` in `.env` first. **Change the password before deploying.**

## Run it

```bash
npm run dev      # nodemon, auto-restarts on change
# or
npm start
```

Then open:
- `http://localhost:4000` — public site
- `http://localhost:4000/admin/login.html` — owner dashboard login

## API quick reference

All routes are mounted under `/api`. Public (no auth) vs owner-only (requires
the `token` httpOnly cookie set by `/api/auth/login`) is marked below.

```
POST   /api/auth/login          public
POST   /api/auth/logout         public
GET    /api/auth/me             owner

GET    /api/profile             public
PUT    /api/profile             owner

GET    /api/services            public (active only) / owner (all)
POST   /api/services            owner
PUT    /api/services/:id        owner
DELETE /api/services/:id        owner   (deactivates instead of deleting if it has bookings)

GET    /api/portfolio           public
POST   /api/portfolio           owner
PUT    /api/portfolio/:id       owner
DELETE /api/portfolio/:id       owner

GET    /api/testimonials        public (active only) / owner (all)
POST   /api/testimonials        owner
PUT    /api/testimonials/:id    owner
DELETE /api/testimonials/:id    owner

POST   /api/inquiries           public  (rate-limited: 20/hour)
GET    /api/inquiries           owner
GET    /api/inquiries/:id       owner
PUT    /api/inquiries/:id       owner
POST   /api/inquiries/:id/convert   owner  (re-checks availability server-side)

GET    /api/bookings            owner
GET    /api/bookings/:id        owner
POST   /api/bookings            owner
PUT    /api/bookings/:id        owner

GET    /api/availability        public
PUT    /api/availability        owner

GET    /api/blocked-dates       public
POST   /api/blocked-dates       owner
DELETE /api/blocked-dates/:id   owner

GET    /api/dashboard/overview  owner
```

## Double-booking protection

Two independent layers, per the spec:
1. `Booking` has a partial unique Mongo index on `{ bookingDate, startTime }`
   for `status in [pending, confirmed]` — the database itself refuses a second
   live booking in the same slot.
2. Every write path (`createBooking`, `updateBooking`, `convertInquiry`) also
   calls `checkSlotAvailable()` first, which checks weekly hours, blocked
   dates, *and* existing bookings — so the customer gets a clear error message
   instead of a raw Mongo duplicate-key error.

## Deploying (zero/low cost, matches the "no fiat banking exposure,
   minimal hosting cost" preference from earlier conversations)

- **MongoDB**: Atlas free tier (M0).
- **App host**: Render or Railway free/hobby tier — one Node service running
  `npm start`, env vars set in their dashboard. Since the frontend is served
  by the same Express app, that's the *only* service you need.
- **Images**: Cloudinary free tier, once the Portfolio-upload stage is built.

## Next steps

Say the word and I'll build, in order:
1. Services / Portfolio / Testimonials / Availability / Settings dashboard UI
2. Cloudinary upload wiring for Portfolio
3. Stage 5 — swap `public/js/api.js` from mock data to real `fetch()` calls
