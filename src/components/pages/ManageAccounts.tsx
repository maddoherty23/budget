"use client";
import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Landmark, 
  Trash2, 
  RefreshCw, 
  Edit3,
  MoreVertical,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  useAuth,
  getConnectedAccounts,
  updateConnectedAccount,
  deleteConnectedAccount,
  type ConnectedAccount,
  where,
  orderBy
} from "@/lib/firebase";
import { onSnapshot, collection, query as firestoreQuery } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ManageAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    balanceCurrent: "",
    balanceAvailable: "",
  });

  // Real-time listener for connected accounts
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    const accountsQuery = firestoreQuery(
      collection(db, 'connectedAccounts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(accountsQuery, (snapshot) => {
      const accountsData: ConnectedAccount[] = [];
      snapshot.forEach((doc) => {
        accountsData.push({
          id: doc.id,
          ...doc.data(),
        } as ConnectedAccount);
      });
      setAccounts(accountsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleEditBalance = (account: ConnectedAccount) => {
    setSelectedAccount(account);
    setEditForm({
      balanceCurrent: account.balanceCurrent?.toString() || "",
      balanceAvailable: account.balanceAvailable?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveBalance = async () => {
    if (!selectedAccount?.id) return;

    try {
      const balanceCurrent = parseFloat(editForm.balanceCurrent) || null;
      const balanceAvailable = parseFloat(editForm.balanceAvailable) || null;

      await updateConnectedAccount(selectedAccount.id, {
        balanceCurrent,
        balanceAvailable,
      });

      toast.success("Account balance updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error("Failed to update account balance");
    }
  };

  const handleDeleteAccount = (account: ConnectedAccount) => {
    setSelectedAccount(account);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!selectedAccount?.id) return;

    try {
      await deleteConnectedAccount(selectedAccount.id);
      toast.success("Account deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const getAccountIcon = (account: ConnectedAccount) => {
    if (account.type === "credit" || account.subtype === "credit card") {
      return <CreditCard className="h-6 w-6" />;
    }
    return <Landmark className="h-6 w-6" />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manage Accounts</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your connected bank accounts
        </p>
      </div>

      {accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No accounts connected
          </h3>
          <p className="text-muted-foreground mb-4">
            Connect a bank account to get started
          </p>
          <Button asChild>
            <a href="/connect-bank">Connect Bank Account</a>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg",
                  account.type === "credit" || account.subtype === "credit card"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}>
                  {getAccountIcon(account)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {account.officialName || account.name}
                    </h3>
                    {account.mask && (
                      <span className="text-sm text-muted-foreground">
                        ••{account.mask}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {account.institutionName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {account.subtype || account.type}
                    {account.status !== "active" && (
                      <span className="ml-2 text-orange-600">
                        • {account.status}
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right mr-4">
                  {account.balanceCurrent !== null ? (
                    <>
                      <p className={cn(
                        "text-lg font-semibold",
                        account.balanceCurrent < 0 ? "text-destructive" : "text-foreground"
                      )}>
                        ${Math.abs(account.balanceCurrent).toLocaleString('en-US', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </p>
                      {account.balanceAvailable !== null && account.balanceAvailable !== account.balanceCurrent && (
                        <p className="text-xs text-muted-foreground">
                          Available: ${account.balanceAvailable.toLocaleString('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Balance unavailable</p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditBalance(account)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Update Balance
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteAccount(account)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Balance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Account Balance</DialogTitle>
            <DialogDescription>
              Manually update the balance for {selectedAccount?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="balanceCurrent">Current Balance</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="balanceCurrent"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9"
                  value={editForm.balanceCurrent}
                  onChange={(e) => setEditForm({ ...editForm, balanceCurrent: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceAvailable">Available Balance</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="balanceAvailable"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9"
                  value={editForm.balanceAvailable}
                  onChange={(e) => setEditForm({ ...editForm, balanceAvailable: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBalance}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAccount?.name}? This action cannot be undone.
              Transactions associated with this account will remain but won't be linked to an account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAccount}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
