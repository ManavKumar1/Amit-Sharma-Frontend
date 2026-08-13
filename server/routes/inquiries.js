const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  createInquiry,
  listInquiries,
  getInquiry,
  updateInquiry,
  convertInquiry,
} = require('../controllers/inquiryController');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

// Public form submission — rate-limited so it can't be used to spam the inbox.
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests submitted. Please try again later or contact us directly.' },
});

router.post(
  '/',
  submitLimiter,
  validateBody({
    customerName: 'required',
    phone: 'required',
    email: 'email',
    serviceId: 'required',
    preferredDate: 'date',
    preferredTime: 'required',
  }),
  createInquiry
);

router.get('/', requireAuth, listInquiries);
router.get('/:id', requireAuth, getInquiry);
router.put('/:id', requireAuth, updateInquiry);
router.post('/:id/convert', requireAuth, convertInquiry);

module.exports = router;
