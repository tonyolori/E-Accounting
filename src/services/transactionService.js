const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { isValidUUID } = require('../utils/validation');

/**
 * Create a new transaction
 * @param {string} userId - User ID
 * @param {Object} transactionData - Transaction data
 * @returns {Object} Created transaction with investment info
 * @throws {AppError} If creation fails
 */
async function createTransaction(userId, transactionData) {
  try {
    const {
      investmentId,
      type,
      amount,
      percentage,
      transactionDate,
      description
    } = transactionData;

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Verify investment exists and is owned by user
      const investment = await tx.investment.findFirst({
        where: {
          id: investmentId,
          userId
        },
        select: {
          id: true,
          name: true,
          currentBalance: true,
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

      if (investment.status === 'CANCELLED') {
        throw new AppError(
          'Cannot create transactions for cancelled investments',
          400,
          'INVALID_OPERATION'
        );
      }

      // Validate transaction amount based on type
      const currentBalanceNum =
        investment && investment.currentBalance && typeof investment.currentBalance.toNumber === 'function'
          ? investment.currentBalance.toNumber()
          : Number(investment.currentBalance);
      if ((type === 'WITHDRAWAL') && Math.abs(Number(amount)) > currentBalanceNum) {
        throw new AppError(
          'Withdrawal amount cannot exceed current balance',
          400,
          'INSUFFICIENT_BALANCE'
        );
      }

      
      // Update investment balance based on transaction type
      let balanceChange = 0;
      switch (type) {
        case 'RETURN':
        case 'DIVIDEND':
        case 'DEPOSIT':
          balanceChange = Number(amount);
          break;
        case 'WITHDRAWAL':
          balanceChange = -Math.abs(Number(amount));
          break;
      }
      let newBalance = currentBalanceNum;
        
      if (balanceChange !== 0) {
        newBalance = currentBalanceNum + Number(balanceChange);

        if (newBalance < 0) {
          throw new AppError(
            'Transaction would result in negative balance',
            400,
            'NEGATIVE_BALANCE'
          );
        }

        await tx.investment.update({
          where: { id: investmentId },
          data: { currentBalance: newBalance }
        });
      }
      // Create transaction
      let transaction = await tx.transaction.create({
        data: {
          investmentId,
          type,
          amount,
          percentage,
          balance: newBalance,
          transactionDate: new Date(transactionDate),
          description: description?.trim() || null
        },
        select: {
          id: true,
          type: true,
          amount: true,
          balance: true,
          percentage: true,
          transactionDate: true,
          description: true,
          createdAt: true,
          investment: {
            select: {
              id: true,
              name: true,
              category: true,
              currency: true
            }
          }
        }
      });

      return transaction;
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Create transaction error:', error);
    throw new AppError(
      'Failed to create transaction',
      500,
      'TRANSACTION_CREATION_ERROR'
    );
  }
}

/**
 * Get user transactions with optional filtering
 * @param {string} userId - User ID
 * @param {Object} filters - Query filters
 * @returns {Object} Transactions with pagination info
 * @throws {AppError} If retrieval fails
 */
async function getUserTransactions(userId, filters = {}) {
  try {
    const {
      investmentId,
      type,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      limit = 20,
      offset = 0,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = filters;

    // Build where clause - ensure user ownership through investment relation
    const where = {
      investment: {
        userId
      }
    };

    if (investmentId) {
      where.investmentId = investmentId;
    }

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

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
        where.amount.gte = minAmount;
      }
      if (maxAmount) {
        where.amount.lte = maxAmount;
      }
    }

    // Build orderBy clause
    const orderBy = {
      [sortBy]: sortOrder
    };
    //theres a bug with this, the sort order the most recent for the 
    //day is not at the top when the sort order is desc

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
          balance: true,
          percentage: true,
          transactionDate: true,
          description: true,
          createdAt: true,
          investment: {
            select: {
              id: true,
              name: true,
              category: true,
              currency: true
            }
          }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0
      }
    };
  } catch (error) {
    console.error('Get user transactions error:', error);
    throw new AppError(
      'Failed to retrieve transactions',
      500,
      'TRANSACTION_RETRIEVAL_ERROR'
    );
  }
}

/**
 * Get transaction by ID with user verification
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID
 * @returns {Object} Transaction data
 * @throws {AppError} If not found or not owned by user
 */
async function getTransactionById(transactionId, userId) {
  try {
    if (!isValidUUID(transactionId)) {
      throw new AppError(
        'Invalid transaction ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        investment: {
          userId // Ensure user owns the investment
        }
      },
      select: {
        id: true,
        type: true,
        amount: true,
        balance: true,
        percentage: true,
        transactionDate: true,
        description: true,
        createdAt: true,
        investment: {
          select: {
            id: true,
            name: true,
            category: true,
            currency: true,
            currentBalance: true,
            status: true
          }
        }
      }
    });

    if (!transaction) {
      throw new AppError(
        'Transaction not found',
        404,
        'TRANSACTION_NOT_FOUND'
      );
    }

    return transaction;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Get transaction by ID error:', error);
    throw new AppError(
      'Failed to retrieve transaction',
      500,
      'TRANSACTION_RETRIEVAL_ERROR'
    );
  }
}

/**
 * Update transaction with ownership check
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated transaction
 * @throws {AppError} If not found, not owned, or update fails
 */
async function updateTransaction(transactionId, userId, updateData) {
  try {
    if (!isValidUUID(transactionId)) {
      throw new AppError(
        'Invalid transaction ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // First verify the transaction exists and user owns the investment
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          investment: {
            userId
          }
        },
        select: {
          id: true,
          type: true,
          amount: true,
          investmentId: true,
          investment: {
            select: {
              currentBalance: true,
              status: true
            }
          }
        }
      });

      if (!existingTransaction) {
        throw new AppError(
          'Transaction not found',
          404,
          'TRANSACTION_NOT_FOUND'
        );
      }

      if (existingTransaction.investment.status === 'CANCELLED') {
        throw new AppError(
          'Cannot update transactions for cancelled investments',
          400,
          'INVALID_OPERATION'
        );
      }

      // Calculate balance impact if amount is being changed
      let balanceAdjustment = 0;
      let prospectiveNewBalance = null;
      if (updateData.amount !== undefined && updateData.amount !== existingTransaction.amount) {
        const oldImpact = getBalanceImpact(existingTransaction.type, existingTransaction.amount);
        const newImpact = getBalanceImpact(existingTransaction.type, updateData.amount);
        balanceAdjustment = newImpact - oldImpact;

        // Check if the new balance would be valid
        const newBalance = (
          existingTransaction &&
          existingTransaction.investment &&
          existingTransaction.investment.currentBalance &&
          typeof existingTransaction.investment.currentBalance.toNumber === 'function'
            ? existingTransaction.investment.currentBalance.toNumber()
            : Number(existingTransaction.investment.currentBalance)
        ) + Number(balanceAdjustment);
        prospectiveNewBalance = newBalance;
        if (newBalance < 0) {
          throw new AppError(
            'Updated transaction would result in negative investment balance',
            400,
            'NEGATIVE_BALANCE'
          );
        }
      }

      // Prepare update data
      const updateFields = { ...updateData };
      
      // Handle date conversion
      if (updateFields.transactionDate) {
        updateFields.transactionDate = new Date(updateFields.transactionDate);
      }

      // Trim string fields
      if (updateFields.description) {
        updateFields.description = updateFields.description.trim() || null;
      }

      //come here 
      // Update transaction
      // Include new post-transaction balance when amount changed
      if (balanceAdjustment !== 0 && prospectiveNewBalance !== null) {
        updateFields.balance = prospectiveNewBalance;
      } else {
        // No balance change; ensure balance column reflects current investment balance
        const currentBalNum = (
          existingTransaction &&
          existingTransaction.investment &&
          existingTransaction.investment.currentBalance &&
          typeof existingTransaction.investment.currentBalance.toNumber === 'function'
            ? existingTransaction.investment.currentBalance.toNumber()
            : Number(existingTransaction.investment.currentBalance)
        );
        updateFields.balance = currentBalNum;
      }
//end here
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: updateFields,
        select: {
          id: true,
          type: true,
          amount: true,
          balance: true,
          percentage: true,
          transactionDate: true,
          description: true,
          createdAt: true,
          investment: {
            select: {
              id: true,
              name: true,
              category: true,
              currency: true
            }
          }
        }
      });

      // Update investment balance if needed
      if (balanceAdjustment !== 0) {
        await tx.investment.update({
          where: { id: existingTransaction.investmentId },
          data: {
            currentBalance: {
              increment: balanceAdjustment
            }
          }
        });
      }

      return updatedTransaction;
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error.code === 'P2025') {
      throw new AppError(
        'Transaction not found',
        404,
        'TRANSACTION_NOT_FOUND'
      );
    }

    console.error('Update transaction error:', error);
    throw new AppError(
      'Failed to update transaction',
      500,
      'TRANSACTION_UPDATE_ERROR'
    );
  }
}

/**
 * Delete transaction with balance adjustment
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User ID
 * @returns {Object} Deletion result
 * @throws {AppError} If not found, not owned, or deletion fails
 */
async function deleteTransaction(transactionId, userId) {
  try {
    if (!isValidUUID(transactionId)) {
      throw new AppError(
        'Invalid transaction ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // First get the transaction and verify ownership
      const transaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          investment: {
            userId
          }
        },
        select: {
          id: true,
          type: true,
          amount: true,
          balance: true,
          investmentId: true,
          investment: {
            select: {
              currentBalance: true,
              status: true,
              name: true
            }
          }
        }
      });

      if (!transaction) {
        throw new AppError(
          'Transaction not found',
          404,
          'TRANSACTION_NOT_FOUND'
        );
      }

      if (transaction.investment.status === 'CANCELLED') {
        throw new AppError(
          'Cannot delete transactions for cancelled investments',
          400,
          'INVALID_OPERATION'
        );
      }

      // Calculate balance adjustment (reverse the original impact)
      const balanceAdjustment = -getBalanceImpact(transaction.type, transaction.amount);

      // Check if removing this transaction would result in negative balance
      const newBalance = (
        transaction &&
        transaction.investment &&
        transaction.investment.currentBalance &&
        typeof transaction.investment.currentBalance.toNumber === 'function'
          ? transaction.investment.currentBalance.toNumber()
          : Number(transaction.investment.currentBalance)
      ) + Number(balanceAdjustment);
      if (newBalance < 0) {
        throw new AppError(
          'Deleting this transaction would result in negative investment balance',
          400,
          'NEGATIVE_BALANCE'
        );
      }

      // Delete the transaction
      await tx.transaction.delete({
        where: { id: transactionId }
      });

      // Update investment balance
      if (balanceAdjustment !== 0) {
        await tx.investment.update({
          where: { id: transaction.investmentId },
          data: {
            currentBalance: newBalance
          }
        });
      }

      return {
        deletedTransaction: {
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          balance: transaction.balance
        },
        investmentName: transaction.investment.name,
        balanceAdjustment,
        newBalance
      };
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Delete transaction error:', error);
    throw new AppError(
      'Failed to delete transaction',
      500,
      'TRANSACTION_DELETE_ERROR'
    );
  }
}

/**
 * Get transaction statistics for user
 * @param {string} userId - User ID
 * @param {Object} filters - Stats filters
 * @returns {Object} Transaction statistics
 * @throws {AppError} If calculation fails
 */
async function getTransactionStatistics(userId, filters = {}) {
  try {
    const {
      investmentId,
      startDate,
      endDate,
      groupBy = 'type'
    } = filters;

    // Build where clause
    const where = {
      investment: {
        userId
      }
    };

    if (investmentId) {
      where.investmentId = investmentId;
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

    // Get overall statistics
    const overall = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      },
      _avg: {
        amount: true
      }
    });

    // Get grouped statistics
    let groupedStats = [];
    
    switch (groupBy) {
      case 'type':
        groupedStats = await prisma.transaction.groupBy({
          by: ['type'],
          where,
          _sum: {
            amount: true
          },
          _count: {
            _all: true
          },
          _avg: {
            amount: true
          }
        });
        break;
        
      case 'investment':
        groupedStats = await prisma.transaction.groupBy({
          by: ['investmentId'],
          where,
          _sum: {
            amount: true
          },
          _count: {
            _all: true
          },
          _avg: {
            amount: true
          }
        });
        
        // Enrich with investment names
        const investmentIds = groupedStats.map(stat => stat.investmentId);
        const investments = await prisma.investment.findMany({
          where: { id: { in: investmentIds } },
          select: { id: true, name: true }
        });
        
        groupedStats = groupedStats.map(stat => ({
          ...stat,
          investmentName: investments.find(inv => inv.id === stat.investmentId)?.name
        }));
        break;
    }

    return {
      overall: {
        totalAmount: overall._sum.amount || 0,
        totalTransactions: overall._count._all || 0,
        averageAmount: overall._avg.amount || 0
      },
      groupedBy: groupBy,
      groups: groupedStats.map(stat => ({
        ...stat,
        totalAmount: stat._sum.amount || 0,
        transactionCount: stat._count._all || 0,
        averageAmount: stat._avg.amount || 0
      }))
    };
  } catch (error) {
    console.error('Get transaction statistics error:', error);
    throw new AppError(
      'Failed to calculate transaction statistics',
      500,
      'TRANSACTION_STATS_ERROR'
    );
  }
}

/**
 * Helper function to calculate balance impact of a transaction
 * @param {string} type - Transaction type
 * @param {number} amount - Transaction amount
 * @returns {number} Balance impact (positive or negative)
 */
function getBalanceImpact(type, amount) {
  switch (type) {
    case 'RETURN':
    case 'DIVIDEND':
    case 'DEPOSIT':
      return amount;
    case 'WITHDRAWAL':
      return -Math.abs(amount);
    default:
      return 0;
  }
}

/**
 * Get investment transactions summary
 * @param {string} investmentId - Investment ID
 * @param {string} userId - User ID
 * @returns {Object} Investment transaction summary
 * @throws {AppError} If investment not found
 */
async function getInvestmentTransactionSummary(investmentId, userId) {
  try {
    if (!isValidUUID(investmentId)) {
      throw new AppError(
        'Invalid investment ID format',
        400,
        'INVALID_ID_FORMAT'
      );
    }

    // Verify investment ownership
    const investment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      },
      select: { id: true, name: true }
    });

    if (!investment) {
      throw new AppError(
        'Investment not found',
        404,
        'INVESTMENT_NOT_FOUND'
      );
    }

    // Get transaction summary for this investment
    const summary = await prisma.transaction.aggregate({
      where: { investmentId },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    });

    // Get breakdown by type
    const typeBreakdown = await prisma.transaction.groupBy({
      by: ['type'],
      where: { investmentId },
      _sum: {
        amount: true
      },
      _count: {
        _all: true
      }
    });

    return {
      investment: investment,
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalTransactions: summary._count._all || 0
      },
      typeBreakdown: typeBreakdown.reduce((acc, item) => {
        acc[item.type.toLowerCase()] = {
          total: item._sum.amount || 0,
          count: item._count._all || 0
        };
        return acc;
      }, {})
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Get investment transaction summary error:', error);
    throw new AppError(
      'Failed to retrieve investment transaction summary',
      500,
      'TRANSACTION_SUMMARY_ERROR'
    );
  }
}

module.exports = {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStatistics,
  getInvestmentTransactionSummary
};
