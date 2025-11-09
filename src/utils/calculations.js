/**
 * Financial Calculation Utilities
 * 
 * This module provides various financial calculation functions
 * for investment returns, compound interest, and portfolio analysis.
 */

/**
 * Calculate compound interest
 * @param {number} principal - Initial investment amount
 * @param {number} annualRate - Annual interest rate (as decimal, e.g., 0.05 for 5%)
 * @param {number} compoundingFrequency - Number of times interest is compounded per year (12 for monthly, 4 for quarterly, 1 for annually)
 * @param {number} years - Number of years
 * @returns {Object} Calculation results
 */
function calculateCompoundInterest(principal, annualRate, compoundingFrequency, years) {
  // Validate inputs
  if (principal <= 0 || annualRate < 0 || compoundingFrequency <= 0 || years < 0) {
    throw new Error('Invalid input parameters for compound interest calculation');
  }

  // Convert percentage to decimal if needed
  const rate = annualRate > 1 ? annualRate / 100 : annualRate;
  
  // Compound interest formula: A = P(1 + r/n)^(nt)
  const futureValue = principal * Math.pow((1 + rate / compoundingFrequency), compoundingFrequency * years);
  
  // Calculate total returns
  const totalReturns = futureValue - principal;
  
  // Calculate effective annual rate
  const effectiveAnnualRate = Math.pow((1 + rate / compoundingFrequency), compoundingFrequency) - 1;
  
  return {
    principal: parseFloat(principal.toFixed(2)),
    futureValue: parseFloat(futureValue.toFixed(2)),
    totalReturns: parseFloat(totalReturns.toFixed(2)),
    annualRate: rate,
    effectiveAnnualRate: parseFloat(effectiveAnnualRate.toFixed(6)),
    compoundingFrequency,
    years,
    percentageGain: parseFloat(((totalReturns / principal) * 100).toFixed(2))
  };
}

/**
 * Calculate simple interest
 * @param {number} principal - Initial investment amount
 * @param {number} annualRate - Annual interest rate (as decimal or percentage)
 * @param {number} years - Number of years
 * @returns {Object} Calculation results
 */
function calculateSimpleInterest(principal, annualRate, years) {
  // Validate inputs
  if (principal <= 0 || annualRate < 0 || years < 0) {
    throw new Error('Invalid input parameters for simple interest calculation');
  }

  // Convert percentage to decimal if needed
  const rate = annualRate > 1 ? annualRate / 100 : annualRate;
  
  // Simple interest formula: I = P * r * t
  const interest = principal * rate * years;
  const futureValue = principal + interest;
  
  return {
    principal: parseFloat(principal.toFixed(2)),
    futureValue: parseFloat(futureValue.toFixed(2)),
    totalInterest: parseFloat(interest.toFixed(2)),
    annualRate: rate,
    years,
    percentageGain: parseFloat(((interest / principal) * 100).toFixed(2))
  };
}

/**
 * Calculate monthly return amount for fixed-rate investments
 * @param {number} principal - Current balance
 * @param {number} annualRate - Annual interest rate (as decimal or percentage)
 * @param {boolean} isCompound - Whether to use compound calculation
 * @returns {Object} Monthly return calculation
 */
function calculateMonthlyReturn(principal, annualRate, isCompound = false) {
  // Validate inputs
  if (principal <= 0 || annualRate < 0) {
    throw new Error('Invalid input parameters for monthly return calculation');
  }

  // Convert percentage to decimal if needed
  const rate = annualRate > 1 ? annualRate / 100 : annualRate;
  const monthlyRate = rate / 12;
  
  let monthlyReturn;
  let newBalance;
  
  if (isCompound) {
    // Compound monthly calculation
    newBalance = principal * (1 + monthlyRate);
    monthlyReturn = newBalance - principal;
  } else {
    // Simple monthly calculation
    monthlyReturn = principal * monthlyRate;
    newBalance = principal + monthlyReturn;
  }
  
  return {
    currentBalance: parseFloat(principal.toFixed(2)),
    monthlyReturn: parseFloat(monthlyReturn.toFixed(2)),
    newBalance: parseFloat(newBalance.toFixed(2)),
    monthlyRate: parseFloat(monthlyRate.toFixed(6)),
    annualRate: rate,
    isCompound
  };
}

/**
 * Calculate return percentage between two values
 * @param {number} initialValue - Starting value
 * @param {number} currentValue - Current value
 * @returns {Object} Return percentage calculation
 */
function calculateReturnPercentage(initialValue, currentValue) {
  // Validate inputs
  if (initialValue <= 0) {
    throw new Error('Initial value must be greater than zero');
  }
  
  const absoluteReturn = currentValue - initialValue;
  const returnPercentage = (absoluteReturn / initialValue) * 100;
  
  return {
    initialValue: parseFloat(initialValue.toFixed(2)),
    currentValue: parseFloat(currentValue.toFixed(2)),
    absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
    returnPercentage: parseFloat(returnPercentage.toFixed(2)),
    isProfit: absoluteReturn > 0,
    isLoss: absoluteReturn < 0
  };
}

/**
 * Calculate annualized return rate
 * @param {number} initialValue - Starting value
 * @param {number} finalValue - Final value
 * @param {number} years - Number of years (can be decimal for partial years)
 * @returns {Object} Annualized return calculation
 */
function calculateAnnualizedReturn(initialValue, finalValue, years) {
  // Validate inputs
  if (initialValue <= 0 || years <= 0) {
    throw new Error('Invalid input parameters for annualized return calculation');
  }
  
  // Annualized return formula: (Final Value / Initial Value)^(1/years) - 1
  const annualizedReturn = Math.pow(finalValue / initialValue, 1 / years) - 1;
  const totalReturn = (finalValue - initialValue) / initialValue;
  
  return {
    initialValue: parseFloat(initialValue.toFixed(2)),
    finalValue: parseFloat(finalValue.toFixed(2)),
    years: parseFloat(years.toFixed(2)),
    annualizedReturn: parseFloat(annualizedReturn.toFixed(6)),
    annualizedReturnPercentage: parseFloat((annualizedReturn * 100).toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(6)),
    totalReturnPercentage: parseFloat((totalReturn * 100).toFixed(2))
  };
}

/**
 * Calculate future value with regular monthly contributions
 * @param {number} initialPrincipal - Initial investment amount
 * @param {number} monthlyContribution - Monthly contribution amount
 * @param {number} annualRate - Annual interest rate (as decimal or percentage)
 * @param {number} years - Number of years
 * @returns {Object} Future value with contributions calculation
 */
function calculateFutureValueWithContributions(initialPrincipal, monthlyContribution, annualRate, years) {
  // Validate inputs
  if (initialPrincipal < 0 || monthlyContribution < 0 || annualRate < 0 || years < 0) {
    throw new Error('Invalid input parameters for future value with contributions calculation');
  }

  // Convert percentage to decimal if needed
  const rate = annualRate > 1 ? annualRate / 100 : annualRate;
  const monthlyRate = rate / 12;
  const totalMonths = years * 12;
  
  // Calculate future value of initial principal
  const futureValueOfPrincipal = initialPrincipal * Math.pow(1 + monthlyRate, totalMonths);
  
  // Calculate future value of annuity (regular contributions)
  let futureValueOfContributions = 0;
  if (monthlyContribution > 0 && monthlyRate > 0) {
    futureValueOfContributions = monthlyContribution * 
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  } else if (monthlyContribution > 0) {
    // If no interest, just sum the contributions
    futureValueOfContributions = monthlyContribution * totalMonths;
  }
  
  const totalFutureValue = futureValueOfPrincipal + futureValueOfContributions;
  const totalContributions = monthlyContribution * totalMonths;
  const totalInvested = initialPrincipal + totalContributions;
  const totalReturns = totalFutureValue - totalInvested;
  
  return {
    initialPrincipal: parseFloat(initialPrincipal.toFixed(2)),
    monthlyContribution: parseFloat(monthlyContribution.toFixed(2)),
    totalContributions: parseFloat(totalContributions.toFixed(2)),
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    futureValueOfPrincipal: parseFloat(futureValueOfPrincipal.toFixed(2)),
    futureValueOfContributions: parseFloat(futureValueOfContributions.toFixed(2)),
    totalFutureValue: parseFloat(totalFutureValue.toFixed(2)),
    totalReturns: parseFloat(totalReturns.toFixed(2)),
    annualRate: rate,
    years,
    months: totalMonths,
    returnPercentage: parseFloat(((totalReturns / totalInvested) * 100).toFixed(2))
  };
}

/**
 * Calculate portfolio performance metrics
 * @param {Array} investments - Array of investment objects with { principalAmount, currentBalance }
 * @returns {Object} Portfolio performance metrics
 */
function calculatePortfolioMetrics(investments) {
  if (!Array.isArray(investments) || investments.length === 0) {
    return {
      totalPrincipal: 0,
      totalCurrentValue: 0,
      totalReturns: 0,
      returnPercentage: 0,
      numberOfInvestments: 0,
      averageReturn: 0,
      bestPerforming: null,
      worstPerforming: null
    };
  }

  let totalPrincipal = 0;
  let totalCurrentValue = 0;
  let bestReturn = -Infinity;
  let worstReturn = Infinity;
  let bestPerforming = null;
  let worstPerforming = null;

  // Calculate totals and find best/worst performing investments
  investments.forEach((investment, index) => {
    const principal = parseFloat(investment.principalAmount) || 0;
    const current = parseFloat(investment.currentBalance) || 0;
    const returnPercentage = principal > 0 ? ((current - principal) / principal) * 100 : 0;

    totalPrincipal += principal;
    totalCurrentValue += current;

    if (returnPercentage > bestReturn && principal > 0) {
      bestReturn = returnPercentage;
      bestPerforming = { ...investment, index, returnPercentage };
    }

    if (returnPercentage < worstReturn && principal > 0) {
      worstReturn = returnPercentage;
      worstPerforming = { ...investment, index, returnPercentage };
    }
  });

  const totalReturns = totalCurrentValue - totalPrincipal;
  const portfolioReturnPercentage = totalPrincipal > 0 ? (totalReturns / totalPrincipal) * 100 : 0;
  const averageReturn = investments.length > 0 ? totalReturns / investments.length : 0;

  return {
    totalPrincipal: parseFloat(totalPrincipal.toFixed(2)),
    totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
    totalReturns: parseFloat(totalReturns.toFixed(2)),
    returnPercentage: parseFloat(portfolioReturnPercentage.toFixed(2)),
    numberOfInvestments: investments.length,
    averageReturn: parseFloat(averageReturn.toFixed(2)),
    bestPerforming: bestPerforming ? {
      ...bestPerforming,
      returnPercentage: parseFloat(bestPerforming.returnPercentage.toFixed(2))
    } : null,
    worstPerforming: worstPerforming ? {
      ...worstPerforming,
      returnPercentage: parseFloat(worstPerforming.returnPercentage.toFixed(2))
    } : null
  };
}

/**
 * Calculate days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of days
 */
function calculateDaysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }
  
  const timeDifference = end.getTime() - start.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24));
}

/**
 * Calculate years between two dates (with decimal precision)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of years (can be decimal)
 */
function calculateYearsBetween(startDate, endDate) {
  const days = calculateDaysBetween(startDate, endDate);
  return parseFloat((days / 365.25).toFixed(4)); // Account for leap years
}

module.exports = {
  calculateCompoundInterest,
  calculateSimpleInterest,
  calculateMonthlyReturn,
  calculateReturnPercentage,
  calculateAnnualizedReturn,
  calculateFutureValueWithContributions,
  calculatePortfolioMetrics,
  calculateDaysBetween,
  calculateYearsBetween
};
