const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createTransactionHandler,
  getTransactionsHandler,
  getTransactionByIdHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
  getTransactionStatisticsHandler,
  getInvestmentTransactionSummaryHandler,
  getRecentTransactionsHandler,
  getTransactionSummaryByTypeHandler,
  getTransactionTrendsHandler
} = require('../controllers/transactionController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * @route   GET /api/transactions/statistics
 * @desc    Get transaction statistics for user
 * @access  Private
 */
router.get('/statistics', getTransactionStatisticsHandler);

/**
 * @route   GET /api/transactions/recent
 * @desc    Get recent transactions for user (dashboard widget)
 * @access  Private
 */
router.get('/recent', getRecentTransactionsHandler);

/**
 * @route   GET /api/transactions/summary/by-type
 * @desc    Get transaction summary by type for user
 * @access  Private
 */
router.get('/summary/by-type', getTransactionSummaryByTypeHandler);

/**
 * @route   GET /api/transactions/trends
 * @desc    Get transaction trends (monthly aggregation)
 * @access  Private
 */
router.get('/trends', getTransactionTrendsHandler);

/**
 * @route   GET /api/transactions/investment/:investmentId/summary
 * @desc    Get investment transaction summary
 * @access  Private
 */
router.get('/investment/:investmentId/summary', getInvestmentTransactionSummaryHandler);

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', createTransactionHandler);

/**
 * @route   GET /api/transactions
 * @desc    Get user transactions with optional filtering
 * @access  Private
 */
router.get('/', getTransactionsHandler);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get specific transaction by ID
 * @access  Private
 */
router.get('/:id', getTransactionByIdHandler);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private
 */
router.put('/:id', updateTransactionHandler);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private
 */
router.delete('/:id', deleteTransactionHandler);

module.exports = router;
