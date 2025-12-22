# Plaid Integration - Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Sign Up for Plaid (2 min)
Visit https://dashboard.plaid.com/signup and create a free account.

### 2. Get Your Keys (1 min)
1. Go to **Team Settings** → **Keys**
2. Copy your **Client ID** and **Sandbox Secret**

### 3. Configure Environment (1 min)
Create `.env.local` in project root:

```env
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox
NEXT_PUBLIC_PLAID_REDIRECT_URI=http://localhost:3000/connect-bank
```

### 4. Start Development Server (1 min)
```bash
npm run dev
```

### 5. Test It! (30 sec)
1. Navigate to http://localhost:3000/connect-bank
2. Click "Connect Your Bank"
3. Search for any bank (e.g., "Chase")
4. Use test credentials:
   - Username: `user_good`
   - Password: `pass_good`
5. Select accounts and continue
6. You should see your connected accounts! 🎉

## 📁 Files Created

```
src/
├── lib/plaid/
│   └── config.ts                           # Plaid client configuration
├── app/api/plaid/
│   ├── create-link-token/route.ts          # Creates Plaid Link token
│   └── exchange-token/route.ts             # Exchanges tokens & saves data
├── hooks/
│   └── usePlaidLink.ts                     # React hook for Plaid Link
└── components/pages/
    └── ConnectBank.tsx                     # Updated with Plaid integration

Firestore Collections (auto-created):
├── plaidItems/                             # Connected bank institutions
└── connectedAccounts/                      # Individual bank accounts
```

## ✨ What You Can Do Now

- ✅ Connect to 12,000+ banks
- ✅ View account balances in real-time
- ✅ Support checking, savings, and credit cards
- ✅ See account details (name, mask, type)
- ✅ Connect multiple accounts per user

## 🔄 Next Steps

1. **Enable Products** in Plaid Dashboard:
   - Go to Account → Product Access
   - Enable "Transactions" and "Auth"

2. **Set Up Webhooks** (optional):
   - Go to Team Settings → Webhooks
   - Add: `https://yourdomain.com/api/plaid/webhook`

3. **Move to Development Mode** (test with real banks):
   - Change `PLAID_ENV=development`
   - Use your real bank credentials (limited to 100 users)

4. **Go to Production**:
   - Submit production access request in Plaid Dashboard
   - Update `PLAID_ENV=production` and use production secret
   - Usually approved in 1-3 business days

## 🔒 Security Notes

⚠️ **Current Implementation**: For development only
- Access tokens stored in plain text
- No encryption on sensitive data

📌 **Before Production**:
- Encrypt Plaid access tokens
- Add Firestore security rules
- Implement webhook handlers
- Set up token rotation
- Enable audit logging

See `PLAID_SETUP.md` for complete security guidelines.

## 📚 Resources

- Full Documentation: `PLAID_SETUP.md`
- Plaid Docs: https://plaid.com/docs/
- Plaid Dashboard: https://dashboard.plaid.com/

## ❓ Troubleshooting

**Issue**: "Failed to create link token"
→ Check your `.env.local` credentials

**Issue**: No accounts showing
→ Check Firebase console for `connectedAccounts` collection

**Issue**: Bank not found
→ Make sure you're in sandbox mode - all banks work in sandbox!

## 💡 Pro Tips

- In sandbox, you can use ANY bank name - it's all test data
- Test credentials work for all banks in sandbox
- Use different test credentials to simulate various scenarios:
  - `user_good` / `pass_good` - Success
  - `user_bad` / `pass_bad` - Invalid credentials
  - `user_locked` / `pass_good` - Account locked

Happy banking! 🏦✨
