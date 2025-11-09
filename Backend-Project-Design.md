# Finance Tracking Application - Backend Project Design

## 1. Project Overview

This document outlines the complete backend development plan for a Finance Tracking Application built with Node.js. The system will help users monitor and manage their investments with features for tracking performance, calculating returns, and generating insights.

## 2. Technical Stack

### Core Technologies
- **Runtime:** Node.js (v18+ LTS)
- **Framework:** Express.js 4.18+
- **Database:** PostgreSQL 15+ (Primary), Redis (Caching/Sessions)
- **ORM:** Prisma 5+
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi or Zod
- **Testing:** Jest + Supertest
- **Documentation:** Swagger/OpenAPI 3.0
- **Process Management:** PM2
- **Logging:** Winston
- **Environment:** dotenv

### Development Tools
- **TypeScript:** For type safety
- **ESLint + Prettier:** Code formatting
- **Husky:** Git hooks
- **nodemon:** Development server
- **Docker:** Containerization

## 3. Project Structure

```
e-accounting-backend/
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/            # Business logic
│   ├── models/              # Database models (Prisma)
│   ├── middleware/          # Custom middleware
│   ├── utils/               # Helper functions
│   ├── validators/          # Input validation schemas
│   ├── routes/              # API route definitions
│   ├── jobs/                # Background jobs
│   ├── config/              # Configuration files
│   └── app.js               # Express app setup
├── tests/                   # Test files
├── docs/                    # API documentation
├── scripts/                 # Database scripts
├── prisma/                  # Database schema and migrations
├── docker/                  # Docker configurations
└── server.js                # Application entry point
```

## 4. Database Schema Design

### 4.1 Core Entities

#### Users Table
```sql
users {
  id: UUID (PK)
  email: VARCHAR(255) UNIQUE
  password_hash: VARCHAR(255)
  first_name: VARCHAR(100)
  last_name: VARCHAR(100)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  is_active: BOOLEAN
}
```

#### Investments Table
```sql
investments {
  id: UUID (PK)
  user_id: UUID (FK -> users.id)
  name: VARCHAR(255)
  category: VARCHAR(100)
  principal_amount: DECIMAL(15,2)
  current_balance: DECIMAL(15,2)
  return_type: ENUM('fixed', 'variable')
  interest_rate: DECIMAL(5,4) -- For fixed returns
  start_date: DATE
  end_date: DATE (nullable)
  duration_months: INTEGER (nullable)
  status: ENUM('active', 'completed', 'cancelled', 'failed')
  compound_frequency: ENUM('monthly', 'quarterly', 'annually')
  is_simple_interest: BOOLEAN
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  cancelled_reason: TEXT (nullable)
  notes: TEXT (nullable)
}
```

#### Transactions Table
```sql
transactions {
  id: UUID (PK)
  investment_id: UUID (FK -> investments.id)
  type: ENUM('return', 'withdrawal', 'deposit', 'dividend', 'loss')
  amount: DECIMAL(15,2)
  percentage: DECIMAL(5,4) (nullable)
  transaction_date: DATE
  is_automatic: BOOLEAN
  description: TEXT (nullable)
  created_at: TIMESTAMP
}
```

#### Investment_Performance Table (for reporting)
```sql
investment_performance {
  id: UUID (PK)
  investment_id: UUID (FK -> investments.id)
  month: INTEGER
  year: INTEGER
  opening_balance: DECIMAL(15,2)
  closing_balance: DECIMAL(15,2)
  returns_earned: DECIMAL(15,2)
  return_rate: DECIMAL(5,4)
  created_at: TIMESTAMP
}
```

## 5. Module Breakdown

### 5.1 Authentication & Authorization Module

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password reset functionality
- Session management

**Endpoints:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

**Key Files:**
- `controllers/authController.js`
- `services/authService.js`
- `middleware/authMiddleware.js`
- `validators/authValidator.js`

### 5.2 Investment Management Module

**Responsibilities:**
- CRUD operations for investments
- Investment status management
- Investment categorization

**Endpoints:**
```
POST   /api/investments               # Create investment
GET    /api/investments               # Get all user investments
GET    /api/investments/:id           # Get specific investment
PUT    /api/investments/:id           # Update investment
DELETE /api/investments/:id           # Cancel investment
GET    /api/investments/categories    # Get investment categories
```

**Key Files:**
- `controllers/investmentController.js`
- `services/investmentService.js`
- `validators/investmentValidator.js`

### 5.3 Returns Calculation Module

**Responsibilities:**
- Automatic fixed return calculations
- Manual variable return processing
- Compound interest calculations
- Balance updates

**Endpoints:**
```
POST /api/returns/calculate           # Calculate compound interest
POST /api/returns/manual              # Add manual return
GET  /api/returns/:investmentId       # Get returns for investment
PUT  /api/returns/auto-apply          # Apply automatic returns
```

**Key Files:**
- `controllers/returnsController.js`
- `services/calculationService.js`
- `services/returnsService.js`
- `jobs/autoReturnsJob.js`

### 5.4 Transaction Management Module

**Responsibilities:**
- Record all financial transactions
- Track deposits, withdrawals, dividends
- Transaction history and filtering

**Endpoints:**
```
POST /api/transactions                # Create transaction
GET  /api/transactions                # Get all transactions (with filters)
GET  /api/transactions/:id            # Get specific transaction
PUT  /api/transactions/:id            # Update transaction
DELETE /api/transactions/:id          # Delete transaction
```

**Key Files:**
- `controllers/transactionController.js`
- `services/transactionService.js`
- `validators/transactionValidator.js`

### 5.5 Reporting & Analytics Module

**Responsibilities:**
- Investment summaries and dashboards
- Performance analytics
- Trend analysis
- Data export capabilities

**Endpoints:**
```
GET /api/reports/dashboard            # Main dashboard data
GET /api/reports/performance/:period  # Performance over time
GET /api/reports/summary              # Investment summary
GET /api/reports/cancelled            # Cancelled investments report
GET /api/reports/export/:format       # Export data (CSV, JSON)
```

**Key Files:**
- `controllers/reportsController.js`
- `services/analyticsService.js`
- `services/exportService.js`

### 5.6 Background Jobs Module

**Responsibilities:**
- Automated monthly return processing
- Performance data aggregation
- Cleanup tasks

**Job Types:**
- Monthly returns application
- Investment maturity checks
- Performance calculations
- Database cleanup

**Key Files:**
- `jobs/scheduler.js`
- `jobs/monthlyReturnsJob.js`
- `jobs/maturityCheckJob.js`
- `jobs/performanceAggregationJob.js`

## 6. API Design Standards

### 6.1 Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2025-11-09T16:33:00.000Z"
}
```

### 6.2 Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2025-11-09T16:33:00.000Z"
}
```

### 6.3 HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## 7. Setup Instructions

### 7.1 Prerequisites
```bash
# Required software
Node.js v18+ LTS
PostgreSQL 15+
Redis 6+
Git
Docker (optional)
```

### 7.2 Project Initialization
```bash
# Create project directory
mkdir e-accounting-backend
cd e-accounting-backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express cors helmet morgan compression
npm install prisma @prisma/client bcryptjs jsonwebtoken
npm install joi winston dotenv node-cron
npm install express-rate-limit express-validator

# Install development dependencies
npm install -D typescript @types/node @types/express
npm install -D nodemon jest supertest eslint prettier
npm install -D husky lint-staged @typescript-eslint/parser
```

### 7.3 Environment Configuration
```env
# .env file
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/e_accounting"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRE="7d"
JWT_REFRESH_EXPIRE="30d"

# Email (for password reset)
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### 7.4 Database Setup
```bash
# Initialize Prisma
npx prisma init

# Create and run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

## 8. Development Tasks Breakdown

### Phase 1: Foundation (Week 1)
**Tasks:**
1. **Project Setup**
   - Initialize Node.js project with TypeScript
   - Configure ESLint, Prettier, and Husky
   - Set up basic Express server
   - Configure environment variables

2. **Database Setup**
   - Design and implement Prisma schema
   - Create initial migrations
   - Set up database connection and configuration

3. **Authentication Module**
   - Implement user registration and login
   - JWT token generation and validation
   - Password hashing with bcrypt
   - Basic auth middleware

**Deliverables:**
- Basic Express server running
- Database connected with user authentication
- JWT-based auth system working
- Basic API documentation setup

### Phase 2: Core Investment Management (Week 2)
**Tasks:**
1. **Investment CRUD Operations**
   - Create investment endpoints
   - Input validation with Joi/Zod
   - Investment model and service layer
   - Basic error handling

2. **Investment Status Management**
   - Status updates (active, cancelled, completed)
   - Cancellation with reasons
   - Investment categorization

3. **Basic Testing Setup**
   - Unit tests for investment service
   - Integration tests for auth endpoints
   - Test database setup

**Deliverables:**
- Full investment CRUD API
- Comprehensive input validation
- Basic test coverage (>70%)
- API documentation updated

### Phase 3: Returns & Calculations (Week 3)
**Tasks:**
1. **Calculation Service**
   - Compound interest calculation logic
   - Simple vs compound interest options
   - Different compounding frequencies
   - Return rate validations

2. **Manual Returns Management**
   - Manual return entry endpoints
   - Percentage and absolute value inputs
   - Balance update logic
   - Transaction recording

3. **Transaction System**
   - Transaction CRUD operations
   - Transaction types and categorization
   - Transaction history with filtering
   - Balance reconciliation

**Deliverables:**
- Working calculation engine
- Manual returns system
- Complete transaction management
- Updated API documentation

### Phase 4: Automated Processing (Week 4)
**Tasks:**
1. **Background Job System**
   - Set up node-cron or bull queue
   - Monthly return automation job
   - Investment maturity checking
   - Error handling and retry logic

2. **Automatic Balance Updates**
   - Scheduled return applications
   - Balance recalculation logic
   - Audit trail for automatic changes
   - Notification system (basic)

3. **Performance Optimization**
   - Database query optimization
   - Caching with Redis
   - API response caching
   - Connection pooling

**Deliverables:**
- Automated monthly returns
- Background job system
- Performance optimizations
- Monitoring and logging

### Phase 5: Reporting & Analytics (Week 5)
**Tasks:**
1. **Dashboard Analytics**
   - Investment summary calculations
   - Portfolio performance metrics
   - Monthly/yearly aggregations
   - Trend analysis logic

2. **Reporting Endpoints**
   - Dashboard data API
   - Performance reports
   - Cancelled investments report
   - Custom date range filtering

3. **Data Export**
   - CSV export functionality
   - JSON export for API integration
   - Report generation with filters
   - File download endpoints

**Deliverables:**
- Complete reporting system
- Data export capabilities
- Analytics dashboard data
- Performance metrics

### Phase 6: Testing & Documentation (Week 6)
**Tasks:**
1. **Comprehensive Testing**
   - Unit tests for all services
   - Integration tests for all endpoints
   - End-to-end testing scenarios
   - Performance testing

2. **API Documentation**
   - Complete Swagger/OpenAPI docs
   - Endpoint examples and schemas
   - Authentication documentation
   - Error code documentation

3. **Deployment Preparation**
   - Docker containerization
   - Production environment config
   - Database migration scripts
   - Monitoring and logging setup

**Deliverables:**
- Complete test suite (>90% coverage)
- Full API documentation
- Production-ready deployment
- Performance benchmarks

## 9. Key Implementation Notes

### 9.1 Calculation Logic
```javascript
// Compound Interest Formula Implementation
function calculateCompoundInterest(principal, rate, frequency, time) {
  return principal * Math.pow((1 + rate / frequency), frequency * time);
}

// Monthly Return Application
function applyMonthlyReturn(investment, currentDate) {
  const monthlyRate = investment.interest_rate / 12;
  const newBalance = investment.current_balance * (1 + monthlyRate);
  const returnAmount = newBalance - investment.current_balance;
  
  return {
    newBalance,
    returnAmount,
    transactionDate: currentDate
  };
}
```

### 9.2 Security Considerations
- Input validation on all endpoints
- SQL injection prevention with Prisma
- Rate limiting on auth endpoints
- CORS configuration for frontend
- Helmet.js for security headers
- JWT token expiration and refresh
- Password strength requirements
- Audit logging for sensitive operations

### 9.3 Error Handling Strategy
```javascript
// Global error handler middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details
      }
    });
  }
  
  // Handle other error types...
});
```

## 10. Testing Strategy

### 10.1 Unit Testing
- **Service Layer:** All business logic functions
- **Utilities:** Calculation functions and helpers
- **Validators:** Input validation schemas
- **Models:** Database operations (mocked)

### 10.2 Integration Testing
- **API Endpoints:** All REST endpoints with real database
- **Authentication:** Login/logout flows
- **Background Jobs:** Scheduled task execution
- **Database Operations:** CRUD operations with test DB

### 10.3 Performance Testing
- **Load Testing:** API endpoints under concurrent load
- **Database Performance:** Query execution times
- **Memory Usage:** Memory leaks and optimization
- **Response Times:** API response time benchmarks

## 11. Deployment Considerations

### 11.1 Production Environment
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: e_accounting
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
  
  redis:
    image: redis:6-alpine
```

### 11.2 Monitoring & Logging
- **Application Logs:** Winston with log rotation
- **Error Tracking:** Sentry integration
- **Performance Monitoring:** New Relic or similar
- **Database Monitoring:** Query performance tracking
- **Health Checks:** Endpoint for service health

## 12. Future Enhancements

### 12.1 Planned Features
- **Multi-currency Support:** Currency conversion and tracking
- **Bank API Integration:** Automated transaction sync
- **Advanced Analytics:** ML-based predictions
- **Mobile App Support:** GraphQL API optimization
- **Notification System:** Email/SMS/Push notifications

### 12.2 Scalability Considerations
- **Database Sharding:** User-based data partitioning
- **Microservices:** Split into domain-specific services
- **Caching Strategy:** Redis cluster for high availability
- **Load Balancing:** Multiple app instances
- **Background Processing:** Queue-based job processing

---

## Summary

This comprehensive backend design provides a solid foundation for the Finance Tracking Application. The modular architecture ensures maintainability and scalability, while the detailed task breakdown allows for systematic development by engineering teams.

The project is structured to deliver core functionality first, with automated processing and advanced features following in subsequent phases. Each module is self-contained with clear responsibilities and well-defined APIs.

**Total Estimated Development Time:** 6 weeks with 1-2 developers
**Core Features Ready:** Week 4
**Production Ready:** Week 6
