import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink as usePlaidLinkOriginal, PlaidLinkOnSuccess, PlaidLinkOptions } from 'react-plaid-link';
import { toast } from 'sonner';
import { doc, setDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getMonthString } from '@/lib/firebase/firestore';

interface UsePlaidLinkProps {
  userId: string | null;
  onSuccess?: (accounts: any[]) => void;
  onExit?: () => void;
}

export const usePlaidLink = ({ userId, onSuccess, onExit }: UsePlaidLinkProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch link token from API
  const generateToken = useCallback(async () => {
    if (!userId) {
      toast.error('You must be logged in to connect a bank account');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error generating link token:', error);
      toast.error('Failed to initialize bank connection');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle successful connection
  const handleOnSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      setIsLoading(true);
      try {
        // Exchange token and get data from API
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            publicToken,
            userId,
            metadata,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange token');
        }

        const data = await response.json();
        const now = Timestamp.now();

        // Store Plaid item in Firestore
        const itemRef = doc(db, 'plaidItems', data.itemId);
        await setDoc(itemRef, {
          userId,
          itemId: data.itemId,
          accessToken: data.accessToken,
          institutionId: data.institutionId,
          institutionName: data.institutionName,
          createdAt: now,
          lastSyncedAt: now,
          status: 'active',
        });

        // Store accounts in Firestore
        for (const account of data.accounts) {
          const accountRef = doc(db, 'connectedAccounts', account.accountId);
          await setDoc(accountRef, {
            userId,
            itemId: data.itemId,
            accountId: account.accountId,
            name: account.name,
            officialName: account.officialName,
            type: account.type,
            subtype: account.subtype,
            mask: account.mask,
            balanceCurrent: account.balanceCurrent,
            balanceAvailable: account.balanceAvailable,
            balanceLimit: account.balanceLimit,
            isoCurrencyCode: account.isoCurrencyCode,
            institutionName: data.institutionName,
            createdAt: now,
            updatedAt: now,
            status: 'active',
          });
        }

        // Store transactions in Firestore with new hierarchical structure
        for (const transaction of data.transactions) {
          const txnDate = Timestamp.fromDate(new Date(transaction.date));
          const month = getMonthString(txnDate);
          
          // Path: transactions/{userId}/{month}/{transactionId}
          const monthCollectionRef = collection(db, `transactions/${userId}/${month}`);
          const transactionRef = doc(monthCollectionRef, transaction.transactionId);
          
          await setDoc(transactionRef, {
            // Do NOT include userId - it's implicit in the path
            source: 'plaid',
            accountId: transaction.accountId,
            plaidTransactionId: transaction.transactionId,
            date: txnDate,
            authorizedDate: transaction.authorizedDate ? Timestamp.fromDate(new Date(transaction.authorizedDate)) : null,
            description: transaction.name,
            merchantName: transaction.merchantName,
            amount: -transaction.amount,
            type: transaction.amount > 0 ? 'expense' : 'income',
            category: transaction.category ? transaction.category[0] : null,
            categoryId: null,
            plaidCategory: transaction.category || null,
            status: transaction.pending ? 'pending' : 'posted',
            excluded: false,
            needsReview: !transaction.category,
            isoCurrencyCode: transaction.isoCurrencyCode || 'USD',
            location: transaction.location,
            paymentChannel: transaction.paymentChannel,
            notes: null,
            tags: [],
            createdAt: now,
            updatedAt: now,
          }, { merge: true });
        }

        toast.success(`Successfully connected ${metadata.institution?.name || 'bank account'}!`);
        
        if (onSuccess) {
          onSuccess(data.accounts);
        }
      } catch (error) {
        console.error('Error exchanging token:', error);
        toast.error('Failed to complete bank connection');
      } finally {
        setIsLoading(false);
      }
    },
    [userId, onSuccess]
  );

  // Handle exit/cancellation
  const handleOnExit = useCallback(
    (error: any, metadata: any) => {
      if (error) {
        console.error('Plaid Link error:', error);
        if (error.error_code !== 'ITEM_LOGIN_REQUIRED') {
          toast.error('Bank connection was cancelled or failed');
        }
      }
      
      if (onExit) {
        onExit();
      }
    },
    [onExit]
  );

  // Configure Plaid Link
  const config: PlaidLinkOptions = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
  };

  const { open, ready } = usePlaidLinkOriginal(config);

  // Auto-generate token when userId is available
  useEffect(() => {
    if (userId && !linkToken && !isLoading) {
      generateToken();
    }
  }, [userId, linkToken, isLoading, generateToken]);

  return {
    open,
    ready: ready && !isLoading,
    isLoading,
    generateToken,
  };
};
