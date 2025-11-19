// Note: requires `node-cron` package. Install: npm install node-cron
const cron = require('node-cron');
const { processScheduledInterestCalculations } = require('../services/scheduledInterestService');

function scheduleInterestCalculationJob() {
  // Run daily at 00:10
  return cron.schedule('10 0 * * *', async () => {
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
