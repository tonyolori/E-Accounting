const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { isValidUUID } = require('../utils/validation');
const { DEFAULT_BASE, convertAmount, normalizeCurrency, getRatesAt } = require('../utils/currency');
const { ReturnType } = require('@prisma/client');

/**
 * Create a new investment
 * @param {string} userId - User ID
 * @param {Object} investmentData - Investment data
 * @returns {Object} Created investment
 * @throws {AppError} If creation fails
 */
async function createInvestment(userId, investmentData) {
  try {
    const {
      name,
      category,
      currency,
      initialAmount,
      returnType,
      interestRate,
      startDate,
      endDate,
      notes
    } = investmentData;

    // Create investment with currentBalance = initialAmount initially
    const investment = await prisma.investment.create({
      data: {
        userId,
        name: name.trim(),
        category: category.trim(),
        currency: (currency || 'NGN').toUpperCase(),
        initialAmount: initialAmount,
        currentBalance: initialAmount, // Set initial balance to principal
        returnType,
        interestRate: returnType === ReturnType.FIXED ? interestRate : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'ACTIVE', // Default status
        notes: notes?.trim() || null
      },
      select: {
        id: true,
        name: true,
        category: true,
        currency: true,
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

    return investment;
  } catch (error) {
    console.error('Create investment error:', error);
    
    if (error.code === 'P2003') {
      throw new AppError(
        'Invalid user - user not found',
        400,
        'INVALID_USER_REFERENCE'
      );
    }

    throw new AppError(
      'Failed to create investment',
      500,
      'INVESTMENT_CREATION_ERROR'
    );
  }
}

/**
 * Get user investments with optional filtering
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} Investments with pagination info
 * @throws {AppError} If retrieval fails
 */
async function getUserInvestments(userId, filters = {}) {
  try {
    const {
      status,
      returnType,
      category,
      currency,
      startDate,
      endDate,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Build where clause
    const where = {
      userId
    };

    if (status) {
      where.status = status;
    }

    if (returnType) {
      where.returnType = returnType;
    }

    if (currency) {
      where.currency = currency;
    }

    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive'
      };
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    // Build orderBy clause
    const orderBy = {
      [sortBy]: sortOrder
    };

    // Execute queries
    const [investments, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          category: true,
          currency: true,
          initialAmount: true,
          currentBalance: true,
          returnType: true,
          interestRate: true,
          startDate: true,
          endDate: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              transactions: true
            }
          }
        }
      }),
      prisma.investment.count({ where })
    ]);

    // Normalize Decimal fields to numbers where appropriate
    const normalizedInvestments = investments.map((inv) => ({
      ...inv,
      interestRate: inv.interestRate == null ? null : Number(inv.interestRate),
      initialAmount: inv.initialAmount == null ? null : Number(inv.initialAmount),
      currentBalance: inv.currentBalance == null ? null : Number(inv.currentBalance)
    }));

    return {
      investments: normalizedInvestments,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };
  } catch (error) {
    console.error('Get user investments error:', error);
    throw new AppError(
      'Failed to retrieve investments',
      500,
      'INVESTMENT_RETRIEVAL_ERROR'
    );
  }
}

/**
 * Get investment by ID with user verification
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @returns {Object} Investment data
 * @throws {AppError} If not found or not owned by user
 */
async function getInvestmentById(investmentId, userId) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    const investment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId // Ensure user owns this investment
      },
      select: {
        id: true,
        name: true,
        category: true,
        currency: true,
        initialAmount: true,
        currentBalance: true,
        returnType: true,
        interestRate: true,
        startDate: true,
        endDate: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    if (!investment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    return investment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Get investment by ID error:', error);
    throw new AppError(
      'Failed to retrieve investment',
      500,
      'INVESTMENT_RETRIEVAL_ERROR'
    );
  }
}

/**
 * Update investment with ownership check
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated investment
 * @throws {AppError} If not found, not owned, or update fails
 */
async function updateInvestment(investmentId, userId, updateData) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    // First verify the investment exists and is owned by user
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      },
      select: { id: true, returnType: true }
    });

    if (!existingInvestment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    // Prepare update data
    const updateFields = { ...updateData };
    if (updateFields.currency) {
      updateFields.currency = updateFields.currency.toUpperCase();
    }
    
    // Handle date conversions
    if (updateFields.endDate) {
      updateFields.endDate = new Date(updateFields.endDate);
    }

    // Handle  interest rate logic
    if (updateFields.returnType === 'VARIABLE') {
      updateFields.interestRate = null;
    } else if (updateFields.returnType === 'FIXED' && !updateFields.interestRate) {
      // If changing to FIXED without providing rate, keep existing or require it
      if (existingInvestment.returnType !== 'FIXED') {
        throw new AppError(
          ' Interest rate is required when changing to FIXED return type',
          400,
          'INTEREST_RATE_REQUIRED'
        );
      }
    }

    // Trim string fields
    if (updateFields.name) {
      updateFields.name = updateFields.name.trim();
    }
    if (updateFields.category) {
      updateFields.category = updateFields.category.trim();
    }
    if (updateFields.notes) {
      updateFields.notes = updateFields.notes.trim() || null;
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: updateFields,
      select: {
        id: true,
        name: true,
        category: true,
        currency: true,
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

    return updatedInvestment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === 'P2025') {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    console.error('Update investment error:', error);
    throw new AppError(
      'Failed to update investment',
      500,
      'INVESTMENT_UPDATE_ERROR'
    );
  }
}

/**
 * Update investment status
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @param {Object} statusData - Status update data
 * @returns {Object} Updated investment
 * @throws {AppError} If not found, not owned, or update fails
 */
async function updateInvestmentStatus(investmentId, userId, statusData) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    const { status, notes } = statusData;

    // First verify the investment exists and is owned by user
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      },
      select: { id: true, status: true }
    });

    if (!existingInvestment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    if (existingInvestment.status === status) {
      throw new AppError(
        `Investment is already ${status.toLowerCase()}`,
        400,
        'INVALID_STATUS_CHANGE'
      );
    }

    const updateData = { status };
    if (notes) {
      updateData.notes = notes.trim();
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: updateData,
      select: {
        id: true,
        name: true,
        category: true,
        currency: true,
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

    return updatedInvestment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Update investment status error:', error);
    throw new AppError(
      'Failed to update investment status',
      500,
      'INVESTMENT_STATUS_UPDATE_ERROR'
    );
  }
}

/**
 * Update investment balance manually
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @param {Object} balanceData - Balance update data
 * @returns {Object} Updated investment
 * @throws {AppError} If not found, not owned, or update fails
 */
async function updateInvestmentBalance(investmentId, userId, balanceData) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    const { currentBalance, notes } = balanceData;

    // First verify the investment exists and is owned by user
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      },
      select: { id: true, currentBalance: true, status: true }
    });

    if (!existingInvestment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    if (existingInvestment.status === 'CANCELLED') {
      throw new AppError(
        'Cannot update balance of cancelled investment',
        400,
        'INVALID_OPERATION'
      );
    }

    const updateData = { currentBalance };
    if (notes) {
      updateData.notes = notes.trim();
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: updateData,
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

    return updatedInvestment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Update investment balance error:', error);
    throw new AppError(
      'Failed to update investment balance',
      500,
      'INVESTMENT_BALANCE_UPDATE_ERROR'
    );
  }
}

/**
 * Get investment summary statistics for user
 * @param {string} userId - User ID
 * @returns {Object} Investment summary
 * @throws {AppError} If calculation fails
 */
async function getInvestmentSummary(userId, options = {}) {
  try {
    const summary = await prisma.investment.aggregate({
      where: { userId },
      _sum: {
        initialAmount: true,
        currentBalance: true
      },
      _count: {
        _all: true
      }
    });

    const statusCounts = await prisma.investment.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        _all: true
      }
    });

    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count._all;
      return acc;
    }, {
      active: 0,
      completed: 0,
      cancelled: 0
    });

    // Base-currency totals
    const baseCurrency = normalizeCurrency(options.baseCurrency || DEFAULT_BASE);
    const ratesAt = getRatesAt();
    const investments = await prisma.investment.findMany({
      where: { userId },
      select: { initialAmount: true, currentBalance: true, currency: true }
    });
    let totalPrincipalBase = 0;
    let totalCurrentValueBase = 0;
    for (const inv of investments) {
      const p = convertAmount(parseFloat(inv.initialAmount), inv.currency, baseCurrency);
      const c = convertAmount(parseFloat(inv.currentBalance), inv.currency, baseCurrency);
      totalPrincipalBase += p || 0;
      totalCurrentValueBase += c || 0;
    }

    return {
      totalInvestments: summary._count._all || 0,
      totalPrincipal: summary._sum.initialAmount || 0,
      totalCurrentValue: summary._sum.currentBalance || 0,
      totalReturns: (summary._sum.currentBalance || 0) - (summary._sum.initialAmount || 0),
      statusBreakdown: statusSummary,
      baseCurrency,
      ratesAt,
      totalPrincipalBase,
      totalCurrentValueBase,
      totalReturnsBase: totalCurrentValueBase - totalPrincipalBase
    };
  } catch (error) {
    console.error('Get investment summary error:', error);
    throw new AppError(
      'Failed to calculate investment summary',
      500,
      'INVESTMENT_SUMMARY_ERROR'
    );
  }
}

module.exports = {
  createInvestment,
  getUserInvestments,
  getInvestmentById,
  updateInvestment,
  updateInvestmentStatus,
  updateInvestmentBalance,
  getInvestmentSummary
};
