const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/interestController');

// Fixed interest
router.post('/calculate/:investmentId', requireAuth, controller.calculateInterestNowHandler);
router.post('/revert/:investmentId', requireAuth, controller.revertLastCalculationHandler);
router.get('/history/:investmentId', requireAuth, controller.getCalculationHistoryHandler);
router.get('/preview/:investmentId', requireAuth, controller.previewInterestCalculationHandler);
router.patch('/schedule/:investmentId', requireAuth, controller.updateInvestmentScheduleHandler);

// Variable investments
router.post('/variable/update-percentage/:investmentId', requireAuth, controller.updateReturnPercentageHandler);
router.post('/variable/update-balance/:investmentId', requireAuth, controller.updateBalanceCalculateReturnHandler);

module.exports = router;
