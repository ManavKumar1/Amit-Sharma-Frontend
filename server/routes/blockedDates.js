const express = require('express');
const {
  listBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
} = require('../controllers/blockedDateController');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

router.get('/', listBlockedDates);
router.post('/', requireAuth, validateBody({ date: 'date' }), createBlockedDate);
router.delete('/:id', requireAuth, deleteBlockedDate);

module.exports = router;
