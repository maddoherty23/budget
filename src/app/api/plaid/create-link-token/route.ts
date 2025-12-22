import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/config';
import { Products, CountryCode } from 'plaid';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create Plaid Link token
    const linkTokenConfig: any = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Budget Buddy',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us, CountryCode.Ca],
      language: 'en',
    };

    // Only add redirect_uri if it's configured in the Plaid dashboard
    // Remove this for sandbox testing if not configured
    // if (process.env.NEXT_PUBLIC_PLAID_REDIRECT_URI) {
    //   linkTokenConfig.redirect_uri = process.env.NEXT_PUBLIC_PLAID_REDIRECT_URI;
    // }

    const response = await plaidClient.linkTokenCreate(linkTokenConfig);

    return NextResponse.json({
      link_token: response.data.link_token,
    });
  } catch (error: any) {
    console.error('Error creating Plaid link token:', error);
    console.error('Error response:', error.response?.data);
    console.error('Plaid config:', {
      clientId: process.env.PLAID_CLIENT_ID ? '✓ Set' : '✗ Missing',
      secret: process.env.PLAID_SECRET ? '✓ Set' : '✗ Missing',
      env: process.env.PLAID_ENV || 'sandbox (default)'
    });
    return NextResponse.json(
      { 
        error: 'Failed to create link token',
        details: error.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}
