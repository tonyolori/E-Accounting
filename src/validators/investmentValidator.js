const Joi = require('joi');

/**
 * Investment creation validation schema
 */
const createInvestmentSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Investment name must be at least 2 characters long',
      'string.max': 'Investment name must be less than 255 characters',
      'any.required': 'Investment name is required'
    }),

  category: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Category must be at least 2 characters long',
      'string.max': 'Category must be less than 100 characters',
      'any.required': 'Investment category is required'
    }),

  currency: Joi.string()
    .uppercase()
    .length(3)
    .optional()
    .messages({
      'string.length': 'Currency must be a 3-letter ISO code'
    }),

  initialAmount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999999.99) // 15 digits total, 2 decimal places
    .required()
    .messages({
      'number.positive': 'Initial amount must be a positive number',
      'number.max': 'Initial amount is too large',
      'any.required': 'Initial amount is required'
    }),

  returnType: Joi.string()
    .valid('FIXED', 'VARIABLE')
    .required()
    .messages({
      'any.only': 'Return type must be either FIXED or VARIABLE',
      'any.required': 'Return type is required'
    }),

  interestRate: Joi.when('returnType', {
    is: 'FIXED',
    then: Joi.number()
      .min(0)
      .max(100)
      .precision(4)
      .required()
      .messages({
        'number.min': 'Interest rate cannot be negative',
        'number.max': 'Interest rate cannot exceed 100%',
        'any.required': 'Interest rate is required for fixed return investments'
      }),
    otherwise: Joi.number()
      .min(0)
      .max(100)
      .precision(4)
      .optional()
      .allow(null)
      .messages({
        'number.min': 'Interest rate cannot be negative',
        'number.max': 'Interest rate cannot exceed 100%'
      })
  }),

  startDate: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Start date cannot be in the future',
      'any.required': 'Start date is required'
    }),

  endDate: Joi.date()
    .iso()
    .greater(Joi.ref('startDate'))
    .optional()
    .allow(null)
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.greater': 'End date must be after start date'
    }),

  notes: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes must be less than 1000 characters'
    })
});

/**
 * Investment update validation schema
 */
const updateInvestmentSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Investment name must be at least 2 characters long',
      'string.max': 'Investment name must be less than 255 characters'
    }),

  category: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Category must be at least 2 characters long',
      'string.max': 'Category must be less than 100 characters'
    }),

  currency: Joi.string()
    .uppercase()
    .length(3)
    .optional()
    .messages({
      'string.length': 'Currency must be a 3-letter ISO code'
    }),

  initialAmount: Joi.number()
    .positive()
    .precision(2)
    .max(999999999999.99)
    .optional()
    .messages({
      'number.positive': 'Initial amount must be a positive number',
      'number.max': 'Initial amount is too large'
    }),

  returnType: Joi.string()
    .valid('FIXED', 'VARIABLE')
    .optional()
    .messages({
      'any.only': 'Return type must be either FIXED or VARIABLE'
    }),

  interestRate: Joi.number()
    .min(0)
    .max(100)
    .precision(4)
    .optional()
    .allow(null)
    .messages({
      'number.min': 'Interest rate cannot be negative',
      'number.max': 'Interest rate cannot exceed 100%'
    }),

  endDate: Joi.date()
    .iso()
    .optional()
    .allow(null)
    .messages({
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)'
    }),

  notes: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .allow(null)
    .messages({
      'string.max': 'Notes must be less than 1000 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Investment status update validation schema
 */
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('ACTIVE', 'COMPLETED', 'CANCELLED')
    .required()
    .messages({
      'any.only': 'Status must be one of: ACTIVE, COMPLETED, CANCELLED',
      'any.required': 'Status is required'
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Status notes must be less than 500 characters'
    })
});

/**
 * Investment balance update validation schema
 */
const balanceUpdateSchema = Joi.object({
  currentBalance: Joi.number()
    .min(0)
    .precision(2)
    .max(999999999999.99)
    .required()
    .messages({
      'number.min': 'Balance cannot be negative',
      'number.max': 'Balance amount is too large',
      'any.required': 'Current balance is required'
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Balance update notes must be less than 500 characters'
    })
});

/**
 * Investment query filters validation schema
 */
const queryFiltersSchema = Joi.object({
  status: Joi.string()
    .valid('ACTIVE', 'COMPLETED', 'CANCELLED')
    .optional()
    .messages({
      'any.only': 'Status filter must be one of: ACTIVE, COMPLETED, CANCELLED'
    }),

  returnType: Joi.string()
    .valid('FIXED', 'VARIABLE')
    .optional()
    .messages({
      'any.only': 'Return type filter must be either FIXED or VARIABLE'
    }),

  currency: Joi.string()
    .uppercase()
    .length(3)
    .optional()
    .messages({
      'string.length': 'Currency filter must be a 3-letter ISO code'
    }),

  category: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Category filter cannot be empty',
      'string.max': 'Category filter must be less than 100 characters'
    }),

  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Start date filter must be in ISO format (YYYY-MM-DD)'
    }),

  endDate: Joi.date()
    .iso()
    .when('startDate', {
      is: Joi.date().exist(),
      then: Joi.date().greater(Joi.ref('startDate')).optional(),
      otherwise: Joi.date().optional()
    })
    .messages({
      'date.format': 'End date filter must be in ISO format (YYYY-MM-DD)',
      'date.greater': 'End date filter must be after start date filter'
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
    .valid('name', 'createdAt', 'updatedAt', 'startDate', 'initialAmount', 'currentBalance')
    .default('createdAt')
    .optional()
    .messages({
      'any.only': 'Sort field must be one of: name, createdAt, updatedAt, startDate, initialAmount, currentBalance'
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
 * Validate investment creation input
 * @param {Object} data - Investment data to validate
 * @returns {Object} Validation result
 */
function validateCreateInvestment(data) {
  const { error, value } = createInvestmentSchema.validate(data, {
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
 * Validate investment update input
 * @param {Object} data - Investment update data to validate
 * @returns {Object} Validation result
 */
function validateUpdateInvestment(data) {
  const { error, value } = updateInvestmentSchema.validate(data, {
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
 * Validate status update input
 * @param {Object} data - Status update data to validate
 * @returns {Object} Validation result
 */
function validateStatusUpdate(data) {
  const { error, value } = statusUpdateSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
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
 * Validate balance update input
 * @param {Object} data - Balance update data to validate
 * @returns {Object} Validation result
 */
function validateBalanceUpdate(data) {
  const { error, value } = balanceUpdateSchema.validate(data, {
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
 * Validate query filters input
 * @param {Object} data - Query filters data to validate
 * @returns {Object} Validation result
 */
function validateQueryFilters(data) {
  const { error, value } = queryFiltersSchema.validate(data, {
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
  createInvestmentSchema,
  updateInvestmentSchema,
  statusUpdateSchema,
  balanceUpdateSchema,
  queryFiltersSchema,
  validateCreateInvestment,
  validateUpdateInvestment,
  validateStatusUpdate,
  validateBalanceUpdate,
  validateQueryFilters
};
