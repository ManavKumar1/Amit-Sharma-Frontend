const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Validates req.body against a simple field-name -> rule map, e.g.:
 *   validateBody({ email: 'email', fullName: 'required', preferredDate: 'date' })
 * Responds 400 with a plain message and stops the chain on the first failure.
 */
function validateBody(rules) {
  return (req, res, next) => {
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body[field];

      if (rule === 'required' && !isNonEmptyString(value) && typeof value !== 'number') {
        return res.status(400).json({ error: `${field} is required.` });
      }
      if (rule === 'email' && !EMAIL_RE.test(String(value || ''))) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (rule === 'date' && !DATE_RE.test(String(value || ''))) {
        return res.status(400).json({ error: `${field} must be in YYYY-MM-DD format.` });
      }
      if (rule === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
        return res.status(400).json({ error: `${field} must be a number.` });
      }
    }
    next();
  };
}

module.exports = { validateBody, isNonEmptyString, EMAIL_RE, DATE_RE };
