const express = require('express');
const {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  getBookedSlotsForDate,
} = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

// Public — no customer details, just which start times are taken on a date.
// Must be registered before the owner-only gate below.
router.get('/slots', getBookedSlotsForDate);

// Every other booking route is owner-only — customers never see bookings
// directly, only the inquiry they submitted.
router.use(requireAuth);

router.get('/', listBookings);
router.get('/:id', getBooking);
router.post(
  '/',
  validateBody({ customerName: 'required', phone: 'required', serviceId: 'required', bookingDate: 'date', startTime: 'required' }),
  createBooking
);
router.put('/:id', updateBooking);

module.exports = router;