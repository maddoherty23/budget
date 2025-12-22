# Budget Buddy - Firebase Data Model

## Overview
This document defines the complete data structure for Budget Buddy using Cloud Firestore. All data is user-scoped for security and privacy.

---

## Collections

### 1. users
Stores user profile and metadata.

**Collection:** `users`  
**Document ID:** Firebase Auth UID

```typescript
{
  uid: string;                    // Firebase Auth user ID
  email: string;                  // User's email address
  displayName: string | null;     // User's display name
  photoURL: string | null;        // Profile photo URL
  emailVerified: boolean;         // Email verification status
  createdAt: Timestamp;           // Account creation time
  updatedAt: Timestamp;           // Last profile update
  lastLoginAt: Timestamp;         // Last login timestamp
  
  // Optional preferences
  currency?: string;              // "USD", "CAD" (default: "USD")
  timezone?: string;              // User's timezone
  fiscalYearStart?: number;       // Month fiscal year starts (1-12)
}
```

**Security Rules:**
```javascript
allow read, write: if request.auth.uid == resource.data.userId;
```

---

### 2. connectedAccounts
Bank accounts connected via Plaid.

**Collection:** `connectedAccounts`  
**Document ID:** Plaid account ID

```typescript
{
  // Ownership
  userId: string;                 // Firebase Auth UID
  itemId: string;                 // References plaidItems collection
  
  // Account details
  accountId: string;              // Plaid account ID (unique)
  name: string;                   // "Plaid Checking"
  officialName: string;           // "Plaid Gold Standard 0% Interest Checking"
  type: string;                   // "depository", "credit", "loan", "investment"
  subtype: string;                // "checking", "savings", "credit card", "money market"
  mask: string | null;            // Last 4 digits "0000"
  
  // Balances
  balanceCurrent: number | null;  // Current balance
  balanceAvailable: number | null; // Available balance
  balanceLimit: number | null;    // Credit limit (credit accounts)
  isoCurrencyCode: string;        // "USD", "CAD"
  
  // Metadata
  institutionName: string;        // "Chase", "Bank of America"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Status
  status: string;                 // "active", "inactive", "error"
}
```

**Indexes:**
- `userId` (ascending)
- `itemId` (ascending)
- Composite: `userId` + `status`

---

### 3. plaidItems
Connected bank institutions (Plaid Items).

**Collection:** `plaidItems`  
**Document ID:** Plaid item ID

```typescript
{
  // Ownership
  userId: string;                 // Firebase Auth UID
  
  // Plaid details
  itemId: string;                 // Plaid item ID (unique)
  accessToken: string;            // ⚠️ ENCRYPT IN PRODUCTION!
  institutionId: string | null;   // Plaid institution ID
  institutionName: string;        // "Chase", "Bank of America"
  
  // Status
  status: string;                 // "active", "error", "needs_update"
  error: object | null;           // Error details if status is "error"
  
  // Sync tracking
  createdAt: Timestamp;
  lastSyncedAt: Timestamp;
  transactionsCursor: string | null; // For incremental sync
}
```

**Security Notes:**
- ⚠️ Access tokens MUST be encrypted before production
- Consider using Firebase Functions to store/retrieve tokens

**Indexes:**
- `userId` (ascending)
- Composite: `userId` + `status`

---

### 4. transactions
Financial transactions (manual and from Plaid).

**Collection:** `transactions`  
**Document ID:** Auto-generated or Plaid transaction ID

```typescript
{
  // Ownership
  userId: string;                 // Firebase Auth UID
  
  // Source
  source: string;                 // "plaid", "manual"
  accountId: string | null;       // References connectedAccounts (if from Plaid)
  plaidTransactionId: string | null; // Plaid transaction ID (if from Plaid)
  
  // Transaction details
  date: Timestamp;                // Transaction date
  authorizedDate: Timestamp | null; // When authorized (Plaid)
  description: string;            // "Starbucks", "Paycheck"
  merchantName: string | null;    // Clean merchant name (Plaid)
  amount: number;                 // Positive for income, negative for expense
  type: string;                   // "income", "expense"
  
  // Categorization
  category: string | null;        // "Groceries", "Rent", "Salary"
  categoryId: string | null;      // References categories collection
  plaidCategory: string[] | null; // Original Plaid categories
  
  // Status
  status: string;                 // "pending", "posted"
  excluded: boolean;              // If true, exclude from budget (transfers)
  needsReview: boolean;           // Flagged for user review
  
  // Metadata
  isoCurrencyCode: string;        // "USD", "CAD"
  location: object | null;        // Location data from Plaid
  paymentChannel: string | null;  // "online", "in store", etc.
  
  // Notes
  notes: string | null;           // User notes
  tags: string[];                 // User tags
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `userId` (ascending)
- `date` (descending)
- Composite: `userId` + `date` (descending)
- Composite: `userId` + `category`
- Composite: `userId` + `needsReview`
- Composite: `userId` + `excluded`

**Best Practices:**
- Use negative amounts for expenses, positive for income
- Set `excluded: true` for transfers between own accounts
- Set `needsReview: true` for uncategorized or unusual transactions

---

### 5. budgets
Monthly budget allocations by category.

**Collection:** `budgets`  
**Document ID:** Auto-generated

```typescript
{
  // Ownership
  userId: string;                 // Firebase Auth UID
  
  // Budget details
  name: string;                   // "Groceries", "Rent"
  categoryId: string | null;      // References categories collection
  icon: string;                   // Emoji "🛒", "🏠"
  
  // Amounts
  budgeted: number;               // Monthly budget amount
  spent: number;                  // Amount spent this period
  
  // Period
  period: string;                 // "monthly", "weekly", "yearly"
  startDate: Timestamp;           // Period start
  endDate: Timestamp;             // Period end
  
  // Grouping
  group: string;                  // "bills", "needs", "wants", "savings", "debt"
  
  // Rollover
  rollover: boolean;              // If true, unspent carries over
  rolloverAmount: number;         // Amount carried from previous period
  
  // Metadata
  color: string | null;           // Hex color for visualization
  order: number;                  // Display order (for sorting)
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `userId` (ascending)
- Composite: `userId` + `group`
- Composite: `userId` + `period`
- Composite: `userId` + `order`

**Calculated Fields:**
- `remaining = budgeted - spent`
- `percentUsed = (spent / budgeted) * 100`

---

### 6. categories
Spending categories (custom and default).

**Collection:** `categories`  
**Document ID:** Auto-generated

```typescript
{
  // Ownership
  userId: string;                 // Firebase Auth UID (or "system" for defaults)
  
  // Category details
  name: string;                   // "Groceries", "Dining Out"
  icon: string;                   // Emoji "🛒", "🍔"
  color: string | null;           // Hex color
  
  // Type
  type: string;                   // "income", "expense"
  group: string | null;           // "bills", "needs", "wants", "savings", "debt"
  
  // System vs Custom
  isDefault: boolean;             // True for system categories
  isActive: boolean;              // False if user deleted (soft delete)
  
  // Keywords for auto-categorization
  keywords: string[];             // ["grocery", "supermarket", "whole foods"]
  
  // Metadata
  order: number;                  // Display order
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `userId` (ascending)
- Composite: `userId` + `type`
- Composite: `userId` + `isActive`

**Default Categories:**
System categories with `userId: "system"` that all users can reference.

---

### 7. customCategories
User-specific custom category data.

**Collection:** `customCategories`  
**Document ID:** Auto-generated

```typescript
{
  userId: string;
  name: string;
  icon: string;
  type: string;
  group: string;
  keywords: string[];
  createdAt: Timestamp;
}
```

---

### 8. deletedCategories
Archive of deleted categories (for recovery).

**Collection:** `deletedCategories`  
**Document ID:** Original category ID

```typescript
{
  userId: string;
  originalData: object;           // Full category data
  deletedAt: Timestamp;
  deletedReason: string | null;
}
```

---

### 9. savingsGoals
Savings targets and progress.

**Collection:** `savingsGoals`  
**Document ID:** Auto-generated

```typescript
{
  // Ownership
  userId: string;
  
  // Goal details
  name: string;                   // "Emergency Fund", "Vacation"
  icon: string;                   // Emoji "🛡️", "✈️"
  description: string | null;
  
  // Amounts
  target: number;                 // Goal amount
  saved: number;                  // Current saved amount
  
  // Timeline
  targetDate: Timestamp | null;   // Optional deadline
  startDate: Timestamp;
  
  // Contribution
  monthlyContribution: number | null; // Auto-save amount
  linkedBudgetId: string | null;  // Link to budget category
  
  // Status
  status: string;                 // "active", "completed", "paused"
  
  // Metadata
  color: string | null;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}
```

**Indexes:**
- `userId` (ascending)
- Composite: `userId` + `status`

---

### 10. recurringTransactions
Templates for recurring expenses/income.

**Collection:** `recurringTransactions`  
**Document ID:** Auto-generated

```typescript
{
  // Ownership
  userId: string;
  
  // Template details
  name: string;                   // "Netflix Subscription"
  description: string;
  amount: number;
  type: string;                   // "income", "expense"
  
  // Categorization
  category: string;
  categoryId: string | null;
  
  // Recurrence
  frequency: string;              // "daily", "weekly", "monthly", "yearly"
  interval: number;               // Every X frequency (e.g., every 2 weeks)
  startDate: Timestamp;
  endDate: Timestamp | null;      // Optional end date
  nextDueDate: Timestamp;         // Next expected transaction
  
  // Reminders
  reminderEnabled: boolean;
  reminderDaysBefore: number;     // Days before to remind
  
  // Status
  isActive: boolean;
  lastCreatedAt: Timestamp | null; // Last auto-created transaction
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
- `userId` (ascending)
- Composite: `userId` + `isActive`
- Composite: `userId` + `nextDueDate`

---

### 11. reports
Saved financial reports and insights.

**Collection:** `reports`  
**Document ID:** Auto-generated

```typescript
{
  userId: string;
  type: string;                   // "spending", "income", "net-worth", "category"
  name: string;
  dateRange: {
    start: Timestamp;
    end: Timestamp;
  };
  data: object;                   // Report-specific data
  generatedAt: Timestamp;
  expiresAt: Timestamp | null;    // Optional expiration for cache
}
```

---

## Data Relationships

```
users (1)
  ├── connectedAccounts (many)
  ├── plaidItems (many)
  ├── transactions (many)
  ├── budgets (many)
  ├── categories (many)
  ├── savingsGoals (many)
  └── recurringTransactions (many)

plaidItems (1)
  └── connectedAccounts (many)

connectedAccounts (1)
  └── transactions (many)

categories (1)
  ├── budgets (many)
  └── transactions (many)

budgets (1)
  └── transactions (many) [via category]
```

---

## Query Patterns

### Get User's Connected Accounts
```typescript
const accountsQuery = query(
  collection(db, 'connectedAccounts'),
  where('userId', '==', userId),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc')
);
```

### Get Transactions for Current Month
```typescript
const startOfMonth = new Date(year, month, 1);
const endOfMonth = new Date(year, month + 1, 0);

const transactionsQuery = query(
  collection(db, 'transactions'),
  where('userId', '==', userId),
  where('date', '>=', Timestamp.fromDate(startOfMonth)),
  where('date', '<=', Timestamp.fromDate(endOfMonth)),
  where('excluded', '==', false),
  orderBy('date', 'desc')
);
```

### Get Budget Categories with Spending
```typescript
const budgetsQuery = query(
  collection(db, 'budgets'),
  where('userId', '==', userId),
  where('period', '==', 'monthly'),
  orderBy('order', 'asc')
);
```

### Get Uncategorized Transactions
```typescript
const uncategorizedQuery = query(
  collection(db, 'transactions'),
  where('userId', '==', userId),
  where('needsReview', '==', true),
  orderBy('date', 'desc'),
  limit(50)
);
```

---

## Best Practices

### 1. Data Consistency
- Always set `userId` on all documents
- Use server timestamps for `createdAt` and `updatedAt`
- Validate data before writes
- Use transactions for related updates

### 2. Security
- Never expose access tokens to client
- Use Firestore Security Rules to enforce userId checks
- Encrypt sensitive data (access tokens, account numbers)
- Implement rate limiting on writes

### 3. Performance
- Create compound indexes for common queries
- Use pagination for large result sets (limit + startAfter)
- Cache frequently accessed data client-side
- Denormalize data when needed (e.g., store category name with transaction)

### 4. Data Integrity
- Soft delete instead of hard delete (set `isActive: false`)
- Keep audit trail in separate collection
- Validate amounts (negative for expenses, positive for income)
- Handle currency conversions consistently

### 5. Sync Strategy
- Use Plaid webhooks for real-time updates
- Implement incremental sync with cursors
- Handle duplicate transactions (check plaidTransactionId)
- Update balances when transactions change

### 6. Calculations
- **Always recalculate on read** (don't trust stored `spent` amounts)
- Cache calculations with expiration
- Use Cloud Functions for complex aggregations
- Store calculations in `reports` collection for historical data

---

## Firestore Security Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Connected accounts
    match /connectedAccounts/{accountId} {
      allow read, write: if isOwner(resource.data.userId);
    }
    
    // Plaid items (protect access tokens!)
    match /plaidItems/{itemId} {
      allow read: if isOwner(resource.data.userId);
      allow write: if false; // Only backend should write
    }
    
    // Transactions
    match /transactions/{transactionId} {
      allow read, write: if isOwner(resource.data.userId);
    }
    
    // Budgets
    match /budgets/{budgetId} {
      allow read, write: if isOwner(resource.data.userId);
    }
    
    // Categories
    match /categories/{categoryId} {
      allow read: if isOwner(resource.data.userId) || resource.data.userId == "system";
      allow write: if isOwner(resource.data.userId);
    }
    
    // Savings goals
    match /savingsGoals/{goalId} {
      allow read, write: if isOwner(resource.data.userId);
    }
    
    // Recurring transactions
    match /recurringTransactions/{recurringId} {
      allow read, write: if isOwner(resource.data.userId);
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Core Features
1. ✅ User authentication
2. ✅ Connected accounts (Plaid)
3. ⬜ Transactions (manual + Plaid)
4. ⬜ Basic categories

### Phase 2: Budgeting
1. ⬜ Budget categories
2. ⬜ Monthly budgets
3. ⬜ Budget vs actual tracking

### Phase 3: Advanced Features
1. ⬜ Savings goals
2. ⬜ Recurring transactions
3. ⬜ Reports and insights
4. ⬜ Export functionality

---

## Example Data Flow

### 1. Connect Bank Account
```
User clicks "Connect Bank"
  → Plaid Link opens
  → User authenticates
  → Public token received
  → Backend exchanges token
  → Store in plaidItems (itemId, accessToken)
  → Fetch accounts
  → Store in connectedAccounts
  → Fetch initial transactions
  → Store in transactions
```

### 2. Categorize Transaction
```
User selects transaction
  → Opens category picker
  → User selects category
  → Update transaction.categoryId
  → Set transaction.needsReview = false
  → Recalculate budget.spent
  → Update budget document
```

### 3. Create Budget
```
User creates new budget
  → Select category
  → Set amount
  → Set period
  → Create budget document
  → Listen for transactions in that category
  → Auto-update spent amount
```

---

This data model provides a solid foundation for a production-ready budgeting app with proper security, scalability, and maintainability.
