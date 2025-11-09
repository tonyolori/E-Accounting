const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 * @param {Object} payload - User data to include in token
 * @param {string} expiresIn - Token expiration time (default: 7d)
 * @returns {string} JWT token
 */
function generateJWT(payload, expiresIn = '7d') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: 'e-accounting-api',
    audience: 'e-accounting-client'
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyJWT(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'e-accounting-api',
      audience: 'e-accounting-client'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Extract JWT token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

module.exports = {
  hashPassword,
  comparePassword,
  generateJWT,
  verifyJWT,
  extractTokenFromHeader
};
