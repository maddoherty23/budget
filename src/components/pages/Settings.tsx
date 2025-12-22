"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Bell, 
  Trash2,
  Plus,
  Landmark,
  LogOut,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const currencies = [
  { code: "CAD", name: "Canadian Dollar", symbol: "$" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

export default function Settings() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [name, setName] = useState("Jamie Doe");
  const [email, setEmail] = useState("jamie@example.com");
  const [currency, setCurrency] = useState("CAD");
  const [notifications, setNotifications] = useState({
    overspending: true,
    bigTransactions: true,
    weeklyReport: false,
    goalProgress: true,
  });

  // Load accounts from Firebase
  useEffect(() => {
    if (!user) return;

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

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
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
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No accounts connected yet</p>
            ) : accounts.map((account) => (
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
                    <p className="font-medium text-foreground">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.institution}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-semibold",
                    account.balance < 0 ? "text-destructive" : "text-foreground"
                  )}>
                    {formatCurrency(Math.abs(account.balance))}
                  </span>
                  <button className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Overspending Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when you go over budget
                </p>
              </div>
              <Switch
                checked={notifications.overspending}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, overspending: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Big Transactions</p>
                <p className="text-sm text-muted-foreground">
                  Alert for transactions over $100
                </p>
              </div>
              <Switch
                checked={notifications.bigTransactions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, bigTransactions: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">
                  Get a weekly email with your spending
                </p>
              </div>
              <Switch
                checked={notifications.weeklyReport}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, weeklyReport: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Goal Progress</p>
                <p className="text-sm text-muted-foreground">
                  Updates when you reach milestones
                </p>
              </div>
              <Switch
                checked={notifications.goalProgress}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, goalProgress: checked })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full" size="lg">
          Save Changes
        </Button>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Danger Zone</h2>
          
          <div className="space-y-3">
            <button className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Log Out</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button className="flex w-full items-center justify-between rounded-lg border border-destructive/30 bg-card px-4 py-3 text-left transition-colors hover:bg-destructive/10">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <span className="font-medium text-destructive">Delete Account</span>
              </div>
              <ChevronRight className="h-5 w-5 text-destructive" />
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
