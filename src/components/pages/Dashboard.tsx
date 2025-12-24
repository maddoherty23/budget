"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import Link from "next/link";
import { TrendingDown, ArrowDown, ChevronRight, Tag, MoreVertical, Landmark, CreditCard, Building2, CheckCircle2, Info, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("this-month");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load accounts from Firebase
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'connectedAccounts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const accts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: data.type || 'checking',
          balance: data.balanceCurrent || 0,
          institution: data.institutionName,
        };
      });
      setAccounts(accts);
    });

    return () => unsubscribe();
  }, [user]);

  // Load transactions from Firebase (hierarchical structure)
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Query current and previous month for dashboard data
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const unsubscribes: (() => void)[] = [];
    const allTxns: any[] = [];

    // Query both months
    [currentMonth, previousMonth].forEach(month => {
      const monthPath = `transactions/${user.uid}/${month}`;
      const monthCollection = collection(db, monthPath);
      
      const unsubscribe = onSnapshot(monthCollection, (snapshot) => {
        // Remove old transactions from this month
        const filtered = allTxns.filter(t => {
          const txnMonth = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
          return txnMonth !== month;
        });
        
        // Add new transactions from this month
        const newTxns = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            accountId: data.accountId,
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category || 'Uncategorized',
            date: data.date?.toDate?.() || new Date(),
          };
        });
        
        allTxns.length = 0;
        allTxns.push(...filtered, ...newTxns);
        setTransactions([...allTxns]);
        setIsLoading(false);
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // Calculate monthly income and expenses
  const { monthlyIncome, monthlyExpenses, previousMonthIncome, previousMonthExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTxns = transactions.filter(t => {
      const txnDate = t.date;
      return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
    });

    const previousMonthTxns = transactions.filter(t => {
      const txnDate = t.date;
      return txnDate.getMonth() === previousMonth && txnDate.getFullYear() === previousYear;
    });

    const monthlyIncome = currentMonthTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthlyExpenses = currentMonthTxns
      .filter(t => t.type === 'expense' && t.category !== 'Exclude')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousMonthIncome = previousMonthTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const previousMonthExpenses = previousMonthTxns
      .filter(t => t.type === 'expense' && t.category !== 'Exclude')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { monthlyIncome, monthlyExpenses, previousMonthIncome, previousMonthExpenses };
  }, [transactions]);

  // Count uncategorized transactions
  const uncategorizedCount = useMemo(() => {
    return transactions.filter(t => !t.category || t.category === 'Uncategorized').length;
  }, [transactions]);

  // Get uncategorized count by account
  const getUncategorizedByAccount = (accountId: string) => {
    return transactions.filter(t => t.accountId === accountId && (!t.category || t.category === 'Uncategorized')).length;
  };

  const netProfit = monthlyIncome - monthlyExpenses;
  const previousNetProfit = previousMonthIncome - previousMonthExpenses;
  const changePercent = previousNetProfit !== 0 ? Math.abs((netProfit - previousNetProfit) / Math.abs(previousNetProfit) * 100).toFixed(0) : 0;
  const isUp = netProfit > previousNetProfit;

  // Calculate max for progress bars
  const maxAmount = Math.max(monthlyIncome, monthlyExpenses, 1);
  const incomePercent = (monthlyIncome / maxAmount) * 100;
  const expensePercent = (monthlyExpenses / maxAmount) * 100;
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Landmark className="h-5 w-5" />;
      case 'savings':
        return <Building2 className="h-5 w-5" />;
      case 'credit':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Landmark className="h-5 w-5" />;
    }
  };
  return <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Finance Snapshot</h1>
          </div>
        </div>

        {/* Main Cards Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profit & Loss Card */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="rounded-xl border border-border bg-card">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Profit & Loss
              </h2>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-8 w-auto gap-2 border-0 bg-transparent text-sm font-medium hover:bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This month</SelectItem>
                  <SelectItem value="last-month">Last month</SelectItem>
                  <SelectItem value="this-quarter">This quarter</SelectItem>
                  <SelectItem value="this-year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-5">
              {/* Net Profit */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Net {netProfit >= 0 ? 'profit' : 'loss'} for December
                </p>
                <div className="flex items-center gap-3">
                  <span className={cn("text-3xl font-bold", netProfit >= 0 ? "text-foreground" : "text-destructive")}>
                    {netProfit < 0 ? '-' : ''}{formatCurrency(Math.abs(netProfit))}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <Info className="h-3 w-3" />
                    100%
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  {isUp ? <>
                      <TrendingDown className="h-4 w-4 rotate-180 text-success" />
                      <span className="text-success">Up {changePercent}%</span>
                    </> : <>
                      <ArrowDown className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">Down {changePercent}%</span>
                    </>}
                  <span className="text-muted-foreground">from prior month</span>
                </div>
              </div>

              {/* Income Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-foreground">
                    {formatCurrency(monthlyIncome)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">Income</span>
                  <div className="flex-1 h-5 bg-secondary rounded overflow-hidden">
                    <motion.div initial={{
                    width: 0
                  }} animate={{
                    width: `${incomePercent}%`
                  }} transition={{
                    delay: 0.3,
                    duration: 0.6
                  }} className="h-full bg-success rounded" />
                  </div>
                </div>
              </div>

              {/* Expenses Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-foreground">
                    {formatCurrency(monthlyExpenses)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">Expenses</span>
                  <div className="flex-1 h-5 bg-secondary rounded overflow-hidden">
                    <motion.div initial={{
                    width: 0
                  }} animate={{
                    width: `${expensePercent}%`
                  }} transition={{
                    delay: 0.5,
                    duration: 0.6
                  }} className="h-full bg-primary rounded" />
                  </div>
                </div>
              </div>

              {/* Footer Link */}
              <div className="flex items-center justify-between pt-2">
                <Link href="/reports" className="text-sm font-medium text-primary hover:underline">
                  See profit and loss report
                </Link>
                <button className="p-1 rounded hover:bg-secondary">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bank Accounts Card */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="rounded-xl border border-border bg-card">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Bank Accounts
              </h2>
              <span className="text-sm text-muted-foreground">As of today</span>
            </div>

            {/* Accounts List */}
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No accounts connected yet</p>
                </div>
              ) : accounts.map(account => {
              const uncategorized = getUncategorizedByAccount(account.id);
              const isCredit = account.type === 'credit';
              return <Link key={account.id} href={`/transactions?account=${account.id}`} className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors">
                    {/* Icon */}
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg mt-1", isCredit ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                      {getAccountIcon(account.type)}
                    </div>

                    {/* Account Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">Bank balance</p>
                      <p className="text-sm text-muted-foreground">In App</p>
                      <p className="text-xs text-muted-foreground mt-1">Updated just now</p>
                    </div>

                    {/* Balance & Status */}
                    <div className="text-right space-y-1">
                      <p className={cn("font-semibold", account.balance >= 0 ? "text-foreground" : "text-destructive")}>
                        {formatCurrency(Math.abs(account.balance))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Math.abs(account.balance))}
                      </p>
                      {uncategorized > 0 ? <Link href={`/transactions?filter=uncategorized&account=${account.id}`} className="inline-flex items-center text-sm font-medium text-primary hover:underline" onClick={e => e.stopPropagation()}>
                          {uncategorized} to review
                        </Link> : <span className="inline-flex items-center gap-1 text-sm text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          Reviewed
                        </span>}
                    </div>
                  </Link>;
            })}
            </div>

            {/* Connect Bank Link */}
            <div className="border-t border-border p-4">
              <Link href="/connect-bank" className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline">
                Connect a bank account
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Categorize Alert - if there are uncategorized transactions */}
        {uncategorizedCount > 0 && <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }}>
            <Link href="/transactions?filter=uncategorized" className="flex items-center gap-4 rounded-xl border border-warning/50 bg-warning/10 p-4 transition-all hover:border-warning hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning text-warning-foreground">
                <Tag className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning text-xs font-bold text-warning-foreground">
                    {uncategorizedCount}
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {uncategorizedCount === 1 ? 'Transaction' : 'Transactions'} to Categorize
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review and assign categories to keep your budget accurate
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </Link>
          </motion.div>}
      </div>
    </AppLayout>;
}