const BlockedDate = require('../models/BlockedDate');

async function listBlockedDates(req, res) {
  const rows = await BlockedDate.find().sort({ date: 1 });
  res.json(rows);
}

async function createBlockedDate(req, res) {
  const { date, reason } = req.body;
  const row = await BlockedDate.create({ date, reason });
  res.status(201).json(row);
}

async function deleteBlockedDate(req, res) {
  const row = await BlockedDate.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ error: 'Blocked date not found.' });
  res.json({ ok: true, deleted: true });
}

module.exports = { listBlockedDates, createBlockedDate, deleteBlockedDate };
