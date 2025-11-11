const {
  getDashboardData,
  getPortfolioSummary,
  getPerformanceTrends,
  getAssetAllocation,
  generateFinancialReport
} = require('../services/reportService');

const { asyncHandler } = require('../middleware/errorHandler');
const Joi = require('joi');

/**
 * Get dashboard data for user
 * @route GET /api/reports/dashboard
 * @access Private
 */
const getDashboardHandler = asyncHandler(async (req, res) => {
  // Get dashboard data
  const dashboardData = await getDashboardData(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: dashboardData
  });
});

/**
 * Get comprehensive portfolio summary
 * @route GET /api/reports/portfolio-summary
 * @access Private
 */
const getPortfolioSummaryHandler = asyncHandler(async (req, res) => {
  // Get portfolio summary
  const portfolioSummary = await getPortfolioSummary(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Portfolio summary retrieved successfully',
    data: portfolioSummary
  });
});

/**
 * Get performance trends over time
 * @route GET /api/reports/performance-trends
 * @access Private
 */
const getPerformanceTrendsHandler = asyncHandler(async (req, res) => {
  // Validate query parameters
  const schema = Joi.object({
    months: Joi.number()
      .integer()
      .min(1)
      .max(24)
      .default(12)
      .optional(),
    investmentId: Joi.string()
      .uuid()
      .optional()
  });

  const { error, value } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      code: 'VALIDATION_ERROR'
    });
  }

  // Get performance trends
  const performanceTrends = await getPerformanceTrends(req.user.id, value);

  res.status(200).json({
    success: true,
    message: 'Performance trends retrieved successfully',
    data: performanceTrends
  });
});

/**
 * Get asset allocation breakdown
 * @route GET /api/reports/asset-allocation
 * @access Private
 */
const getAssetAllocationHandler = asyncHandler(async (req, res) => {
  // Get asset allocation
  const assetAllocation = await getAssetAllocation(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Asset allocation retrieved successfully',
    data: assetAllocation
  });
});

/**
 * Generate comprehensive financial report
 * @route POST /api/reports/financial-report
 * @access Private
 */
const generateFinancialReportHandler = asyncHandler(async (req, res) => {
  // Validate request body
  const schema = Joi.object({
    includeTransactions: Joi.boolean()
      .default(false)
      .optional(),
    period: Joi.string()
      .valid('all', 'ytd', 'last12months', 'last6months')
      .default('all')
      .optional(),
    format: Joi.string()
      .valid('json')
      .default('json')
      .optional()
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      code: 'VALIDATION_ERROR'
    });
  }

  // Generate financial report
  const financialReport = await generateFinancialReport(req.user.id, value);

  res.status(200).json({
    success: true,
    message: 'Financial report generated successfully',
    data: financialReport
  });
});

/**
 * Get quick stats for header/widget display
 * @route GET /api/reports/quick-stats
 * @access Private
 */
const getQuickStatsHandler = asyncHandler(async (req, res) => {
  // Get basic portfolio metrics quickly
  const [investmentSummary, transactionSummary] = await Promise.all([
    require('../config/database').prisma.investment.aggregate({
      where: { userId: req.user.id },
      _sum: {
        initialAmount: true,
        currentBalance: true
      },
      _count: {
        _all: true
      }
    }),
    require('../config/database').prisma.transaction.aggregate({
      where: {
        investment: {
          userId: req.user.id
        },
        transactionDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    })
  ]);

  const totalPrincipal = investmentSummary._sum.initialAmount || 0;
  const totalCurrentValue = investmentSummary._sum.currentBalance || 0;
  const totalReturns = totalCurrentValue - totalPrincipal;
  const returnPercentage = totalPrincipal > 0 ? (totalReturns / totalPrincipal) * 100 : 0;

  res.status(200).json({
    success: true,
    message: 'Quick stats retrieved successfully',
    data: {
      totalInvestments: investmentSummary._count._all || 0,
      totalPortfolioValue: totalCurrentValue,
      totalReturns,
      returnPercentage,
      thisMonth: {
        transactionCount: transactionSummary._count._all || 0,
        transactionAmount: transactionSummary._sum.amount || 0
      }
    }
  });
});

/**
 * Get investment comparison data
 * @route POST /api/reports/investment-comparison
 * @access Private
 */
const getInvestmentComparisonHandler = asyncHandler(async (req, res) => {
  // Validate request body
  const schema = Joi.object({
    investmentIds: Joi.array()
      .items(Joi.string().uuid())
      .min(2)
      .max(10)
      .required()
      .messages({
        'array.min': 'At least 2 investments are required for comparison',
        'array.max': 'Cannot compare more than 10 investments at once'
      })
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      code: 'VALIDATION_ERROR'
    });
  }

  // Get investment details for comparison
  const investments = await require('../config/database').prisma.investment.findMany({
    where: {
      id: {
        in: value.investmentIds
      },
      userId: req.user.id // Ensure user owns all investments
    },
    select: {
      id: true,
      name: true,
      category: true,
      initialAmount: true,
      currentBalance: true,
      returnType: true,
      interestRate: true,
      startDate: true,
      status: true,
      _count: {
        select: {
          transactions: true
        }
      }
    }
  });

  if (investments.length !== value.investmentIds.length) {
    return res.status(404).json({
      success: false,
      error: 'One or more investments not found',
      code: 'INVESTMENT_NOT_FOUND'
    });
  }

  // Calculate comparison metrics
  const comparison = investments.map(investment => {
    const returnCalc = require('../utils/calculations').calculateReturnPercentage(
      parseFloat(investment.initialAmount),
      parseFloat(investment.currentBalance)
    );
    
    const age = require('../utils/calculations').calculateYearsBetween(investment.startDate, new Date());
    const annualizedReturn = age > 0 
      ? (Math.pow(parseFloat(investment.currentBalance) / parseFloat(investment.initialAmount), 1 / age) - 1) * 100
      : 0;

    return {
      id: investment.id,
      name: investment.name,
      category: investment.category,
      initialAmount: parseFloat(investment.initialAmount),
      currentBalance: parseFloat(investment.currentBalance),
      absoluteReturn: returnCalc.absoluteReturn,
      returnPercentage: returnCalc.returnPercentage,
      annualizedReturn,
      age,
      transactionCount: investment._count.transactions,
      returnType: investment.returnType,
      interestRate: investment.interestRate,
      status: investment.status
    };
  });

  // Calculate summary statistics
  const summary = {
    bestPerformer: comparison.reduce((best, current) => 
      current.returnPercentage > best.returnPercentage ? current : best
    ),
    worstPerformer: comparison.reduce((worst, current) => 
      current.returnPercentage < worst.returnPercentage ? current : worst
    ),
    averageReturn: comparison.reduce((sum, inv) => sum + inv.returnPercentage, 0) / comparison.length,
    totalValue: comparison.reduce((sum, inv) => sum + inv.currentBalance, 0)
  };

  res.status(200).json({
    success: true,
    message: 'Investment comparison data retrieved successfully',
    data: {
      investments: comparison,
      summary
    }
  });
});

/**
 * Get monthly breakdown for specific year
 * @route GET /api/reports/monthly-breakdown/:year
 * @access Private
 */
const getMonthlyBreakdownHandler = asyncHandler(async (req, res) => {
  const { year } = req.params;
  
  // Validate year parameter
  const currentYear = new Date().getFullYear();
  const requestedYear = parseInt(year);
  
  if (isNaN(requestedYear) || requestedYear < 2000 || requestedYear > currentYear + 1) {
    return res.status(400).json({
      success: false,
      error: 'Invalid year parameter',
      code: 'INVALID_YEAR'
    });
  }

  // Get monthly transaction data for the year
  const startDate = new Date(requestedYear, 0, 1);
  const endDate = new Date(requestedYear, 11, 31, 23, 59, 59);

  const transactions = await require('../config/database').prisma.transaction.findMany({
    where: {
      investment: {
        userId: req.user.id
      },
      transactionDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      amount: true,
      type: true,
      transactionDate: true,
      investment: {
        select: {
          name: true,
          category: true
        }
      }
    }
  });

  // Group by month
  const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthTransactions = transactions.filter(t => 
      t.transactionDate.getMonth() === index
    );

    return {
      month,
      monthName: new Date(requestedYear, index).toLocaleString('default', { month: 'long' }),
      transactions: monthTransactions.length,
      totalAmount: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
      breakdown: {
        returns: monthTransactions.filter(t => t.type === 'RETURN').reduce((sum, t) => sum + t.amount, 0),
        withdrawals: monthTransactions.filter(t => t.type === 'WITHDRAWAL').reduce((sum, t) => sum + Math.abs(t.amount), 0),
        deposits: monthTransactions.filter(t => t.type === 'DEPOSIT').reduce((sum, t) => sum + t.amount, 0),
        dividends: monthTransactions.filter(t => t.type === 'DIVIDEND').reduce((sum, t) => sum + t.amount, 0)
      }
    };
  });

  const yearSummary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    totalReturns: monthlyBreakdown.reduce((sum, m) => sum + m.breakdown.returns, 0),
    totalWithdrawals: monthlyBreakdown.reduce((sum, m) => sum + m.breakdown.withdrawals, 0),
    totalDeposits: monthlyBreakdown.reduce((sum, m) => sum + m.breakdown.deposits, 0),
    totalDividends: monthlyBreakdown.reduce((sum, m) => sum + m.breakdown.dividends, 0)
  };

  res.status(200).json({
    success: true,
    message: `Monthly breakdown for ${year} retrieved successfully`,
    data: {
      year: requestedYear,
      monthlyBreakdown,
      yearSummary
    }
  });
});

module.exports = {
  getDashboardHandler,
  getPortfolioSummaryHandler,
  getPerformanceTrendsHandler,
  getAssetAllocationHandler,
  generateFinancialReportHandler,
  getQuickStatsHandler,
  getInvestmentComparisonHandler,
  getMonthlyBreakdownHandler
};
