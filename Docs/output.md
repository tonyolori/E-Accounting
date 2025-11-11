# E-Accounting API Documentation

## Overview
This is a comprehensive REST API for a finance tracking application that manages investments, transactions, returns, and reporting. The API uses JWT authentication and follows RESTful conventions.

**Base URL**: `http://localhost:5000` (or your deployed URL)
**Authentication**: Bearer token (JWT) required for most endpoints
**Content-Type**: `application/json`

---

## Authentication

All endpoints except `/health`, `/api/auth/register`, and `/api/auth/login` require authentication.

**Header**: `Authorization: Bearer <JWT_TOKEN>`

---

## Endpoints

### Health Check

#### GET /health
Check if the server is running.

**Authentication**: None required  
**Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

### Authentication (/api/auth)

#### POST /api/auth/register
Register a new user account.

**Authentication**: None required  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```
**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Authentication**: None required  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### GET /api/auth/me
Get current user profile information.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/logout
Logout user (client-side token removal).

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /api/auth/refresh
Refresh JWT token.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

---

### Investments (/api/investments)

#### GET /api/investments/summary
Get investment summary for the authenticated user.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "totalInvestments": 5,
    "totalAmount": 50000,
    "activeInvestments": 3,
    "totalReturns": 2500,
    "portfolioValue": 52500
  }
}
```

#### POST /api/investments
Create a new investment.

**Authentication**: Required  
**Request Body**:
```json
{
  "name": "Investment Name",
  "type": "STOCKS",
  "category": "EQUITY",
  "initialAmount": 10000,
  "currentAmount": 10000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "expectedReturn": 10,
  "status": "ACTIVE",
  "description": "Investment description"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Investment created successfully",
  "data": {
    "id": "investment_id",
    "name": "Investment Name",
    "type": "STOCKS",
    "category": "EQUITY",
    "initialAmount": 10000,
    "currentAmount": 10000,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "expectedReturn": 10,
    "status": "ACTIVE",
    "description": "Investment description",
    "userId": "user_id",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/investments
Get all investments for the authenticated user with optional filtering.

**Authentication**: Required  
**Query Parameters**:
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `status` (optional): Filter by investment status
- `type` (optional): Filter by investment type
- `category` (optional): Filter by investment category

**Response**:
```json
{
  "success": true,
  "data": {
    "investments": [
      {
        "id": "investment_id",
        "name": "Investment Name",
        "type": "STOCKS",
        "category": "EQUITY",
        "initialAmount": 10000,
        "currentAmount": 10500,
        "startDate": "2025-01-01",
        "endDate": "2025-12-31",
        "expectedReturn": 10,
        "status": "ACTIVE",
        "description": "Investment description",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

#### GET /api/investments/:id
Get a specific investment by ID.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "investment_id",
    "name": "Investment Name",
    "type": "STOCKS",
    "category": "EQUITY",
    "initialAmount": 10000,
    "currentAmount": 10500,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "expectedReturn": 10,
    "status": "ACTIVE",
    "description": "Investment description",
    "userId": "user_id",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/investments/:id
Update an investment.

**Authentication**: Required  
**Request Body**: Same as POST /api/investments (all fields optional)
**Response**: Same as POST /api/investments response

#### PATCH /api/investments/:id/status
Update investment status only.

**Authentication**: Required  
**Request Body**:
```json
{
  "status": "ACTIVE|COMPLETED|CANCELLED|SUSPENDED"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Investment status updated successfully",
  "data": {
    "id": "investment_id",
    "status": "ACTIVE"
  }
}
```

#### PATCH /api/investments/:id/balance
Update investment balance manually.

**Authentication**: Required  
**Request Body**:
```json
{
  "currentAmount": 11000,
  "reason": "Manual adjustment"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Investment balance updated successfully",
  "data": {
    "id": "investment_id",
    "currentAmount": 11000,
    "previousAmount": 10500
  }
}
```

#### DELETE /api/investments/:id
Cancel an investment (sets status to CANCELLED).

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "message": "Investment cancelled successfully"
}
```

---

### Returns (/api/returns)

#### GET /api/returns/summary
Get returns summary across all investments for the user.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "totalReturns": 2500,
    "totalInvested": 50000,
    "averageReturnRate": 5.0,
    "bestPerformingInvestment": {
      "id": "investment_id",
      "name": "Investment Name",
      "returnRate": 12.5
    },
    "returnsByType": {
      "STOCKS": 1500,
      "BONDS": 1000
    }
  }
}
```

#### POST /api/returns/manual
Add a manual return to an investment.

**Authentication**: Required  
**Request Body**:
```json
{
  "investmentId": "investment_id",
  "amount": 500,
  "type": "INTEREST|DIVIDEND|CAPITAL_GAIN",
  "date": "2025-01-01",
  "description": "Manual return entry"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Manual return added successfully",
  "data": {
    "id": "return_id",
    "investmentId": "investment_id",
    "amount": 500,
    "type": "INTEREST",
    "date": "2025-01-01",
    "description": "Manual return entry",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/returns/calculate
Calculate compound interest (utility endpoint).

**Authentication**: Required  
**Request Body**:
```json
{
  "principal": 10000,
  "rate": 5,
  "time": 12,
  "frequency": 12
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "principal": 10000,
    "finalAmount": 10511.62,
    "totalInterest": 511.62,
    "rate": 5,
    "time": 12,
    "frequency": 12
  }
}
```

#### POST /api/returns/bulk
Bulk add returns to multiple investments.

**Authentication**: Required  
**Request Body**:
```json
{
  "returns": [
    {
      "investmentId": "investment_id_1",
      "amount": 500,
      "type": "INTEREST",
      "date": "2025-01-01"
    },
    {
      "investmentId": "investment_id_2",
      "amount": 300,
      "type": "DIVIDEND",
      "date": "2025-01-01"
    }
  ]
}
```
**Response**:
```json
{
  "success": true,
  "message": "Bulk returns added successfully",
  "data": {
    "processed": 2,
    "failed": 0,
    "returns": [
      {
        "id": "return_id_1",
        "investmentId": "investment_id_1",
        "amount": 500
      },
      {
        "id": "return_id_2",
        "investmentId": "investment_id_2",
        "amount": 300
      }
    ]
  }
}
```

#### GET /api/returns/:investmentId
Get returns for a specific investment.

**Authentication**: Required  
**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `type` (optional): Filter by return type

**Response**:
```json
{
  "success": true,
  "data": {
    "returns": [
      {
        "id": "return_id",
        "investmentId": "investment_id",
        "amount": 500,
        "type": "INTEREST",
        "date": "2025-01-01",
        "description": "Return description",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    },
    "summary": {
      "totalReturns": 2500,
      "averageReturn": 500
    }
  }
}
```

#### POST /api/returns/:investmentId/projections
Calculate projected returns for an investment.

**Authentication**: Required  
**Request Body**:
```json
{
  "years": 5,
  "scenario": "CONSERVATIVE|MODERATE|AGGRESSIVE"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "investmentId": "investment_id",
    "currentAmount": 10000,
    "projections": [
      {
        "year": 1,
        "projectedAmount": 10500,
        "projectedReturn": 500
      },
      {
        "year": 2,
        "projectedAmount": 11025,
        "projectedReturn": 525
      }
    ],
    "totalProjectedReturn": 2762.82,
    "totalProjectedAmount": 12762.82
  }
}
```

#### GET /api/returns/:investmentId/next-monthly
Calculate next monthly return for fixed-rate investment.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "investmentId": "investment_id",
    "currentAmount": 10000,
    "monthlyRate": 0.4167,
    "nextMonthlyReturn": 41.67,
    "newAmount": 10041.67,
    "calculationDate": "2025-01-01"
  }
}
```

#### POST /api/returns/:investmentId/apply-monthly
Apply next monthly return to fixed-rate investment.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "message": "Monthly return applied successfully",
  "data": {
    "returnId": "return_id",
    "investmentId": "investment_id",
    "amount": 41.67,
    "previousAmount": 10000,
    "newAmount": 10041.67
  }
}
```

---

### Transactions (/api/transactions)

#### GET /api/transactions/statistics
Get transaction statistics for the user.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "totalTransactions": 150,
    "totalAmount": 75000,
    "averageTransaction": 500,
    "transactionsByType": {
      "DEPOSIT": 50000,
      "WITHDRAWAL": 15000,
      "TRANSFER": 10000
    },
    "recentActivity": 25,
    "thisMonthTotal": 5000
  }
}
```

#### GET /api/transactions/recent
Get recent transactions for user (dashboard widget).

**Authentication**: Required  
**Query Parameters**:
- `limit` (optional): Number of transactions to return (default: 10)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction_id",
      "investmentId": "investment_id",
      "type": "DEPOSIT",
      "amount": 1000,
      "description": "Initial deposit",
      "date": "2025-01-01",
      "balance": 11000,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/transactions/summary/by-type
Get transaction summary by type for the user.

**Authentication**: Required  
**Query Parameters**:
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**:
```json
{
  "success": true,
  "data": {
    "DEPOSIT": {
      "count": 25,
      "totalAmount": 50000,
      "averageAmount": 2000
    },
    "WITHDRAWAL": {
      "count": 10,
      "totalAmount": 15000,
      "averageAmount": 1500
    },
    "TRANSFER": {
      "count": 5,
      "totalAmount": 10000,
      "averageAmount": 2000
    }
  }
}
```

#### GET /api/transactions/trends
Get transaction trends (monthly aggregation).

**Authentication**: Required  
**Query Parameters**:
- `months` (optional): Number of months to analyze (1-24, default: 12)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-01",
      "totalTransactions": 15,
      "totalAmount": 7500,
      "averageAmount": 500,
      "byType": {
        "DEPOSIT": 5000,
        "WITHDRAWAL": 1500,
        "TRANSFER": 1000
      }
    }
  ]
}
```

#### GET /api/transactions/investment/:investmentId/summary
Get investment transaction summary.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "investmentId": "investment_id",
    "totalTransactions": 25,
    "totalDeposits": 15000,
    "totalWithdrawals": 2000,
    "netAmount": 13000,
    "currentBalance": 13000,
    "firstTransactionDate": "2025-01-01",
    "lastTransactionDate": "2025-01-15"
  }
}
```

#### POST /api/transactions
Create a new transaction.

**Authentication**: Required  
**Request Body**:
```json
{
  "investmentId": "investment_id",
  "type": "DEPOSIT|WITHDRAWAL|TRANSFER",
  "amount": 1000,
  "description": "Transaction description",
  "date": "2025-01-01"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "transaction_id",
    "investmentId": "investment_id",
    "type": "DEPOSIT",
    "amount": 1000,
    "description": "Transaction description",
    "date": "2025-01-01",
    "balance": 11000,
    "userId": "user_id",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/transactions
Get user transactions with optional filtering.

**Authentication**: Required  
**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `investmentId` (optional): Filter by investment ID
- `type` (optional): Filter by transaction type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "transaction_id",
        "investmentId": "investment_id",
        "type": "DEPOSIT",
        "amount": 1000,
        "description": "Transaction description",
        "date": "2025-01-01",
        "balance": 11000,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "totalPages": 15
    }
  }
}
```

#### GET /api/transactions/:id
Get a specific transaction by ID.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "transaction_id",
    "investmentId": "investment_id",
    "type": "DEPOSIT",
    "amount": 1000,
    "description": "Transaction description",
    "date": "2025-01-01",
    "balance": 11000,
    "userId": "user_id",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/transactions/:id
Update a transaction.

**Authentication**: Required  
**Request Body**: Same as POST /api/transactions (all fields optional)
**Response**: Same as POST /api/transactions response

#### DELETE /api/transactions/:id
Delete a transaction.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

---

### Reports (/api/reports)

#### GET /api/reports/dashboard
Get comprehensive dashboard data for user.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalInvestments": 5,
      "totalValue": 52500,
      "totalReturns": 2500,
      "activeInvestments": 3
    },
    "performance": {
      "monthlyChange": 2.5,
      "yearlyChange": 12.5,
      "bestPerformer": {
        "id": "investment_id",
        "name": "Investment Name",
        "returnRate": 15.2
      }
    },
    "recentTransactions": [
      {
        "id": "transaction_id",
        "type": "DEPOSIT",
        "amount": 1000,
        "date": "2025-01-01"
      }
    ],
    "assetAllocation": {
      "STOCKS": 60,
      "BONDS": 30,
      "REAL_ESTATE": 10
    }
  }
}
```

#### GET /api/reports/quick-stats
Get quick stats for header/widget display.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "totalValue": 52500,
    "dailyChange": 125.50,
    "dailyChangePercent": 0.24,
    "totalReturns": 2500,
    "activeInvestments": 3,
    "lastUpdated": "2025-01-01T12:00:00.000Z"
  }
}
```

#### GET /api/reports/portfolio-summary
Get comprehensive portfolio summary with detailed metrics.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "totalInvested": 50000,
    "currentValue": 52500,
    "totalReturns": 2500,
    "overallReturnRate": 5.0,
    "investments": [
      {
        "id": "investment_id",
        "name": "Investment Name",
        "type": "STOCKS",
        "currentValue": 10500,
        "returns": 500,
        "returnRate": 5.0,
        "weight": 20.0
      }
    ],
    "performanceMetrics": {
      "bestPerformer": {
        "name": "Investment Name",
        "returnRate": 12.5
      },
      "worstPerformer": {
        "name": "Investment Name",
        "returnRate": 2.1
      },
      "averageReturnRate": 5.0
    },
    "assetAllocation": {
      "byType": {
        "STOCKS": 60,
        "BONDS": 30,
        "REAL_ESTATE": 10
      },
      "byCategory": {
        "EQUITY": 60,
        "FIXED_INCOME": 30,
        "ALTERNATIVES": 10
      }
    }
  }
}
```

#### GET /api/reports/performance-trends
Get performance trends over time.

**Authentication**: Required  
**Query Parameters**:
- `months` (optional): Number of months to analyze (1-24, default: 12)
- `investmentId` (optional): Specific investment ID

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "month": "2025-01",
      "portfolioValue": 50000,
      "returns": 500,
      "returnRate": 1.0,
      "investmentCount": 5
    },
    {
      "month": "2025-02",
      "portfolioValue": 51250,
      "returns": 1250,
      "returnRate": 2.5,
      "investmentCount": 5
    }
  ]
}
```

#### GET /api/reports/asset-allocation
Get asset allocation breakdown by category and type.

**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "data": {
    "byType": {
      "STOCKS": {
        "amount": 31500,
        "percentage": 60.0,
        "investments": 3
      },
      "BONDS": {
        "amount": 15750,
        "percentage": 30.0,
        "investments": 1
      },
      "REAL_ESTATE": {
        "amount": 5250,
        "percentage": 10.0,
        "investments": 1
      }
    },
    "byCategory": {
      "EQUITY": {
        "amount": 31500,
        "percentage": 60.0,
        "investments": 3
      },
      "FIXED_INCOME": {
        "amount": 15750,
        "percentage": 30.0,
        "investments": 1
      },
      "ALTERNATIVES": {
        "amount": 5250,
        "percentage": 10.0,
        "investments": 1
      }
    },
    "diversificationScore": 75.5,
    "recommendations": [
      "Consider diversifying into international markets",
      "Fixed income allocation is within recommended range"
    ]
  }
}
```

#### GET /api/reports/monthly-breakdown/:year
Get monthly breakdown for specific year.

**Authentication**: Required  
**Path Parameters**:
- `year`: Year to analyze (YYYY format)

**Response**:
```json
{
  "success": true,
  "data": {
    "year": 2025,
    "monthlyData": [
      {
        "month": "January",
        "monthNumber": 1,
        "startingValue": 50000,
        "endingValue": 51250,
        "returns": 1250,
        "returnRate": 2.5,
        "deposits": 1000,
        "withdrawals": 0,
        "netCashFlow": 1000,
        "investmentCount": 5,
        "newInvestments": 1,
        "closedInvestments": 0
      }
    ],
    "yearlySummary": {
      "startingValue": 50000,
      "endingValue": 52500,
      "totalReturns": 2500,
      "totalReturnRate": 5.0,
      "totalDeposits": 2000,
      "totalWithdrawals": 500,
      "netCashFlow": 1500
    }
  }
}
```

#### POST /api/reports/financial-report
Generate comprehensive financial report.

**Authentication**: Required  
**Request Body**:
```json
{
  "includeTransactions": false,
  "period": "all|ytd|last12months|last6months",
  "format": "json"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "reportId": "report_id",
    "generatedAt": "2025-01-01T00:00:00.000Z",
    "period": "last12months",
    "summary": {
      "totalInvested": 50000,
      "currentValue": 52500,
      "totalReturns": 2500,
      "overallReturnRate": 5.0
    },
    "performanceAnalysis": {
      "monthlyAverage": 208.33,
      "bestMonth": "2025-03",
      "worstMonth": "2025-08",
      "volatility": "Low"
    },
    "investments": [
      {
        "id": "investment_id",
        "name": "Investment Name",
        "performance": {
          "returns": 500,
          "returnRate": 5.0,
          "riskLevel": "Medium"
        }
      }
    ],
    "recommendations": [
      "Portfolio is well diversified",
      "Consider increasing international exposure"
    ]
  }
}
```

#### POST /api/reports/investment-comparison
Compare multiple investments.

**Authentication**: Required  
**Request Body**:
```json
{
  "investmentIds": ["investment_id_1", "investment_id_2"]
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "comparisonDate": "2025-01-01T00:00:00.000Z",
    "investments": [
      {
        "id": "investment_id_1",
        "name": "Investment 1",
        "type": "STOCKS",
        "currentValue": 10500,
        "returns": 500,
        "returnRate": 5.0,
        "riskScore": 7.5
      },
      {
        "id": "investment_id_2",
        "name": "Investment 2",
        "type": "BONDS",
        "currentValue": 10500,
        "returns": 300,
        "returnRate": 3.0,
        "riskScore": 3.2
      }
    ],
    "metrics": {
      "bestPerformer": {
        "id": "investment_id_1",
        "name": "Investment 1",
        "returnRate": 5.0
      },
      "lowestRisk": {
        "id": "investment_id_2",
        "name": "Investment 2",
        "riskScore": 3.2
      },
      "averageReturnRate": 4.0,
      "totalValue": 21000
    },
    "recommendations": [
      "Investment 1 shows better returns but higher risk",
      "Consider rebalancing based on risk tolerance"
    ]
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

- `AUTH_TOKEN_MISSING`: Authentication token not provided
- `AUTH_TOKEN_INVALID`: Invalid or expired token
- `AUTH_USER_NOT_FOUND`: User not found
- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: User not authorized for this action
- `INTERNAL_ERROR`: Internal server error

---

## Data Types

### Investment Types
- `STOCKS`
- `BONDS`
- `REAL_ESTATE`
- `MUTUAL_FUNDS`
- `ETF`
- `CRYPTOCURRENCY`
- `COMMODITIES`
- `OTHER`

### Investment Categories
- `EQUITY`
- `FIXED_INCOME`
- `REAL_ESTATE`
- `COMMODITIES`
- `ALTERNATIVES`
- `CASH`
- `OTHER`

### Investment Status
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`
- `SUSPENDED`

### Transaction Types
- `DEPOSIT`
- `WITHDRAWAL`
- `TRANSFER`

### Return Types
- `INTEREST`
- `DIVIDEND`
- `CAPITAL_GAIN`
- `OTHER`

---

## Rate Limiting

API requests are rate-limited to prevent abuse. Standard limits apply:
- 100 requests per minute per authenticated user
- 10 requests per minute for unauthenticated endpoints

---

## Pagination

Endpoints that return lists support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

## Example Usage

### Authentication Flow
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Creating an Investment
```bash
curl -X POST http://localhost:3000/api/investments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Tech Stocks","type":"STOCKS","category":"EQUITY","initialAmount":10000,"expectedReturn":10}'
```

### Getting Dashboard Data
```bash
curl -X GET http://localhost:3000/api/reports/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes for Frontend Development

1. **Authentication**: Store JWT tokens securely (localStorage, sessionStorage, or httpOnly cookies)
2. **Error Handling**: Implement consistent error handling using the standard error response format
3. **Loading States**: Implement loading states for all API calls
4. **Pagination**: Use pagination for large datasets to improve performance
5. **Caching**: Consider caching dashboard data and portfolio summaries
6. **Real-time Updates**: For real-time features, consider implementing WebSocket connections
7. **Form Validation**: Implement client-side validation matching server-side validation rules
8. **Date Formatting**: Dates are returned in ISO format; format for display as needed
9. **Currency**: Amounts are in decimal format; format for display with appropriate currency symbols
10. **Responsive Design**: Ensure UI works well on mobile devices as well as desktop

---

## Environment Variables

The API expects these environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)

---

This documentation provides comprehensive information for building a frontend application that integrates with the E-Accounting API. All endpoints are fully functional and tested.
