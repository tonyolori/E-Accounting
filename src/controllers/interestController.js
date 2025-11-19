const { prisma } = require('../config/database');
const {
  calculateInterestNow,
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

exports.calculateInterestNow = async (req, res, next) => {
  try {
    const { investmentId } = validate(calculateInterestNowSchema, { investmentId: req.params.investmentId });
    const result = await calculateInterestNow(investmentId, req.user.id);
    return res.status(200).json({ success: true, data: formatInterestCalculationResponse(result) });
  } catch (err) { next(err); }
};

exports.revertLastCalculation = async (req, res, next) => {
  try {
    const payload = validate(revertCalculationSchema, { investmentId: req.params.investmentId, ...req.body });
    const result = await revertLastInterestCalculation(payload.investmentId, req.user.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.getCalculationHistory = async (req, res, next) => {
  try {
    const investmentId = req.params.investmentId;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const result = await getInterestCalculationHistory(investmentId, req.user.id, { page, limit });
    return res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.updateReturnPercentage = async (req, res, next) => {
  try {
    const payload = validate(updateReturnPercentageSchema, { investmentId: req.params.investmentId, ...req.body });
    const result = await updateReturnPercentage(payload.investmentId, req.user.id, payload.percentage, payload.effectiveDate, payload.description);
    return res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.updateBalanceCalculateReturn = async (req, res, next) => {
  try {
    const payload = validate(updateBalanceSchema, { investmentId: req.params.investmentId, ...req.body });
    const result = await updateBalanceCalculateReturn(payload.investmentId, req.user.id, payload.newBalance, payload.effectiveDate, payload.description);
    return res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.previewInterestCalculation = async (req, res, next) => {
  try {
    // Preview simply calls calculateInterestNow but does not persist; we rely on service preview in the future
    const { investmentId } = validate(calculateInterestNowSchema, { investmentId: req.params.investmentId });
    // For now, compute preview by reading investment and calculating period without writing
    const investment = await prisma.investment.findFirst({ where: { id: investmentId, userId: req.user.id } });
    if (!investment) { const e = new Error('Investment not found'); e.status = 404; throw e; }
    if (investment.returnType !== 'FIXED' || !investment.interestRate) { const e = new Error('Preview only available for FIXED with interest rate'); e.status = 400; throw e; }
    const now = new Date();
    const periodStart = investment.lastInterestCalculated || investment.startDate;
    const { calculateDaysBetween, calculatePeriodInterest } = require('../utils/calculations');
    const days = calculateDaysBetween(periodStart, now);
    const { interest, newBalance } = calculatePeriodInterest(parseFloat(investment.currentBalance), parseFloat(investment.interestRate), investment.compoundingFrequency || 'MONTHLY', days);
    return res.status(200).json({ success: true, data: { preview: true, investmentId, days, interest, newBalance, periodStart, periodEnd: now } });
  } catch (err) { next(err); }
};

exports.updateInvestmentSchedule = async (req, res, next) => {
  try {
    const payload = validate(scheduleSettingsSchema, req.body);
    const { investmentId } = validate(calculateInterestNowSchema, { investmentId: req.params.investmentId });
    const updated = await prisma.investment.update({
      where: { id: investmentId },
      data: {
        autoCalculateInterest: payload.autoCalculate,
        compoundingFrequency: payload.compoundingFrequency
      }
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) { next(err); }
};
