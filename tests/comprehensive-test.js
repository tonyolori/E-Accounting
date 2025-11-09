/**
 * Comprehensive API Integration Test Suite
 * Tests all major functionality across the entire application
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'integration.test@example.com',
  password: 'IntegrationTest123',
  confirmPassword: 'IntegrationTest123',
  firstName: 'Integration',
  lastName: 'Tester'
};

let authToken = null;
let investmentId = null;
let transactionId = null;

// Utility function to make authenticated requests
const authRequest = (config) => ({
  ...config,
  headers: {
    ...config.headers,
    Authorization: `Bearer ${authToken}`
  }
});

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, success, message = '') {
  const result = success ? '✅ PASS' : '❌ FAIL';
  const output = `${result}: ${testName}${message ? ' - ' + message : ''}`;
  console.log(output);
  
  testResults.tests.push({
    name: testName,
    success,
    message
  });
  
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive API Integration Tests\n');
  
  try {
    // =================== PHASE 1: AUTHENTICATION TESTS ===================
    console.log('📋 PHASE 1: Authentication System Tests');
    
    // Test 1: User Registration
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, TEST_USER);
      logTest('User Registration', 
        registerResponse.status === 201 && registerResponse.data.success,
        `Status: ${registerResponse.status}`
      );
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.error.includes('already exists')) {
        logTest('User Registration', true, 'User already exists (acceptable)');
      } else {
        logTest('User Registration', false, `Error: ${error.message}`);
      }
    }

    // Test 2: User Login
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      authToken = loginResponse.data.data.token;
      logTest('User Login', 
        loginResponse.status === 200 && authToken,
        `Token received: ${!!authToken}`
      );
    } catch (error) {
      logTest('User Login', false, `Error: ${error.message}`);
      return; // Cannot continue without auth token
    }

    // Test 3: Get Current User
    try {
      const userResponse = await axios.get(`${BASE_URL}/api/auth/me`, authRequest({}));
      logTest('Get Current User', 
        userResponse.status === 200 && userResponse.data.data.user.email === TEST_USER.email,
        `Email: ${userResponse.data.data.user.email}`
      );
    } catch (error) {
      logTest('Get Current User', false, `Error: ${error.message}`);
    }

    // =================== PHASE 2: INVESTMENT MANAGEMENT TESTS ===================
    console.log('\n📋 PHASE 2: Investment Management Tests');

    // Test 4: Create Investment
    try {
      const investmentData = {
        name: 'Test Investment Portfolio',
        category: 'STOCKS',
        principalAmount: 10000,
        returnType: 'VARIABLE',
        interestRate: 8.5,
        startDate: new Date().toISOString().split('T')[0],
        description: 'Integration test investment'
      };

      const createResponse = await axios.post(`${BASE_URL}/api/investments`, 
        investmentData, 
        authRequest({ headers: { 'Content-Type': 'application/json' } })
      );

      investmentId = createResponse.data.data.investment.id;
      logTest('Create Investment', 
        createResponse.status === 201 && investmentId,
        `ID: ${investmentId}`
      );
    } catch (error) {
      logTest('Create Investment', false, `Error: ${error.message}`);
    }

    // Test 5: Get Investments List
    try {
      const listResponse = await axios.get(`${BASE_URL}/api/investments`, authRequest({}));
      logTest('Get Investments List', 
        listResponse.status === 200 && Array.isArray(listResponse.data.data.investments),
        `Count: ${listResponse.data.data.investments.length}`
      );
    } catch (error) {
      logTest('Get Investments List', false, `Error: ${error.message}`);
    }

    // Test 6: Get Investment by ID
    if (investmentId) {
      try {
        const getResponse = await axios.get(`${BASE_URL}/api/investments/${investmentId}`, authRequest({}));
        logTest('Get Investment by ID', 
          getResponse.status === 200 && getResponse.data.data.investment.id === investmentId,
          `Name: ${getResponse.data.data.investment.name}`
        );
      } catch (error) {
        logTest('Get Investment by ID', false, `Error: ${error.message}`);
      }
    }

    // Test 7: Update Investment
    if (investmentId) {
      try {
        const updateData = {
          name: 'Updated Test Investment Portfolio',
          interestRate: 9.0
        };
        
        const updateResponse = await axios.put(`${BASE_URL}/api/investments/${investmentId}`, 
          updateData, 
          authRequest({ headers: { 'Content-Type': 'application/json' } })
        );
        
        logTest('Update Investment', 
          updateResponse.status === 200 && updateResponse.data.data.investment.name === updateData.name,
          `New name: ${updateResponse.data.data.investment.name}`
        );
      } catch (error) {
        logTest('Update Investment', false, `Error: ${error.message}`);
      }
    }

    // Test 8: Investment Summary
    try {
      const summaryResponse = await axios.get(`${BASE_URL}/api/investments/summary`, authRequest({}));
      logTest('Investment Summary', 
        summaryResponse.status === 200 && summaryResponse.data.data.summary,
        `Total investments: ${summaryResponse.data.data.summary.totalInvestments}`
      );
    } catch (error) {
      logTest('Investment Summary', false, `Error: ${error.message}`);
    }

    // =================== PHASE 3: FINANCIAL CALCULATIONS TESTS ===================
    console.log('\n📋 PHASE 3: Financial Calculations Tests');

    // Test 9: Compound Interest Calculator
    try {
      const calcData = {
        principal: 10000,
        annualRate: 8,
        compoundingFrequency: 12,
        years: 5
      };

      const calcResponse = await axios.post(`${BASE_URL}/api/returns/calculate`, 
        calcData, 
        authRequest({ headers: { 'Content-Type': 'application/json' } })
      );

      logTest('Compound Interest Calculator', 
        calcResponse.status === 200 && calcResponse.data.data.calculation,
        `Future value calculated: ${!!calcResponse.data.data.calculation.futureValue}`
      );
    } catch (error) {
      logTest('Compound Interest Calculator', false, `Error: ${error.message}`);
    }

    // Test 10: Returns Summary
    try {
      const returnsResponse = await axios.get(`${BASE_URL}/api/returns/summary`, authRequest({}));
      logTest('Returns Summary', 
        returnsResponse.status === 200 && returnsResponse.data.success,
        'Summary retrieved'
      );
    } catch (error) {
      logTest('Returns Summary', false, `Error: ${error.message}`);
    }

    // =================== PHASE 4: TRANSACTION MANAGEMENT TESTS ===================
    console.log('\n📋 PHASE 4: Transaction Management Tests');

    // Test 11: Create Transaction
    if (investmentId) {
      try {
        const transactionData = {
          investmentId: investmentId,
          type: 'RETURN',
          amount: 500,
          transactionDate: new Date().toISOString().split('T')[0],
          description: 'Monthly return payment'
        };

        const transResponse = await axios.post(`${BASE_URL}/api/transactions`, 
          transactionData, 
          authRequest({ headers: { 'Content-Type': 'application/json' } })
        );

        transactionId = transResponse.data.data.transaction.id;
        logTest('Create Transaction', 
          transResponse.status === 201 && transactionId,
          `ID: ${transactionId}`
        );
      } catch (error) {
        logTest('Create Transaction', false, `Error: ${error.message}`);
      }
    }

    // Test 12: Get Transactions List
    try {
      const transListResponse = await axios.get(`${BASE_URL}/api/transactions`, authRequest({}));
      logTest('Get Transactions List', 
        transListResponse.status === 200 && Array.isArray(transListResponse.data.data.transactions),
        `Count: ${transListResponse.data.data.transactions.length}`
      );
    } catch (error) {
      logTest('Get Transactions List', false, `Error: ${error.message}`);
    }

    // Test 13: Transaction Statistics
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/transactions/statistics`, authRequest({}));
      logTest('Transaction Statistics', 
        statsResponse.status === 200 && statsResponse.data.data.statistics,
        'Statistics calculated'
      );
    } catch (error) {
      logTest('Transaction Statistics', false, `Error: ${error.message}`);
    }

    // =================== PHASE 5: REPORTING & ANALYTICS TESTS ===================
    console.log('\n📋 PHASE 5: Reporting & Analytics Tests');

    // Test 14: Dashboard Data
    try {
      const dashResponse = await axios.get(`${BASE_URL}/api/reports/dashboard`, authRequest({}));
      logTest('Dashboard Data', 
        dashResponse.status === 200 && dashResponse.data.data.portfolio,
        `Portfolio value: ${dashResponse.data.data.portfolio.totalCurrentValue}`
      );
    } catch (error) {
      logTest('Dashboard Data', false, `Error: ${error.message}`);
    }

    // Test 15: Portfolio Summary
    try {
      const portfolioResponse = await axios.get(`${BASE_URL}/api/reports/portfolio-summary`, authRequest({}));
      logTest('Portfolio Summary', 
        portfolioResponse.status === 200 && portfolioResponse.data.data.summary,
        `Total investments: ${portfolioResponse.data.data.summary.totalInvestments}`
      );
    } catch (error) {
      logTest('Portfolio Summary', false, `Error: ${error.message}`);
    }

    // Test 16: Performance Trends
    try {
      const trendsResponse = await axios.get(`${BASE_URL}/api/reports/performance-trends?months=6`, authRequest({}));
      logTest('Performance Trends', 
        trendsResponse.status === 200 && Array.isArray(trendsResponse.data.data.trends),
        `Months analyzed: ${trendsResponse.data.data.period.months}`
      );
    } catch (error) {
      logTest('Performance Trends', false, `Error: ${error.message}`);
    }

    // Test 17: Asset Allocation
    try {
      const allocResponse = await axios.get(`${BASE_URL}/api/reports/asset-allocation`, authRequest({}));
      logTest('Asset Allocation', 
        allocResponse.status === 200 && allocResponse.data.data,
        `Total value: ${allocResponse.data.data.totalValue}`
      );
    } catch (error) {
      logTest('Asset Allocation', false, `Error: ${error.message}`);
    }

    // Test 18: Financial Report Generation
    try {
      const reportData = {
        includeTransactions: true,
        period: 'all'
      };

      const reportResponse = await axios.post(`${BASE_URL}/api/reports/financial-report`, 
        reportData, 
        authRequest({ headers: { 'Content-Type': 'application/json' } })
      );

      logTest('Financial Report Generation', 
        reportResponse.status === 200 && reportResponse.data.data.executiveSummary,
        'Report generated successfully'
      );
    } catch (error) {
      logTest('Financial Report Generation', false, `Error: ${error.message}`);
    }

    // =================== PHASE 6: ERROR HANDLING & VALIDATION TESTS ===================
    console.log('\n📋 PHASE 6: Error Handling & Validation Tests');

    // Test 19: Invalid Authentication
    try {
      await axios.get(`${BASE_URL}/api/investments`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      logTest('Invalid Authentication', false, 'Should have failed with 401');
    } catch (error) {
      logTest('Invalid Authentication', 
        error.response?.status === 401,
        `Status: ${error.response?.status}`
      );
    }

    // Test 20: Input Validation
    try {
      await axios.post(`${BASE_URL}/api/investments`, 
        { name: '', principalAmount: -100 }, 
        authRequest({ headers: { 'Content-Type': 'application/json' } })
      );
      logTest('Input Validation', false, 'Should have failed with validation error');
    } catch (error) {
      logTest('Input Validation', 
        error.response?.status === 400 && error.response.data.code === 'VALIDATION_ERROR',
        `Validation errors detected`
      );
    }

    // Test 21: Resource Not Found
    try {
      await axios.get(`${BASE_URL}/api/investments/00000000-0000-0000-0000-000000000000`, authRequest({}));
      logTest('Resource Not Found', false, 'Should have failed with 404');
    } catch (error) {
      logTest('Resource Not Found', 
        error.response?.status === 404,
        `Status: ${error.response?.status}`
      );
    }

    // =================== PHASE 7: PERFORMANCE & STRESS TESTS ===================
    console.log('\n📋 PHASE 7: Performance Tests');

    // Test 22: Concurrent Requests
    try {
      const concurrentRequests = Array(5).fill().map(() => 
        axios.get(`${BASE_URL}/api/investments/summary`, authRequest({}))
      );

      const results = await Promise.all(concurrentRequests);
      const allSuccessful = results.every(r => r.status === 200);
      
      logTest('Concurrent Requests', 
        allSuccessful,
        `${results.length} concurrent requests handled`
      );
    } catch (error) {
      logTest('Concurrent Requests', false, `Error: ${error.message}`);
    }

    // Test 23: Large Data Handling (Pagination)
    try {
      const paginationResponse = await axios.get(`${BASE_URL}/api/transactions?limit=1&offset=0`, authRequest({}));
      logTest('Pagination Support', 
        paginationResponse.status === 200 && paginationResponse.data.data.pagination,
        `Pagination metadata present`
      );
    } catch (error) {
      logTest('Pagination Support', false, `Error: ${error.message}`);
    }

    // =================== CLEANUP ===================
    console.log('\n📋 CLEANUP: Removing Test Data');

    // Clean up transaction
    if (transactionId) {
      try {
        await axios.delete(`${BASE_URL}/api/transactions/${transactionId}`, authRequest({}));
        logTest('Cleanup Transaction', true, 'Test transaction removed');
      } catch (error) {
        logTest('Cleanup Transaction', false, `Error: ${error.message}`);
      }
    }

    // Clean up investment
    if (investmentId) {
      try {
        await axios.delete(`${BASE_URL}/api/investments/${investmentId}`, authRequest({}));
        logTest('Cleanup Investment', true, 'Test investment removed');
      } catch (error) {
        logTest('Cleanup Investment', false, `Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Critical error during testing:', error.message);
  }

  // =================== TEST RESULTS SUMMARY ===================
  console.log('\n' + '='.repeat(60));
  console.log('🧪 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log(`🔧 Total Tests: ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(t => !t.success).forEach(test => {
      console.log(`   • ${test.name}: ${test.message}`);
    });
  } else {
    console.log('\n🎉 ALL TESTS PASSED! The application is production-ready! 🚀');
  }
  
  console.log('='.repeat(60));
}

// Export for potential use as module
module.exports = { runComprehensiveTests };

// Run tests if executed directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}
