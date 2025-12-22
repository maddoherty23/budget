"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  PiggyBank, 
  Building2, 
  Shield, 
  CheckCircle2,
  ArrowRight,
  Plus,
  CreditCard,
  Landmark,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePlaidLink } from "@/hooks/usePlaidLink";
import { useAuth } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface ConnectedAccount {
  id: string;
  name: string;
  officialName: string;
  type: string;
  subtype: string | null;
  mask: string | null;
  balanceCurrent: number | null;
  institutionName: string;
}

export default function ConnectBank() {
  const router = useRouter();
  const { user } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Plaid Link hook
  const { open, ready, isLoading } = usePlaidLink({
    userId: user?.uid || null,
    onSuccess: (accounts) => {
      console.log('Successfully connected accounts:', accounts);
      // Accounts will be automatically updated via Firestore listener
    },
  });

  // Load connected accounts from Firestore
  useEffect(() => {
    if (!user?.uid) {
      setIsLoadingAccounts(false);
      return;
    }

    // Real-time listener for connected accounts
    const accountsQuery = query(
      collection(db, 'connectedAccounts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(accountsQuery, (snapshot) => {
      const accounts: ConnectedAccount[] = [];
      snapshot.forEach((doc) => {
        accounts.push({
          id: doc.id,
          ...doc.data(),
        } as ConnectedAccount);
      });
      setConnectedAccounts(accounts);
      setIsLoadingAccounts(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleConnectBank = () => {
    if (!ready) {
      toast.error('Bank connection is not ready. Please try again.');
      return;
    }
    open();
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  const handleSkip = () => {
    toast.info("You can connect your bank anytime from Settings");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <PiggyBank className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Budget Buddy</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {isLoadingAccounts ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : connectedAccounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Connect your bank accounts
              </h1>
              <p className="mx-auto max-w-md text-muted-foreground">
                Securely link your bank and credit cards using Plaid to automatically import your transactions. 
                No more manual entry!
              </p>
            </div>

            {/* Security Badge */}
            <div className="mx-auto flex max-w-sm items-center gap-3 rounded-lg bg-success/10 px-4 py-3">
              <Shield className="h-5 w-5 text-success" />
              <p className="text-sm text-foreground">
                Bank-level encryption. Powered by Plaid. We never store your bank credentials.
              </p>
            </div>

            {/* Plaid Connect Button */}
            <div className="space-y-4">
              <Button
                onClick={handleConnectBank}
                disabled={!ready || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-5 w-5" />
                    Connect Your Bank
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Supports 12,000+ banks and credit unions in the US and Canada
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">Bank-Level Security</p>
                <p className="text-xs text-muted-foreground">256-bit encryption</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">Auto-Sync</p>
                <p className="text-xs text-muted-foreground">Daily updates</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">Read-Only</p>
                <p className="text-xs text-muted-foreground">We can't move money</p>
              </div>
            </div>

            {/* Skip Link */}
            <div className="text-center">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Skip for now — I'll add transactions manually
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">
                Accounts connected!
              </h1>
              <p className="text-muted-foreground">
                We found these accounts. Your transactions will sync automatically.
              </p>
            </div>

            {/* Connected Accounts */}
            <div className="space-y-3">
              {connectedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    account.type === "credit" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  )}>
                    {account.type === "credit" || account.subtype === "credit card" ? (
                      <CreditCard className="h-6 w-6" />
                    ) : (
                      <Landmark className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {account.officialName || account.name}
                      {account.mask && <span className="ml-2 text-muted-foreground">••{account.mask}</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{account.institutionName}</p>
                  </div>
                  <div className="text-right">
                    {account.balanceCurrent !== null ? (
                      <>
                        <p className={cn(
                          "text-lg font-semibold",
                          account.balanceCurrent < 0 ? "text-destructive" : "text-foreground"
                        )}>
                          ${Math.abs(account.balanceCurrent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{account.subtype || account.type}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Balance unavailable</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add More */}
            <button
              onClick={handleConnectBank}
              disabled={!ready || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Connect another account
                </>
              )}
            </button>

            {/* Continue Button */}
            <Button onClick={handleContinue} className="w-full" size="lg">
              Go to My Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
