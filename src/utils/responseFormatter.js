function formatInterestCalculationResponse(result) {
  const { calculation, transaction, investment } = result;
  return {
    calculation: calculation ? {
      id: calculation.id,
      investmentId: calculation.investmentId,
      calculationType: calculation.calculationType,
      calculatedAt: calculation.calculatedAt,
      periodStart: calculation.periodStart,
      periodEnd: calculation.periodEnd,
      principalAmount: Number(calculation.principalAmount),
      interestRate: Number(calculation.interestRate),
      interestEarned: Number(calculation.interestEarned),
      newBalance: Number(calculation.newBalance),
      transactionId: calculation.transactionId,
      isReverted: calculation.isReverted
    } : null,
    transaction: transaction ? {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      balance: transaction.balance ? Number(transaction.balance) : undefined,
      percentage: transaction.percentage ? Number(transaction.percentage) : undefined,
      transactionDate: transaction.transactionDate
    } : null,
    investment: investment ? {
      id: investment.id,
      currentBalance: Number(investment.currentBalance),
      lastInterestCalculated: investment.lastInterestCalculated,
      nextInterestDue: investment.nextInterestDue
    } : null
  };
}

module.exports = { formatInterestCalculationResponse };
