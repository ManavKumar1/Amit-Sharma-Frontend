const express = require('express');
const {
  listServices,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { requireAuth, attachAuthIfPresent } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

router.get('/', attachAuthIfPresent, listServices);
router.post(
  '/',
  requireAuth,
  validateBody({ name: 'required', price: 'number', duration: 'number' }),
  createService
);
router.put('/:id', requireAuth, updateService);
router.delete('/:id', requireAuth, deleteService);

module.exports = router;
