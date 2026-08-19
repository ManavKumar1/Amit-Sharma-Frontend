const express = require('express');
const rateLimit = require('express-rate-limit');
const { subscribe, listSubscribers } = require('../controllers/newsletterController');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

// Public form submission — rate-limited so it can't be used to spam the list.
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please try again later.' },
});

router.post('/', subscribeLimiter, validateBody({ email: 'email' }), subscribe);
router.get('/', requireAuth, listSubscribers);

module.exports = router;
