const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  addManualReturnHandler,
  getInvestmentReturnsHandler,
  calculateCompoundInterestHandler,
  calculateProjectedReturnsHandler,
  calculateNextMonthlyReturnHandler,
  applyMonthlyReturnHandler,
  bulkAddReturnsHandler,
  getReturnsSummaryHandler
} = require('../controllers/returnsController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * @route   GET /api/returns/summary
 * @desc    Get returns summary across all investments for user
 * @access  Private
 */
router.get('/summary', getReturnsSummaryHandler);

/**
 * @route   POST /api/returns/manual
 * @desc    Add manual return to investment
 * @access  Private
 */
router.post('/manual', addManualReturnHandler);

/**
 * @route   POST /api/returns/calculate
 * @desc    Calculate compound interest (utility endpoint)
 * @access  Private
 */
router.post('/calculate', calculateCompoundInterestHandler);

/**
 * @route   POST /api/returns/bulk
 * @desc    Bulk add returns to multiple investments
 * @access  Private
 */
router.post('/bulk', bulkAddReturnsHandler);

/**
 * @route   GET /api/returns/:investmentId
 * @desc    Get returns for specific investment
 * @access  Private
 */
router.get('/:investmentId', getInvestmentReturnsHandler);

/**
 * @route   POST /api/returns/:investmentId/projections
 * @desc    Calculate projected returns for investment
 * @access  Private
 */
router.post('/:investmentId/projections', calculateProjectedReturnsHandler);

/**
 * @route   GET /api/returns/:investmentId/next-monthly
 * @desc    Calculate next monthly return for fixed-rate investment
 * @access  Private
 */
router.get('/:investmentId/next-monthly', calculateNextMonthlyReturnHandler);

/**
 * @route   POST /api/returns/:investmentId/apply-monthly
 * @desc    Apply next monthly return to fixed-rate investment
 * @access  Private
 */
router.post('/:investmentId/apply-monthly', applyMonthlyReturnHandler);

module.exports = router;
