import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/config';
import { doc, setDoc, serverTimestamp, Timestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getMonthString } from '@/lib/firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, userId, itemId, startDate, endDate } = await request.json();

    if (!accessToken || !userId || !itemId) {
      return NextResponse.json(
        { error: 'Access token, user ID, and item ID are required' },
        { status: 400 }
      );
    }

    // Sync transactions from Plaid
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate || '2020-01-01', // Default to fetch all
      end_date: endDate || new Date().toISOString().split('T')[0], // Today
    });

    const transactions = response.data.transactions;
    let syncedCount = 0;

    // Store each transaction in Firestore with new hierarchical structure
    for (const transaction of transactions) {
      const txnDate = Timestamp.fromDate(new Date(transaction.date));
      const month = getMonthString(txnDate);
      
      // Path: transactions/{userId}/{month}/{transactionId}
      const monthCollectionRef = collection(db, `transactions/${userId}/${month}`);
      const transactionRef = doc(monthCollectionRef, transaction.transaction_id);
      
      await setDoc(transactionRef, {
        // Do NOT include userId - it's implicit in the path
        
        // Source
        source: 'plaid',
        accountId: transaction.account_id,
        plaidTransactionId: transaction.transaction_id,
        
        // Transaction details
        date: txnDate,
        authorizedDate: transaction.authorized_date 
          ? Timestamp.fromDate(new Date(transaction.authorized_date))
          : null,
        description: transaction.name,
        merchantName: transaction.merchant_name || null,
        amount: -transaction.amount, // Plaid uses positive for debits, we use negative for expenses
        type: transaction.amount > 0 ? 'expense' : 'income',
        
        // Categorization
        category: transaction.category ? transaction.category[0] : null,
        categoryId: null,
        plaidCategory: transaction.category || null,
        
        // Status
        status: transaction.pending ? 'pending' : 'posted',
        excluded: false,
        needsReview: !transaction.category || transaction.category.length === 0,
        
        // Metadata
        isoCurrencyCode: transaction.iso_currency_code || 'USD',
        location: transaction.location || null,
        paymentChannel: transaction.payment_channel || null,
        
        // Notes
        notes: null,
        tags: [],
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true }); // Use merge to avoid overwriting existing data
      
      syncedCount++;
    }

    // Update the item's last synced timestamp
    const itemRef = doc(db, 'plaidItems', itemId);
    await setDoc(itemRef, {
      lastSyncedAt: serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      syncedCount,
      message: `Synced ${syncedCount} transactions`,
    });
  } catch (error: any) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync transactions',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
