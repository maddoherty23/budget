# Plaid Integration Setup Guide

This guide will help you set up Plaid for bank account connections in Budget Buddy.

## What is Plaid?

Plaid is a service that allows applications to securely connect to users' bank accounts. It provides:
- Secure bank authentication
- Read-only access to account data
- Automatic transaction syncing
- Support for 12,000+ financial institutions

## Prerequisites

1. A Plaid account (sign up at https://dashboard.plaid.com/)
2. Firebase project set up (already configured)
3. Node.js environment variables configured

## Step 1: Create a Plaid Account

1. Go to https://dashboard.plaid.com/signup
2. Sign up for a free account
3. Verify your email address
4. Complete the onboarding process

## Step 2: Get Your Plaid Credentials

1. Log in to your Plaid Dashboard
2. Navigate to **Team Settings** → **Keys**
3. Copy your credentials:
   - **Client ID** (same for all environments)
   - **Sandbox Secret** (for testing)
   - **Development Secret** (for testing with real credentials)
   - **Production Secret** (for live production)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (copy from `.env.local.example`):

```bash
cp .env.local.example .env.local
```

2. Add your Plaid credentials to `.env.local`:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your_actual_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox

# Plaid Redirect URI (for OAuth banks)
NEXT_PUBLIC_PLAID_REDIRECT_URI=http://localhost:3000/connect-bank
```

### Environment Options:

- **sandbox**: Use fake test credentials (username: `user_good`, password: `pass_good`)
- **development**: Use real bank credentials (limited to 100 users, free)
- **production**: Live production environment (requires approval from Plaid)

## Step 4: Configure Plaid Settings

### Enable Products

In your Plaid Dashboard:
1. Go to **Account** → **Product Access**
2. Enable these products:
   - ✅ **Transactions** - Required for transaction data
   - ✅ **Auth** - Required for account verification

### Allowed Redirect URIs

1. Go to **Team Settings** → **API**
2. Add your redirect URIs:
   - Development: `http://localhost:3000/connect-bank`
   - Production: `https://yourdomain.com/connect-bank`

### Webhook Configuration (Optional)

Set up webhooks for automatic transaction updates:
1. Go to **Team Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/plaid/webhook`

## Step 5: Test the Integration

### Using Sandbox Mode

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the Connect Bank page (`/connect-bank`)

3. Click "Connect Your Bank"

4. In Plaid Link, search for any bank (e.g., "Chase")

5. Use these test credentials:
   - **Username**: `user_good`
   - **Password**: `pass_good`

6. Complete the flow - you should see test accounts connected!

### Test Credentials for Different Scenarios:

- **Success**: username `user_good`, password `pass_good`
- **Invalid Credentials**: username `user_bad`, password `pass_bad`
- **Account Locked**: username `user_locked`, password `pass_good`

## Step 6: Firestore Collections

The integration automatically creates these collections:

### `plaidItems`
Stores connected bank institutions:
```typescript
{
  userId: string;           // Firebase Auth user ID
  itemId: string;           // Plaid item ID
  accessToken: string;      // Plaid access token (encrypt in production!)
  institutionId: string;    // Plaid institution ID
  institutionName: string;  // Bank name (e.g., "Chase")
  status: string;           // "active", "error", etc.
  createdAt: Timestamp;
  lastSyncedAt: Timestamp;
}
```

### `connectedAccounts`
Stores individual bank accounts:
```typescript
{
  userId: string;           // Firebase Auth user ID
  itemId: string;           // References plaidItems
  accountId: string;        // Plaid account ID
  name: string;             // Account name
  officialName: string;     // Official account name
  type: string;             // "depository", "credit", etc.
  subtype: string;          // "checking", "savings", "credit card"
  mask: string;             // Last 4 digits (e.g., "0000")
  balanceCurrent: number;   // Current balance
  balanceAvailable: number; // Available balance
  balanceLimit: number;     // Credit limit (if applicable)
  isoCurrencyCode: string;  // "USD", "CAD", etc.
  institutionName: string;  // Bank name
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Step 7: Security Considerations

### For Production:

1. **Encrypt Access Tokens**: Never store Plaid access tokens in plain text
   ```typescript
   // Use encryption library like crypto or KMS
   const encryptedToken = encrypt(accessToken);
   ```

2. **Use Environment Variables**: Never commit secrets to Git

3. **Set Up Webhooks**: Use Plaid webhooks for real-time updates

4. **Implement Token Rotation**: Regularly rotate access tokens

5. **Add Error Handling**: Handle expired/invalid items gracefully

6. **Monitor Usage**: Track API usage in Plaid Dashboard

7. **Firebase Security Rules**: Add Firestore security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /plaidItems/{itemId} {
         allow read, write: if request.auth != null 
           && request.auth.uid == resource.data.userId;
       }
       match /connectedAccounts/{accountId} {
         allow read, write: if request.auth != null 
           && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

## Step 8: Moving to Production

1. **Request Production Access**:
   - Submit production approval request in Plaid Dashboard
   - Provide business details and use case
   - Usually takes 1-3 business days

2. **Update Environment Variables**:
   ```env
   PLAID_ENV=production
   PLAID_SECRET=your_production_secret
   ```

3. **Update Redirect URIs**: Add production domain to allowed redirects

4. **Test Thoroughly**: Test with real bank accounts in development mode first

## Common Issues & Solutions

### Issue: "Failed to create link token"
**Solution**: Check that your Plaid credentials are correct in `.env.local`

### Issue: "Bank connection was cancelled or failed"
**Solution**: This is normal - user cancelled the flow or entered wrong credentials

### Issue: Access token not working
**Solution**: Tokens expire after Item becomes invalid. Implement re-authentication flow.

### Issue: No accounts showing up
**Solution**: Check Firestore console to ensure data is being written correctly

## API Endpoints

The integration includes these API routes:

### `POST /api/plaid/create-link-token`
Creates a Plaid Link token for initializing the connection flow.

**Request Body:**
```json
{
  "userId": "firebase_user_id"
}
```

**Response:**
```json
{
  "link_token": "link-sandbox-abc123..."
}
```

### `POST /api/plaid/exchange-token`
Exchanges public token for access token and stores account data.

**Request Body:**
```json
{
  "publicToken": "public-sandbox-xyz789...",
  "userId": "firebase_user_id",
  "metadata": { /* Plaid metadata */ }
}
```

**Response:**
```json
{
  "success": true,
  "itemId": "item_id",
  "accounts": [...]
}
```

## Next Steps

1. ✅ Set up Plaid account
2. ✅ Configure environment variables
3. ✅ Test in sandbox mode
4. ⬜ Implement transaction syncing
5. ⬜ Add webhook handlers
6. ⬜ Implement re-authentication flow
7. ⬜ Add account management UI
8. ⬜ Request production access

## Resources

- [Plaid Documentation](https://plaid.com/docs/)
- [Plaid API Reference](https://plaid.com/docs/api/)
- [Plaid Quickstart](https://github.com/plaid/quickstart)
- [React Plaid Link Docs](https://github.com/plaid/react-plaid-link)
- [Plaid Dashboard](https://dashboard.plaid.com/)

## Support

- Plaid Support: support@plaid.com
- Plaid Status Page: https://status.plaid.com/
- Budget Buddy Support: support@budgetbuddy.com
