const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { isValidUUID } = require('../utils/validation');
const { 
  calculateCompoundInterest, 
  calculateReturnPercentage,
  calculateMonthlyReturn,
  calculateAnnualizedReturn,
  calculateYearsBetween
} = require('../utils/calculations');

/**
 * Add manual return to investment
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @param {Object} returnData - Return data
 * @returns {Object} Updated investment and transaction record
 * @throws {AppError} If investment not found or operation fails
 */
async function addManualReturn(investmentId, userId, returnData) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    const { amount, percentage, transactionDate, description, type = 'RETURN' } = returnData;

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // First verify the investment exists and is owned by user
      const investment = await tx.investment.findFirst({
        where: {
          id: investmentId,
          userId
        },
        select: {
          id: true,
          name: true,
          currentBalance: true,
          initialAmount: true,
          status: true,
          returnType: true,
          interestRate: true
        }
      });

      if (!investment) {
        throw new AppError(
          'Investment not found',
          404,
          'INVESTMENT_NOT_FOUND'
        );
      }

      if (investment.status === 'CANCELLED') {
        throw new AppError(
          'Cannot add returns to cancelled investment',
          400,
          'INVALID_OPERATION'
        );
      }

      // Calculate return amount
      let returnAmount = amount || 0;
      let returnPercentage = percentage || null;

      if (amount && percentage) {
        throw new AppError(
          'Cannot specify both amount and percentage',
          400,
          'INVALID_INPUT'
        );
      }

      if (!amount && !percentage) {
        throw new AppError(
          'Either amount or percentage must be specified',
          400,
          'INVALID_INPUT'
        );
      }

      if (percentage) {
        returnAmount = (investment.currentBalance * percentage) / 100;
        returnPercentage = percentage;
      } else {
        returnPercentage = (returnAmount / investment.currentBalance) * 100;
      }

      if (returnAmount < 0 && Math.abs(returnAmount) > investment.currentBalance) {
        throw new AppError(
          'Loss amount cannot exceed current balance',
          400,
          'INVALID_AMOUNT'
        );
      }

      // Calculate new balance
      const newBalance = investment.currentBalance + returnAmount;

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          investmentId,
          type,
          amount: returnAmount,
          percentage: returnPercentage,
          transactionDate: new Date(transactionDate || new Date()),
          description: description?.trim() || `Manual ${type.toLowerCase()} of ${returnAmount >= 0 ? '+' : ''}${returnAmount}`
        },
        select: {
          id: true,
          type: true,
          amount: true,
          percentage: true,
          transactionDate: true,
          description: true,
          createdAt: true
        }
      });

      // Update investment balance
      const updatedInvestment = await tx.investment.update({
        where: { id: investmentId },
        data: { currentBalance: newBalance },
        select: {
          id: true,
          name: true,
          category: true,
          initialAmount: true,
          currentBalance: true,
          returnType: true,
          interestRate: true,
          startDate: true,
          endDate: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        investment: updatedInvestment,
        transaction
      };
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Add manual return error:', error);
    throw new AppError(
      'Failed to add manual return',
      500,
      'RETURN_ADD_ERROR'
    );
  }
}

/**
 * Get investment returns (transaction history)
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} Returns with pagination info
 * @throws {AppError} If investment not found
 */
async function getInvestmentReturns(investmentId, userId, filters = {}) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    // First verify the investment exists and is owned by user
    const investment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      },
      select: { id: true }
    });

    if (!investment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    const {
      type,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = filters;

    // Build where clause
    const where = {
      investmentId
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    // Build orderBy clause
    const orderBy = {
      [sortBy]: sortOrder
    };

    // Execute queries
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          type: true,
          amount: true,
          percentage: true,
          transactionDate: true,
          description: true,
          createdAt: true
        }
      }),
      prisma.transaction.count({ where })
    ]);

    // Calculate summary statistics
    const summary = await prisma.transaction.aggregate({
      where: { investmentId },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    });

    return {
      returns: transactions,
      summary: {
        totalReturns: summary._sum.amount || 0,
        totalTransactions: summary._count._all || 0
      },
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Get investment returns error:', error);
    throw new AppError(
      'Failed to retrieve investment returns',
      500,
      'RETURNS_RETRIEVAL_ERROR'
    );
  }
}

/**
 * Calculate projected returns for an investment
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @param {Object} projectionParams - Projection parameters
 * @returns {Object} Projected returns calculation
 * @throws {AppError} If investment not found or calculation fails
 */
async function calculateProjectedReturns(investmentId, userId, projectionParams = {}) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    // Get investment details
    const investment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      },
      select: {
        id: true,
        name: true,
        currentBalance: true,
        initialAmount: true,
        returnType: true,
        interestRate: true,
        startDate: true,
        endDate: true,
        status: true
      }
    });

    if (!investment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    const {
      years = 1,
      monthlyContribution = 0,
      annualRate = investment.interestRate || 5, // Default 5% if no rate specified
      compoundingFrequency = 12 // Monthly compounding by default
    } = projectionParams;

    // Validate projection parameters
    if (years <= 0 || years > 50) {
      throw new AppError(
        'Years must be between 0 and 50',
        400,
        'INVALID_PROJECTION_PARAMS'
      );
    }

    if (annualRate < 0 || annualRate > 100) {
      throw new AppError(
        'Annual rate must be between 0 and 100',
        400,
        'INVALID_PROJECTION_PARAMS'
      );
    }

    // Calculate current performance metrics
    const investmentAge = calculateYearsBetween(investment.startDate, new Date());
    const currentPerformance = calculateReturnPercentage(
      investment.initialAmount,
      investment.currentBalance
    );

    let annualizedReturn = 0;
    if (investmentAge > 0) {
      const annualizedCalc = calculateAnnualizedReturn(
        investment.initialAmount,
        investment.currentBalance,
        investmentAge
      );
      annualizedReturn = annualizedCalc.annualizedReturn;
    }

    // Calculate projected future value
    let projectedResults;
    
    if (monthlyContribution > 0) {
      // Use future value with contributions calculation
      projectedResults = require('../utils/calculations').calculateFutureValueWithContributions(
        investment.currentBalance,
        monthlyContribution,
        annualRate,
        years
      );
    } else {
      // Use compound interest calculation
      projectedResults = calculateCompoundInterest(
        investment.currentBalance,
        annualRate,
        compoundingFrequency,
        years
      );
    }

    // Calculate monthly projections for the first year
    const monthlyProjections = [];
    for (let month = 1; month <= Math.min(12, years * 12); month++) {
      const monthsAsYears = month / 12;
      const monthResult = calculateCompoundInterest(
        investment.currentBalance,
        annualRate,
        compoundingFrequency,
        monthsAsYears
      );
      
      monthlyProjections.push({
        month,
        balance: monthResult.futureValue,
        returns: monthResult.totalReturns,
        monthlyReturn: month === 1 ? monthResult.totalReturns : 
          monthResult.totalReturns - (monthlyProjections[month - 2]?.returns || 0)
      });
    }

    return {
      investment: {
        id: investment.id,
        name: investment.name,
        currentBalance: investment.currentBalance,
        initialAmount: investment.initialAmount,
        returnType: investment.returnType,
        interestRate: investment.interestRate
      },
      currentPerformance: {
        totalReturns: currentPerformance.absoluteReturn,
        returnPercentage: currentPerformance.returnPercentage,
        investmentAge,
        annualizedReturn: annualizedReturn * 100
      },
      projectionParams: {
        years,
        monthlyContribution,
        annualRate,
        compoundingFrequency
      },
      projectedResults: {
        futureValue: projectedResults.futureValue || projectedResults.totalFutureValue,
        totalReturns: projectedResults.totalReturns,
        totalInvested: projectedResults.totalInvested || investment.currentBalance,
        returnPercentage: projectedResults.returnPercentage || projectedResults.percentageGain
      },
      monthlyProjections
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Calculate projected returns error:', error);
    throw new AppError(
      'Failed to calculate projected returns',
      500,
      'PROJECTION_CALCULATION_ERROR'
    );
  }
}

/**
 * Calculate next monthly return for fixed-rate investments
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @returns {Object} Next monthly return calculation
 * @throws {AppError} If investment not found or not applicable
 */
async function calculateNextMonthlyReturn(investmentId, userId) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    // Get investment details
    const investment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      },
      select: {
        id: true,
        name: true,
        currentBalance: true,
        returnType: true,
        interestRate: true,
        status: true
      }
    });

    if (!investment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    if (investment.returnType !== 'FIXED') {
      throw new AppError(
        'Monthly return calculation only available for fixed-rate investments',
        400,
        'INVALID_OPERATION'
      );
    }

    if (!investment.interestRate) {
      throw new AppError(
        'Investment has no  interest rate defined',
        400,
        'NO_INTEREST_RATE'
      );
    }

    if (investment.status !== 'ACTIVE') {
      throw new AppError(
        'Monthly return calculation only available for active investments',
        400,
        'INVALID_STATUS'
      );
    }

    // Calculate next monthly return
    const monthlyReturnCalc = calculateMonthlyReturn(
      investment.currentBalance,
      investment.interestRate,
      true // Use compound calculation
    );

    return {
      investment: {
        id: investment.id,
        name: investment.name,
        currentBalance: investment.currentBalance,
        interestRate: investment.interestRate
      },
      nextMonthlyReturn: monthlyReturnCalc,
      calculatedAt: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Calculate next monthly return error:', error);
    throw new AppError(
      'Failed to calculate next monthly return',
      500,
      'MONTHLY_RETURN_CALCULATION_ERROR'
    );
  }
}

/**
 * Bulk add returns to multiple investments (for automation)
 * @param {Array} returnEntries - Array of return entries
 * @param {string} userId - User ID
 * @returns {Object} Bulk operation results
 * @throws {AppError} If operation fails
 */
async function bulkAddReturns(returnEntries, userId) {
  try {
    if (!Array.isArray(returnEntries) || returnEntries.length === 0) {
      throw new AppError(
        'Return entries array is required and cannot be empty',
        400,
        'INVALID_INPUT'
      );
    }

    const results = [];
    const errors = [];

    for (const entry of returnEntries) {
      try {
        const result = await addManualReturn(entry.investmentId, userId, entry.returnData);
        results.push({
          investmentId: entry.investmentId,
          success: true,
          transaction: result.transaction,
          newBalance: result.investment.currentBalance
        });
      } catch (error) {
        errors.push({
          investmentId: entry.investmentId,
          success: false,
          error: error.message || 'Failed to add return'
        });
      }
    }

    return {
      totalProcessed: returnEntries.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  } catch (error) {
    console.error('Bulk add returns error:', error);
    throw new AppError(
      'Failed to process bulk return additions',
      500,
      'BULK_RETURNS_ERROR'
    );
  }
}

module.exports = {
  addManualReturn,
  getInvestmentReturns,
  calculateProjectedReturns,
  calculateNextMonthlyReturn,
  bulkAddReturns
};
