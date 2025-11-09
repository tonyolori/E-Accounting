const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
const authRoutes = require('./routes/auth');
const investmentRoutes = require('./routes/investments');

app.use('/api/auth', authRoutes);
app.use('/api/investments', investmentRoutes);
// app.use('/api/returns', returnsRoutes);
// app.use('/api/transactions', transactionRoutes);
// app.use('/api/reports', reportRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
