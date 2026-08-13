const Availability = require('../models/Availability');
const BlockedDate = require('../models/BlockedDate');
const Booking = require('../models/Booking');

/**
 * Independently verifies a date/time is bookable, regardless of what
 * the frontend sent. Returns { ok: true } or { ok: false, reason }.
 *
 * excludeBookingId: pass when editing an existing booking to a new time,
 * so it doesn't collide with itself.
 */
async function checkSlotAvailable(dateStr, timeStr, excludeBookingId = null) {
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

  return { ok: true };
}

module.exports = checkSlotAvailable;
