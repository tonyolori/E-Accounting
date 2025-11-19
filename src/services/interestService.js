const { prisma } = require('../config/database');
const { Prisma } = require('@prisma/client');
const {
  calculateDaysBetween,
  calculatePeriodInterest,
  determineNextDueDate
} = require('../utils/calculations');

async function getInvestmentOrThrow(investmentId, userId) {
  const investment = await prisma.investment.findFirst({
    where: { id: investmentId, userId },
  });
  if (!investment) {
    const err = new Error('Investment not found');
    err.status = 404;
    throw err;
  }
  return investment;
}

function ensureFixedInvestment(investment) {
  if (investment.returnType !== 'FIXED') {
    const err = new Error('Operation only valid for FIXED return investments');
    err.status = 400;
    throw err;
  }
  if (investment.status !== 'ACTIVE') {
    const err = new Error('Investment is not ACTIVE');
    err.status = 400;
    throw err;
  }
  if (investment.interestRate == null) {
    const err = new Error('interestRate is not set for this investment');
    err.status = 400;
    throw err;
  }
}

async function calculateInterestNow(investmentId, userId) {
  const investment = await getInvestmentOrThrow(investmentId, userId);
  ensureFixedInvestment(investment);

  const now = new Date();
  const periodStart = investment.lastInterestCalculated || investment.startDate;
  const periodEnd = now;
  const days = calculateDaysBetween(periodStart, periodEnd);
  if (days <= 0) {
    const err = new Error('No new period to calculate interest for');
    err.status = 400;
    throw err;
  }

  const compounding = investment.compoundingFrequency || 'MONTHLY';
  const rate = parseFloat(investment.interestRate);
  const principal = parseFloat(investment.currentBalance);
  const { interest, newBalance } = calculatePeriodInterest(principal, rate, compounding, days);

  return await prisma.$transaction(async (tx) => {
    // Create RETURN transaction
    const transaction = await tx.transaction.create({
      data: {
        investmentId: investment.id,
        type: 'RETURN',
        amount: new Prisma.Decimal(interest),
        balance: new Prisma.Decimal(newBalance),
        transactionDate: now,
        description: `Auto interest for ${days} day(s)`
      }
    });

    // Create InterestCalculation record
    const calculation = await tx.interestCalculation.create({
      data: {
        investmentId: investment.id,
        calculationType: 'AUTOMATIC',
        periodStart,
        periodEnd,
        principalAmount: new Prisma.Decimal(principal),
        interestRate: new Prisma.Decimal(rate),
        interestEarned: new Prisma.Decimal(interest),
        newBalance: new Prisma.Decimal(newBalance),
        transactionId: transaction.id,
      }
    });

    // Update investment
    const updatedInvestment = await tx.investment.update({
      where: { id: investment.id },
      data: {
        currentBalance: new Prisma.Decimal(newBalance),
        lastInterestCalculated: now,
        nextInterestDue: determineNextDueDate(now, compounding)
      }
    });

    return { calculation, transaction, investment: updatedInvestment };
  });
}

async function getInterestCalculationHistory(investmentId, userId, options = {}) {
  await getInvestmentOrThrow(investmentId, userId);
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.interestCalculation.findMany({
      where: { investmentId },
      orderBy: { calculatedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.interestCalculation.count({ where: { investmentId } })
  ]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function revertLastInterestCalculation(investmentId, userId) {
  const investment = await getInvestmentOrThrow(investmentId, userId);

  const lastCalc = await prisma.interestCalculation.findFirst({
    where: { investmentId: investment.id, isReverted: false },
    orderBy: { calculatedAt: 'desc' }
  });
  if (!lastCalc) {
    const err = new Error('No interest calculation to revert');
    err.status = 400;
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    // Mark calculation reverted
    const reverted = await tx.interestCalculation.update({
      where: { id: lastCalc.id },
      data: { isReverted: true, revertedAt: new Date(), revertedBy: userId }
    });

    // Delete associated transaction if present
    if (lastCalc.transactionId) {
      await tx.transaction.delete({ where: { id: lastCalc.transactionId } });
    }

    // Find previous calculation date
    const prevCalc = await tx.interestCalculation.findFirst({
      where: { investmentId: investment.id, isReverted: false, calculatedAt: { lt: lastCalc.calculatedAt } },
      orderBy: { calculatedAt: 'desc' }
    });

    const newBalance = parseFloat(investment.currentBalance) - parseFloat(lastCalc.interestEarned);

    const updatedInvestment = await tx.investment.update({
      where: { id: investment.id },
      data: {
        currentBalance: new Prisma.Decimal(newBalance),
        lastInterestCalculated: prevCalc ? prevCalc.calculatedAt : null,
        nextInterestDue: determineNextDueDate(prevCalc ? prevCalc.calculatedAt : new Date(), investment.compoundingFrequency || 'MONTHLY')
      }
    });

    return { calculation: reverted, investment: updatedInvestment };
  });
}

async function updateReturnPercentage(investmentId, userId, newPercentage, effectiveDate = new Date(), description = null) {
  const investment = await getInvestmentOrThrow(investmentId, userId);
  if (investment.returnType !== 'VARIABLE') {
    const err = new Error('Operation only valid for VARIABLE return investments');
    err.status = 400;
    throw err;
  }
  if (investment.status !== 'ACTIVE') {
    const err = new Error('Investment is not ACTIVE');
    err.status = 400;
    throw err;
  }
  const pct = parseFloat(newPercentage);
  const current = parseFloat(investment.currentBalance);
  const amount = current * (pct / 100);
  const newBalance = current + amount;

  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        investmentId: investment.id,
        type: 'RETURN',
        amount: new Prisma.Decimal(amount),
        balance: new Prisma.Decimal(newBalance),
        percentage: new Prisma.Decimal(pct),
        transactionDate: effectiveDate,
        description: description || `Variable return ${pct}%`
      }
    });

    const updatedInvestment = await tx.investment.update({
      where: { id: investment.id },
      data: { currentBalance: new Prisma.Decimal(newBalance) }
    });

    return { transaction, investment: updatedInvestment, calculatedAmount: amount };
  });
}

async function updateBalanceCalculateReturn(investmentId, userId, newBalance, effectiveDate = new Date(), description = null) {
  const investment = await getInvestmentOrThrow(investmentId, userId);
  if (investment.returnType !== 'VARIABLE') {
    const err = new Error('Operation only valid for VARIABLE return investments');
    err.status = 400;
    throw err;
  }
  if (investment.status !== 'ACTIVE') {
    const err = new Error('Investment is not ACTIVE');
    err.status = 400;
    throw err;
  }
  const current = parseFloat(investment.currentBalance);
  const nextBalance = parseFloat(newBalance);
  if (nextBalance < 0) {
    const err = new Error('New balance cannot be negative');
    err.status = 400;
    throw err;
  }
  const returnAmount = nextBalance - current;
  const pct = current > 0 ? (returnAmount / current) * 100 : 0;

  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        investmentId: investment.id,
        type: 'RETURN',
        amount: new Prisma.Decimal(returnAmount),
        balance: new Prisma.Decimal(nextBalance),
        percentage: new Prisma.Decimal(pct),
        transactionDate: effectiveDate,
        description: description || `Variable return via balance update (${pct.toFixed(2)}%)`
      }
    });

    const updatedInvestment = await tx.investment.update({
      where: { id: investment.id },
      data: { currentBalance: new Prisma.Decimal(nextBalance) }
    });

    return { transaction, investment: updatedInvestment, calculatedPercentage: pct, returnAmount };
  });
}

module.exports = {
  calculateInterestNow,
  getInterestCalculationHistory,
  revertLastInterestCalculation,
  updateReturnPercentage,
  updateBalanceCalculateReturn
};
