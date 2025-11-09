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

## Development

- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode