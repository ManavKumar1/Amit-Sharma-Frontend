const Newsletter = require('../models/Newsletter');

// Public: subscribe an email address. Silently treats a repeat signup as a
// success instead of a duplicate-key error — the visitor doesn't need to
// know they were already on the list.
async function subscribe(req, res) {
  const email = String(req.body.email || '').toLowerCase().trim();

  const existing = await Newsletter.findOne({ email });
  if (existing) {
    return res.json({ ok: true, alreadySubscribed: true });
  }

  await Newsletter.create({ email });
  res.status(201).json({ ok: true, alreadySubscribed: false });
}

// Owner: every subscriber, newest first.
async function listSubscribers(req, res) {
  const subscribers = await Newsletter.find().sort({ createdAt: -1 });
  res.json(subscribers);
}

module.exports = { subscribe, listSubscribers };
