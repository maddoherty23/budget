import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Get Plaid environment
const getPlaidEnvironment = () => {
  const env = process.env.PLAID_ENV || 'sandbox';
  
  switch (env) {
    case 'production':
      return PlaidEnvironments.production;
    case 'development':
      return PlaidEnvironments.development;
    case 'sandbox':
    default:
      return PlaidEnvironments.sandbox;
  }
};

// Plaid configuration
const configuration = new Configuration({
  basePath: getPlaidEnvironment(),
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

// Create and export Plaid client
export const plaidClient = new PlaidApi(configuration);

// Export environment for reference
export const plaidEnv = process.env.PLAID_ENV || 'sandbox';
