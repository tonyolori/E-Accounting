# Finance Tracking Application - Backend API

A comprehensive finance tracking application that helps users monitor and manage their investments efficiently. This backend API provides tools to track investment performance, calculate returns (fixed and variable), manage transactions, and generate basic reports.

## Features

- **Investment Management** - Create, view, update, and cancel investments
- **Manual Returns Management** - Add returns manually for both fixed and variable investments  
- **Transaction Tracking** - Record deposits, withdrawals, dividends, and returns
- **Basic Calculations** - Compound interest calculator and return calculations
- **User Authentication** - JWT-based authentication system
- **Basic Reporting** - Investment summary and dashboard data

## Tech Stack

- **Runtime:** Node.js (v18+ LTS)
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi
- **Testing:** Jest + Supertest

## Project Structure

```
src/
├── controllers/         # Request handlers
├── services/           # Business logic
├── middleware/         # Auth middleware
├── utils/              # Helper functions
├── validators/         # Input validation
├── routes/             # API routes
└── config/             # Configuration files
tests/                  # Test files
prisma/                 # Database schema
```

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables (copy .env.example to .env)
3. Set up database and run migrations: `npx prisma migrate dev`
4. Start development server: `npm run dev`

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/investments` - List user investments
- `POST /api/investments` - Create new investment
- `POST /api/returns/manual` - Add manual return
- `GET /api/reports/dashboard` - Get dashboard data

## Multi-Currency

- Investments have a `currency` (ISO 4217, e.g. `NGN`, `USD`).
- Aggregated reports convert values to a base currency for totals.
- Configure via environment:

```
BASE_CURRENCY=NGN
FX_RATES_JSON={"USD":1,"NGN":1500}
```

Notes:
- Rates are interpreted as “units per 1 USD” (e.g., NGN 1500 per USD).
- A timestamp for rates is returned as `ratesAt` in reporting responses.

## Transactions API: Response Shapes

All transaction responses include the related investment and its `currency`.

- Create (POST /api/transactions) and Update (PUT /api/transactions/:id):

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "...",
      "type": "RETURN",
      "amount": 500,
      "balance": 152500,
      "percentage": null,
      "transactionDate": "2025-11-15T12:00:00.000Z",
      "description": "...",
      "createdAt": "2025-11-15T12:00:01.000Z",
      "investment": {
        "id": "...",
        "name": "...",
        "category": "STOCKS",
        "currency": "NGN"
      }
    }
  }
}
```

- List (GET /api/transactions):

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "...",
        "type": "RETURN",
        "amount": 500,
        "balance": 152500,
        "percentage": null,
        "transactionDate": "2025-11-15T12:00:00.000Z",
        "description": "...",
        "createdAt": "2025-11-15T12:00:01.000Z",
        "investment": { "id": "...", "name": "...", "category": "STOCKS", "currency": "NGN" }
      }
    ],
    "pagination": { "total": 37, "limit": 20, "offset": 0, "hasNext": true, "hasPrev": false }
  }
}
```

- Get by ID (GET /api/transactions/:id) also includes current fields:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "...",
      "type": "RETURN",
      "amount": 500,
      "balance": 152500,
      "transactionDate": "2025-11-15T12:00:00.000Z",
      "createdAt": "2025-11-15T12:00:01.000Z",
      "investment": {
        "id": "...",
        "name": "...",
        "category": "STOCKS",
        "currency": "NGN",
        "currentBalance": 152500,
        "status": "ACTIVE"
      }
    }
  }
}
```

## Dashboard Reporting Changes

Removed native-currency fields from the dashboard response:
- Removed: `totalPrincipal`, `totalCurrentValue`, `totalReturns`, `returnPercentage`.

Added base-currency portfolio totals and breakdowns:
- `portfolio.totalPrincipalBase`
- `portfolio.totalCurrentValueBase`
- `portfolio.totalReturnsBase`
- `portfolio.ratesAt`
- `totalsByCurrency`: array of per-currency sums
- `assetAllocation`: object of category percentages that sum to 100

Example (partial):

```json
{
  "portfolio": {
    "ratesAt": "2025-11-15T12:00:00.000Z",
    "totalPrincipalBase": 175000,
    "totalCurrentValueBase": 198750,
    "totalReturnsBase": 23750
  },
  "totalsByCurrency": [
    { "currency": "NGN", "totalPrincipal": 150000, "totalCurrentValue": 172000, "totalReturns": 22000, "count": 5 },
    { "currency": "USD", "totalPrincipal": 100, "totalCurrentValue": 115, "totalReturns": 15, "count": 2 }
  ],
  "assetAllocation": { "STOCKS": 60, "BONDS": 30, "CASH": 10 }
}
```

## Development

- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode