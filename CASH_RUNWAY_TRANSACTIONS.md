# Cash Runway - Transaction Integration

This document explains how the Cash Runway feature integrates with your actual transaction data from Firestore.

## Overview

The Cash Runway feature now automatically pulls **both income and expense transactions** from your Firestore database to provide accurate cash flow projections. This means your actual spending and income are included in the forecast calculations.

## How It Works

### Data Sources

The cash runway forecast combines multiple data sources:

1. **Connected Account Balances** - Starting balance from your bank accounts
2. **Income Transactions** - Actual income from your transaction history
3. **Expense Transactions** - Actual expenses from your transaction history
4. **Bill Instances** - Recurring bills you've configured
5. **Planned Spending** - Future spending you've planned

### Transaction Query Logic

The system queries transactions from the hierarchical Firestore structure:

```
transactions/{userId}/{month}/{transactionId}
```

#### Income Transactions

**Criteria**:
- Type: `income`
- Date: Within the forecast horizon (default 90 days)
- Category: NOT `"Exclude"`

**Treatment**: Added as positive cash inflows on their transaction date

#### Expense Transactions

**Criteria**:
- Type: `expense`
- Date: Within the forecast horizon (default 90 days)
- Category: NOT `"Exclude"` AND NOT `"Uncategorized"`
- Must have a category assigned

**Treatment**: Added as negative cash outflows on their transaction date

### Why Uncategorized and Excluded Transactions Are Skipped

**Uncategorized Transactions** (`category === "Uncategorized"`):
- These transactions haven't been reviewed yet
- Including them could distort the forecast
- They need manual categorization first

**Excluded Transactions** (`category === "Exclude"`):
- These represent internal transfers between your accounts
- They don't affect your total net worth
- Including them would double-count cash movements

## Implementation Details

### API Endpoint: `/api/cash/forecast`

The forecast API endpoint (`POST /api/cash/forecast`) performs these steps:

1. **Authenticate User** - Verify the logged-in user
2. **Load Cash Plan** - Get user's cash runway settings
3. **Calculate Starting Balance** - Sum balances from connected accounts
4. **Load Bill Instances** - Get recurring bills
5. **Load Planned Spending** - Get planned future expenses
6. **Query Transactions** - Fetch income and expense transactions
   - Generates a list of months to query (current month through horizon)
   - Queries each month's subcollection
   - Filters by type, category, and date range
7. **Build Events** - Combine all data into cash events
8. **Calculate Forecast** - Run the forecast engine
9. **Return Results** - Include metadata about what was included

### Response Format

```json
{
  "forecast": {
    "userId": "user123",
    "horizonDays": 90,
    "daily": [...], // Daily balance projections
    "monthSummaries": [...], // Monthly summaries
    "dangerPoint": {...}, // Lowest balance point
    "redDays": [...] // Days when balance goes negative
  },
  "cached": false,
  "meta": {
    "carryoverBalance": 3420.50,
    "billInstancesCount": 12,
    "plannedSpendingCount": 5,
    "incomeTransactionsCount": 8,
    "expenseTransactionsCount": 45,
    "totalTransactionsCount": 53,
    "calculationTimeMs": 125
  }
}
```

## Transaction Categories and Cash Runway

### Best Practices

1. **Categorize Your Transactions**
   - Only categorized transactions are included in forecasts
   - Use the Transactions page to categorize uncategorized items
   - This ensures accurate cash runway calculations

2. **Mark Transfers as "Exclude"**
   - When you transfer money between your own accounts, categorize as "Exclude"
   - This prevents double-counting in your cash runway
   - Example: Moving money from checking to savings

3. **Review Regularly**
   - Check the Cash Runway dashboard to see if forecasts match expectations
   - If numbers seem off, review your transaction categorization
   - Ensure all income and expenses have proper categories

## Viewing Your Cash Runway

Navigate to the Cash Runway dashboard to see:

- **Cash Runway Date** - When you'll run out of money at current spending rate
- **Danger Days** - Days when balance drops below buffer or goes negative
- **Monthly Summaries** - Net cash flow for each month
- **Daily Balances** - Day-by-day balance projections
- **Transaction Events** - All events affecting your balance

## How Transactions Are Represented

### Income Transaction Example

```typescript
{
  id: "txn_123",
  date: "2025-12-25", // YYYY-MM-DD
  amount: 3000.00, // Positive for income
  kind: "income",
  meta: {
    name: "Paycheck",
    category: "Salary"
  }
}
```

### Expense Transaction Example

```typescript
{
  id: "txn_456",
  date: "2025-12-20", // YYYY-MM-DD
  amount: -150.00, // Negative for expense
  kind: "bill", // Treated as a bill for forecasting
  meta: {
    name: "Whole Foods",
    category: "Groceries"
  }
}
```

## Forecast Horizon

By default, the forecast looks **90 days** into the future. The system:

1. Calculates which months fall within this period
2. Queries each month's transaction subcollection
3. Filters transactions by date to only include those in the horizon
4. Combines with recurring bills and planned spending for complete picture

### Example Month Calculation

If today is December 24, 2025, and horizon is 90 days:
- End date: March 23, 2026
- Months to query: `2025-12`, `2026-01`, `2026-02`, `2026-03`
- Each month's subcollection is queried separately for performance

## Performance Considerations

### Efficient Querying

The implementation uses efficient querying strategies:

1. **Month-based Partitioning** - Only queries relevant months
2. **Indexed Queries** - Uses Firestore indexes for fast lookups
3. **Type Filtering** - Separate queries for income and expenses
4. **Date Range Filtering** - Only includes transactions in forecast period

### Caching

- Forecasts are cached to avoid recalculation
- Cache is invalidated when inputs change
- "What-if" scenarios bypass cache

## Troubleshooting

### My transactions aren't showing in the forecast

**Check**:
1. Are they categorized? (not "Uncategorized")
2. Are they marked as "Exclude"? (remove if not a transfer)
3. Are they within the 90-day horizon?
4. Are they of type "income" or "expense"?

### The forecast doesn't match my expectations

**Verify**:
1. Starting balance is correct (check connected accounts)
2. All transactions are properly categorized
3. No duplicate transactions
4. Transfers are marked as "Exclude"
5. Recurring bills are configured correctly

### I see "Balance unavailable" on accounts

**Solution**:
- Navigate to `/manage-accounts`
- Update account balances manually
- This sets the starting point for forecasts

## Future Enhancements

Potential improvements:

1. **Historical Pattern Analysis** - Use past spending to predict future
2. **Category-based Projections** - Forecast future spending by category
3. **Seasonal Adjustments** - Account for seasonal spending patterns
4. **Income Forecasting** - Predict irregular income based on history
5. **Real-time Updates** - Automatically refresh when new transactions sync

## Integration with Other Features

### Transactions Page
- Categorize transactions to include in forecast
- Mark transfers as "Exclude"
- View transaction history

### Connected Accounts
- Provides starting balance for forecasts
- Multiple accounts are summed
- Configure which accounts to include in cash plan

### Budgets
- Budget categories align with transaction categories
- Helps identify spending patterns
- Complements cash runway for full financial picture

## Summary

The Cash Runway feature now provides **accurate, transaction-based forecasts** by:

✅ Pulling real income and expense transactions from your Firestore database
✅ Filtering by category to exclude transfers and uncategorized items
✅ Combining with recurring bills and planned spending
✅ Calculating day-by-day balance projections
✅ Identifying danger points and shortfalls

Keep your transactions categorized for the most accurate forecasts!
