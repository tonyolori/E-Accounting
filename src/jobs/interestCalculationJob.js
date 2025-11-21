const cron = require('node-cron');
const { processScheduledInterestCalculations } = require('../services/scheduledInterestService');

function scheduleInterestCalculationJob() {
  // Run every hour at 5m
  //originally every day at 00:10
  return cron.schedule('5 * * * *', async () => {
    try {
      const summary = await processScheduledInterestCalculations();
      console.log(`[InterestJob] Processed: ${summary.processed}, Succeeded: ${summary.succeeded}, Failed: ${summary.failed}`);
      if (summary.errors.length) {
        console.warn('[InterestJob] Errors:', summary.errors);
      }
    } catch (err) {
      console.error('[InterestJob] Fatal error:', err);
    }
  }, { timezone: 'UTC' });
}

module.exports = { scheduleInterestCalculationJob };
