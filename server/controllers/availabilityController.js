const Availability = require('../models/Availability');

const DEFAULTS = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: '10:00',
  endTime: '19:00',
  isAvailable: dayOfWeek !== 0, // closed Sunday by default
}));

async function getAvailability(req, res) {
  let rows = await Availability.find().sort({ dayOfWeek: 1 });
  if (rows.length === 0) {
    rows = await Availability.insertMany(DEFAULTS);
  }
  res.json(rows);
}

// Owner: replace the full week in one call — body is an array of 7 day rules.
async function updateAvailability(req, res) {
  const days = req.body;
  if (!Array.isArray(days) || days.length === 0) {
    return res.status(400).json({ error: 'Expected an array of day rules.' });
  }

  const ops = days.map((day) => ({
    updateOne: {
      filter: { dayOfWeek: day.dayOfWeek },
      update: {
        $set: {
          startTime: day.startTime,
          endTime: day.endTime,
          isAvailable: day.isAvailable,
        },
      },
      upsert: true,
    },
  }));

  await Availability.bulkWrite(ops);
  const rows = await Availability.find().sort({ dayOfWeek: 1 });
  res.json(rows);
}

module.exports = { getAvailability, updateAvailability };
