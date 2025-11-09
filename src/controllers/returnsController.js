const {
  addManualReturn,
  getInvestmentReturns,
  calculateProjectedReturns,
  calculateNextMonthlyReturn,
  bulkAddReturns
} = require('../services/returnsService');

const {
  validateManualReturn,
  validateCalculateInterest,
  validateProjectedReturns,
  validateReturnsQueryFilters,
  validateBulkReturns
} = require('../validators/returnsValidator');

const { asyncHandler } = require('../middleware/errorHandler');
const { prisma } = require('../config/database');

const {
  calculateCompoundInterest,
  calculateFutureValueWithContributions
} = require('../utils/calculations');

/**
 * Add manual return to investment
 * @route POST /api/returns/manual
 * @access Private
 */
const addManualReturnHandler = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateManualReturn(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  const { investmentId, ...returnData } = validation.data;

  // Add manual return
  const result = await addManualReturn(investmentId, req.user.id, returnData);

  res.status(201).json({
    success: true,
    message: 'Manual return added successfully',
    data: {
      investment: result.investment,
      transaction: result.transaction
    }
  });
});

/**
 * Get returns for specific investment
 * @route GET /api/returns/:investmentId
 * @access Private
 */
const getInvestmentReturnsHandler = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  // Validate query parameters
  const validation = validateReturnsQueryFilters(req.query);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Get investment returns
  const result = await getInvestmentReturns(investmentId, req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Investment returns retrieved successfully',
    data: {
      returns: result.returns,
      summary: result.summary,
      pagination: result.pagination
    }
  });
});

/**
 * Calculate compound interest (utility endpoint)
 * @route POST /api/returns/calculate
 * @access Private
 */
const calculateCompoundInterestHandler = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateCalculateInterest(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  const { principal, annualRate, compoundingFrequency, years, monthlyContribution } = validation.data;

  let result;
  
  if (monthlyContribution && monthlyContribution > 0) {
    // Calculate future value with monthly contributions
    result = calculateFutureValueWithContributions(
      principal,
      monthlyContribution,
      annualRate,
      years
    );
  } else {
    // Calculate compound interest
    result = calculateCompoundInterest(
      principal,
      annualRate,
      compoundingFrequency,
      years
    );
  }

  res.status(200).json({
    success: true,
    message: 'Compound interest calculated successfully',
    data: {
      calculation: result,
      parameters: validation.data
    }
  });
});

/**
 * Calculate projected returns for investment
 * @route POST /api/returns/:investmentId/projections
 * @access Private
 */
const calculateProjectedReturnsHandler = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  // Validate input
  const validation = validateProjectedReturns(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Calculate projected returns
  const result = await calculateProjectedReturns(investmentId, req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Projected returns calculated successfully',
    data: result
  });
});

/**
 * Calculate next monthly return for fixed-rate investment
 * @route GET /api/returns/:investmentId/next-monthly
 * @access Private
 */
const calculateNextMonthlyReturnHandler = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  // Calculate next monthly return
  const result = await calculateNextMonthlyReturn(investmentId, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Next monthly return calculated successfully',
    data: result
  });
});

/**
 * Apply next monthly return to fixed-rate investment
 * @route POST /api/returns/:investmentId/apply-monthly
 * @access Private
 */
const applyMonthlyReturnHandler = asyncHandler(async (req, res) => {
  const { investmentId } = req.params;

  // First calculate the monthly return
  const monthlyCalc = await calculateNextMonthlyReturn(investmentId, req.user.id);
  
  // Apply the calculated monthly return
  const returnData = {
    amount: monthlyCalc.nextMonthlyReturn.monthlyReturn,
    transactionDate: new Date(),
    description: `Monthly return - ${monthlyCalc.nextMonthlyReturn.monthlyRate * 100}% of ${monthlyCalc.nextMonthlyReturn.currentBalance}`,
    type: 'RETURN'
  };

  const result = await addManualReturn(investmentId, req.user.id, returnData);

  res.status(201).json({
    success: true,
    message: 'Monthly return applied successfully',
    data: {
      investment: result.investment,
      transaction: result.transaction,
      calculation: monthlyCalc.nextMonthlyReturn
    }
  });
});

/**
 * Bulk add returns to multiple investments
 * @route POST /api/returns/bulk
 * @access Private
 */
const bulkAddReturnsHandler = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateBulkReturns(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Process bulk returns
  const result = await bulkAddReturns(validation.data.returnEntries, req.user.id);

  const statusCode = result.failed > 0 ? 207 : 201; // 207 Multi-Status if some failed

  res.status(statusCode).json({
    success: true,
    message: `Bulk returns processed: ${result.successful} successful, ${result.failed} failed`,
    data: result
  });
});

/**
 * Get returns summary across all investments for user
 * @route GET /api/returns/summary
 * @access Private
 */
const getReturnsSummaryHandler = asyncHandler(async (req, res) => {
  // Get all user transactions summary
  const transactionSummary = await prisma.transaction.aggregate({
    where: {
      investment: {
        userId: req.user.id
      }
    },
    _sum: {
      amount: true
    },
    _count: {
      _all: true
    }
  });

  // Group by transaction type
  const transactionsByType = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      investment: {
        userId: req.user.id
      }
    },
    _sum: {
      amount: true
    },
    _count: {
      _all: true
    }
  });

  // Get monthly returns summary (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyReturns = await prisma.transaction.groupBy({
    by: ['transactionDate'],
    where: {
      investment: {
        userId: req.user.id
      },
      transactionDate: {
        gte: twelveMonthsAgo
      }
    },
    _sum: {
      amount: true
    },
    _count: {
      _all: true
    },
    orderBy: {
      transactionDate: 'desc'
    },
    take: 12
  });

  const typeBreakdown = transactionsByType.reduce((acc, item) => {
    acc[item.type.toLowerCase()] = {
      total: item._sum.amount || 0,
      count: item._count._all || 0
    };
    return acc;
  }, {
    return: { total: 0, count: 0 },
    withdrawal: { total: 0, count: 0 },
    deposit: { total: 0, count: 0 },
    dividend: { total: 0, count: 0 }
  });

  res.status(200).json({
    success: true,
    message: 'Returns summary retrieved successfully',
    data: {
      overall: {
        totalAmount: transactionSummary._sum.amount || 0,
        totalTransactions: transactionSummary._count._all || 0
      },
      typeBreakdown,
      monthlyReturns: monthlyReturns.map(item => ({
        date: item.transactionDate,
        amount: item._sum.amount || 0,
        count: item._count._all || 0
      }))
    }
  });
});

module.exports = {
  addManualReturnHandler,
  getInvestmentReturnsHandler,
  calculateCompoundInterestHandler,
  calculateProjectedReturnsHandler,
  calculateNextMonthlyReturnHandler,
  applyMonthlyReturnHandler,
  bulkAddReturnsHandler,
  getReturnsSummaryHandler
};
