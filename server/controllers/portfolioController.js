const fs = require('fs');
const path = require('path');
const Portfolio = require('../models/Portfolio');
const { UPLOAD_DIR } = require('../middleware/upload');

async function listPortfolio(req, res) {
  const filter = {};
  if (req.query.category && req.query.category !== 'all') {
    filter.category = req.query.category;
  }
  const items = await Portfolio.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  res.json(items);
}

async function createPortfolioItem(req, res) {
  const item = await Portfolio.create(req.body);
  res.status(201).json(item);
}

async function updatePortfolioItem(req, res) {
  const item = await Portfolio.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });
  res.json(item);
}

async function deletePortfolioItem(req, res) {
  const item = await Portfolio.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found.' });

  // Clean up the file on disk if it's one of our own local uploads
  // (leave external/seed URLs like picsum links alone).
  if (item.imageUrl && item.imageUrl.startsWith('/assets/uploads/')) {
    const filePath = path.join(UPLOAD_DIR, path.basename(item.imageUrl));
    fs.unlink(filePath, () => {}); // best-effort, don't fail the request over it
  }

  res.json({ ok: true, deleted: true });
}

module.exports = { listPortfolio, createPortfolioItem, updatePortfolioItem, deletePortfolioItem };