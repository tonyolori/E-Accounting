const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { 
  register, 
  login, 
  getMe, 
  logout, 
  refreshToken 
} = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', requireAuth, getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', requireAuth, logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh user token
 * @access  Private
 */
router.post('/refresh', requireAuth, refreshToken);

module.exports = router;
