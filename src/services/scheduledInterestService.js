const { prisma } = require('../config/database');
const { calculateInterestNow } = require('./interestService');

async function processScheduledInterestCalculations() {
  const now = new Date();
  const investments = await prisma.investment.findMany({
    where: {
      returnType: 'FIXED',
      autoCalculateInterest: true,
      status: 'ACTIVE',
      nextInterestDue: { lte: now }
    },
    select: { id: true, userId: true }
  });

  const results = { processed: investments.length, succeeded: 0, failed: 0, errors: [] };

  for (const inv of investments) {
    try {
      await calculateInterestNow(inv.id, inv.userId);
      results.succeeded += 1;
    } catch (err) {
      results.failed += 1;
      results.errors.push({ investmentId: inv.id, error: err.message });
    }
  }

  return results;
}

module.exports = { processScheduledInterestCalculations };
