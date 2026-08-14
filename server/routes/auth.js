const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, logout, me, setupStatus, changePassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Slow down credential-stuffing / brute-force attempts on the one login form.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/setup-status', setupStatus);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);

module.exports = router;