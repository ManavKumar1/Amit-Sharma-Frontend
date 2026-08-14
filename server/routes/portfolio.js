const express = require('express');
const {
  listPortfolio,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} = require('../controllers/portfolioController');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validation');

const router = express.Router();

router.get('/', listPortfolio);
router.post('/', requireAuth, validateBody({ imageUrl: 'required', category: 'required' }), createPortfolioItem);
router.put('/:id', requireAuth, updatePortfolioItem);
router.delete('/:id', requireAuth, deletePortfolioItem);

module.exports = router;
