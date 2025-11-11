# Finance Tracking Application - Step-by-Step Implementation Plan

## Overview
This document provides a granular, step-by-step implementation plan for building the Finance Tracking Application MVP. Each task focuses on one specific concern and can be completed independently with tests run between steps.

**Start:** Empty Node.js project setup  
**End:** Fully functional finance tracking API with user authentication, investment management, manual returns, and basic reporting

---

## PHASE 1: PROJECT FOUNDATION

### Task 1.1: Initialize Node.js Project
**Concern:** Basic project setup and structure

**Steps:**
1. Create project directory: `e-accounting-backend`
2. Initialize npm: `npm init -y`
3. Create basic folder structure:
   ```
   src/
   ├── controllers/
   ├── services/
   ├── middleware/
   ├── utils/
   ├── validators/
   ├── routes/
   └── config/
   tests/
   prisma/
   ```
4. Create `.gitignore` file with node_modules, .env, dist/
5. Create basic `README.md`

**Test:** Verify folder structure exists and npm project is initialized

### Task 1.2: Install Core Dependencies
**Concern:** Package management and dependencies

**Steps:**
1. Install production dependencies:
   ```bash
   npm install express cors helmet morgan compression
   npm install prisma @prisma/client bcryptjs jsonwebtoken
   npm install joi dotenv uuid
   ```
2. Install development dependencies:
   ```bash
   npm install -D nodemon jest supertest eslint prettier
   ```
3. Create basic `package.json` scripts:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js",
       "test": "jest",
       "test:watch": "jest --watch"
     }
   }
   ```

**Test:** Run `npm install` successfully, verify all packages in package.json

### Task 1.3: Basic Express Server Setup
**Concern:** HTTP server foundation

**Steps:**
1. Create `server.js` in root:
   - Import express and dotenv
   - Set up basic server on PORT from env
   - Add basic middleware (cors, helmet, morgan, express.json)
   - Add health check endpoint: `GET /health`
   - Start server with error handling
2. Create `.env` file:
   ```
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your-development-jwt-secret
   ```
3. Create `src/app.js` for Express app configuration

**Test:** Server starts on port 5000, health endpoint returns 200

---

## PHASE 2: DATABASE SETUP

### Task 2.1: Prisma Configuration
**Concern:** Database ORM setup

**Steps:**
1. Initialize Prisma: `npx prisma init`
2. Configure `prisma/schema.prisma`:
   - Set provider to postgresql
   - Add database URL from env
   - Configure client generator
3. Update `.env` with DATABASE_URL:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/e_accounting_dev"
   ```

**Test:** Prisma schema file exists, no syntax errors in schema

### Task 2.2: Database Schema Definition
**Concern:** Data model structure

**Steps:**
1. Define User model in `schema.prisma`:
   - id (String, @id, @default(uuid()))
   - email (String, @unique)
   - passwordHash (String)
   - firstName (String)
   - lastName (String)
   - createdAt (DateTime, @default(now()))
   - updatedAt (DateTime, @updatedAt)
2. Define Investment model:
   - id, userId (String, relation to User)
   - name, category (String)
   - initialAmount, currentBalance (Decimal)
   - returnType (enum: FIXED, VARIABLE)
   - interestRate (Decimal?, optional)
   - startDate, endDate (DateTime?)
   - status (enum: ACTIVE, COMPLETED, CANCELLED)
   - createdAt, updatedAt (DateTime)
   - notes (String?)
3. Define Transaction model:
   - id, investmentId (String, relation)
   - type (enum: RETURN, WITHDRAWAL, DEPOSIT, DIVIDEND)
   - amount (Decimal)
   - percentage (Decimal?)
   - transactionDate (DateTime)
   - description (String?)
   - createdAt (DateTime)

**Test:** Run `npx prisma validate` successfully

### Task 2.3: Database Migration
**Concern:** Database creation and schema application

**Steps:**
1. Create initial migration: `npx prisma migrate dev --name init`
2. Generate Prisma client: `npx prisma generate`
3. Create `src/config/database.js`:
   - Import PrismaClient
   - Create singleton instance
   - Export prisma client
   - Add connection error handling

**Test:** Database creates successfully, Prisma client generates without errors

---

## PHASE 3: AUTHENTICATION SYSTEM

### Task 3.1: Authentication Utilities
**Concern:** Auth helper functions

**Steps:**
1. Create `src/utils/auth.js`:
   - hashPassword function using bcrypt
   - comparePassword function
   - generateJWT function
   - verifyJWT function
2. Create `src/utils/validation.js`:
   - Email validation regex
   - Password strength validation
   - Common validation helpers

**Test:** Unit tests for all auth utility functions pass

### Task 3.2: Auth Middleware
**Concern:** Request authentication

**Steps:**
1. Create `src/middleware/auth.js`:
   - requireAuth middleware
   - Extract JWT from Authorization header
   - Verify token and attach user to req.user
   - Handle authentication errors
2. Create `src/middleware/errorHandler.js`:
   - Global error handling middleware
   - Format error responses consistently
   - Log errors appropriately

**Test:** Middleware properly rejects invalid tokens and passes valid ones

### Task 3.3: User Registration
**Concern:** User account creation

**Steps:**
1. Create `src/validators/authValidator.js`:
   - Registration schema (email, password, firstName, lastName)
   - Login schema (email, password)
   - Use Joi for validation
2. Create `src/services/authService.js`:
   - registerUser function
   - Check if email exists
   - Hash password and create user
   - Return user without password
3. Create `src/controllers/authController.js`:
   - register endpoint handler
   - Validate input, call service, return response
4. Create `src/routes/auth.js`:
   - POST /register route

**Test:** POST /api/auth/register creates user, returns 201, handles duplicates

### Task 3.4: User Login
**Concern:** User authentication and token generation

**Steps:**
1. Add loginUser function to `authService.js`:
   - Find user by email
   - Compare password
   - Generate JWT token
   - Return user and token
2. Add login handler to `authController.js`:
   - Validate credentials
   - Call login service
   - Return token and user data
3. Add POST /login route to auth routes
4. Add GET /me route for current user info

**Test:** Login with valid credentials returns token, invalid credentials return 401

---

## PHASE 4: INVESTMENT MANAGEMENT

### Task 4.1: Investment Validation
**Concern:** Input validation for investments

**Steps:**
1. Create `src/validators/investmentValidator.js`:
   - createInvestment schema:
     - name (required, string, max 255)
     - category (required, string)
     - initialAmount (required, positive number)
     - returnType (required, enum: 'fixed', 'variable')
     - interestRate (optional, for fixed type)
     - startDate (required, valid date)
     - endDate (optional, date after startDate)
     - notes (optional, string)
   - updateInvestment schema (all fields optional except ID)
   - statusUpdate schema (status enum)

**Test:** Validation schemas accept valid data, reject invalid inputs

### Task 4.2: Investment Service Layer
**Concern:** Business logic for investment operations

**Steps:**
1. Create `src/services/investmentService.js`:
   - createInvestment function:
     - Validate user ownership
     - Set currentBalance = initialAmount initially
     - Set default status to ACTIVE
     - Create investment record
   - getUserInvestments function with filtering
   - getInvestmentById with user verification
   - updateInvestment with ownership check
   - updateInvestmentStatus function
   - updateInvestmentBalance function

**Test:** Unit tests for all service functions with mocked database

### Task 4.3: Investment CRUD Endpoints
**Concern:** HTTP API for investment management

**Steps:**
1. Create `src/controllers/investmentController.js`:
   - createInvestment handler
   - getInvestments handler (with query filters)
   - getInvestmentById handler
   - updateInvestment handler
   - updateInvestmentStatus handler
   - updateInvestmentBalance handler
2. Create `src/routes/investments.js`:
   - POST / (create investment)
   - GET / (list investments with filters)
   - GET /:id (get specific investment)
   - PUT /:id (update investment)
   - PATCH /:id/status (update status)
   - PATCH /:id/balance (update balance)
3. Add auth middleware to all routes

**Test:** All CRUD operations work, return proper status codes, enforce ownership

---

## PHASE 5: RETURNS MANAGEMENT

### Task 5.1: Calculation Utilities
**Concern:** Financial calculations

**Steps:**
1. Create `src/utils/calculations.js`:
   - calculateCompoundInterest function:
     - Parameters: principal, rate, frequency, time
     - Return future value and total returns
   - calculateSimpleInterest function
   - calculateMonthlyReturn function
   - calculateReturnPercentage function
2. Add comprehensive unit tests for all calculations

**Test:** All calculation functions return mathematically correct results

### Task 5.2: Returns Service Layer
**Concern:** Return management business logic

**Steps:**
1. Create `src/services/returnsService.js`:
   - addManualReturn function:
     - Validate investment exists and user owns it
     - Create transaction record
     - Update investment currentBalance
     - Return updated investment and transaction
   - getInvestmentReturns function
   - calculateProjectedReturns function (using calculation utils)
2. Add transaction validation in service

**Test:** Manual returns update balances correctly, create proper transaction records

### Task 5.3: Returns API Endpoints
**Concern:** HTTP API for returns management

**Steps:**
1. Create `src/validators/returnsValidator.js`:
   - manualReturn schema (investmentId, amount or percentage, date, description)
   - calculateInterest schema (principal, rate, frequency, years)
2. Create `src/controllers/returnsController.js`:
   - addManualReturn handler
   - getInvestmentReturns handler
   - calculateCompoundInterest handler (utility endpoint)
3. Create `src/routes/returns.js`:
   - POST /manual (add manual return)
   - GET /:investmentId (get returns for investment)
   - POST /calculate (compound interest calculator)

**Test:** Manual returns API works, calculator endpoint returns correct values

---

## PHASE 6: TRANSACTION MANAGEMENT

### Task 6.1: Transaction Service
**Concern:** Transaction recording and retrieval

**Steps:**
1. Create `src/services/transactionService.js`:
   - createTransaction function
   - getUserTransactions with filtering (by investment, type, date range)
   - getTransactionById with ownership verification
   - updateTransaction function
   - deleteTransaction function
   - getInvestmentTransactions function

**Test:** All transaction operations respect user ownership and data integrity

### Task 6.2: Transaction API
**Concern:** Transaction HTTP endpoints

**Steps:**
1. Create `src/validators/transactionValidator.js`:
   - createTransaction schema
   - updateTransaction schema
   - query filters schema
2. Create `src/controllers/transactionController.js`:
   - All CRUD operation handlers
   - Proper error handling and responses
3. Create `src/routes/transactions.js`:
   - Full CRUD routes with auth middleware

**Test:** All transaction endpoints work correctly, enforce proper validation

---

## PHASE 7: BASIC REPORTING

### Task 7.1: Reporting Service
**Concern:** Data aggregation and summary calculations

**Steps:**
1. Create `src/services/reportService.js`:
   - getDashboardData function:
     - Calculate total investments count
     - Sum total principal amounts
     - Sum current portfolio value
     - Calculate total returns
     - Get active vs completed vs cancelled counts
   - getPortfolioSummary function
   - getInvestmentSummary function

**Test:** Dashboard calculations are mathematically correct

### Task 7.2: Reporting API
**Concern:** Reporting HTTP endpoints

**Steps:**
1. Create `src/controllers/reportController.js`:
   - getDashboard handler
   - getPortfolioSummary handler
2. Create `src/routes/reports.js`:
   - GET /dashboard
   - GET /portfolio-summary

**Test:** Reporting endpoints return correct aggregated data

---

## PHASE 8: API INTEGRATION & TESTING

### Task 8.1: Route Integration
**Concern:** Connecting all routes to main app

**Steps:**
1. Update `src/app.js`:
   - Import all route modules
   - Mount routes with /api prefix:
     - /api/auth -> auth routes
     - /api/investments -> investment routes
     - /api/returns -> returns routes
     - /api/transactions -> transaction routes
     - /api/reports -> report routes
   - Add global error handler middleware

**Test:** All API endpoints accessible with correct paths

### Task 8.2: Integration Testing
**Concern:** End-to-end API functionality

**Steps:**
1. Create `tests/integration/` directory
2. Create integration test files:
   - `auth.test.js` - full auth flow
   - `investments.test.js` - investment CRUD with auth
   - `returns.test.js` - returns management flow
   - `transactions.test.js` - transaction management
   - `reports.test.js` - reporting endpoints
3. Use supertest for HTTP testing
4. Set up test database and cleanup

**Test:** Full integration test suite passes (>90% coverage)

### Task 8.3: Final Validation
**Concern:** Complete system verification

**Steps:**
1. Test complete user journey:
   - Register new user
   - Login and get token
   - Create investment
   - Add manual return
   - Update investment balance
   - View dashboard
   - Get reports
2. Verify all error cases handle properly
3. Check all validation works correctly
4. Ensure proper HTTP status codes

**Test:** Complete user journey works end-to-end without errors

---

## SUCCESS CRITERIA

**Project Complete When:**
✅ All 23 tasks completed successfully  
✅ All tests pass (unit + integration)  
✅ API documentation generated  
✅ Full user journey functional  
✅ Error handling robust  
✅ Database schema deployed  
✅ Authentication secured  

**Final Deliverable:** Production-ready Finance Tracking API with user authentication, investment management, manual returns processing, transaction tracking, and basic reporting capabilities.
