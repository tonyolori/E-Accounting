const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getDashboardHandler,
  getPortfolioSummaryHandler,
  getPerformanceTrendsHandler,
  getAssetAllocationHandler,
  generateFinancialReportHandler,
  getQuickStatsHandler,
  getInvestmentComparisonHandler,
  getMonthlyBreakdownHandler
} = require('../controllers/reportController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get comprehensive dashboard data for user
 * @access  Private
 */
router.get('/dashboard', getDashboardHandler);

/**
 * @route   GET /api/reports/quick-stats
 * @desc    Get quick stats for header/widget display
 * @access  Private
 */
router.get('/quick-stats', getQuickStatsHandler);

/**
 * @route   GET /api/reports/portfolio-summary
 * @desc    Get comprehensive portfolio summary with detailed metrics
 * @access  Private
 */
router.get('/portfolio-summary', getPortfolioSummaryHandler);

/**
 * @route   GET /api/reports/performance-trends
 * @desc    Get performance trends over time
 * @query   months - Number of months to analyze (1-24, default: 12)
 * @query   investmentId - Optional specific investment ID
 * @access  Private
 */
router.get('/performance-trends', getPerformanceTrendsHandler);

/**
 * @route   GET /api/reports/asset-allocation
 * @desc    Get asset allocation breakdown by category and type
 * @access  Private
 */
router.get('/asset-allocation', getAssetAllocationHandler);

/**
 * @route   GET /api/reports/monthly-breakdown/:year
 * @desc    Get monthly breakdown for specific year
 * @param   year - Year to analyze (YYYY format)
 * @access  Private
 */
router.get('/monthly-breakdown/:year', getMonthlyBreakdownHandler);

/**
 * @route   POST /api/reports/financial-report
 * @desc    Generate comprehensive financial report
 * @body    includeTransactions - Include transaction history (default: false)
 * @body    period - Report period ('all', 'ytd', 'last12months', 'last6months')
 * @body    format - Report format ('json')
 * @access  Private
 */
router.post('/financial-report', generateFinancialReportHandler);

/**
 * @route   POST /api/reports/investment-comparison
 * @desc    Compare multiple investments
 * @body    investmentIds - Array of investment IDs to compare (2-10 items)
 * @access  Private
 */
router.post('/investment-comparison', getInvestmentComparisonHandler);

module.exports = router;
