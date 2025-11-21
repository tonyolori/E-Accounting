const { prisma } = require('../config/database');
const { ReturnType } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  calculateInterestNow: calculateInterestNowService,
  getInterestCalculationHistory,
  revertLastInterestCalculation,
  updateReturnPercentage,
  updateBalanceCalculateReturn
} = require('../services/interestService');
const {
  calculateInterestNowSchema,
  revertCalculationSchema,
  updateReturnPercentageSchema,
  updateBalanceSchema,
  scheduleSettingsSchema
} = require('../validators/interestValidator');
const { formatInterestCalculationResponse } = require('../utils/responseFormatter');

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    const err = new Error('Validation error');
    err.status = 400;
    err.details = error.details.map(d => d.message);
    throw err;
  }
  return value;
}

/**
 * Calculate interest now for fixed-rate investment
 * @route POST /api/interest/calculate/:investmentId
 * @access Private
 */
const calculateInterestNowHandler = asyncHandler(async (req, res) => {
  const { investmentId } = validate(calculateInterestNowSchema, { investmentId: req.params.investmentId });
  const result = await calculateInterestNowService(investmentId, req.user.id);
  res.status(200).json({ success: true, message: 'Interest calculated successfully', data: formatInterestCalculationResponse(result) });
});

/**
 * Revert the most recent interest calculation
 * @route POST /api/interest/revert/:investmentId
 * @access Private
 */
const revertLastCalculationHandler = asyncHandler(async (req, res) => {
  const payload = validate(revertCalculationSchema, { investmentId: req.params.investmentId, ...req.body });
  const result = await revertLastInterestCalculation(payload.investmentId, req.user.id);
  res.status(200).json({ success: true, message: 'Interest calculation reverted successfully', data: result });
});

/**
 * Get interest calculation history for an investment
 * @route GET /api/interest/history/:investmentId
 * @access Private
 */
const getCalculationHistoryHandler = asyncHandler(async (req, res) => {
  const investmentId = req.params.investmentId;
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const result = await getInterestCalculationHistory(investmentId, req.user.id, { page, limit });
  res.status(200).json({ success: true, message: 'Interest calculation history retrieved successfully', data: result });
});

/**
 * Update variable investment by return percentage
 * @route POST /api/interest/variable/update-percentage/:investmentId
 * @access Private
 */
const updateReturnPercentageHandler = asyncHandler(async (req, res) => {
  const payload = validate(updateReturnPercentageSchema, { investmentId: req.params.investmentId, ...req.body });
  const result = await updateReturnPercentage(payload.investmentId, req.user.id, payload.percentage, payload.effectiveDate, payload.description);
  res.status(200).json({ success: true, message: 'Return percentage updated successfully', data: result });
});

/**
 * Update variable investment by providing a new balance (derive percentage)
 * @route POST /api/interest/variable/update-balance/:investmentId
 * @access Private
 */
const updateBalanceCalculateReturnHandler = asyncHandler(async (req, res) => {
  const payload = validate(updateBalanceSchema, { investmentId: req.params.investmentId, ...req.body });
  const result = await updateBalanceCalculateReturn(payload.investmentId, req.user.id, payload.newBalance, payload.effectiveDate, payload.description);
  res.status(200).json({ success: true, message: 'Variable return calculated from balance update successfully', data: result });
});

/**
 * Preview interest calculation (no persistence)
 * @route GET /api/interest/preview/:investmentId
 * @access Private
 */
const previewInterestCalculationHandler = asyncHandler(async (req, res) => {
  // Preview simply calls calculateInterestNow but does not persist; we rely on service preview in the future
  const { investmentId } = validate(calculateInterestNowSchema, { investmentId: req.params.investmentId });
  // For now, compute preview by reading investment and calculating period without writing
  const investment = await prisma.investment.findFirst({ where: { id: investmentId, userId: req.user.id } });
  if (!investment) {
    return res.status(404).json({
      success: false,
      error: 'Investment not found',
      code: 'RECORD_NOT_FOUND'
    });
  }
  if (investment.returnType !== ReturnType.FIXED) {
    return res.status(400).json({
      success: false,
      error: 'Preview only available for FIXED investments',
      code: 'INVALID_OPERATION'
    });
  }
  if (!investment.interestRate) {
    return res.status(400).json({
      success: false,
      error: 'Preview only available for investments with interest rate',
      code: 'INVALID_OPERATION'
    });
  }
  
  const now = new Date();
  const periodStart = investment.lastInterestCalculated || investment.startDate;
  const { calculateDaysBetween, calculatePeriodInterest } = require('../utils/calculations');
  const days = calculateDaysBetween(periodStart, now);
  const { interest, newBalance } = calculatePeriodInterest(parseFloat(investment.currentBalance), parseFloat(investment.interestRate), investment.compoundingFrequency || 'MONTHLY', days);
  res.status(200).json({ success: true, message: 'Interest calculation preview generated successfully', data: { preview: true, investmentId, days, interest, newBalance, periodStart, periodEnd: now } });
});

/**
 * Update auto-calculation schedule for fixed investment
 * @route PATCH /api/interest/schedule/:investmentId
 * @access Private
 */
const updateInvestmentScheduleHandler = asyncHandler(async (req, res) => {
  const payload = validate(scheduleSettingsSchema, req.body);
  const { investmentId } = validate(calculateInterestNowSchema, { investmentId: req.params.investmentId });
  const updated = await prisma.investment.update({
    where: { id: investmentId },
    data: {
      autoCalculateInterest: payload.autoCalculate,
      compoundingFrequency: payload.compoundingFrequency
    }
  });
  res.status(200).json({ success: true, message: 'Investment schedule updated successfully', data: updated });
});

module.exports = {
  calculateInterestNowHandler,
  revertLastCalculationHandler,
  getCalculationHistoryHandler,
  updateReturnPercentageHandler,
  updateBalanceCalculateReturnHandler,
  previewInterestCalculationHandler,
  updateInvestmentScheduleHandler
};
