const Service = require('../models/Service');
const Booking = require('../models/Booking');

async function listServices(req, res) {
  // Public (unauthenticated) callers only ever see active services.
  // The dashboard is authenticated and manages everything, including disabled ones.
  const filter = req.userId ? {} : { isActive: true };

  const services = await Service.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  res.json(services);
}

async function createService(req, res) {
  const service = await Service.create(req.body);
  res.status(201).json(service);
}

async function updateService(req, res) {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!service) return res.status(404).json({ error: 'Service not found.' });
  res.json(service);
}

async function deleteService(req, res) {
  const inUse = await Booking.exists({ serviceId: req.params.id });
  if (inUse) {
    // Don't destroy historical bookings tied to this service — deactivate instead.
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found.' });
    return res.json({ ok: true, deactivated: true, service });
  }

  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found.' });
  res.json({ ok: true, deleted: true });
}

module.exports = { listServices, createService, updateService, deleteService };
