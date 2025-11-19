require('dotenv').config();
const app = require('./src/app');
const { scheduleInterestCalculationJob } = require('./src/jobs/interestCalculationJob');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  // Start scheduled interest calculation job (requires node-cron)
  try {
    const job = scheduleInterestCalculationJob();
    if (job && job.start) job.start();
  } catch (err) {
    console.warn('⚠️ Interest calculation scheduler not started:', err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = server;
