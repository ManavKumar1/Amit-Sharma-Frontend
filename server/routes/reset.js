const express = require('express');
const { resetContent } = require('../controllers/resetController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, resetContent);

module.exports = router;