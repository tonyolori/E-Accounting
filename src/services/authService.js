const { prisma } = require('../config/database');
const { hashPassword, comparePassword, generateJWT } = require('../utils/auth');
const { sanitizeEmail, sanitizeName } = require('../utils/validation');
const { AppError } = require('../middleware/errorHandler');

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user and token
 * @throws {AppError} If email already exists or registration fails
 */
async function registerUser(userData) {
  const { email, password, firstName, lastName } = userData;

  try {
    // Sanitize input data
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFirstName = sanitizeName(firstName);
    const sanitizedLastName = sanitizeName(lastName);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existingUser) {
      throw new AppError(
        'An account with this email already exists',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Generate JWT token
    const token = generateJWT({
      id: user.id,
      email: user.email
    });

    return {
      user,
      token
    };
  } catch (error) {
    // Re-throw AppErrors
    if (error instanceof AppError) {
      throw error;
    }

    // Handle Prisma errors
    if (error.code === 'P2002') {
      throw new AppError(
        'An account with this email already exists',
        409,
        'EMAIL_ALREADY_EXISTS'
      );
    }

    // Handle other errors
    console.error('Registration error:', error);
    throw new AppError(
      'User registration failed',
      500,
      'REGISTRATION_ERROR'
    );
  }
}

/**
 * Authenticate user login
 * @param {Object} loginData - User login credentials
 * @returns {Object} User and token
 * @throws {AppError} If credentials are invalid
 */
async function loginUser(loginData) {
  const { email, password } = loginData;

  try {
    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError(
        'Invalid email or password',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new AppError(
        'Invalid email or password',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = generateJWT({
      id: user.id,
      email: user.email
    });

    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    // Re-throw AppErrors
    if (error instanceof AppError) {
      throw error;
    }

    // Handle other errors
    console.error('Login error:', error);
    throw new AppError(
      'Login failed',
      500,
      'LOGIN_ERROR'
    );
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User data without password
 * @throws {AppError} If user not found
 */
async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND'
      );
    }

    return user;
  } catch (error) {
    // Re-throw AppErrors
    if (error instanceof AppError) {
      throw error;
    }

    // Handle other errors
    console.error('Get user error:', error);
    throw new AppError(
      'Failed to retrieve user',
      500,
      'USER_RETRIEVAL_ERROR'
    );
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user data
 * @throws {AppError} If user not found or update fails
 */
async function updateUserProfile(userId, updateData) {
  try {
    const { firstName, lastName } = updateData;
    
    const updateFields = {};
    
    if (firstName !== undefined) {
      updateFields.firstName = sanitizeName(firstName);
    }
    
    if (lastName !== undefined) {
      updateFields.lastName = sanitizeName(lastName);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateFields,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND'
      );
    }

    console.error('Update user error:', error);
    throw new AppError(
      'Failed to update user profile',
      500,
      'USER_UPDATE_ERROR'
    );
  }
}

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @returns {boolean} True if email exists
 */
async function emailExists(email) {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: { id: true }
    });

    return !!user;
  } catch (error) {
    console.error('Email check error:', error);
    throw new AppError(
      'Email verification failed',
      500,
      'EMAIL_CHECK_ERROR'
    );
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  emailExists
};
