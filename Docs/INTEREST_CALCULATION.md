# Interest Calculation & Investment Value Automation

## Overview
This document describes the automatic investment value increase features for both fixed and variable return investments.

- Fixed (automatic or manual): Calculate interest now, store history, revert last calculation, and schedule auto-calculation.
- Variable (manual): Update last return percentage or input a new balance; the system computes the implied return and percentage.

---

## Data Model

### Investment (new fields)
- compoundingFrequency: DAILY | MONTHLY | QUARTERLY | ANNUALLY (string)
- lastInterestCalculated: DateTime
- nextInterestDue: DateTime
- autoCalculateInterest: Boolean

### InterestCalculation (new model)
- id: string (UUID)
- investmentId: string (FK)
- calculationType: AUTOMATIC | MANUAL (string)
- calculatedAt: DateTime
- periodStart: DateTime
- periodEnd: DateTime
- principalAmount: Decimal(15,2)
- interestRate: Decimal(5,4) (annual)
- interestEarned: Decimal(15,2)
- newBalance: Decimal(15,2)
- transactionId: string (nullable)
- isReverted: boolean
- revertedAt: DateTime (nullable)
- revertedBy: string (nullable)

---

## Calculation Logic

### Fixed Investments
- Period interest is computed using an effective rate for the exact day span:
  - effectiveRate = (1 + r/n)^(n * tYears) - 1
  - where r = annual rate (decimal), n = compounding frequency per year, tYears = periodDays / 365.25
  - interest = principal * effectiveRate
  - newBalance = principal + interest
- Frequencies: DAILY (365), MONTHLY (12), QUARTERLY (4), ANNUALLY (1)
- The system records an InterestCalculation, creates a RETURN transaction, updates the investment balance and schedules the next due date.

### Variable Investments
- Update by percentage:
  - amount = currentBalance * (percentage / 100)
  - newBalance = currentBalance + amount
- Update by balance:
  - returnAmount = newBalance - currentBalance
  - percentage = currentBalance > 0 ? (returnAmount / currentBalance) * 100 : 0
- A RETURN transaction is recorded in both cases with the computed amount and optional percentage.

---

## Endpoints
Base path: `/api/interest` (all routes require auth)

### 1) Calculate Interest Now (Fixed)
POST `/calculate/:investmentId`
- Response: { calculation, transaction, investment }
- Errors: 400 (invalid type or missing rate), 404 (not found)

### 2) Revert Last Calculation (Fixed)
POST `/revert/:investmentId`
Body: `{ "confirmRevert": true }`
- Response: { calculation (reverted), investment }
- Errors: 400 (no calc to revert), 404

### 3) Calculation History
GET `/history/:investmentId?page=1&limit=20`
- Response: { items: InterestCalculation[], pagination }

### 4) Preview (No Write)
GET `/preview/:investmentId`
- Response: { preview: true, investmentId, days, interest, newBalance, periodStart, periodEnd }

### 5) Update Auto-Calc Schedule
PATCH `/schedule/:investmentId`
Body: `{ "autoCalculate": true, "compoundingFrequency": "MONTHLY" }`
- Response: updated Investment

### 6) Variable: Update Return Percentage
POST `/variable/update-percentage/:investmentId`
Body: `{ "percentage": 2.5, "effectiveDate": "2025-11-01", "description": "Monthly variable return" }`
- Response: { transaction, investment, calculatedAmount }

### 7) Variable: Update Balance (Derive %)
POST `/variable/update-balance/:investmentId`
Body: `{ "newBalance": 105000, "effectiveDate": "2025-11-01", "description": "Mark to market" }`
- Response: { transaction, investment, calculatedPercentage, returnAmount }

---

## Validation
Schemas (Joi):
- calculateInterestNow: { investmentId: UUID }
- revertCalculation: { investmentId: UUID, confirmRevert: true }
- updateReturnPercentage: { investmentId: UUID, percentage: -100..1000, effectiveDate?: <= now }
- updateBalance: { investmentId: UUID, newBalance: >= 0, effectiveDate?: <= now }
- scheduleSettings: { autoCalculate: boolean, compoundingFrequency: enum }

Rules:
- Must own investment
- Investment must be ACTIVE
- Fixed: requires interestRate, correct type
- Variable: correct type

---

## Scheduler
- Job: `processScheduledInterestCalculations()` (daily at 00:10 UTC)
- Selects FIXED, ACTIVE, autoCalculateInterest=true, nextInterestDue <= now
- For each, runs Calculate Interest Now
- Logging of successes and failures

Note: Requires installing `node-cron` and initializing the job at server startup.

---

## Error Responses (examples)
- 400 BAD REQUEST
```json
{ "success": false, "error": "Investment is not ACTIVE", "code": "INVALID_STATE" }
```
- 404 NOT FOUND
```json
{ "success": false, "error": "Investment not found" }
```
- 500 SERVER ERROR
```json
{ "success": false, "error": "Unexpected error" }
```

---

## Security & Limits
- All endpoints protected by JWT auth
- Recommended: Rate limit interest calculation endpoints
- Audit trail via InterestCalculation model and transactions

---

## Examples

### Fixed Calculate Now
Request: `POST /api/interest/calculate/INV_ID`
Response (200):
```json
{
  "success": true,
  "data": {
    "calculation": {
      "id": "...", "investmentId": "INV_ID", "interestEarned": 250.50,
      "periodStart": "2025-10-15T00:00:00.000Z", "periodEnd": "2025-11-15T00:00:00.000Z",
      "newBalance": 10250.50
    },
    "transaction": { "id": "...", "type": "RETURN", "amount": 250.50, "transactionDate": "2025-11-15T00:00:00.000Z" },
    "investment": { "id": "INV_ID", "currentBalance": 10250.50, "nextInterestDue": "2025-12-15T00:00:00.000Z" }
  }
}
```

### Variable Update Percentage
Request: `POST /api/interest/variable/update-percentage/INV_ID`
```json
{ "percentage": 2.5, "effectiveDate": "2025-11-01" }
```
Response (200):
```json
{ "success": true, "data": { "transaction": { "amount": 250.00, "percentage": 2.5 }, "investment": { "currentBalance": 10250.00 } } }
```
