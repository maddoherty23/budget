# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Budget Buddy is a personal finance application built with Next.js 16 (App Router), Firebase (Authentication + Firestore), Plaid (bank integration), and shadcn/ui components. It enables users to connect bank accounts, track transactions, manage budgets, and view financial reports.

## Development Commands

### Running the App
```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run ESLint
```

### Firebase
```bash
# Deploy Firestore rules (requires Firebase CLI)
firebase deploy --only firestore:rules
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (React 19)
- **Language**: TypeScript (strict mode enabled)
- **Backend**: Firebase (Auth + Firestore), Plaid API
- **UI**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **State Management**: React Context (Auth), TanStack Query
- **Forms**: react-hook-form with Zod validation
- **Charts**: Recharts

### Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (Next.js Route Handlers)
│   │   └── plaid/        # Plaid integration endpoints
│   ├── (pages)/          # Page routes (login, dashboard, etc.)
│   └── layout.tsx        # Root layout with providers
├── components/
│   ├── pages/            # Page-level components (actual UI logic)
│   ├── layout/           # Layout components (AppLayout, etc.)
│   ├── transactions/     # Transaction-specific components
│   ├── ui/              # shadcn/ui components (from CLI)
│   └── Providers.tsx    # App-wide providers wrapper
├── lib/
│   ├── firebase/        # Firebase setup and utilities
│   │   ├── config.ts   # Firebase initialization
│   │   ├── auth.ts     # Authentication functions
│   │   ├── firestore.ts # Firestore CRUD helpers
│   │   ├── AuthContext.tsx # Auth context provider
│   │   └── index.ts    # Public API exports
│   ├── plaid/          # Plaid configuration
│   └── utils.ts        # Shared utilities (cn, formatters)
├── hooks/              # Custom React hooks
└── integrations/       # Third-party integrations (Supabase legacy)
```

### Page-Component Architecture

**Critical Pattern**: This project follows a **component-based architecture** where:
- **Pages** (`src/app/**/page.tsx`) are minimal shells that only import and render components
- **Components** (`src/components/pages/*.tsx`) contain all UI logic, state, and functionality
- Example: `src/app/dashboard/page.tsx` imports `Dashboard` from `src/components/pages/DashboardNew.tsx`

This separation ensures:
- Better code organization and reusability
- Easier testing of UI logic
- Clear separation between routing and business logic

### Firebase Integration

**Authentication Flow**:
- Firebase Auth handles sign up, login, password reset, email verification
- `AuthContext` provides global auth state via `useAuth()` hook
- All authenticated users get a Firestore document in the `users` collection
- User data is automatically scoped by `userId` in all Firestore operations

**Firestore Architecture**:
- **User-scoped security**: All documents include a `userId` field
- **Security rules**: Enforced at database level (see `firestore.rules`)
- **Helper functions**: Generic CRUD operations in `src/lib/firebase/firestore.ts` automatically:
  - Add `userId` to all documents
  - Add `createdAt` and `updatedAt` timestamps
  - Verify ownership before reads/updates/deletes
  - Use Firebase web SDK (not Admin SDK)

**Key Collections**:
- `users` - User profiles
- `connectedAccounts` - Plaid-connected bank accounts
- `plaidItems` - Plaid Item metadata (institution connections)
- `transactions` - Financial transactions (manual + Plaid-synced)
- `budgets` - Budget allocations by category
- `categories` - Expense/income categories
- `savingsGoals` - Savings targets

See `FIREBASE_DATA_MODEL.md` for complete schema and relationships.

### Plaid Integration

**Setup**:
- Environment variables required: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`
- Supports `sandbox`, `development`, and `production` environments
- Copy `.env.local.example` to `.env.local` and add credentials

**Flow**:
1. Frontend calls `/api/plaid/create-link-token` with `userId`
2. User completes Plaid Link flow (bank authentication)
3. Frontend receives `publicToken` from Plaid
4. Frontend calls `/api/plaid/exchange-token` with `publicToken`
5. Backend exchanges for `accessToken` and fetches accounts/transactions
6. Frontend stores data in Firestore (accounts → `connectedAccounts`, transactions → `transactions`)

**API Routes**:
- `POST /api/plaid/create-link-token` - Initialize Plaid Link
- `POST /api/plaid/exchange-token` - Exchange token and fetch data
- `POST /api/plaid/sync-transactions` - Sync new transactions (incremental)

See `PLAID_SETUP.md` for detailed integration guide.

### State Management Patterns

**Auth State**:
- Global: `AuthContext` + `useAuth()` hook
- Persisted via Firebase Auth session

**Data Fetching**:
- Real-time: Firestore `onSnapshot` listeners for live updates
- Example: Dashboard component subscribes to `connectedAccounts` and `transactions`
- Components clean up listeners in `useEffect` return functions

**Form State**:
- Managed by `react-hook-form`
- Validation via `zod` schemas
- Use `@hookform/resolvers` for integration

### UI Component System

**shadcn/ui**:
- Components in `src/components/ui/`
- Customizable via Tailwind CSS (see `tailwind.config.js`)
- Add new components: `npx shadcn@latest add <component-name>`

**Styling**:
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Custom utility: `cn()` from `lib/utils.ts` for conditional classes
- Design tokens: Colors, spacing defined in `app/globals.css`

**Animations**:
- Framer Motion for complex animations
- `tailwindcss-animate` for utility-based animations

## Development Patterns

### Writing Firestore Operations

Always use the centralized helper functions from `src/lib/firebase/firestore.ts`:

```typescript
import { createTransaction, getTransactions, updateTransaction } from '@/lib/firebase';

// Create - userId added automatically
await createTransaction({
  amount: -50.00,
  type: 'expense',
  category: 'Groceries',
  description: 'Whole Foods',
  date: Timestamp.now(),
});

// Read - filtered by userId automatically
const transactions = await getTransactions([
  where('date', '>=', startDate),
  orderBy('date', 'desc'),
  limit(50)
]);

// Update - ownership verified automatically
await updateTransaction(id, { category: 'Dining' });
```

**Never** directly use `addDoc` or `setDoc` without including `userId` and timestamps.

### API Routes (Next.js Route Handlers)

API routes are in `src/app/api/` and use Next.js 13+ Route Handlers:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ... logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Message' }, { status: 500 });
  }
}
```

### Path Aliases

Use `@/*` imports for cleaner paths:
```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
```

### Type Safety

- Enable strict TypeScript checking
- Define interfaces for Firestore documents (see `lib/firebase/firestore.ts`)
- Use Zod schemas for API validation and form validation

## Security Considerations

### Firestore Rules
- All collections require authentication: `request.auth != null`
- User can only access documents where `resource.data.userId == request.auth.uid`
- Enforced at database level (see `firestore.rules`)

### Plaid Access Tokens
- ⚠️ **WARNING**: Access tokens are currently stored in plain text in Firestore
- **Before production**: Implement encryption or move to Firebase Functions/Cloud Secret Manager
- Never expose tokens to client logs or error messages

### Environment Variables
- **Never commit** `.env.local` to version control
- Use `.env.local.example` as template
- Prefix client-side vars with `NEXT_PUBLIC_`

## Testing

**Plaid Sandbox Credentials**:
- Username: `user_good`
- Password: `pass_good`
- Use for testing bank connections locally

**Firebase Emulators** (optional):
- Uncomment emulator connection code in `lib/firebase/config.ts`
- Run: `firebase emulators:start`

## Common Tasks

### Adding a New Firestore Collection

1. Define TypeScript interface in `lib/firebase/firestore.ts`
2. Create helper functions using generic CRUD operations
3. Export from `lib/firebase/index.ts`
4. Add security rules to `firestore.rules`
5. Deploy rules: `firebase deploy --only firestore:rules`

### Adding a New Page

1. Create route: `src/app/[route-name]/page.tsx`
2. Create component: `src/components/pages/[PageName].tsx`
3. Import component in page file
4. Use `AppLayout` wrapper for authenticated pages

### Adding UI Components

```bash
npx shadcn@latest add [component-name]
```

Components are added to `src/components/ui/` and can be customized.

## Documentation

- `FIREBASE_DATA_MODEL.md` - Complete Firestore schema
- `PLAID_SETUP.md` - Plaid integration guide
- `PLAID_QUICKSTART.md` - Quick start for Plaid
- `CHANGELOG.md` - Project changes log
- `NEXTJS_MIGRATION_CHANGELOG.md` - Migration history

## Notes

- Firebase config is currently hardcoded in `lib/firebase/config.ts` (for testing)
- The app uses Next.js App Router (not Pages Router)
- All pages are client components due to Firebase Auth/Firestore listeners
- The project was migrated from a Create React App to Next.js
