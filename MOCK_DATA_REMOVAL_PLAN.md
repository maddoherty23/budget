# Mock Data Removal & Firebase Integration Plan

## Completed ✅

1. **mockData.ts** - Removed all mock data arrays
2. **FIREBASE_DATA_MODEL.md** - Created comprehensive data model documentation
3. **Backup created** - Dashboard.tsx.backup

## Components Needing Updates

### 1. Dashboard.tsx
**Current State:** Uses mockAccounts, mockTransactions, monthlyIncome, monthlyExpenses

**Required Changes:**
- Add `useAuth()` hook to get current user
- Query `connectedAccounts` collection for bank accounts
- Query `transactions` collection for current month
- Calculate income/expenses from transactions
- Add loading state while fetching
- Add empty state when no accounts connected

**Empty State Messages:**
- No accounts: "Connect your bank to get started"
- No transactions: "No transactions this month"

---

### 2. Budget.tsx
**Current State:** Uses mockBudgetCategories, monthlyIncome

**Required Changes:**
- Query `budgets` collection
- Query `transactions` to calculate spent amounts
- Add budget creation flow
- Add loading/empty states

**Empty State:** "Create your first budget category"

---

### 3. Transactions.tsx  
**Current State:** Uses mockTransactions, mockAccounts, mockBudgetCategories

**Required Changes:**
- Query `transactions` collection with filters
- Query `connectedAccounts` for account selector
- Query `categories` for categorization
- Add transaction creation (manual)
- Add categorization flow
- Implement search and filters

**Empty State:** "No transactions found"

---

### 4. Reports.tsx
**Current State:** Likely uses mock data for charts

**Required Changes:**
- Query `transactions` with date ranges
- Calculate aggregations
- Generate charts from real data

**Empty State:** "Not enough data for reports"

---

### 5. Categories.tsx
**Current State:** Uses mock categories

**Required Changes:**
- Query `categories` and `customCategories`
- Add category creation
- Add category editing/deletion

**Empty State:** "Create custom categories"

---

### 6. Settings.tsx
**Current State:** May use mock user data

**Required Changes:**
- Use Firebase Auth user data
- Add profile editing
- Add account deletion

---

## Implementation Priority

### Phase 1: Core Functionality (Do First)
1. ✅ Remove mock data from mockData.ts
2. ⬜ Update Connect Bank (already done with Plaid)
3. ⬜ Update Dashboard with real accounts
4. ⬜ Create transaction sync from Plaid
5. ⬜ Update Transactions page

### Phase 2: Budgeting
1. ⬜ Update Budget page
2. ⬜ Update Categories page
3. ⬜ Implement budget calculations

### Phase 3: Advanced
1. ⬜ Update Reports page
2. ⬜ Update Settings page
3. ⬜ Add manual transaction entry

---

## Code Pattern to Follow

### Standard Component Structure with Firebase:

```typescript
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Loader2 } from "lucide-react";

export default function ComponentName() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || authLoading) {
      setIsLoading(false);
      return;
    }

    // Query Firebase
    const q = query(
      collection(db, 'collectionName'),
      where('userId', '==', user.uid)
    );

    // Option 1: One-time fetch
    const fetchData = async () => {
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
      setIsLoading(false);
    };

    // Option 2: Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
      setIsLoading(false);
    });

    fetchData(); // or just use the listener
    return () => unsubscribe(); // cleanup listener
  }, [user, authLoading]);

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="text-center py-12">
        <p>Please log in to continue</p>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <h3>No data found</h3>
        <p>Get started by connecting your bank</p>
      </div>
    );
  }

  // Render with data
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{/* render item */}</div>
      ))}
    </div>
  );
}
```

---

## Testing Strategy

### 1. Test with Plaid Sandbox
- Connect test bank account
- Verify accounts appear in Dashboard
- Check transactions sync

### 2. Test Manual Entry
- Create manual transaction
- Verify it appears in Transactions
- Test categorization

### 3. Test Budgets
- Create budget category
- Add transactions
- Verify spending calculations

### 4. Test Empty States
- New user with no data
- User with accounts but no transactions
- User with transactions but no budgets

---

## Database Queries Needed

### Dashboard
```typescript
// Get connected accounts
collection(db, 'connectedAccounts')
  where('userId', '==', userId)
  where('status', '==', 'active')

// Get current month transactions
collection(db, 'transactions')
  where('userId', '==', userId)
  where('date', '>=', startOfMonth)
  where('date', '<=', endOfMonth)
  where('excluded', '==', false)
```

### Budget Page
```typescript
// Get budgets
collection(db, 'budgets')
  where('userId', '==', userId)
  where('period', '==', 'monthly')
  orderBy('order', 'asc')

// Calculate spent per category
collection(db, 'transactions')
  where('userId', '==', userId)
  where('category', '==', categoryName)
  where('date', '>=', periodStart)
  where('date', '<=', periodEnd)
```

### Transactions Page
```typescript
// Get all transactions with filters
collection(db, 'transactions')
  where('userId', '==', userId)
  where('accountId', '==', accountId) // optional filter
  where('category', '==', category) // optional filter
  where('needsReview', '==', true) // for uncategorized
  orderBy('date', 'desc')
  limit(100)
```

---

## Next Steps

1. Review FIREBASE_DATA_MODEL.md
2. Start with Dashboard.tsx - replace with Firebase queries
3. Test with Plaid sandbox data
4. Move to Transactions.tsx
5. Then Budget.tsx
6. Finally Reports.tsx and others

## Notes

- All queries MUST filter by `userId` for security
- Use real-time listeners (`onSnapshot`) for live updates
- Implement proper loading states
- Add empty states with helpful CTAs
- Handle errors gracefully
- Use transactions for related updates

---

This is a significant refactor that will make the app production-ready with real data!
