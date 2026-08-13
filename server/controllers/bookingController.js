const Booking = require('../models/Booking');
const Service = require('../models/Service');
const checkSlotAvailable = require('../utils/checkSlotAvailable');

async function listBookings(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) filter.bookingDate = req.query.date;
  const bookings = await Booking.find(filter).sort({ bookingDate: 1, startTime: 1 });
  res.json(bookings);
}

async function getBooking(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(booking);
}

// Owner manually creating a booking directly (no inquiry behind it).
async function createBooking(req, res) {
  const { customerName, phone, email, serviceId, bookingDate, startTime, endTime, customerNotes } = req.body;

  const service = await Service.findById(serviceId);
  if (!service) return res.status(400).json({ error: 'Service not found.' });

  const availability = await checkSlotAvailable(bookingDate, startTime);
  if (!availability.ok) {
    return res.status(409).json({ error: availability.reason });
  }

  const booking = await Booking.create({
    customerName,
    phone,
    email,
    serviceId,
    serviceNameSnapshot: service.name,
    priceSnapshot: service.price,
    bookingDate,
    startTime,
    endTime: endTime || startTime,
    status: 'pending',
    customerNotes: customerNotes || '',
  });

  res.status(201).json(booking);
}

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no-show'],
  completed: [],
  cancelled: [],
  'no-show': [],
};

async function updateBooking(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const { status, bookingDate, startTime, endTime, internalNotes, customerNotes } = req.body;

  // Changing the date/time re-triggers the same server-side availability check.
  const movingSlot = (bookingDate && bookingDate !== booking.bookingDate) || (startTime && startTime !== booking.startTime);
  if (movingSlot) {
    const availability = await checkSlotAvailable(
      bookingDate || booking.bookingDate,
      startTime || booking.startTime,
      booking._id
    );
    if (!availability.ok) {
      return res.status(409).json({ error: availability.reason });
    }
    if (bookingDate) booking.bookingDate = bookingDate;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
  }

  if (status && status !== booking.status) {
    const allowedNext = STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({ error: `Cannot move a "${booking.status}" booking to "${status}".` });
    }
    booking.status = status;
  }

  if (internalNotes !== undefined) booking.internalNotes = internalNotes;
  if (customerNotes !== undefined) booking.customerNotes = customerNotes;

  await booking.save();
  res.json(booking);
}

module.exports = { listBookings, getBooking, createBooking, updateBooking };
