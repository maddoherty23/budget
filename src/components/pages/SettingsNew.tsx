"use client";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  CreditCard, 
  Trash2,
  Plus,
  Landmark,
  LogOut,
  Loader2,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth, signOut } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

const currencies = [
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

interface ConnectedAccount {
  id: string;
  name: string;
  institutionName: string;
  type: string;
  balanceCurrent: number | null;
  mask: string | null;
}

export default function Settings() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");

  // Debug: Log auth state
  console.log('Settings - Auth State:', { user, authLoading, isAuthenticated: !!user });

  // Load user data from Firebase Auth
  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Load connected accounts
  useEffect(() => {
    if (!user) {
      setIsLoadingAccounts(false);
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
        const accountsData: ConnectedAccount[] = [];
        snapshot.forEach((doc) => {
          accountsData.push({
            id: doc.id,
            ...doc.data(),
          } as ConnectedAccount);
        });

        setAccounts(accountsData);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to load connected accounts');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [user]);

  const handleSave = () => {
    // TODO: Implement profile update
    toast.success("Settings saved successfully!");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'connectedAccounts', accountId));
      setAccounts(accounts.filter(a => a.id !== accountId));
      toast.success("Account disconnected");
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Failed to disconnect account");
    }
  };

  if (authLoading) {
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
          <p className="text-muted-foreground mb-4">Please log in to access settings</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 pb-20 lg:pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Connected Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Connected Accounts</h2>
            </div>
            <Link href="/connect-bank">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </Link>
          </div>

          {isLoadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No connected accounts</p>
              <Link href="/connect-bank">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Your Bank
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      account.type === "credit" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    )}>
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {account.name}
                        {account.mask && <span className="ml-2 text-muted-foreground">••{account.mask}</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{account.institutionName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {account.balanceCurrent !== null && (
                      <span className={cn(
                        "font-semibold",
                        account.balanceCurrent < 0 ? "text-destructive" : "text-foreground"
                      )}>
                        {formatCurrency(Math.abs(account.balanceCurrent))}
                      </span>
                    )}
                    <button 
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
