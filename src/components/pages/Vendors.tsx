"use client";

import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Plus, 
  Store,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VendorData {
  name: string;
  totalSpent: number;
  transactionCount: number;
  lastTransaction: string;
  isTracked: boolean;
  category?: string;
}

interface SavedVendor {
  id: string;
  userId: string;
  name: string;
  totalSpent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function Vendors() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [selectedVendorNames, setSelectedVendorNames] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Fetch transactions from Firestore (last 6 months)
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const months: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(month);
    }

    const unsubscribes: (() => void)[] = [];
    const allTxns: any[] = [];

    months.forEach(month => {
      const monthPath = `transactions/${user.uid}/${month}`;
      const monthCollection = collection(db, monthPath);
      const q = query(monthCollection);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const filtered = allTxns.filter(t => {
          const txnDate = new Date(t.date);
          const txnMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
          return txnMonth !== month;
        });
        
        const newTxns = snapshot.docs.map(doc => {
          const data = doc.data();
          const txnDate = data.date?.toDate?.() || new Date();
          return {
            id: doc.id,
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category || 'Uncategorized',
            date: txnDate.toISOString().split('T')[0],
            month,
          };
        });
        
        allTxns.length = 0;
        allTxns.push(...filtered, ...newTxns);
        setTransactions([...allTxns]);
        setIsLoading(false);
      }, (error) => {
        console.error(`Error fetching transactions for ${month}:`, error);
        setIsLoading(false);
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // Fetch saved vendors from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'vendors'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vendors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SavedVendor[];
      setSavedVendors(vendors);
    }, (error) => {
      console.error('Error fetching vendors:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Extract vendors from transactions
  const vendors = useMemo(() => {
    const vendorMap = new Map<string, VendorData>();

    // Only include expense transactions
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    expenseTransactions.forEach(txn => {
      const vendorName = txn.description.trim();
      if (!vendorName) return;

      const existing = vendorMap.get(vendorName);
      const isTracked = savedVendors.some(v => v.name === vendorName);

      if (existing) {
        existing.totalSpent += Math.abs(txn.amount);
        existing.transactionCount += 1;
        if (new Date(txn.date) > new Date(existing.lastTransaction)) {
          existing.lastTransaction = txn.date;
        }
        existing.isTracked = isTracked;
      } else {
        vendorMap.set(vendorName, {
          name: vendorName,
          totalSpent: Math.abs(txn.amount),
          transactionCount: 1,
          lastTransaction: txn.date,
          isTracked,
          category: txn.category !== 'Uncategorized' ? txn.category : undefined,
        });
      }
    });

    return Array.from(vendorMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [transactions, savedVendors]);

  // Filter vendors by search query
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToSpreadsheet = (vendor: VendorData) => {
    setSelectedVendor(vendor);
    setIsAddDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!selectedVendor || !user) return;

    try {
      const vendorId = `vendor-${Date.now()}`;
      const vendorRef = doc(db, 'vendors', vendorId);
      const now = Timestamp.now();

      await setDoc(vendorRef, {
        userId: user.uid,
        name: selectedVendor.name,
        totalSpent: selectedVendor.totalSpent,
        createdAt: now,
        updatedAt: now,
      });

      toast({
        title: "Vendor added to spreadsheet",
        description: `${selectedVendor.name} has been saved`,
      });

      setIsAddDialogOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Error",
        description: "Failed to save vendor",
        variant: "destructive",
      });
    }
  };

  const handleToggleVendor = (vendorName: string) => {
    setSelectedVendorNames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorName)) {
        newSet.delete(vendorName);
      } else {
        newSet.add(vendorName);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedVendorNames.size === filteredVendors.length) {
      setSelectedVendorNames(new Set());
    } else {
      setSelectedVendorNames(new Set(filteredVendors.map(v => v.name)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedVendorNames.size === 0 || !user) return;

    try {
      const now = Timestamp.now();
      const promises = Array.from(selectedVendorNames).map(async (vendorName) => {
        const vendor = vendors.find(v => v.name === vendorName);
        if (!vendor || vendor.isTracked) return;

        const vendorId = `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const vendorRef = doc(db, 'vendors', vendorId);
        
        await setDoc(vendorRef, {
          userId: user.uid,
          name: vendor.name,
          totalSpent: vendor.totalSpent,
          createdAt: now,
          updatedAt: now,
        });
      });

      await Promise.all(promises);

      toast({
        title: "Vendors added to spreadsheet",
        description: `${selectedVendorNames.size} vendor${selectedVendorNames.size > 1 ? 's' : ''} added`,
      });

      setSelectedVendorNames(new Set());
    } catch (error) {
      console.error('Error saving vendors:', error);
      toast({
        title: "Error",
        description: "Failed to save vendors",
        variant: "destructive",
      });
    }
  };

  const totalTracked = savedVendors.reduce((sum, v) => sum + v.totalSpent, 0);

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Vendors
            </h1>
            <p className="text-muted-foreground">
              Track spending by vendor and add to spreadsheet
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vendors
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendors.length}</div>
              <p className="text-xs text-muted-foreground">
                From last 6 months
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tracked in Spreadsheet
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedVendors.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(totalTracked)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Vendor
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendors[0] ? formatCurrency(vendors[0].totalSpent) : '$0'}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {vendors[0]?.name || 'No vendors yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Bulk Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredVendors.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="whitespace-nowrap"
              >
                {selectedVendorNames.size === filteredVendors.length ? 'Deselect All' : 'Select All'}
              </Button>
              {selectedVendorNames.size > 0 && (
                <Button
                  onClick={handleAddSelected}
                  className="whitespace-nowrap"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add {selectedVendorNames.size} to Spreadsheet
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Vendors List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Loading vendors...
            </h3>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              No vendors found
            </h3>
            <p className="text-muted-foreground">
              {transactions.length === 0 
                ? 'Add transactions to see vendor analytics' 
                : 'Try adjusting your search query'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className={cn(
                  "transition-all",
                  selectedVendorNames.has(vendor.name) && "ring-2 ring-primary"
                )}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedVendorNames.has(vendor.name)}
                        onChange={() => handleToggleVendor(vendor.name)}
                        disabled={vendor.isTracked}
                        className="h-5 w-5 rounded border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {vendor.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {vendor.transactionCount} {vendor.transactionCount === 1 ? 'transaction' : 'transactions'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last: {new Date(vendor.lastTransaction).toLocaleDateString()}
                          </span>
                          {vendor.category && (
                            <span className="text-primary">
                              {vendor.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {formatCurrency(vendor.totalSpent)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total spent
                        </div>
                      </div>
                      
                      {vendor.isTracked ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddToSpreadsheet(vendor)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add to Spreadsheet Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor to Spreadsheet</DialogTitle>
            <DialogDescription>
              Track this vendor's spending in your cashflow spreadsheet
            </DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <div className="text-lg font-semibold">{selectedVendor.name}</div>
              </div>
              
              <div className="space-y-2">
                <Label>Total Spent (Last 6 Months)</Label>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedVendor.totalSpent)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Transactions</Label>
                  <div className="text-sm font-medium">{selectedVendor.transactionCount}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <div className="text-sm font-medium">{selectedVendor.category || 'Uncategorized'}</div>
                </div>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  This vendor will be tracked in your spreadsheet with a running total of spending.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVendor}>
              <Plus className="mr-2 h-4 w-4" />
              Add to Spreadsheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
