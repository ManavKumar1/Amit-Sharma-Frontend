const Testimonial = require('../models/Testimonial');

async function listTestimonials(req, res) {
  const filter = req.userId ? {} : { isActive: true };
  const items = await Testimonial.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  res.json(items);
}

async function createTestimonial(req, res) {
  const item = await Testimonial.create(req.body);
  res.status(201).json(item);
}

async function updateTestimonial(req, res) {
  const item = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ error: 'Testimonial not found.' });
  res.json(item);
}

async function deleteTestimonial(req, res) {
  const item = await Testimonial.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Testimonial not found.' });
  res.json({ ok: true, deleted: true });
}

module.exports = { listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
