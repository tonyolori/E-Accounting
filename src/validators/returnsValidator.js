const Joi = require('joi');

/**
 * Manual return validation schema
 */
const manualReturnSchema = Joi.object({
  investmentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Investment ID must be a valid UUID',
      'any.required': 'Investment ID is required'
    }),

  amount: Joi.number()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Amount must be a number'
    }),

  percentage: Joi.number()
    .min(-100)
    .max(100)
    .precision(4)
    .optional()
    .messages({
      'number.base': 'Percentage must be a number',
      'number.min': 'Percentage cannot be less than -100%',
      'number.max': 'Percentage cannot be more than 100%'
    }),

  transactionDate: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.format': 'Transaction date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Transaction date cannot be in the future'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must be less than 500 characters'
    }),

  type: Joi.string()
    .valid('RETURN', 'WITHDRAWAL', 'DEPOSIT', 'DIVIDEND')
    .default('RETURN')
    .optional()
    .messages({
      'any.only': 'Type must be one of: RETURN, WITHDRAWAL, DEPOSIT, DIVIDEND'
    })
}).xor('amount', 'percentage').messages({
  'object.xor': 'Either amount or percentage must be specified, but not both'
});

/**
 * Compound interest calculation validation schema
 */
const calculateInterestSchema = Joi.object({
  principal: Joi.number()
    .positive()
    .precision(2)
    .max(999999999999.99)
    .required()
    .messages({
      'number.positive': 'Principal amount must be positive',
      'number.max': 'Principal amount is too large',
      'any.required': 'Principal amount is required'
    }),

  annualRate: Joi.number()
    .min(0)
    .max(100)
    .precision(4)
    .required()
    .messages({
      'number.min': 'Annual rate cannot be negative',
      'number.max': 'Annual rate cannot exceed 100%',
      'any.required': 'Annual rate is required'
    }),

  compoundingFrequency: Joi.number()
    .integer()
    .valid(1, 4, 12, 365)
    .default(12)
    .optional()
    .messages({
      'number.integer': 'Compounding frequency must be an integer',
      'any.only': 'Compounding frequency must be 1 (annually), 4 (quarterly), 12 (monthly), or 365 (daily)'
    }),

  years: Joi.number()
    .positive()
    .max(50)
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Years must be positive',
      'number.max': 'Years cannot exceed 50',
      'any.required': 'Years is required'
    }),

  monthlyContribution: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .optional()
    .messages({
      'number.min': 'Monthly contribution cannot be negative'
    })
});

/**
 * Projected returns calculation validation schema
 */
const projectedReturnsSchema = Joi.object({
  years: Joi.number()
    .positive()
    .max(50)
    .precision(2)
    .default(1)
    .optional()
    .messages({
      'number.positive': 'Years must be positive',
      'number.max': 'Years cannot exceed 50'
    }),

  monthlyContribution: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .optional()
    .messages({
      'number.min': 'Monthly contribution cannot be negative'
    }),

  annualRate: Joi.number()
    .min(0)
    .max(100)
    .precision(4)
    .optional()
    .messages({
      'number.min': 'Annual rate cannot be negative',
      'number.max': 'Annual rate cannot exceed 100%'
    }),

  compoundingFrequency: Joi.number()
    .integer()
    .valid(1, 4, 12, 365)
    .default(12)
    .optional()
    .messages({
      'number.integer': 'Compounding frequency must be an integer',
      'any.only': 'Compounding frequency must be 1 (annually), 4 (quarterly), 12 (monthly), or 365 (daily)'
    })
});

/**
 * Returns query filters validation schema
 */
const returnsQueryFiltersSchema = Joi.object({
  type: Joi.string()
    .valid('RETURN', 'WITHDRAWAL', 'DEPOSIT', 'DIVIDEND')
    .optional()
    .messages({
      'any.only': 'Type must be one of: RETURN, WITHDRAWAL, DEPOSIT, DIVIDEND'
    }),

  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),

  endDate: Joi.date()
    .iso()
    .when('startDate', {
      is: Joi.date().exist(),
      then: Joi.date().greater(Joi.ref('startDate')).optional(),
      otherwise: Joi.date().optional()
    })
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.greater': 'End date must be after start date'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional()
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),

  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.integer': 'Offset must be an integer',
      'number.min': 'Offset cannot be negative'
    }),

  sortBy: Joi.string()
    .valid('transactionDate', 'amount', 'percentage', 'type', 'createdAt')
    .default('transactionDate')
    .optional()
    .messages({
      'any.only': 'Sort field must be one of: transactionDate, amount, percentage, type, createdAt'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});

/**
 * Bulk returns validation schema
 */
const bulkReturnsSchema = Joi.object({
  returnEntries: Joi.array()
    .items(Joi.object({
      investmentId: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.uuid': 'Investment ID must be a valid UUID',
          'any.required': 'Investment ID is required'
        }),
      
      returnData: manualReturnSchema.fork('investmentId', (schema) => schema.forbidden())
    }))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one return entry is required',
      'array.max': 'Cannot process more than 50 returns at once',
      'any.required': 'Return entries array is required'
    })
});

/**
 * Validate manual return input
 * @param {Object} data - Manual return data to validate
 * @returns {Object} Validation result
 */
function validateManualReturn(data) {
  const { error, value } = manualReturnSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

/**
 * Validate calculate interest input
 * @param {Object} data - Calculate interest data to validate
 * @returns {Object} Validation result
 */
function validateCalculateInterest(data) {
  const { error, value } = calculateInterestSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

/**
 * Validate projected returns input
 * @param {Object} data - Projected returns data to validate
 * @returns {Object} Validation result
 */
function validateProjectedReturns(data) {
  const { error, value } = projectedReturnsSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

/**
 * Validate returns query filters input
 * @param {Object} data - Query filters data to validate
 * @returns {Object} Validation result
 */
function validateReturnsQueryFilters(data) {
  const { error, value } = returnsQueryFiltersSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

/**
 * Validate bulk returns input
 * @param {Object} data - Bulk returns data to validate
 * @returns {Object} Validation result
 */
function validateBulkReturns(data) {
  const { error, value } = bulkReturnsSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      data: null
    };
  }

  return {
    isValid: true,
    errors: null,
    data: value
  };
}

module.exports = {
  manualReturnSchema,
  calculateInterestSchema,
  projectedReturnsSchema,
  returnsQueryFiltersSchema,
  bulkReturnsSchema,
  validateManualReturn,
  validateCalculateInterest,
  validateProjectedReturns,
  validateReturnsQueryFilters,
  validateBulkReturns
};
