const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { calculatePortfolioMetrics, calculateReturnPercentage, calculateYearsBetween } = require('../utils/calculations');

/**
 * Get comprehensive dashboard data for user
 * @param {string} userId - User ID
 * @returns {Object} Dashboard data with all key metrics
 * @throws {AppError} If calculation fails
 */
async function getDashboardData(userId) {
  try {
    // Get user investments summary
    const investmentSummary = await prisma.investment.aggregate({
      where: { userId },
      _sum: {
        principalAmount: true,
        currentBalance: true
      },
      _count: {
        _all: true
      }
    });

    // Get investment status breakdown
    const statusBreakdown = await prisma.investment.groupBy({
      by: ['status'],
      where: { userId },
      _sum: {
        principalAmount: true,
        currentBalance: true
      },
      _count: {
        _all: true
      }
    });

    // Get recent transactions (last 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        investment: {
          userId
        }
      },
      orderBy: {
        transactionDate: 'desc'
      },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        transactionDate: true,
        investment: {
          select: {
            name: true
          }
        }
      }
    });

    // Get transaction summary for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactionSummary = await prisma.transaction.aggregate({
      where: {
        investment: {
          userId
        },
        transactionDate: {
          gte: thirtyDaysAgo
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    });

    // Get top performing investments
    const allInvestments = await prisma.investment.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        principalAmount: true,
        currentBalance: true,
        returnType: true,
        status: true,
        startDate: true
      }
    });

    const investmentsWithReturns = allInvestments.map(investment => {
      const returnPercentage = investment.principalAmount > 0 
        ? ((investment.currentBalance - investment.principalAmount) / investment.principalAmount) * 100 
        : 0;

      const investmentAge = calculateYearsBetween(investment.startDate, new Date());
      const annualizedReturn = investmentAge > 0 
        ? (Math.pow(investment.currentBalance / investment.principalAmount, 1 / investmentAge) - 1) * 100
        : 0;

      return {
        ...investment,
        absoluteReturn: investment.currentBalance - investment.principalAmount,
        returnPercentage,
        annualizedReturn
      };
    });

    // Sort by return percentage for top performers
    const topPerformers = investmentsWithReturns
      .filter(inv => inv.status === 'ACTIVE')
      .sort((a, b) => b.returnPercentage - a.returnPercentage)
      .slice(0, 5);

    // Calculate total returns
    const totalPrincipal = investmentSummary._sum.principalAmount || 0;
    const totalCurrentValue = investmentSummary._sum.currentBalance || 0;
    const totalReturns = totalCurrentValue - totalPrincipal;
    const portfolioReturnPercentage = totalPrincipal > 0 ? (totalReturns / totalPrincipal) * 100 : 0;

    // Format status breakdown
    const formattedStatusBreakdown = statusBreakdown.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = {
        count: item._count._all || 0,
        principal: item._sum.principalAmount || 0,
        currentValue: item._sum.currentBalance || 0,
        returns: (item._sum.currentBalance || 0) - (item._sum.principalAmount || 0)
      };
      return acc;
    }, {
      active: { count: 0, principal: 0, currentValue: 0, returns: 0 },
      completed: { count: 0, principal: 0, currentValue: 0, returns: 0 },
      cancelled: { count: 0, principal: 0, currentValue: 0, returns: 0 }
    });

    return {
      portfolio: {
        totalInvestments: investmentSummary._count._all || 0,
        totalPrincipal,
        totalCurrentValue,
        totalReturns,
        returnPercentage: portfolioReturnPercentage
      },
      statusBreakdown: formattedStatusBreakdown,
      recentActivity: {
        transactions: recentTransactions,
        last30Days: {
          transactionCount: recentTransactionSummary._count._all || 0,
          totalAmount: recentTransactionSummary._sum.amount || 0
        }
      },
      topPerformers,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get dashboard data error:', error);
    throw new AppError(
      'Failed to generate dashboard data',
      500,
      'DASHBOARD_DATA_ERROR'
    );
  }
}

/**
 * Get detailed portfolio summary with performance metrics
 * @param {string} userId - User ID
 * @returns {Object} Portfolio summary with detailed metrics
 * @throws {AppError} If calculation fails
 */
async function getPortfolioSummary(userId) {
  try {
    // Get all user investments with transaction counts
    const investments = await prisma.investment.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        category: true,
        principalAmount: true,
        currentBalance: true,
        returnType: true,
        interestRate: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    if (investments.length === 0) {
      return {
        summary: {
          totalInvestments: 0,
          totalPrincipal: 0,
          totalCurrentValue: 0,
          totalReturns: 0,
          returnPercentage: 0,
          averageReturn: 0
        },
        categoryBreakdown: [],
        performanceMetrics: {
          bestPerforming: null,
          worstPerforming: null,
          averageAge: 0,
          totalTransactions: 0
        },
        investments: []
      };
    }

    // Calculate portfolio metrics using utility function
    const portfolioMetrics = calculatePortfolioMetrics(investments);

    // Calculate category breakdown
    const categoryMap = new Map();
    investments.forEach(investment => {
      const category = investment.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          count: 0,
          principal: 0,
          currentValue: 0,
          returns: 0
        });
      }
      const categoryData = categoryMap.get(category);
      categoryData.count += 1;
      categoryData.principal += parseFloat(investment.principalAmount);
      categoryData.currentValue += parseFloat(investment.currentBalance);
      categoryData.returns += parseFloat(investment.currentBalance) - parseFloat(investment.principalAmount);
    });

    const categoryBreakdown = Array.from(categoryMap.values()).map(category => ({
      ...category,
      returnPercentage: category.principal > 0 ? (category.returns / category.principal) * 100 : 0
    }));

    // Calculate additional performance metrics
    const totalTransactions = investments.reduce((sum, inv) => sum + inv._count.transactions, 0);
    
    const averageAge = investments.length > 0 
      ? investments.reduce((sum, inv) => {
          return sum + calculateYearsBetween(inv.startDate, new Date());
        }, 0) / investments.length 
      : 0;

    // Enrich investments with calculated metrics
    const enrichedInvestments = investments.map(investment => {
      const returnCalc = calculateReturnPercentage(
        parseFloat(investment.principalAmount),
        parseFloat(investment.currentBalance)
      );
      
      const age = calculateYearsBetween(investment.startDate, new Date());
      const annualizedReturn = age > 0 
        ? (Math.pow(parseFloat(investment.currentBalance) / parseFloat(investment.principalAmount), 1 / age) - 1) * 100
        : 0;

      return {
        ...investment,
        principalAmount: parseFloat(investment.principalAmount),
        currentBalance: parseFloat(investment.currentBalance),
        absoluteReturn: returnCalc.absoluteReturn,
        returnPercentage: returnCalc.returnPercentage,
        annualizedReturn,
        age,
        transactionCount: investment._count.transactions
      };
    });

    return {
      summary: {
        totalInvestments: portfolioMetrics.numberOfInvestments,
        totalPrincipal: portfolioMetrics.totalPrincipal,
        totalCurrentValue: portfolioMetrics.totalCurrentValue,
        totalReturns: portfolioMetrics.totalReturns,
        returnPercentage: portfolioMetrics.returnPercentage,
        averageReturn: portfolioMetrics.averageReturn
      },
      categoryBreakdown,
      performanceMetrics: {
        bestPerforming: portfolioMetrics.bestPerforming,
        worstPerforming: portfolioMetrics.worstPerforming,
        averageAge,
        totalTransactions
      },
      investments: enrichedInvestments
    };
  } catch (error) {
    console.error('Get portfolio summary error:', error);
    throw new AppError(
      'Failed to generate portfolio summary',
      500,
      'PORTFOLIO_SUMMARY_ERROR'
    );
  }
}

/**
 * Get investment performance trends over time
 * @param {string} userId - User ID
 * @param {Object} options - Options for trend analysis
 * @returns {Object} Performance trends data
 * @throws {AppError} If calculation fails
 */
async function getPerformanceTrends(userId, options = {}) {
  try {
    const { months = 12, investmentId = null } = options;
    
    // Calculate start date
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);

    // Build where clause
    const where = {
      investment: {
        userId
      },
      transactionDate: {
        gte: startDate
      }
    };

    if (investmentId) {
      where.investmentId = investmentId;
    }

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        type: true,
        transactionDate: true,
        investment: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        transactionDate: 'asc'
      }
    });

    // Group by month
    const monthlyData = new Map();
    
    transactions.forEach(transaction => {
      const monthKey = transaction.transactionDate.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          totalReturn: 0,
          totalWithdrawal: 0,
          totalDeposit: 0,
          totalDividend: 0,
          netFlow: 0,
          transactionCount: 0
        });
      }
      
      const monthData = monthlyData.get(monthKey);
      monthData.transactionCount += 1;
      
      switch (transaction.type) {
        case 'RETURN':
          monthData.totalReturn += transaction.amount;
          monthData.netFlow += transaction.amount;
          break;
        case 'WITHDRAWAL':
          monthData.totalWithdrawal += Math.abs(transaction.amount);
          monthData.netFlow -= Math.abs(transaction.amount);
          break;
        case 'DEPOSIT':
          monthData.totalDeposit += transaction.amount;
          monthData.netFlow += transaction.amount;
          break;
        case 'DIVIDEND':
          monthData.totalDividend += transaction.amount;
          monthData.netFlow += transaction.amount;
          break;
      }
    });

    // Fill in missing months with zero values
    const trends = [];
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - months + i + 1);
      const monthKey = date.toISOString().substring(0, 7);
      
      trends.push(monthlyData.get(monthKey) || {
        month: monthKey,
        totalReturn: 0,
        totalWithdrawal: 0,
        totalDeposit: 0,
        totalDividend: 0,
        netFlow: 0,
        transactionCount: 0
      });
    }

    return {
      period: {
        months,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      trends,
      summary: {
        totalReturn: trends.reduce((sum, month) => sum + month.totalReturn, 0),
        totalWithdrawal: trends.reduce((sum, month) => sum + month.totalWithdrawal, 0),
        totalDeposit: trends.reduce((sum, month) => sum + month.totalDeposit, 0),
        totalDividend: trends.reduce((sum, month) => sum + month.totalDividend, 0),
        netFlow: trends.reduce((sum, month) => sum + month.netFlow, 0),
        totalTransactions: trends.reduce((sum, month) => sum + month.transactionCount, 0)
      }
    };
  } catch (error) {
    console.error('Get performance trends error:', error);
    throw new AppError(
      'Failed to generate performance trends',
      500,
      'PERFORMANCE_TRENDS_ERROR'
    );
  }
}

/**
 * Get asset allocation breakdown
 * @param {string} userId - User ID
 * @returns {Object} Asset allocation data
 * @throws {AppError} If calculation fails
 */
async function getAssetAllocation(userId) {
  try {
    const investments = await prisma.investment.findMany({
      where: { 
        userId,
        status: 'ACTIVE' // Only include active investments
      },
      select: {
        category: true,
        currentBalance: true,
        returnType: true
      }
    });

    if (investments.length === 0) {
      return {
        totalValue: 0,
        categoryAllocation: [],
        typeAllocation: []
      };
    }

    const totalValue = investments.reduce((sum, inv) => sum + parseFloat(inv.currentBalance), 0);

    // Group by category
    const categoryMap = new Map();
    investments.forEach(investment => {
      const category = investment.category;
      const value = parseFloat(investment.currentBalance);
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, 0);
      }
      categoryMap.set(category, categoryMap.get(category) + value);
    });

    // Group by return type
    const typeMap = new Map();
    investments.forEach(investment => {
      const type = investment.returnType;
      const value = parseFloat(investment.currentBalance);
      
      if (!typeMap.has(type)) {
        typeMap.set(type, 0);
      }
      typeMap.set(type, typeMap.get(type) + value);
    });

    const categoryAllocation = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    const typeAllocation = Array.from(typeMap.entries()).map(([type, value]) => ({
      type,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    }));

    return {
      totalValue,
      categoryAllocation,
      typeAllocation
    };
  } catch (error) {
    console.error('Get asset allocation error:', error);
    throw new AppError(
      'Failed to generate asset allocation',
      500,
      'ASSET_ALLOCATION_ERROR'
    );
  }
}

/**
 * Generate comprehensive financial report
 * @param {string} userId - User ID
 * @param {Object} options - Report options
 * @returns {Object} Comprehensive financial report
 * @throws {AppError} If generation fails
 */
async function generateFinancialReport(userId, options = {}) {
  try {
    const { includeTransactions = false, period = 'all' } = options;
    
    // Get all required data
    const [dashboardData, portfolioSummary, performanceTrends, assetAllocation] = await Promise.all([
      getDashboardData(userId),
      getPortfolioSummary(userId),
      getPerformanceTrends(userId, { months: 12 }),
      getAssetAllocation(userId)
    ]);

    let transactionHistory = null;
    if (includeTransactions) {
      transactionHistory = await prisma.transaction.findMany({
        where: {
          investment: {
            userId
          }
        },
        select: {
          id: true,
          type: true,
          amount: true,
          transactionDate: true,
          description: true,
          investment: {
            select: {
              name: true,
              category: true
            }
          }
        },
        orderBy: {
          transactionDate: 'desc'
        },
        take: 100 // Limit to last 100 transactions
      });
    }

    return {
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        period,
        includeTransactions
      },
      executiveSummary: {
        totalPortfolioValue: dashboardData.portfolio.totalCurrentValue,
        totalReturns: dashboardData.portfolio.totalReturns,
        returnPercentage: dashboardData.portfolio.returnPercentage,
        activeInvestments: dashboardData.statusBreakdown.active.count,
        totalInvestments: dashboardData.portfolio.totalInvestments
      },
      dashboardData,
      portfolioSummary,
      performanceTrends,
      assetAllocation,
      ...(includeTransactions && { transactionHistory })
    };
  } catch (error) {
    console.error('Generate financial report error:', error);
    throw new AppError(
      'Failed to generate financial report',
      500,
      'FINANCIAL_REPORT_ERROR'
    );
  }
}

module.exports = {
  getDashboardData,
  getPortfolioSummary,
  getPerformanceTrends,
  getAssetAllocation,
  generateFinancialReport
};
