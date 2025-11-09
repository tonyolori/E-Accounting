const { verifyJWT, extractTokenFromHeader } = require('../utils/auth');
const { prisma } = require('../config/database');

/**
 * Authentication middleware - requires valid JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function requireAuth(req, res, next) {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = verifyJWT(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message || 'Invalid or expired token',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found - token may be invalid',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Authentication service unavailable',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = verifyJWT(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Silently ignore token errors for optional auth
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
}

/**
 * Check if request has authenticated user
 * @param {Object} req - Express request object
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated(req) {
  return req.user && req.user.id;
}

/**
 * Get current user ID from request
 * @param {Object} req - Express request object
 * @returns {string|null} User ID or null if not authenticated
 */
function getCurrentUserId(req) {
  return req.user?.id || null;
}

module.exports = {
  requireAuth,
  optionalAuth,
  isAuthenticated,
  getCurrentUserId
};
