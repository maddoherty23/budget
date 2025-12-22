import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/config';

export async function POST(request: NextRequest) {
  try {
    const { publicToken, userId, metadata } = await request.json();

    if (!publicToken || !userId) {
      return NextResponse.json(
        { error: 'Public token and user ID are required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;
    const institution = metadata?.institution;

    // Fetch transactions (last 90 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let transactions = [];
    try {
      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });
      transactions = transactionsResponse.data.transactions;
    } catch (txnError) {
      console.error('Error fetching transactions:', txnError);
      // Continue without transactions if fetch fails
    }

    // Return all data to client for storage
    return NextResponse.json({
      success: true,
      itemId,
      accessToken,
      institutionId: institution?.institution_id || null,
      institutionName: institution?.name || 'Unknown Bank',
      accounts: accounts.map(account => ({
        accountId: account.account_id,
        name: account.name,
        officialName: account.official_name || account.name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        balanceCurrent: account.balances.current,
        balanceAvailable: account.balances.available,
        balanceLimit: account.balances.limit,
        isoCurrencyCode: account.balances.iso_currency_code,
      })),
      transactions: transactions.map(transaction => ({
        transactionId: transaction.transaction_id,
        accountId: transaction.account_id,
        date: transaction.date,
        authorizedDate: transaction.authorized_date,
        name: transaction.name,
        merchantName: transaction.merchant_name,
        amount: transaction.amount,
        category: transaction.category,
        pending: transaction.pending,
        isoCurrencyCode: transaction.iso_currency_code,
        location: transaction.location,
        paymentChannel: transaction.payment_channel,
      })),
    });
  } catch (error: any) {
    console.error('Error exchanging Plaid token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to exchange token',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
