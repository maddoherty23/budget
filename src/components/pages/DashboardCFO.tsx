"use client";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import Link from "next/link";
import { Landmark, CreditCard, Building2, Loader2, Plus, TrendingUp, TrendingDown, Download } from "lucide-react";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Account {
  id: string;
  name: string;
  type: string;
  balanceCurrent: number | null;
  institutionName: string;
  mask: string | null;
  status: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: Timestamp;
}

export default function DashboardCFO() {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  useEffect(() => {
    if (!user || authLoading) {
      setIsLoading(false);
      return;
    }

    const fetchAccounts = async () => {
      try {
        const q = query(
          collection(db, 'connectedAccounts'),
          where('userId', '==', user.uid),
          where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        const accountsData: Account[] = [];
        snapshot.forEach((doc) => {
          accountsData.push({
            id: doc.id,
            ...doc.data(),
          } as Account);
        });

        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || authLoading) {
      setIsLoadingTransactions(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(q);
        const transactionsData: Transaction[] = [];
        snapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            ...doc.data(),
          } as Transaction);
        });

        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [user, authLoading]);

  // Calculate financial metrics
  const totalBalance = accounts.reduce((sum, acc) => {
    if (acc.balanceCurrent === null) return sum;
    return sum + acc.balanceCurrent;
  }, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const getAccountIcon = (type: string) => {
    if (type === 'credit') return <CreditCard className="h-4 w-4" />;
    if (type === 'depository') return <Landmark className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading || authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view your dashboard</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Finance Snapshot</h1>
            <p className="text-sm text-muted-foreground">Household CFO Mode</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Bank Accounts Connected
              </h2>
              <p className="text-muted-foreground mb-6">
                Connect your bank account to get started with automatic transaction tracking
              </p>
              <Link href="/connect-bank">
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Connect Your Bank
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Profit & Loss Summary */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Profit & Loss
                  </h2>
                  <span className="text-sm text-muted-foreground">This month</span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Net Profit for December</p>
                    <div className="flex items-center gap-2">
                      <p className={cn("text-3xl font-bold", netProfit >= 0 ? "text-foreground" : "text-destructive")}>
                        {formatCurrency(Math.abs(netProfit))}
                      </p>
                      <div className={cn("flex items-center gap-1 text-sm", netProfit >= 0 ? "text-green-600" : "text-destructive")}>
                        {netProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{profitMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Income</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalIncome)}</p>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Expenses</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalExpenses)}</p>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: totalIncome > 0 ? `${(totalExpenses / totalIncome) * 100}%` : '0%' }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Accounts Table */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Bank Accounts
                </h2>
                <span className="text-sm text-muted-foreground">As of today</span>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Account #</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      const isCredit = account.type === 'credit';
                      return (
                        <TableRow key={account.id} className="cursor-pointer hover:bg-secondary/30">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg",
                                isCredit ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                              )}>
                                {getAccountIcon(account.type)}
                              </div>
                              <Link href={`/transactions?account=${account.id}`} className="hover:underline">
                                {account.name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell>{account.institutionName}</TableCell>
                          <TableCell className="capitalize">{account.type}</TableCell>
                          <TableCell>
                            {account.mask ? `••••${account.mask}` : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {account.balanceCurrent !== null ? (
                              <span className={cn(
                                "font-semibold",
                                account.balanceCurrent >= 0 ? "text-foreground" : "text-destructive"
                              )}>
                                {formatCurrency(Math.abs(account.balanceCurrent))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Active
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={4} className="font-semibold">Total Balance</TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        {formatCurrency(totalBalance)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="border-t border-border p-4">
                <Link
                  href="/connect-bank"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Connect another account
                </Link>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent Transactions
                </h2>
                <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              </div>

              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                              transaction.type === "income" 
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20" 
                                : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                            )}>
                              {transaction.type}
                            </span>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-semibold",
                            transaction.type === "income" ? "text-green-600" : "text-destructive"
                          )}>
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
