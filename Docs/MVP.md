# Finance Tracking Application - MVP Backend Design

## 1. MVP Overview

This document outlines a **Minimum Viable Product (MVP)** version of the Finance Tracking Application backend. The MVP focuses on core functionality with manual operations, removing complex automation and background processing for faster development and deployment.

## 2. MVP Scope - What's Included

### ✅ Core Features
- **Investment CRUD Operations** - Create, view, update, cancel investments
- **Manual Return Management** - Add returns manually (both fixed and variable)
- **Basic Transaction Tracking** - Record deposits, withdrawals, dividends
- **Simple Calculations** - Compound interest calculator (on-demand)
- **Basic Reporting** - Investment summary and simple dashboard
- **User Authentication** - Register, login, JWT-based auth

### ❌ Excluded from MVP
- **Background Jobs** - No automated monthly return processing
- **Advanced Analytics** - No trend analysis or complex reporting
- **Notifications** - No automated alerts or reminders
- **Data Export** - No CSV/Excel export functionality
- **Multi-currency Support** - Single currency only
- **Bank API Integration** - Manual data entry only
- **Performance Optimization** - Basic caching, no Redis
- **Advanced Security** - Basic security measures only

## 3. Simplified Tech Stack

### Core Technologies
- **Runtime:** Node.js (v18+ LTS)
- **Framework:** Express.js 4.18+
- **Database:** PostgreSQL 15+ (or SQLite for development)
- **ORM:** Prisma 5+
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi
- **Testing:** Jest + Supertest
- **Environment:** dotenv

### Excluded Technologies
- ~~Redis~~ (caching)
- ~~node-cron~~ (scheduling)
- ~~Bull/Agenda~~ (job queues)
- ~~Winston~~ (advanced logging)
- ~~PM2~~ (process management)

## 4. Simplified Database Schema

### 4.1 Core Tables (MVP)

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
  status: ENUM('active', 'completed', 'cancelled')
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  notes: TEXT (nullable)
}
```

#### Transactions Table
```sql
transactions {
  id: UUID (PK)
  investment_id: UUID (FK -> investments.id)
  type: ENUM('return', 'withdrawal', 'deposit', 'dividend')
  amount: DECIMAL(15,2)
  percentage: DECIMAL(5,4) (nullable)
  transaction_date: DATE
  description: TEXT (nullable)
  created_at: TIMESTAMP
}
```

## 5. MVP Module Breakdown

### 5.1 Authentication Module (Simplified)

**Responsibilities:**
- Basic user registration and login
- JWT token generation and validation
- Simple password management

**Endpoints:**
```
POST /api/auth/register
POST /api/auth/login
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
- Basic investment status management
- Manual balance updates

**Endpoints:**
```
POST   /api/investments               # Create investment
GET    /api/investments               # Get all user investments
GET    /api/investments/:id           # Get specific investment
PUT    /api/investments/:id           # Update investment
PATCH  /api/investments/:id/status    # Update status (cancel)
PATCH  /api/investments/:id/balance   # Manual balance update
```

**Key Files:**
- `controllers/investmentController.js`
- `services/investmentService.js`
- `validators/investmentValidator.js`

### 5.3 Returns Management Module (Manual Only)

**Responsibilities:**
- Manual return entry (no automation)
- Basic calculation utilities
- On-demand compound interest calculation

**Endpoints:**
```
POST /api/returns/manual              # Add manual return
POST /api/returns/calculate           # Calculate compound interest (utility)
GET  /api/returns/:investmentId       # Get returns for investment
```

**Key Files:**
- `controllers/returnsController.js`
- `services/calculationService.js`
- `services/returnsService.js`

### 5.4 Transaction Management Module

**Responsibilities:**
- Basic transaction recording
- Simple transaction history
- Transaction CRUD operations

**Endpoints:**
```
POST /api/transactions                # Create transaction
GET  /api/transactions                # Get transactions (basic filtering)
GET  /api/transactions/:id            # Get specific transaction
PUT  /api/transactions/:id            # Update transaction
DELETE /api/transactions/:id          # Delete transaction
```

**Key Files:**
- `controllers/transactionController.js`
- `services/transactionService.js`

### 5.5 Basic Reporting Module

**Responsibilities:**
- Simple dashboard data
- Basic investment summary
- Total calculations only

**Endpoints:**
```
GET /api/reports/dashboard            # Basic dashboard data
GET /api/reports/summary              # Simple investment summary
```

**Key Files:**
- `controllers/reportsController.js`
- `services/reportService.js`

## 6. MVP API Design

### 6.1 Simplified Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### 6.2 Basic Error Format
```json
{
  "success": false,
  "error": "Error message",
  "details": []
}
```

## 7. MVP Setup Instructions

### 7.1 Simplified Dependencies
```bash
# Core dependencies only
npm install express cors helmet morgan
npm install prisma @prisma/client bcryptjs jsonwebtoken
npm install joi dotenv

# Development dependencies
npm install -D nodemon jest supertest
npm install -D eslint prettier
```

### 7.2 Basic Environment Configuration
```env
# .env file (simplified)
NODE_ENV=development
PORT=5000

# Database (SQLite for development, PostgreSQL for production)
DATABASE_URL="postgresql://username:password@localhost:5432/e_accounting_mvp"
# Or for development:
# DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRE="7d"
```

### 7.3 Basic Project Structure
```
e-accounting-mvp/
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/            # Business logic
│   ├── middleware/          # Auth middleware only
│   ├── utils/               # Basic helpers
│   ├── validators/          # Input validation
│   ├── routes/              # API routes
│   └── app.js               # Express app
├── tests/                   # Basic tests
├── prisma/                  # Database schema
└── server.js                # Entry point
```

## 8. MVP Development Plan

### Phase 1: Foundation (Week 1)
**Tasks:**
1. **Basic Project Setup**
   - Initialize Node.js project
   - Set up Express server with basic middleware
   - Configure environment variables
   - Set up basic error handling

2. **Database Setup**
   - Create simplified Prisma schema
   - Set up database connection
   - Create initial migration

3. **Authentication (Basic)**
   - User registration with email/password
   - JWT login system
   - Basic auth middleware
   - Simple password hashing

**Deliverables:**
- Running Express server
- Database connected with basic user model
- Working registration and login

### Phase 2: Core Investment Features (Week 2)
**Tasks:**
1. **Investment CRUD**
   - Create investment endpoints
   - Basic input validation with Joi
   - Investment service layer
   - Simple error responses

2. **Manual Balance Management**
   - Update investment balance manually
   - Basic status management (active, cancelled)
   - Simple investment listing and filtering

**Deliverables:**
- Complete investment management API
- Basic validation and error handling
- Simple investment dashboard data

### Phase 3: Returns & Transactions (Week 3)
**Tasks:**
1. **Manual Returns System**
   - Add manual returns to investments
   - Update balances based on returns
   - Basic return calculation utilities
   - Simple compound interest calculator

2. **Transaction Management**
   - Record transactions manually
   - Basic transaction history
   - Simple transaction CRUD operations

3. **Basic Testing**
   - Unit tests for core functions
   - Basic API endpoint testing
   - Simple integration tests

**Deliverables:**
- Working manual returns system
- Complete transaction management
- Basic test coverage

### Phase 4: Reporting & Polish (Week 4)
**Tasks:**
1. **Basic Reporting**
   - Simple dashboard with totals
   - Basic investment summary
   - Simple performance calculations

2. **MVP Polish**
   - Input validation improvements
   - Better error messages
   - Basic API documentation
   - Simple frontend integration preparation

3. **Deployment Preparation**
   - Production environment setup
   - Basic deployment configuration
   - Simple health check endpoint

**Deliverables:**
- Complete MVP with basic reporting
- Production-ready deployment
- Basic API documentation
- Simple dashboard data endpoints

## 9. MVP Calculation Logic (Simplified)

### 9.1 Basic Compound Interest
```javascript
// Simple compound interest calculation
function calculateCompoundInterest(principal, annualRate, years, compoundingFrequency = 12) {
  const rate = annualRate / 100;
  const amount = principal * Math.pow((1 + rate / compoundingFrequency), compoundingFrequency * years);
  return {
    futureValue: amount,
    totalReturns: amount - principal
  };
}

// Manual return application
function applyManualReturn(currentBalance, returnAmount) {
  return {
    newBalance: currentBalance + returnAmount,
    returnAmount: returnAmount
  };
}
```

### 9.2 Basic Portfolio Calculations
```javascript
// Simple portfolio summary
function calculatePortfolioSummary(investments) {
  return investments.reduce((summary, investment) => {
    summary.totalPrincipal += investment.principal_amount;
    summary.currentValue += investment.current_balance;
    summary.totalReturns += (investment.current_balance - investment.principal_amount);
    return summary;
  }, {
    totalPrincipal: 0,
    currentValue: 0,
    totalReturns: 0
  });
}
```

## 10. MVP Testing Strategy

### 10.1 Basic Testing
- **Unit Tests:** Core calculation functions
- **API Tests:** All endpoint functionality
- **Integration Tests:** Database operations
- **Manual Testing:** Frontend integration

### 10.2 Testing Focus Areas
- Authentication flow
- Investment CRUD operations
- Manual return calculations
- Basic error handling

## 11. MVP Limitations & Future Upgrades

### 11.1 Known Limitations
- **Manual Operations Only** - No automated processing
- **Basic Security** - Minimal security features
- **No Data Export** - Manual data viewing only
- **Single Currency** - No multi-currency support
- **Basic Reporting** - Simple calculations only
- **No Notifications** - No alert system

### 11.2 Post-MVP Upgrade Path
1. **Add Background Jobs** - Implement automated monthly returns
2. **Enhanced Reporting** - Add charts and trend analysis
3. **Data Export** - CSV/Excel export functionality
4. **Advanced Security** - Rate limiting, advanced auth
5. **Performance Optimization** - Caching and optimization
6. **Notifications** - Email alerts and reminders

## 12. MVP Deployment

### 12.1 Simple Deployment Options
```bash
# Option 1: Simple VPS deployment
npm run build
pm2 start server.js

# Option 2: Heroku deployment
# Add Procfile: web: node server.js
git push heroku main

# Option 3: Basic Docker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### 12.2 Basic Environment Variables (Production)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://..."
JWT_SECRET="secure-production-secret"
```

---

## MVP Summary

This MVP version focuses on delivering core investment tracking functionality quickly:

**🎯 MVP Goals:**
- **Core Investment Management** - Manual CRUD operations
- **Basic Return Tracking** - Manual entry and simple calculations
- **Simple Reporting** - Dashboard with basic totals
- **User Authentication** - Simple JWT-based auth

**⏱️ Development Timeline:**
- **Total Time:** 4 weeks with 1 developer
- **Core MVP Ready:** Week 3
- **Production Ready:** Week 4

**🚀 Key Benefits:**
- **Faster Development** - 4 weeks vs 6 weeks
- **Simpler Architecture** - Fewer dependencies and complexity
- **Easier Testing** - Manual operations are more predictable
- **Quick Feedback** - Get user feedback faster with core features

The MVP provides a solid foundation that can be enhanced with automation and advanced features based on user feedback and requirements.
