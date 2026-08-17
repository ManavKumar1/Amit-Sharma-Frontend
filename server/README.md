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
| 4 | Dashboard — Services, Portfolio, Testimonials, Availability, Settings | Done, live |
| 5 | Connect public site (index.html/book.html) to the real API | Done |
| 6 | Portfolio image upload | Done — local disk storage, no cloud service |

The whole site now runs on the real backend end to end: public pages, booking
flow, and dashboard all talk to the same Express/Mongo API. There is no mock
data left anywhere.

## Image storage

Portfolio images (and the profile photo, once wired into Settings' UI) are
uploaded straight to disk at `public/assets/uploads/` via `POST /api/upload`,
and served back out by the same `express.static` call that serves the rest
of the frontend. No Cloudinary, no external image service, no API keys for
image hosting.

**One tradeoff worth knowing before you deploy:** most free-tier hosts
(Render's free Web Service included) use an *ephemeral* filesystem — anything
written to disk gets wiped on every redeploy or restart. That's fine for
development. For production, either:
- pay for a small persistent disk add-on (Render offers this cheaply), or
- accept that re-uploading portfolio images after a redeploy is a manual step, or
- point `imageUrl` at any external host you prefer later — the schema just
  stores a URL string, so nothing about the data model has to change.

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
GET    /api/bookings/slots?date=YYYY-MM-DD   public (taken start times only, no customer data)
POST   /api/bookings            owner
PUT    /api/bookings/:id        owner

GET    /api/availability        public
PUT    /api/availability        owner

GET    /api/blocked-dates       public
POST   /api/blocked-dates       owner
DELETE /api/blocked-dates/:id   owner

GET    /api/dashboard/overview  owner

POST   /api/upload              owner   (multipart, field name "image" — saves to public/assets/uploads)

POST   /api/reset-content       owner   (irreversible — wipes Profile/Service/Portfolio/Testimonial/
                                          Availability/BlockedDate only. Never touches User, Booking,
                                          or Inquiry. Requires body { "confirm": "RESET_CONTENT" })
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
- **Images**: local disk, served by the same app — see the "Image storage"
  section above for the ephemeral-disk caveat on free hosting tiers.

## Next steps

The core build is complete: public site, booking flow, full dashboard, image
upload, all connected end to end. Reasonable next steps if you want them:
- A simple calendar-grid view for Bookings (currently list view, filterable)
- Editing the profile photo directly from Settings (upload API already supports it)
- Any polish pass on copy/photos once you swap in real business content