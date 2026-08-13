function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Mongoose validation errors -> readable 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(' ') });
  }

  // Duplicate key (e.g. the booking double-booking index, or a unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'bookingDate' || field === 'startTime') {
      return res.status(409).json({ error: 'That time slot was just taken. Please pick another.' });
    }
    return res.status(409).json({ error: `That ${field || 'value'} is already in use.` });
  }

  // Malformed ObjectId in a route param
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on our end. Please try again.' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
