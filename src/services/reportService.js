const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { calculatePortfolioMetrics, calculateReturnPercentage, calculateYearsBetween } = require('../utils/calculations');
const { DEFAULT_BASE, normalizeCurrency, convertAmount, getRatesAt } = require('../utils/currency');

/**
 * Get comprehensive dashboard data for user
 * @param {string} userId - User ID
 * @returns {Object} Dashboard data with all key metrics
 * @throws {AppError} If calculation fails
 */
async function getDashboardData(userId, options = {}) {
  try {
    // Get total investments count
    const totalInvestments = await prisma.investment.count({
      where: { userId }
    });

    // Get investment status breakdown
    const statusBreakdown = await prisma.investment.groupBy({
      by: ['status'],
      where: { userId },
      _sum: {
        initialAmount: true,
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
        initialAmount: true,
        currentBalance: true,
        returnType: true,
        status: true,
        startDate: true
      }
    });

    const investmentsWithReturns = allInvestments.map(investment => {
      const returnPercentage = investment.initialAmount > 0 
        ? ((investment.currentBalance - investment.initialAmount) / investment.initialAmount) * 100 
        : 0;

      const investmentAge = calculateYearsBetween(investment.startDate, new Date());
      const annualizedReturn = investmentAge > 0 
        ? (Math.pow(investment.currentBalance / investment.initialAmount, 1 / investmentAge) - 1) * 100
        : 0;

      return {
        ...investment,
        absoluteReturn: investment.currentBalance - investment.initialAmount,
        returnPercentage,
        annualizedReturn
      };
    });

    // Sort by return percentage for top performers
    const topPerformers = investmentsWithReturns
      .filter(inv => inv.status === 'ACTIVE')
      .sort((a, b) => b.returnPercentage - a.returnPercentage)
      .slice(0, 5);

    // Base-currency totals
    const baseCurrency = normalizeCurrency(options.baseCurrency || DEFAULT_BASE);
    const ratesAt = getRatesAt();
    const investmentsForBase = await prisma.investment.findMany({
      where: { userId },
      select: { initialAmount: true, currentBalance: true, currency: true, category: true }
    });
    let totalPrincipalBase = 0;
    let totalCurrentValueBase = 0;
    for (const inv of investmentsForBase) {
      const p = convertAmount(parseFloat(inv.initialAmount), inv.currency, baseCurrency);
      const c = convertAmount(parseFloat(inv.currentBalance), inv.currency, baseCurrency);
      totalPrincipalBase += p || 0;
      totalCurrentValueBase += c || 0;
    }
    const totalReturnsBase = totalCurrentValueBase - totalPrincipalBase;

    // Asset allocation by category (percentages, using base-currency values)
    const categorySumsBase = new Map();
    for (const inv of investmentsForBase) {
      const cat = inv.category || 'UNCATEGORIZED';
      const valBase = convertAmount(parseFloat(inv.currentBalance), inv.currency, baseCurrency) || 0;
      categorySumsBase.set(cat, (categorySumsBase.get(cat) || 0) + valBase);
    }
    const totalAllocationBase = Array.from(categorySumsBase.values()).reduce((sum, v) => sum + v, 0);
    const assetAllocation = {};
    if (totalAllocationBase > 0) {
      // Build entries with exact percentages and fractional parts
      const entries = Array.from(categorySumsBase.entries()).map(([cat, val]) => {
        const exact = (val / totalAllocationBase) * 100;
        const base = Math.floor(exact);
        const frac = exact - base;
        return { cat, base, frac };
      });

      // Distribute remainder to ensure sum exactly 100
      let sumBase = entries.reduce((s, e) => s + e.base, 0);
      let remainder = 100 - sumBase;
      if (remainder > 0) {
        // Add 1 to categories with largest fractional parts
        entries.sort((a, b) => b.frac - a.frac);
        for (let i = 0; i < remainder && i < entries.length; i++) entries[i].base += 1;
      } else if (remainder < 0) {
        // Remove 1 from categories with smallest fractional parts (handle float errors)
        entries.sort((a, b) => a.frac - b.frac);
        for (let i = 0; i < -remainder && i < entries.length; i++) {
          if (entries[i].base > 0) entries[i].base -= 1;
        }
      }

      // Construct final integer percentage allocation
      for (const e of entries) assetAllocation[e.cat] = e.base;
    }

    // Per-currency totals
    const currencyBreakdownRaw = await prisma.investment.groupBy({
      by: ['currency'],
      where: { userId },
      _sum: {
        initialAmount: true,
        currentBalance: true
      },
      _count: { _all: true }
    });

    const totalsByCurrency = currencyBreakdownRaw.map(row => ({
      currency: row.currency,
      totalPrincipal: row._sum.initialAmount || 0,
      totalCurrentValue: row._sum.currentBalance || 0,
      totalReturns: (row._sum.currentBalance || 0) - (row._sum.initialAmount || 0),
      count: row._count._all || 0
    }));

    // Format status breakdown
    const formattedStatusBreakdown = statusBreakdown.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = {
        count: item._count._all || 0,
        principal: item._sum.initialAmount || 0,
        currentValue: item._sum.currentBalance || 0,
        returns: (item._sum.currentBalance || 0) - (item._sum.initialAmount || 0)
      };
      return acc;
    }, {
      active: { count: 0, principal: 0, currentValue: 0, returns: 0 },
      completed: { count: 0, principal: 0, currentValue: 0, returns: 0 },
      cancelled: { count: 0, principal: 0, currentValue: 0, returns: 0 }
    });

    return {
      portfolio: {
        totalInvestments: totalInvestments || 0,
        ratesAt,
        totalPrincipalBase,
        totalCurrentValueBase,
        totalReturnsBase
      },
      statusBreakdown: formattedStatusBreakdown,
      assetAllocation,
      totalsByCurrency,
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
      error.message,
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
async function getPortfolioSummary(userId, options = {}) {
  try {
    // Get all user investments with transaction counts
    const investments = await prisma.investment.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        category: true,
        currency: true,
        initialAmount: true,
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
      categoryData.principal += parseFloat(investment.initialAmount);
      categoryData.currentValue += parseFloat(investment.currentBalance);
      categoryData.returns += parseFloat(investment.currentBalance) - parseFloat(investment.initialAmount);
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
        parseFloat(investment.initialAmount),
        parseFloat(investment.currentBalance)
      );
      
      const age = calculateYearsBetween(investment.startDate, new Date());
      const annualizedReturn = age > 0 
        ? (Math.pow(parseFloat(investment.currentBalance) / parseFloat(investment.initialAmount), 1 / age) - 1) * 100
        : 0;

      return {
        ...investment,
        initialAmount: parseFloat(investment.initialAmount),
        currentBalance: parseFloat(investment.currentBalance),
        absoluteReturn: returnCalc.absoluteReturn,
        returnPercentage: returnCalc.returnPercentage,
        annualizedReturn,
        age,
        transactionCount: investment._count.transactions
      };
    });

    // Base-currency totals
    const baseCurrency = normalizeCurrency(options.baseCurrency || DEFAULT_BASE);
    const ratesAt = getRatesAt();
    let totalPrincipalBase = 0;
    let totalCurrentValueBase = 0;
    for (const inv of investments) {
      const p = convertAmount(parseFloat(inv.initialAmount), inv.currency || baseCurrency, baseCurrency);
      const c = convertAmount(parseFloat(inv.currentBalance), inv.currency || baseCurrency, baseCurrency);
      totalPrincipalBase += p || 0;
      totalCurrentValueBase += c || 0;
    }

    return {
      summary: {
        totalInvestments: portfolioMetrics.numberOfInvestments,
        totalPrincipal: portfolioMetrics.totalPrincipal,
        totalCurrentValue: portfolioMetrics.totalCurrentValue,
        totalReturns: portfolioMetrics.totalReturns,
        returnPercentage: portfolioMetrics.returnPercentage,
        averageReturn: portfolioMetrics.averageReturn,
        ratesAt,
        totalPrincipalBase,
        totalCurrentValueBase,
        totalReturnsBase: totalCurrentValueBase - totalPrincipalBase
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
        totalPortfolioValue: dashboardData.portfolio.totalCurrentValueBase,
        totalReturns: dashboardData.portfolio.totalReturnsBase,
        returnPercentage: dashboardData.portfolio.totalPrincipalBase > 0
          ? (dashboardData.portfolio.totalReturnsBase / dashboardData.portfolio.totalPrincipalBase) * 100
          : 0,
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
