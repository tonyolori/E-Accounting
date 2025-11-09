const Joi = require('joi');

/**
 * Transaction creation validation schema
 */
const createTransactionSchema = Joi.object({
  investmentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Investment ID must be a valid UUID',
      'any.required': 'Investment ID is required'
    }),

  type: Joi.string()
    .valid('RETURN', 'WITHDRAWAL', 'DEPOSIT', 'DIVIDEND')
    .required()
    .messages({
      'any.only': 'Type must be one of: RETURN, WITHDRAWAL, DEPOSIT, DIVIDEND',
      'any.required': 'Transaction type is required'
    }),

  amount: Joi.number()
    .required()
    .precision(2)
    .messages({
      'number.base': 'Amount must be a number',
      'any.required': 'Amount is required'
    }),

  percentage: Joi.number()
    .min(-100)
    .max(100)
    .precision(4)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Percentage must be a number',
      'number.min': 'Percentage cannot be less than -100%',
      'number.max': 'Percentage cannot be more than 100%'
    }),

  transactionDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.format': 'Transaction date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Transaction date cannot be in the future',
      'any.required': 'Transaction date is required'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must be less than 500 characters'
    })
});

/**
 * Transaction update validation schema
 */
const updateTransactionSchema = Joi.object({
  type: Joi.string()
    .valid('RETURN', 'WITHDRAWAL', 'DEPOSIT', 'DIVIDEND')
    .optional()
    .messages({
      'any.only': 'Type must be one of: RETURN, WITHDRAWAL, DEPOSIT, DIVIDEND'
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
    .allow(null)
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
    .allow(null)
    .messages({
      'string.max': 'Description must be less than 500 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Transaction query filters validation schema
 */
const transactionQueryFiltersSchema = Joi.object({
  investmentId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Investment ID must be a valid UUID'
    }),

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

  minAmount: Joi.number()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Minimum amount must be a number'
    }),

  maxAmount: Joi.number()
    .precision(2)
    .when('minAmount', {
      is: Joi.number().exist(),
      then: Joi.number().greater(Joi.ref('minAmount')).optional(),
      otherwise: Joi.number().optional()
    })
    .messages({
      'number.base': 'Maximum amount must be a number',
      'number.greater': 'Maximum amount must be greater than minimum amount'
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
    .valid('transactionDate', 'amount', 'type', 'createdAt')
    .default('transactionDate')
    .optional()
    .messages({
      'any.only': 'Sort field must be one of: transactionDate, amount, type, createdAt'
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
 * Bulk transaction operations validation schema
 */
const bulkTransactionSchema = Joi.object({
  transactions: Joi.array()
    .items(createTransactionSchema)
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one transaction is required',
      'array.max': 'Cannot process more than 50 transactions at once',
      'any.required': 'Transactions array is required'
    })
});

/**
 * Transaction statistics query validation schema
 */
const transactionStatsQuerySchema = Joi.object({
  investmentId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Investment ID must be a valid UUID'
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

  groupBy: Joi.string()
    .valid('type', 'investment', 'month', 'year')
    .default('type')
    .optional()
    .messages({
      'any.only': 'Group by must be one of: type, investment, month, year'
    })
});

/**
 * Validate transaction creation input
 * @param {Object} data - Transaction data to validate
 * @returns {Object} Validation result
 */
function validateCreateTransaction(data) {
  const { error, value } = createTransactionSchema.validate(data, {
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
 * Validate transaction update input
 * @param {Object} data - Transaction update data to validate
 * @returns {Object} Validation result
 */
function validateUpdateTransaction(data) {
  const { error, value } = updateTransactionSchema.validate(data, {
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
 * Validate transaction query filters
 * @param {Object} data - Query filters data to validate
 * @returns {Object} Validation result
 */
function validateTransactionQueryFilters(data) {
  const { error, value } = transactionQueryFiltersSchema.validate(data, {
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
 * Validate bulk transactions input
 * @param {Object} data - Bulk transactions data to validate
 * @returns {Object} Validation result
 */
function validateBulkTransactions(data) {
  const { error, value } = bulkTransactionSchema.validate(data, {
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
 * Validate transaction stats query input
 * @param {Object} data - Stats query data to validate
 * @returns {Object} Validation result
 */
function validateTransactionStatsQuery(data) {
  const { error, value } = transactionStatsQuerySchema.validate(data, {
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
  createTransactionSchema,
  updateTransactionSchema,
  transactionQueryFiltersSchema,
  bulkTransactionSchema,
  transactionStatsQuerySchema,
  validateCreateTransaction,
  validateUpdateTransaction,
  validateTransactionQueryFilters,
  validateBulkTransactions,
  validateTransactionStatsQuery
};
