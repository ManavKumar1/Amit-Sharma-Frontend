const express = require('express');
const {
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require('../controllers/testimonialController');
const { requireAuth, attachAuthIfPresent } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

router.get('/', attachAuthIfPresent, listTestimonials);
router.post(
  '/',
  requireAuth,
  validateBody({ clientName: 'required', review: 'required' }),
  createTestimonial
);
router.put('/:id', requireAuth, updateTestimonial);
router.delete('/:id', requireAuth, deleteTestimonial);

module.exports = router;
