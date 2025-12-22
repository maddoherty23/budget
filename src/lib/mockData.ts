// Mock data for the budgeting app

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  institution: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  accountId: string;
  type: 'income' | 'expense';
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  budgeted: number;
  spent: number;
  group: 'bills' | 'needs' | 'wants' | 'savings' | 'debt';
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  icon: string;
}

// All data is now loaded from Firebase
// These exports are kept for backward compatibility but should not be used
export const mockAccounts: any[] = [];
export const mockTransactions: any[] = [];
export const mockBudgetCategories: any[] = [];
export const mockSavingsGoals: any[] = [];
export const monthlyIncome = 0;
export const monthlyExpenses = 0;

export function formatCurrency(amount: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}
