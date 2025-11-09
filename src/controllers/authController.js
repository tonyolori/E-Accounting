const { registerUser, loginUser, getUserById } = require('../services/authService');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateRegistration(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Register user
  const result = await registerUser(validation.data);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: result.user,
      token: result.token
    }
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateLogin(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Authenticate user
  const result = await loginUser(validation.data);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      token: result.token
    }
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  // User is already attached to request by auth middleware
  const user = req.user;

  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: user
    }
  });
});

/**
 * Logout user (client-side token removal)
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = asyncHandler(async (req, res) => {
  // In JWT implementation, logout is handled client-side by removing the token
  // This endpoint can be used for logging/analytics purposes
  
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Refresh token (if needed in the future)
 * @route POST /api/auth/refresh
 * @access Private
 */
const refreshToken = asyncHandler(async (req, res) => {
  // For now, we'll return the current user info
  // In the future, this could generate a new token
  
  const user = req.user;
  
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user: user,
      token: req.token // Return existing token for now
    }
  });
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  refreshToken
};
