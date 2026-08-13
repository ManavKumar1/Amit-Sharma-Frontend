const Booking = require('../models/Booking');
const Inquiry = require('../models/Inquiry');

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

async function getOverview(req, res) {
  const today = todayStr();

  const [todaysBookings, upcomingBookings, newInquiries, pendingConfirmations, upcomingList] = await Promise.all([
    Booking.countDocuments({ bookingDate: today, status: { $in: ['pending', 'confirmed'] } }),
    Booking.countDocuments({ bookingDate: { $gt: today }, status: { $in: ['pending', 'confirmed'] } }),
    Inquiry.countDocuments({ status: 'new' }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.find({ bookingDate: { $gte: today }, status: { $in: ['pending', 'confirmed'] } })
      .sort({ bookingDate: 1, startTime: 1 })
      .limit(10),
  ]);

  res.json({
    todaysBookings,
    upcomingBookings,
    newInquiries,
    pendingConfirmations,
    upcomingList,
  });
}

module.exports = { getOverview };
