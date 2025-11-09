const Joi = require('joi');

/**
 * User registration validation schema
 */
const registrationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must be less than 255 characters',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be less than 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match password',
      'any.required': 'Password confirmation is required'
    }),

  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(new RegExp("^[a-zA-Z\\s'-]+$"))
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must be less than 50 characters',
      'string.pattern.base': 'First name can only contain letters, spaces, apostrophes, and hyphens',
      'any.required': 'First name is required'
    }),

  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(new RegExp("^[a-zA-Z\\s'-]+$"))
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must be less than 50 characters',
      'string.pattern.base': 'Last name can only contain letters, spaces, apostrophes, and hyphens',
      'any.required': 'Last name is required'
    })
});

/**
 * User login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Password reset request validation schema
 */
const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

/**
 * Password reset validation schema
 */
const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be less than 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match password',
      'any.required': 'Password confirmation is required'
    })
});

/**
 * Validate registration input
 * @param {Object} data - Registration data to validate
 * @returns {Object} Validation result
 */
function validateRegistration(data) {
  const { error, value } = registrationSchema.validate(data, {
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
 * Validate login input
 * @param {Object} data - Login data to validate
 * @returns {Object} Validation result
 */
function validateLogin(data) {
  const { error, value } = loginSchema.validate(data, {
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
 * Validate password reset request input
 * @param {Object} data - Password reset request data to validate
 * @returns {Object} Validation result
 */
function validatePasswordResetRequest(data) {
  const { error, value } = passwordResetRequestSchema.validate(data, {
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
 * Validate password reset input
 * @param {Object} data - Password reset data to validate
 * @returns {Object} Validation result
 */
function validatePasswordReset(data) {
  const { error, value } = passwordResetSchema.validate(data, {
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

module.exports = {
  registrationSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  validateRegistration,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset
};
