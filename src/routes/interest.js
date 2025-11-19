const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/interestController');

// Fixed interest
router.post('/calculate/:investmentId', requireAuth, controller.calculateInterestNow);
router.post('/revert/:investmentId', requireAuth, controller.revertLastCalculation);
router.get('/history/:investmentId', requireAuth, controller.getCalculationHistory);
router.get('/preview/:investmentId', requireAuth, controller.previewInterestCalculation);
router.patch('/schedule/:investmentId', requireAuth, controller.updateInvestmentSchedule);

// Variable investments
router.post('/variable/update-percentage/:investmentId', requireAuth, controller.updateReturnPercentage);
router.post('/variable/update-balance/:investmentId', requireAuth, controller.updateBalanceCalculateReturn);

module.exports = router;
