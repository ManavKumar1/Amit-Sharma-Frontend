const Availability = require('../models/Availability');
const BlockedDate = require('../models/BlockedDate');
const Booking = require('../models/Booking');
const Inquiry = require('../models/Inquiry');

// Inquiry statuses that still "hold" a slot. 'converted' inquiries already
// have a real Booking (checked separately below), and 'rejected'/'archived'
// ones were resolved without taking the slot, so neither should block.
const HOLDING_INQUIRY_STATUSES = ['new', 'contacted'];

/**
 * Independently verifies a date/time is bookable, regardless of what
 * the frontend sent. Returns { ok: true } or { ok: false, reason }.
 *
 * Checks both confirmed/pending Bookings AND still-open Inquiries for the
 * same date+time — the owner may take a while to turn an inquiry into a
 * real booking, so a second customer shouldn't be able to request (or be
 * booked into) the same slot in the meantime.
 *
 * excludeBookingId: pass when editing an existing booking to a new time,
 * so it doesn't collide with itself.
 * excludeInquiryId: pass when converting an inquiry to a booking, so the
 * inquiry being converted doesn't count as a conflict with itself.
 */
async function checkSlotAvailable(dateStr, timeStr, excludeBookingId = null, excludeInquiryId = null) {
  const dayOfWeek = new Date(`${dateStr}T00:00:00`).getDay();

  const dayRule = await Availability.findOne({ dayOfWeek });
  if (!dayRule || !dayRule.isAvailable) {
    return { ok: false, reason: 'Closed on that day.' };
  }

  const blocked = await BlockedDate.findOne({ date: dateStr });
  if (blocked) {
    return { ok: false, reason: 'That date is blocked off.' };
  }

  const conflictFilter = {
    bookingDate: dateStr,
    startTime: timeStr,
    status: { $in: ['pending', 'confirmed'] },
  };
  if (excludeBookingId) conflictFilter._id = { $ne: excludeBookingId };

  const conflict = await Booking.findOne(conflictFilter);
  if (conflict) {
    return { ok: false, reason: 'That time slot is already booked.' };
  }

  const inquiryConflictFilter = {
    preferredDate: dateStr,
    preferredTime: timeStr,
    status: { $in: HOLDING_INQUIRY_STATUSES },
  };
  if (excludeInquiryId) inquiryConflictFilter._id = { $ne: excludeInquiryId };

  const inquiryConflict = await Inquiry.findOne(inquiryConflictFilter);
  if (inquiryConflict) {
    return { ok: false, reason: 'That time slot has a pending inquiry and is on hold — please pick another time.' };
  }

  return { ok: true };
}

module.exports = checkSlotAvailable;
