const {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStatistics,
  getInvestmentTransactionSummary
} = require('../services/transactionService');

const {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateTransactionQueryFilters,
  validateTransactionStatsQuery
} = require('../validators/transactionValidator');

const { asyncHandler } = require('../middleware/errorHandler');
const { prisma } = require('../config/database');

/**
 * Create a new transaction
 * @route POST /api/transactions
 * @access Private
 */
const createTransactionHandler = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateCreateTransaction(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Create transaction
  const transaction = await createTransaction(req.user.id, validation.data);

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: {
      transaction
    }
  });
});

/**
 * Get user transactions with optional filtering
 * @route GET /api/transactions
 * @access Private
 */
const getTransactionsHandler = asyncHandler(async (req, res) => {
  // Validate query parameters
  const validation = validateTransactionQueryFilters(req.query);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Get transactions
  const result = await getUserTransactions(req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Transactions retrieved successfully',
    data: {
      transactions: result.transactions,
      pagination: result.pagination
    }
  });
});

/**
 * Get specific transaction by ID
 * @route GET /api/transactions/:id
 * @access Private
 */
const getTransactionByIdHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get transaction
  const transaction = await getTransactionById(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Transaction retrieved successfully',
    data: {
      transaction
    }
  });
});

/**
 * Update transaction
 * @route PUT /api/transactions/:id
 * @access Private
 */
const updateTransactionHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate input
  const validation = validateUpdateTransaction(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Update transaction
  const transaction = await updateTransaction(id, req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Transaction updated successfully',
    data: {
      transaction
    }
  });
});

/**
 * Delete transaction
 * @route DELETE /api/transactions/:id
 * @access Private
 */
const deleteTransactionHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Delete transaction
  const result = await deleteTransaction(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Transaction deleted successfully',
    data: {
      deletedTransaction: result.deletedTransaction,
      investmentName: result.investmentName,
      balanceAdjustment: result.balanceAdjustment,
      newBalance: result.newBalance
    }
  });
});

/**
 * Get transaction statistics for user
 * @route GET /api/transactions/statistics
 * @access Private
 */
const getTransactionStatisticsHandler = asyncHandler(async (req, res) => {
  // Validate query parameters
  const validation = validateTransactionStatsQuery(req.query);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Get statistics
  const statistics = await getTransactionStatistics(req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Transaction statistics retrieved successfully',
    data: {
      statistics
    }
  });
});

/**
 * Get investment transaction summary
 * @route GET /api/transactions/investment/:investmentId/summary
 * @access Private
 */
const getInvestmentTransactionSummaryHandler = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  // Get investment transaction summary
  const summary = await getInvestmentTransactionSummary(investmentId, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Investment transaction summary retrieved successfully',
    data: {
      summary
    }
  });
});

/**
 * Get recent transactions for user (dashboard widget)
 * @route GET /api/transactions/recent
 * @access Private
 */
const getRecentTransactionsHandler = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  // Get recent transactions with a fixed filter
  const result = await getUserTransactions(req.user.id, {
    limit: Math.min(limit, 50), // Cap at 50
    offset: 0,
    sortBy: 'transactionDate',
    sortOrder: 'desc'
  });

  res.status(200).json({
    success: true,
    message: 'Recent transactions retrieved successfully',
    data: {
      transactions: result.transactions,
      total: result.pagination.total
    }
  });
});

/**
 * Get transaction summary by type for user
 * @route GET /api/transactions/summary/by-type
 * @access Private
 */
const getTransactionSummaryByTypeHandler = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Validate date range if provided
  if ((startDate && !endDate) || (!startDate && endDate)) {
    return res.status(400).json({
      success: false,
      error: 'Both startDate and endDate must be provided together',
      code: 'INVALID_DATE_RANGE'
    });
  }

  // Get statistics grouped by type
  const statistics = await getTransactionStatistics(req.user.id, {
    startDate,
    endDate,
    groupBy: 'type'
  });

  res.status(200).json({
    success: true,
    message: 'Transaction summary by type retrieved successfully',
    data: {
      overall: statistics.overall,
      breakdown: statistics.groups.reduce((acc, group) => {
        acc[group.type.toLowerCase()] = {
          totalAmount: group.totalAmount,
          transactionCount: group.transactionCount,
          averageAmount: group.averageAmount
        };
        return acc;
      }, {
        return: { totalAmount: 0, transactionCount: 0, averageAmount: 0 },
        withdrawal: { totalAmount: 0, transactionCount: 0, averageAmount: 0 },
        deposit: { totalAmount: 0, transactionCount: 0, averageAmount: 0 },
        dividend: { totalAmount: 0, transactionCount: 0, averageAmount: 0 }
      })
    }
  });
});

/**
 * Get transaction trends (monthly aggregation)
 * @route GET /api/transactions/trends
 * @access Private
 */
const getTransactionTrendsHandler = asyncHandler(async (req, res) => {
  const { months = 12 } = req.query;
  
  // Validate months parameter
  const monthsNum = parseInt(months);
  if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 24) {
    return res.status(400).json({
      success: false,
      error: 'Months must be a number between 1 and 24',
      code: 'INVALID_MONTHS_PARAMETER'
    });
  }

  // Calculate start date
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsNum);
  startDate.setDate(1); // First day of the month

  // Get monthly transaction data
  const monthlyData = await prisma.transaction.findMany({
    where: {
      investment: {
        userId: req.user.id
      },
      transactionDate: {
        gte: startDate
      }
    },
    select: {
      amount: true,
      type: true,
      transactionDate: true
    },
    orderBy: {
      transactionDate: 'asc'
    }
  });

  // Group by month
  const monthlyTrends = {};
  monthlyData.forEach(transaction => {
    const monthKey = transaction.transactionDate.toISOString().substring(0, 7); // YYYY-MM
    
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = {
        month: monthKey,
        totalAmount: 0,
        transactionCount: 0,
        types: {
          RETURN: { amount: 0, count: 0 },
          WITHDRAWAL: { amount: 0, count: 0 },
          DEPOSIT: { amount: 0, count: 0 },
          DIVIDEND: { amount: 0, count: 0 }
        }
      };
    }
    
    monthlyTrends[monthKey].totalAmount += transaction.amount;
    monthlyTrends[monthKey].transactionCount += 1;
    monthlyTrends[monthKey].types[transaction.type].amount += transaction.amount;
    monthlyTrends[monthKey].types[transaction.type].count += 1;
  });

  const trends = Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month));

  res.status(200).json({
    success: true,
    message: 'Transaction trends retrieved successfully',
    data: {
      trends,
      period: {
        months: monthsNum,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    }
  });
});

module.exports = {
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
};
