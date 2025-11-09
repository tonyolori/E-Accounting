/**
 * Email validation regex pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password validation rules
 */
const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {Object} Validation result with isValid and error
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email is required and must be a string'
    };
  }

  if (email.length > 255) {
    return {
      isValid: false,
      error: 'Email must be less than 255 characters'
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      error: 'Please provide a valid email address'
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid, error, and score
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password is required and must be a string',
      score: 0
    };
  }

  const errors = [];
  let score = 0;

  // Length check
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters long`);
  } else {
    score += 25;
  }

  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_RULES.maxLength} characters long`);
  }

  // Character type checks
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (PASSWORD_RULES.requireUppercase) {
    score += 25;
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (PASSWORD_RULES.requireLowercase) {
    score += 25;
  }

  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (PASSWORD_RULES.requireNumbers) {
    score += 25;
  }

  if (PASSWORD_RULES.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('. ') : null,
    score: Math.min(score, 100)
  };
}

/**
 * Validate name fields (firstName, lastName)
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} Validation result
 */
function validateName(name, fieldName = 'Name') {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: `${fieldName} is required and must be a string`
    };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty`
    };
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 2 characters long`
    };
  }

  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: `${fieldName} must be less than 50 characters long`
    };
  }

  // Check for valid characters (letters, spaces, apostrophes, hyphens)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
    return {
      isValid: false,
      error: `${fieldName} can only contain letters, spaces, apostrophes, and hyphens`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Sanitize and normalize email
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
}

/**
 * Sanitize name fields
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name.trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Validate UUID format
 * @param {string} id - UUID to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof id === 'string' && uuidRegex.test(id);
}

module.exports = {
  EMAIL_REGEX,
  PASSWORD_RULES,
  validateEmail,
  validatePassword,
  validateName,
  sanitizeEmail,
  sanitizeName,
  isValidUUID
};
