# Changelog

All notable changes to Budget Buddy will be documented in this file.

## [Unreleased] - 2024-12-22

### 🎉 Major: Next.js Migration + Complete Firebase Integration

#### Added
- **Next.js Framework Migration**
  - Migrated from Create React App to Next.js 15 with App Router
  - Implemented server-side rendering (SSR) and static generation where appropriate
  - Created Next.js API routes for Plaid integration
  - Set up proper client/server component architecture
  - Added TypeScript support throughout the application

- **Plaid Integration with Firebase Storage**
  - Connected bank accounts automatically save to `connectedAccounts` collection
  - Plaid connection metadata stored in `plaidItems` collection
  - Transactions from Plaid (last 90 days) automatically saved to `transactions` collection
  - Real-time sync of account balances and transaction data

- **Custom Categories System**
  - User-created categories stored in `customCategories` collection
  - Budget amounts per category with real-time updates
  - Category grouping (Bills, Needs, Wants, Savings, Debt)
  - Categories used across Transactions, Budget, and Reports pages

- **Authentication System**
  - Created `useAuth` hook (`src/hooks/useAuth.ts`)
  - Provides user authentication state throughout the app
  - Real-time auth state changes
  - Protected routes via Next.js layouts and middleware
  - Login/signup pages at root level with redirect logic

- **Firestore Security Rules**
  - Added rules for `savingsGoals` collection
  - All collections now have user-scoped access control
  - Security rules deployed to Firebase

#### Changed
- **Transactions Page** (`src/components/pages/Transactions.tsx`)
  - Now loads accounts from `connectedAccounts` collection
  - Transactions loaded from Firestore with real-time updates
  - Category assignment saved to Firestore
  - Removed all `mockAccounts` and `mockTransactions` usage

- **Dashboard Page** (`src/components/pages/Dashboard.tsx`)
  - Loads accounts, transactions in real-time from Firebase
  - Monthly income and expenses calculated from transaction data
  - Uncategorized transaction counts from real data
  - Removed all mock data dependencies

- **Budget Page** (`src/components/pages/Budget.tsx`)
  - Categories loaded from `customCategories` collection
  - Monthly income calculated from income transactions
  - Budget amount changes saved to Firestore
  - Real-time category updates

- **Categories Page** (`src/components/pages/Categories.tsx`)
  - Already using Firebase via `useCustomCategories` hook
  - Removed `mockBudgetCategories` dependency
  - Now uses only system default categories + Firebase custom categories

- **Settings Page** (`src/components/pages/Settings.tsx`)
  - Connected accounts loaded from Firestore
  - Real-time account list updates
  - Removed `mockAccounts` dependency

- **Reports Page** (`src/components/pages/Reports.tsx`)
  - All data (accounts, transactions, categories) loaded from Firebase
  - Report calculations based on real transaction data
  - Drill-down functionality uses live data

- **Plaid Hook** (`src/hooks/usePlaidLink.ts`)
  - Refactored to save data client-side (respects Firestore rules)
  - Saves Plaid items, accounts, and transactions to Firebase
  - Uses `Timestamp.now()` instead of `serverTimestamp()` for client-side writes

- **Plaid API Routes**
  - `create-link-token` route: Removed redirect_uri for sandbox compatibility
  - `exchange-token` route: Returns data to client instead of writing to DB
  - Switched to sandbox environment for testing

#### Fixed
- **Plaid Integration Errors**
  - Fixed 500 errors from production credentials (switched to sandbox)
  - Fixed OAuth redirect URI configuration issues
  - Fixed `serverTimestamp()` issues with client SDK
  - Fixed authentication context in API routes

- **Firebase Configuration**
  - Created `firebase.json` for Firestore rules deployment
  - Fixed timestamp handling (Timestamp.now() vs serverTimestamp())
  - Ensured all writes happen from authenticated client context

#### Removed
- **Mock Data**
  - Removed all mock data from `src/lib/mockData.ts`
  - Kept utility functions (`formatCurrency`, `formatDate`)
  - Removed imports of `mockAccounts`, `mockTransactions`, `mockBudgetCategories`
  - Removed hardcoded `monthlyIncome` and `monthlyExpenses`

#### Technical Details
- **Firebase Collections Structure**
  - `transactions`: userId, accountId, amount, type, category, date, description, etc.
  - `connectedAccounts`: userId, accountId, name, type, balance, institution
  - `plaidItems`: userId, itemId, accessToken, institutionId, institutionName
  - `customCategories`: userId, name, icon, budgeted, spent, group
  - `savingsGoals`: Ready for implementation (rules added)

- **Next.js Architecture**
  - App Router with nested layouts (`src/app/layout.tsx`, `src/app/(authenticated)/layout.tsx`)
  - API routes in `src/app/api/` directory (Plaid endpoints)
  - Client components marked with `'use client'` directive
  - Server components for authentication and layout
  - Environment variables managed via `.env.local`
  - TypeScript throughout with strict type checking

- **Data Flow**
  - Plaid connection → Next.js API routes → Client-side Firebase writes
  - All pages use `onSnapshot` for real-time Firebase updates
  - User-scoped queries with `where('userId', '==', user.uid)`
  - Calculations (income, expenses, budgets) computed from live data

### 🔐 Security
- All Firestore writes now happen from authenticated client context
- Security rules enforce user-scoped data access
- Access tokens stored in Firestore (note: should be encrypted in production)

### 📝 Notes
- **Framework**: Next.js 15 with App Router
- **Runtime**: Node.js (for API routes and build)
- **Development**: Run `npm run dev` to start dev server on http://localhost:3000
- **Build**: Run `npm run build` then `npm start` for production
- **Plaid**: Configured for sandbox environment (use test credentials: `user_good` / `pass_good`)
- **Firebase**: Client SDK used throughout, admin SDK available for API routes if needed
- Ready to switch to Plaid production when account is approved

---

## Previous Versions
No previous changelog entries available.
