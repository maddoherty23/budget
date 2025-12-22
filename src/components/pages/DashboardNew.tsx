"use client";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import Link from "next/link";
import { Landmark, CreditCard, Building2, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";

interface Account {
  id: string;
  name: string;
  type: string;
  balanceCurrent: number | null;
  institutionName: string;
  mask: string | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const getAccountIcon = (type: string) => {
    if (type === 'credit') return <CreditCard className="h-5 w-5" />;
    if (type === 'depository') return <Landmark className="h-5 w-5" />;
    return <Building2 className="h-5 w-5" />;
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
      <div className="mx-auto max-w-5xl space-y-6 pb-20 lg:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Finance Snapshot</h1>
          </div>
        </div>

        {accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 space-y-6"
          >
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
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Bank Accounts
                </h2>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>

              <div className="divide-y divide-border">
                {accounts.map((account) => {
                  const isCredit = account.type === 'credit';
                  return (
                    <Link
                      key={account.id}
                      href={`/transactions?account=${account.id}`}
                      className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg mt-1",
                          isCredit ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                        )}
                      >
                        {getAccountIcon(account.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {account.name}
                          {account.mask && (
                            <span className="ml-2 text-muted-foreground">••{account.mask}</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{account.institutionName}</p>
                      </div>

                      <div className="text-right">
                        {account.balanceCurrent !== null ? (
                          <p
                            className={cn(
                              "font-semibold",
                              account.balanceCurrent >= 0 ? "text-foreground" : "text-destructive"
                            )}
                          >
                            {formatCurrency(Math.abs(account.balanceCurrent))}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Balance unavailable</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
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
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
