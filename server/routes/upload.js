const express = require('express');
const { upload } = require('../middleware/upload');
const { handleUpload } = require('../controllers/uploadController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, upload.single('image'), handleUpload);

// Multer errors (bad file type, too large) come through as normal Error objects
// thrown before our own error handler's Mongo-specific checks — handle them here
// so the client gets a clean message instead of a raw stack trace.
router.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;