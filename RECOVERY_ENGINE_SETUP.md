# AI Money Recovery Engine - Setup Guide

## Overview
This document provides setup instructions for the AI Money Recovery Engine feature, including Firebase configuration, security rules, and deployment steps.

## Features Implemented
- ✅ Deterministic rules-based detection engine
- ✅ 5 detection types: subscriptions, duplicates, price creep, fee leaks, refunds
- ✅ Recovery score calculation and ranking
- ✅ User-scoped insights with status management
- ✅ Demo data seeding for testing
- ✅ Projected impact visualization
- ✅ Recovery destination selection (preview only)
- ✅ Real-time Firestore syncing

## Firebase Configuration

### Required Environment Variables
No additional environment variables needed beyond existing Firebase config in `src/lib/firebase/config.ts`.

### Firestore Security Rules

The rules have been added to your `firestore.rules` file. The following section was inserted before the catch-all deny rule:

```javascript
// Recovery Insights collection - user-scoped access
match /recovery_insights/{insightId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && hasValidUserId();
  allow update: if isAuthenticated() && resource.data.userId == request.auth.uid && hasValidUserId();
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}
```

These rules:
- Use your existing `isAuthenticated()` and `hasValidUserId()` helper functions
- Ensure users can only read/write their own insights
- Follow the same security pattern as other collections in your app

### Firestore Indexes

Create the following composite index for efficient queries:

**Collection**: `recovery_insights`
**Fields indexed**:
- `userId` (Ascending)
- `recoveryScore` (Descending)

**To create this index:**
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Collection ID: `recovery_insights`
4. Add fields:
   - Field path: `userId`, Order: Ascending
   - Field path: `recoveryScore`, Order: Descending
5. Query scope: Collection
6. Click "Create Index"

Alternatively, run a query in your app and Firebase will prompt you to create the index automatically.

## Deployment Steps

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Build and Deploy Application
```bash
npm run build
npm start
```

## Testing the Feature

### Using Real Data
1. Navigate to `/recovery` page
2. Ensure you have at least 30 transactions in the last 12 months
3. Click "Scan my transactions"
4. Review detected insights in the Recovery Stack

### Using Demo Data
1. Navigate to `/recovery` page
2. If you have fewer than 30 transactions, click "Load sample data"
3. Wait for confirmation toast
4. Click "Scan my transactions"
5. Review the 6-8 insights that should be detected

**Expected demo insights:**
- 4 subscription services (Netflix, Spotify, iCloud, Hulu)
- 1 duplicate streaming service (Hulu vs Netflix)
- 1 price creep (Planet Fitness gym)
- 1 fee leak (various banking fees)
- 1 refund/credit entry

## Data Model

### RecoveryInsight Document
```typescript
{
  id: string;                     // Auto-generated
  userId: string;                 // Auth user ID
  type: "subscription" | "duplicate" | "price_creep" | "fee_leak" | "refund_credit";
  title: string;                  // Display title
  summary: string;                // Brief description
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  confidence: number;             // 0-1 range
  effort: number;                 // 1-3 scale
  safetyImpact: number;           // 0-1 range
  recoveryScore: number;          // Calculated ranking score
  evidence: Array<{
    transactionId: string;
    date: Date;
    merchant: string;
    amount: number;
    note?: string;
  }>;
  status: "active" | "done" | "snoozed" | "dismissed";
  snoozedUntil?: Timestamp;       // Optional snooze date
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Recovery Engine Logic

### Detection Rules

**1. Recurring Subscriptions**
- Merchant appears 2+ times
- Cadence: 25-35 days (monthly), 6-9 days (weekly), or 350-380 days (annual)
- Amount variance ≤ 15%
- Confidence: 0.8 (if 3+ occurrences) or 0.6 (if 2 occurrences)

**2. Duplicate Services**
- 2+ recurring subscriptions in same category
- Categories inferred from merchant keywords
- Confidence: 0.65

**3. Price Creep**
- Recurring service with 5+ transactions
- Recent 2 charges average > 15% higher than previous 3-charge baseline
- Confidence: 0.7

**4. Fee Leaks**
- Transactions containing keywords: overdraft, late fee, ATM fee, interest charge, NSF, etc.
- Calculated as 90-day average
- Confidence: 0.9

**5. Refunds/Credits**
- Income transactions > $20
- Confidence: 0.6

### Recovery Score Formula
```
RecoveryScore = estimatedAnnualSavings × confidence × ((4 - effort) / 3) × safetyImpact
```

Insights are ranked by recovery score in descending order.

## User Actions

### Mark as Done
- Updates status to "done"
- Removes from active Recovery Stack
- Insight remains in database for history

### Snooze
- Updates status to "snoozed"
- Sets `snoozedUntil` timestamp (7 or 30 days)
- Temporarily hidden from Recovery Stack
- Can be automatically re-activated after snooze period (future enhancement)

### Dismiss (Not Relevant)
- Updates status to "dismissed"
- Permanently removed from Recovery Stack
- User will not see this insight again

## Future Enhancements

### Short-term
- [ ] Re-scan button with cooldown (e.g., once per week)
- [ ] Export insights as PDF report
- [ ] Email digest of top opportunities
- [ ] Integration with actual bank account switching tools

### Medium-term
- [ ] LLM-powered personalized explanations
- [ ] Negotiation script templates (e.g., "Here's how to call your gym")
- [ ] Automatic snooze expiration handling
- [ ] Historical tracking of recovered money

### Long-term
- [ ] Direct integration with service cancellation APIs
- [ ] Price monitoring for detected subscriptions
- [ ] Recommendations for alternative cheaper services
- [ ] Connection to actual goal/buffer accounts for money movement

## Troubleshooting

### Scan returns 0 insights
- Verify transaction data exists (check `/transactions` page)
- Ensure transactions span at least 60 days
- Check console for errors during scan

### Insights not appearing in real-time
- Verify Firestore rules are deployed correctly
- Check browser console for permission errors
- Ensure user is authenticated

### "Load sample data" button not working
- Check Firebase write permissions
- Verify `createTransaction` function works correctly
- Review console logs for errors

## Support
For issues or questions, refer to the main WARP.md documentation or contact the development team.
