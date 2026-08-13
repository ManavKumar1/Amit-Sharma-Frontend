const Inquiry = require('../models/Inquiry');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const checkSlotAvailable = require('../utils/checkSlotAvailable');

// Public: a customer submits a request. This is NOT a confirmed booking.
async function createInquiry(req, res) {
  const { customerName, phone, email, serviceId, preferredDate, preferredTime, message } = req.body;

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    return res.status(400).json({ error: 'That service is not available.' });
  }

  const inquiry = await Inquiry.create({
    customerName,
    phone,
    email,
    serviceId,
    serviceNameSnapshot: service.name,
    preferredDate,
    preferredTime,
    message,
  });

  res.status(201).json({ ok: true, inquiryId: inquiry._id });
}

// Owner: list inquiries, optionally filtered by status.
async function listInquiries(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
  res.json(inquiries);
}

async function getInquiry(req, res) {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json(inquiry);
}

// Owner: mark contacted / rejected / archived, or edit fields. Converting to
// a booking is a separate, more careful operation — see convertInquiry below.
async function updateInquiry(req, res) {
  const allowed = ['status', 'customerName', 'phone', 'email', 'preferredDate', 'preferredTime', 'message'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (updates.status === 'converted') {
    return res.status(400).json({
      error: 'Use the "convert to booking" action to move an inquiry to converted status.',
    });
  }

  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json(inquiry);
}

// Owner: turn an inquiry into a real Booking record. Re-checks availability
// server-side even though the customer picked a slot when they submitted —
// time may have passed, or someone else may have taken it since.
async function convertInquiry(req, res) {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
  if (inquiry.status === 'converted') {
    return res.status(409).json({ error: 'This inquiry was already converted.' });
  }

  const { startTime, endTime, bookingDate } = req.body;
  const date = bookingDate || inquiry.preferredDate;
  const start = startTime || inquiry.preferredTime;

  const availability = await checkSlotAvailable(date, start);
  if (!availability.ok) {
    return res.status(409).json({ error: availability.reason });
  }

  const service = await Service.findById(inquiry.serviceId);
  if (!service) return res.status(400).json({ error: 'The requested service no longer exists.' });

  const booking = await Booking.create({
    inquiryId: inquiry._id,
    customerName: inquiry.customerName,
    phone: inquiry.phone,
    email: inquiry.email,
    serviceId: service._id,
    serviceNameSnapshot: service.name,
    priceSnapshot: service.price,
    bookingDate: date,
    startTime: start,
    endTime: endTime || start,
    status: 'pending',
    customerNotes: inquiry.message,
  });

  inquiry.status = 'converted';
  await inquiry.save();

  res.status(201).json({ ok: true, booking });
}

module.exports = { createInquiry, listInquiries, getInquiry, updateInquiry, convertInquiry };
