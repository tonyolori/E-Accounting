const {
  createInvestment,
  getUserInvestments,
  getInvestmentById,
  updateInvestment,
  updateInvestmentStatus,
  updateInvestmentBalance,
  getInvestmentSummary
} = require('../services/investmentService');

const {
  validateCreateInvestment,
  validateUpdateInvestment,
  validateStatusUpdate,
  validateBalanceUpdate,
  validateQueryFilters
} = require('../validators/investmentValidator');

const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new investment
 * @route POST /api/investments
 * @access Private
 */
const createInvestmentHandler = asyncHandler(async (req, res) => {
  // Validate input
  const validation = validateCreateInvestment(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Create investment
  const investment = await createInvestment(req.user.id, validation.data);

  res.status(201).json({
    success: true,
    message: 'Investment created successfully',
    data: {
      investment
    }
  });
});

/**
 * Get user investments with optional filtering
 * @route GET /api/investments
 * @access Private
 */
const getInvestmentsHandler = asyncHandler(async (req, res) => {
  // Validate query parameters
  const validation = validateQueryFilters(req.query);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Get investments
  const result = await getUserInvestments(req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Investments retrieved successfully',
    data: {
      investments: result.investments,
      pagination: result.pagination
    }
  });
});

/**
 * Get specific investment by ID
 * @route GET /api/investments/:id
 * @access Private
 */
const getInvestmentByIdHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get investment
  const investment = await getInvestmentById(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Investment retrieved successfully',
    data: {
      investment
    }
  });
});

/**
 * Update investment
 * @route PUT /api/investments/:id
 * @access Private
 */
const updateInvestmentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate input
  const validation = validateUpdateInvestment(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Update investment
  const investment = await updateInvestment(id, req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Investment updated successfully',
    data: {
      investment
    }
  });
});

/**
 * Update investment status
 * @route PATCH /api/investments/:id/status
 * @access Private
 */
const updateInvestmentStatusHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate input
  const validation = validateStatusUpdate(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Update status
  const investment = await updateInvestmentStatus(id, req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Investment status updated successfully',
    data: {
      investment
    }
  });
});

/**
 * Update investment balance manually
 * @route PATCH /api/investments/:id/balance
 * @access Private
 */
const updateInvestmentBalanceHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate input
  const validation = validateBalanceUpdate(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: validation.errors,
      code: 'VALIDATION_ERROR'
    });
  }

  // Update balance
  const investment = await updateInvestmentBalance(id, req.user.id, validation.data);

  res.status(200).json({
    success: true,
    message: 'Investment balance updated successfully',
    data: {
      investment
    }
  });
});

/**
 * Get investment summary for user
 * @route GET /api/investments/summary
 * @access Private
 */
const getInvestmentSummaryHandler = asyncHandler(async (req, res) => {
  // Get summary
  const summary = await getInvestmentSummary(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Investment summary retrieved successfully',
    data: {
      summary
    }
  });
});

/**
 * Delete/Cancel investment
 * @route DELETE /api/investments/:id
 * @access Private
 */
const deleteInvestmentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cancel investment by updating status
  const investment = await updateInvestmentStatus(id, req.user.id, {
    status: 'CANCELLED',
    notes: 'Investment cancelled by user'
  });

  res.status(200).json({
    success: true,
    message: 'Investment cancelled successfully',
    data: {
      investment
    }
  });
});

module.exports = {
  createInvestmentHandler,
  getInvestmentsHandler,
  getInvestmentByIdHandler,
  updateInvestmentHandler,
  updateInvestmentStatusHandler,
  updateInvestmentBalanceHandler,
  getInvestmentSummaryHandler,
  deleteInvestmentHandler
};
