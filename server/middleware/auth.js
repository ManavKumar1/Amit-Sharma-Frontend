const jwt = require('jsonwebtoken');

/**
 * There is exactly one owner account. This middleware just checks
 * "is this a valid, unexpired token for that owner" — no roles,
 * no permission levels.
 */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

/**
 * For routes that behave differently for the owner vs. the public
 * (e.g. GET /api/services returning all services vs. active-only)
 * but shouldn't reject an unauthenticated request outright.
 */
function attachAuthIfPresent(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
  } catch (err) {
    // Invalid/expired token on an optional-auth route — treat as anonymous.
  }
  next();
}

module.exports = { requireAuth, attachAuthIfPresent };
