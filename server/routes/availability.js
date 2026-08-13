const express = require('express');
const { getAvailability, updateAvailability } = require('../controllers/availabilityController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAvailability);
router.put('/', requireAuth, updateAvailability);

module.exports = router;
