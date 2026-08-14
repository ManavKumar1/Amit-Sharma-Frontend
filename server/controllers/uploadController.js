function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file received.' });
  }
  // Files live in public/assets/uploads and are served directly by express.static,
  // so the URL the frontend gets back is just a normal relative path — no SDK,
  // no API key, nothing but a file on disk.
  res.status(201).json({ url: `/assets/uploads/${req.file.filename}` });
}

module.exports = { handleUpload };