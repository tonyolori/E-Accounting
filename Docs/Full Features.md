# Finance Tracking Application – Feature Specification

## 1. Overview
The **Finance Tracking Application** helps users monitor and manage their investments efficiently.  
It provides tools to track investment performance, calculate returns (fixed and variable), automate interest updates, and manage portfolio health.

---

## 2. Core Features

### 2.1 Investment Management
- **Add New Investment**
  - Create a new investment entry with:
    - Investment name and category
    - Principal amount
    - Start date
    - Duration or maturity date (optional)
    - Type of return (fixed or variable)
    -  Interest rate or expected monthly return (if applicable)

- **View All Investments**
  - Display all investments (Active, Completed, Cancelled)
  - Show key details:
    - Investment name
    - Current balance
    - Return type
    - Monthly/Annual  interest rate
    - Status
    - Start and end dates

- **Update Investment**
  - Modify details such as:
    -  Interest rate
    - Balance
    - Return type
    - Duration

- **Cancel Investment**
  - Mark an investment as *Cancelled* or *Failed*
  - Cancelled investments stop accruing returns
  - Retain records for audit and reporting

---

### 2.2 Return Calculation

- **Automatic Fixed Returns (Manual or Scheduled)**
  - Calculate interest now for fixed-rate investments based on actual period days and compounding frequency
  - Configuration:
    - Compounding frequency: daily, monthly, quarterly, annually
    - Automatic scheduling (cron) or manual trigger
  - Interest calculation creates a RETURN transaction, updates the investment balance, and records an InterestCalculation history entry
  - Revert last calculation restores prior balance, marks calculation as reverted, and removes the associated transaction
  - Preview calculation endpoint allows seeing interest and new balance without persisting changes

- **Manual Variable Returns**
  - Two supported flows:
    - Update last return percentage (system computes amount and updates balance)
    - Input new balance (system computes return amount and implied percentage)
  - Both flows create a RETURN transaction with the computed values and update the investment balance

- **Compound Interest Calculator**
  - Estimate future value of an investment by inputting:
    - Principal amount
    - Rate of return
    - Compounding frequency (monthly, quarterly, annually)
    - Duration

---

### 2.3 Investment Balances

- **Automatic Balance Updates**
  - Auto-adjust balance based on computed or entered returns (fixed: calculated interest; variable: computed amount or implied percentage)

- **Manual Balance Update**
  - Allow users to manually adjust balance to reflect:
    - Dividends
    - Losses
    - Withdrawals

---

### 2.4 Reporting & Insights

- **Investment Summary Dashboard**
  - Display:
    - Total investments
    - Total returns
    - Current portfolio value

- **Performance Trends**
  - Show:
    - Historical growth charts
    - Monthly or annual performance summaries

- **Cancelled or Failed Investments Report**
  - List all cancelled or failed investments with:
    - Cancellation reason
    - Loss tracking

---

### 2.5 Notifications & Reminders *(Future Enhancement)*
- Notify users when:
  - Monthly return is applied
  - Investment reaches maturity
  - Manual updates are pending (for variable returns)
- Use event-based notifications or scheduled tasks

---

## 3. Optional Enhancements
- **Data Export**
  - Export investment data as CSV, Excel, or JSON

- **Multi-Currency Support**
  - Track investments in multiple currencies with live exchange rate updates

- **Bank API Integration**
  - Auto-sync investment transactions and balances

- **User Authentication**
  - Secure login and registration
  - Password reset and profile management
  - JWT-based authentication or session tokens

---

## 4. Technical Notes (for Design Phase)
- Recommended architecture:
  - Modular or layered service design (Controllers → Services → Data Access)
  - Async I/O for database and background tasks
- Database entities:
  - `Investments` (core investment data)
  - `Transactions` (monthly or manual returns, deposits, withdrawals)
  - `Users` (authentication and ownership)
- Background processing:
  - Use schedulers or queues (e.g., `node-cron`, `bull`, or `agenda`) for monthly interest updates
- API design:
  - RESTful or GraphQL endpoints for CRUD operations and reports
- Testing:
  - Unit tests for calculation logic
  - Integration tests for API endpoints
- Extensibility:
  - Support multiple calculation strategies
  - Allow plug-in of third-party APIs (e.g., exchange rates, financial feeds)

---

