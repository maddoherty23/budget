# Bank Account & Transaction Management Implementation

This document summarizes the implementation of features to manage bank accounts and transactions in Budget Buddy.

## What Was Implemented

### 1. Connected Account Management Functions
**File**: `src/lib/firebase/firestore.ts`

Added the following functions to manage connected bank accounts:

- `createConnectedAccount()` - Create a new connected account
- `getConnectedAccount(id)` - Get a specific account by ID
- `getConnectedAccounts(constraints)` - Get all accounts with optional filters
- `updateConnectedAccount(id, data)` - Update account details (including balances)
- `deleteConnectedAccount(id)` - Delete a connected account

**TypeScript Interface**:
```typescript
interface ConnectedAccount {
  id?: string;
  userId: string;
  itemId: string;
  accountId: string;
  name: string;
  officialName: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  balanceCurrent: number | null;
  balanceAvailable: number | null;
  balanceLimit: number | null;
  isoCurrencyCode: string;
  institutionName: string;
  status: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

All functions are exported from `src/lib/firebase/index.ts` for easy import.

### 2. Manage Accounts Page
**Component**: `src/components/pages/ManageAccounts.tsx`
**Route**: `src/app/manage-accounts/page.tsx`

A full-featured page to manage connected bank accounts with:

**Features**:
- ✅ Real-time display of all connected accounts
- ✅ View current and available balances
- ✅ Update account balances manually
- ✅ Delete bank accounts
- ✅ Visual indicators for account types (checking, savings, credit card)
- ✅ Account status display (active, inactive, error)
- ✅ Institution name and account mask display

**UI Components**:
- Card-based layout for each account
- Dropdown menu for actions (Update Balance, Delete)
- Dialog for editing balances with currency input
- Confirmation dialog for deletions
- Empty state with link to connect bank accounts

**Access**: Navigate to `/manage-accounts` to use this page.

### 3. useConnectedAccounts Hook
**File**: `src/hooks/useConnectedAccounts.ts`

A custom React hook for fetching and managing connected accounts:

**Returns**:
```typescript
{
  accounts: ConnectedAccount[];       // Array of accounts
  isLoading: boolean;                 // Loading state
  error: Error | null;                // Error state
  totalBalance: number;               // Sum of all balances
  totalAvailable: number;             // Sum of available balances
  accountCount: number;               // Number of accounts
}
```

**Features**:
- Real-time updates via Firestore listeners
- Automatic balance calculations
- Error handling
- User scoping (only shows current user's accounts)

**Usage Example**:
```typescript
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";

function MyComponent() {
  const { accounts, totalBalance, isLoading } = useConnectedAccounts();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Total Balance: ${totalBalance}</p>
      {accounts.map(account => (
        <div key={account.id}>{account.name}</div>
      ))}
    </div>
  );
}
```

### 4. Transaction Delete Functionality
**Component**: `src/components/transactions/TransactionActions.tsx`

A reusable component for transaction actions with delete capability:

**Features**:
- ✅ Dropdown menu with delete option
- ✅ Confirmation dialog before deletion
- ✅ Loading state during deletion
- ✅ Success/error toast notifications
- ✅ Uses the `deleteTransaction()` function from Firebase

**Props**:
```typescript
{
  transactionId: string;
  transactionMonth: string;          // Required for hierarchical path
  transactionDescription: string;     // For confirmation message
}
```

**Usage Example**:
```typescript
import { TransactionActions } from "@/components/transactions/TransactionActions";

<TransactionActions
  transactionId={transaction.id}
  transactionMonth={transaction.month}
  transactionDescription={transaction.description}
/>
```

## How to Use

### Managing Bank Accounts

1. **View Accounts**: Navigate to `/manage-accounts`
2. **Update Balance**: 
   - Click the menu icon (⋮) on any account
   - Select "Update Balance"
   - Enter new current and available balances
   - Click "Save Changes"
3. **Delete Account**:
   - Click the menu icon (⋮) on any account
   - Select "Delete Account"
   - Confirm the deletion

### Fetching Bank Balances Programmatically

Use the `useConnectedAccounts` hook in any component:

```typescript
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";

function Dashboard() {
  const { accounts, totalBalance, isLoading } = useConnectedAccounts();
  
  return (
    <div>
      <h2>Total Balance: ${totalBalance.toFixed(2)}</h2>
      <ul>
        {accounts.map(account => (
          <li key={account.id}>
            {account.name}: ${account.balanceCurrent}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Or use the functions directly:

```typescript
import { getConnectedAccounts, where } from "@/lib/firebase";

// Get all active accounts
const activeAccounts = await getConnectedAccounts([
  where("status", "==", "active")
]);

// Get a specific account
const account = await getConnectedAccount(accountId);

// Update balance
await updateConnectedAccount(accountId, {
  balanceCurrent: 1500.00,
  balanceAvailable: 1450.00
});
```

### Deleting Transactions

Add the `TransactionActions` component to any transaction display:

```typescript
import { TransactionActions } from "@/components/transactions/TransactionActions";

function TransactionRow({ transaction }) {
  return (
    <div className="flex items-center justify-between">
      <div>{transaction.description}</div>
      <div>{transaction.amount}</div>
      <TransactionActions
        transactionId={transaction.id}
        transactionMonth={getMonthString(transaction.date)}
        transactionDescription={transaction.description}
      />
    </div>
  );
}
```

**Note**: The `transactionMonth` parameter is required because transactions are stored in a hierarchical structure: `transactions/{userId}/{month}/{transactionId}`.

## Data Structure

### Firestore Paths

**Connected Accounts**:
```
connectedAccounts/{accountId}
```

**Transactions** (hierarchical):
```
transactions/{userId}/{month}/{transactionId}
```

Example month format: `2025-12` (YYYY-MM)

### Security

All operations automatically:
- Verify user authentication
- Scope data to the current user
- Enforce ownership checks
- Add timestamps (createdAt, updatedAt)

Firestore security rules ensure users can only access their own data.

## Integration with Existing Code

The implementation follows the project's existing patterns:

1. **Firebase Functions**: Uses the centralized helper functions in `src/lib/firebase/firestore.ts`
2. **Component Architecture**: Page components are in `src/components/pages/`, route pages import and wrap them with `AppLayout`
3. **Styling**: Uses existing shadcn/ui components and Tailwind CSS
4. **State Management**: Uses React hooks and Firestore real-time listeners
5. **Error Handling**: Uses toast notifications (sonner) for user feedback

## Future Enhancements

Potential improvements for the future:

1. **Bulk Operations**: Select and delete multiple transactions at once
2. **Transaction Sync**: Refresh balances from Plaid automatically
3. **Account History**: Track balance changes over time
4. **Export**: Export account or transaction data to CSV
5. **Filters**: Advanced filtering for accounts by status, type, institution
6. **Transaction Edit**: Edit transaction details (amount, description, date)
7. **Reconciliation**: Match transactions with bank statements

## Files Changed/Added

### Added Files:
- `src/components/pages/ManageAccounts.tsx` - Account management UI
- `src/components/transactions/TransactionActions.tsx` - Delete functionality
- `src/app/manage-accounts/page.tsx` - Route for manage accounts
- `src/hooks/useConnectedAccounts.ts` - Hook for fetching accounts
- `ACCOUNT_TRANSACTION_MANAGEMENT.md` - This documentation

### Modified Files:
- `src/lib/firebase/firestore.ts` - Added ConnectedAccount interface and CRUD functions
- `src/lib/firebase/index.ts` - Exported new functions and types

## Navigation

Add a link to the manage accounts page in your navigation/sidebar:

```tsx
<a href="/manage-accounts">Manage Accounts</a>
```

Or use Next.js Link:

```tsx
import Link from "next/link";

<Link href="/manage-accounts">Manage Accounts</Link>
```
