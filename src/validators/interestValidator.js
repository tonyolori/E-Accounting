const Joi = require('joi');

const calculateInterestNowSchema = Joi.object({
  investmentId: Joi.string().uuid().required()
});

const revertCalculationSchema = Joi.object({
  investmentId: Joi.string().uuid().required(),
  confirmRevert: Joi.boolean().valid(true).required()
});

const updateReturnPercentageSchema = Joi.object({
  investmentId: Joi.string().uuid().required(),
  percentage: Joi.number().min(-100).max(1000).required(),
  effectiveDate: Joi.date().max('now').optional(),
  description: Joi.string().max(500).optional()
});

const updateBalanceSchema = Joi.object({
  investmentId: Joi.string().uuid().required(),
  newBalance: Joi.number().min(0).required(),
  effectiveDate: Joi.date().max('now').optional(),
  description: Joi.string().max(500).optional()
});

const scheduleSettingsSchema = Joi.object({
  autoCalculate: Joi.boolean().required(),
  compoundingFrequency: Joi.string().valid('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY').required()
});

module.exports = {
  calculateInterestNowSchema,
  revertCalculationSchema,
  updateReturnPercentageSchema,
  updateBalanceSchema,
  scheduleSettingsSchema
};
