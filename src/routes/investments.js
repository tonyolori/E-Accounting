const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createInvestmentHandler,
  getInvestmentsHandler,
  getInvestmentByIdHandler,
  updateInvestmentHandler,
  updateInvestmentStatusHandler,
  updateInvestmentBalanceHandler,
  getInvestmentSummaryHandler,
  deleteInvestmentHandler
} = require('../controllers/investmentController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * @route   GET /api/investments/summary
 * @desc    Get investment summary for user
 * @access  Private
 */
router.get('/summary', getInvestmentSummaryHandler);

/**
 * @route   POST /api/investments
 * @desc    Create a new investment
 * @access  Private
 */
router.post('/', createInvestmentHandler);

/**
 * @route   GET /api/investments
 * @desc    Get user investments with optional filtering
 * @access  Private
 */
router.get('/', getInvestmentsHandler);

/**
 * @route   GET /api/investments/:id
 * @desc    Get specific investment by ID
 * @access  Private
 */
router.get('/:id', getInvestmentByIdHandler);

/**
 * @route   PUT /api/investments/:id
 * @desc    Update investment
 * @access  Private
 */
router.put('/:id', updateInvestmentHandler);

/**
 * @route   PATCH /api/investments/:id/status
 * @desc    Update investment status
 * @access  Private
 */
router.patch('/:id/status', updateInvestmentStatusHandler);

/**
 * @route   PATCH /api/investments/:id/balance
 * @desc    Update investment balance manually
 * @access  Private
 */
router.patch('/:id/balance', updateInvestmentBalanceHandler);

/**
 * @route   DELETE /api/investments/:id
 * @desc    Cancel investment (set status to CANCELLED)
 * @access  Private
 */
router.delete('/:id', deleteInvestmentHandler);

module.exports = router;
