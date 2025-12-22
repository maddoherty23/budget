"use client";
import { useState, useEffect, useMemo } from "react";
import { useDeletedCategories } from "@/hooks/useDeletedCategories";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, orderBy as fbOrderBy, onSnapshot, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ArrowDownRight,
  Tag,
  CheckCircle2,
  ChevronDown,
  Building2,
  CreditCard,
  Landmark,
  ArrowLeftRight,
  Ban,
  GripVertical
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  formatCurrency,
  formatDate 
} from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableAccount } from "@/components/transactions/SortableAccount";

const EMOJI_MAP: Record<string, string[]> = {
  // Home & Living
  "🏠": ["home", "house", "rent", "mortgage"],
  "🏡": ["home", "house", "garden"],
  "🛋️": ["furniture", "couch", "sofa", "living"],
  "🛏️": ["bed", "bedroom", "sleep"],
  "🪴": ["plant", "garden"],
  "🧹": ["cleaning", "clean", "housekeeping"],
  "🔧": ["tools", "repair", "fix", "wrench"],
  "🔨": ["hammer", "tools", "repair", "fix", "construction"],
  // Shopping & Food
  "🛒": ["grocery", "groceries", "shopping", "cart", "supermarket"],
  "🛍️": ["shopping", "bags", "retail", "clothes"],
  "🍔": ["food", "burger", "fast food", "dining", "restaurant"],
  "🍕": ["pizza", "food", "dining"],
  "🍜": ["noodles", "ramen", "asian", "food"],
  "🍣": ["sushi", "japanese", "food"],
  "☕": ["coffee", "cafe", "drinks"],
  "🍺": ["beer", "drinks", "alcohol", "bar"],
  "🥗": ["salad", "healthy", "food"],
  "🍰": ["cake", "dessert", "bakery"],
  // Transport
  "🚗": ["car", "auto", "vehicle", "driving"],
  "⛽": ["gas", "fuel", "petrol"],
  "🚌": ["bus", "transit", "public transport"],
  "🚇": ["subway", "metro", "train", "transit"],
  "🚕": ["taxi", "uber", "lyft", "rideshare"],
  "✈️": ["plane", "flight", "travel", "airline", "vacation"],
  "🚲": ["bike", "bicycle", "cycling"],
  "🛵": ["scooter", "motorcycle"],
  // Bills & Finance
  "💡": ["electricity", "utilities", "power", "light", "bills"],
  "💧": ["water", "utilities", "bills"],
  "📱": ["phone", "mobile", "cell", "telecom"],
  "💳": ["credit card", "payment", "card"],
  "💰": ["money", "savings", "cash", "income"],
  "🏦": ["bank", "banking", "finance"],
  "📊": ["investing", "stocks", "finance", "chart"],
  "💵": ["cash", "money", "dollar"],
  // Health & Fitness
  "💊": ["medicine", "pharmacy", "health", "pills", "drugs"],
  "🏥": ["hospital", "medical", "doctor", "health"],
  "🏋️": ["gym", "fitness", "workout", "exercise"],
  "🧘": ["yoga", "meditation", "wellness"],
  "🩺": ["doctor", "medical", "health"],
  "🦷": ["dental", "dentist", "teeth"],
  "💆": ["spa", "massage", "wellness", "self care"],
  // Entertainment
  "🎬": ["movies", "film", "cinema", "entertainment", "netflix"],
  "🎮": ["gaming", "games", "video games"],
  "🎵": ["music", "spotify", "streaming"],
  "🎨": ["art", "crafts", "hobbies"],
  "📺": ["tv", "television", "streaming"],
  "🎭": ["theater", "shows", "entertainment"],
  "🎪": ["circus", "events", "entertainment"],
  "🎯": ["target", "goals", "darts"],
  // Education & Work
  "📚": ["books", "education", "learning", "school"],
  "🎓": ["education", "college", "university", "school"],
  "💻": ["computer", "laptop", "tech", "electronics"],
  "📝": ["office", "supplies", "notes"],
  "🖨️": ["printer", "office", "printing"],
  "📎": ["office", "supplies", "paperclip"],
  // Pets & Family
  "🐕": ["dog", "pet", "pets"],
  "🐈": ["cat", "pet", "pets"],
  "👶": ["baby", "kids", "children", "family"],
  "👨‍👩‍👧": ["family", "kids", "children"],
  "🍼": ["baby", "infant", "kids"],
  // Sports & Hobbies
  "⚽": ["soccer", "football", "sports"],
  "🏀": ["basketball", "sports"],
  "🎾": ["tennis", "sports"],
  "⛳": ["golf", "golfing", "sports"],
  "🏌️": ["golf", "golfing", "sports"],
  "🎣": ["fishing", "hobbies"],
  "🏄": ["surfing", "beach", "sports"],
  "⛷️": ["skiing", "winter", "sports"],
  "🎿": ["skiing", "winter", "sports"],
  // Travel & Vacation
  "🏖️": ["beach", "vacation", "travel"],
  "🏕️": ["camping", "outdoors", "vacation"],
  "🗺️": ["travel", "map", "vacation"],
  "🧳": ["luggage", "travel", "vacation"],
  "🏨": ["hotel", "lodging", "travel"],
  "🎢": ["theme park", "amusement", "fun"],
  // Savings & Goals
  "🛡️": ["insurance", "protection", "emergency"],
  "🎁": ["gifts", "presents", "birthday"],
  "💎": ["jewelry", "luxury"],
  "🏆": ["trophy", "goals", "achievement"],
  "⭐": ["star", "favorite", "goals"],
  "🚀": ["startup", "growth", "goals"],
  // Misc
  "❤️": ["love", "heart", "charity", "donation"],
  "🔔": ["notifications", "alerts", "subscriptions"],
  "📦": ["packages", "delivery", "amazon", "shipping"],
  "🧾": ["receipt", "bills", "expenses"],
  "✂️": ["haircut", "salon", "barber"],
  "🎀": ["ribbon", "gifts", "beauty"]
};

const EMOJI_OPTIONS = Object.keys(EMOJI_MAP);
const GROUP_OPTIONS = [
  { value: "bills", label: "Bills" },
  { value: "needs", label: "Needs" },
  { value: "wants", label: "Wants" },
  { value: "savings", label: "Savings" },
  { value: "debt", label: "Debt" },
];

// Dynamic categories list will be computed from transactions
const allCategories = ["All Categories"];

type StatusFilter = "for-review" | "categorized" | "excluded";

export default function Transactions() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("for-review");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [openAccounts, setOpenAccounts] = useState<string[]>([]);
  const [accountOrder, setAccountOrder] = useState<string[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "🏠", budgeted: "", group: "needs" });
  const [userCategories, setUserCategories] = useState<{ id: string; name: string; icon: string; budgeted: number; spent: number; group: string }[]>([]);
  const [userGroups, setUserGroups] = useState<{ value: string; label: string }[]>([]);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [pendingCategories, setPendingCategories] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const { toast } = useToast();
  
  const { deletedCategories, isDeleted } = useDeletedCategories();
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAccountDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAccountOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast({ title: "Account order updated" });
    }
  };
  
  // Use user-created categories (filtering deleted)
  const allBudgetCategories = useMemo(() => 
    userCategories.filter(cat => !isDeleted(cat.name)),
    [userCategories, deletedCategories]
  );
  
  // Merge default groups with user-created ones
  const allGroups = [...GROUP_OPTIONS, ...userGroups];
  
  // Filter emojis based on search keywords
  const filteredEmojis = emojiSearch.trim()
    ? EMOJI_OPTIONS.filter(emoji => {
        const keywords = EMOJI_MAP[emoji] || [];
        const search = emojiSearch.toLowerCase();
        return keywords.some(keyword => keyword.includes(search));
      })
    : EMOJI_OPTIONS;
    
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const value = newGroupName.trim().toLowerCase().replace(/\s+/g, '-');
    if (allGroups.some(g => g.value === value)) {
      toast({ title: "Group already exists", variant: "destructive" });
      return;
    }
    setUserGroups(prev => [...prev, { value, label: newGroupName.trim() }]);
    setNewCategory(prev => ({ ...prev, group: value }));
    setNewGroupName("");
    setIsAddingGroup(false);
    toast({ title: "Group created", description: `"${newGroupName.trim()}" added` });
  };
  
  // Fetch transactions from Firestore
  useEffect(() => {
    if (!user) {
      setIsLoadingTransactions(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      fbOrderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txns = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          accountId: data.accountId,
          description: data.description,
          amount: data.amount,
          type: data.type,
          category: data.category || 'Uncategorized',
          date: data.date?.toDate?.()?.toISOString?.().split('T')[0] || new Date().toISOString().split('T')[0],
        };
      });
      setTransactions(txns);
      setIsLoadingTransactions(false);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      setIsLoadingTransactions(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch custom categories from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'customCategories'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          icon: data.icon,
          budgeted: data.budgeted || 0,
          spent: data.spent || 0,
          group: data.group,
        };
      });
      setUserCategories(cats);
    }, (error) => {
      console.error('Error fetching categories:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch connected accounts from Firestore
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
      
      // Initialize open/order state when accounts load
      const accountIds = accts.map(a => a.id);
      setOpenAccounts(accountIds);
      setAccountOrder(accountIds);
    }, (error) => {
      console.error('Error fetching accounts:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Check if we came from dashboard with uncategorized filter
  useEffect(() => {
    if (searchParams.get('filter') === 'uncategorized') {
      setStatusFilter("for-review");
    }
  }, [searchParams]);
  
  // Count transactions by status
  const forReviewCount = transactions.filter(t => !t.category || t.category === "Uncategorized").length;
  const categorizedCount = transactions.filter(t => t.category && t.category !== "Uncategorized" && t.category !== "Exclude").length;
  const excludedCount = transactions.filter(t => t.category === "Exclude").length;

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesAccount = selectedAccount === "all" || transaction.accountId === selectedAccount;
    const isUncategorized = !transaction.category || transaction.category === "Uncategorized";
    const isExcluded = transaction.category === "Exclude";
    const isCategorized = transaction.category && transaction.category !== "Uncategorized" && transaction.category !== "Exclude";
    
    // Status filter (like QuickBooks tabs)
    const matchesStatus = 
      (statusFilter === "for-review" && isUncategorized) ||
      (statusFilter === "categorized" && isCategorized) ||
      (statusFilter === "excluded" && isExcluded);
    
    // Category filter (additional filter within status)
    const matchesCategory = 
      selectedCategory === "All Categories" || 
      transaction.category === selectedCategory;
    
    return matchesSearch && matchesAccount && matchesStatus && matchesCategory;
  });
  
  const handleCategorySelect = (transactionId: string, category: string) => {
    setPendingCategories(prev => ({ ...prev, [transactionId]: category }));
  };
  
  const handleAddTransaction = async (transactionId: string) => {
    const category = pendingCategories[transactionId];
    if (!category || category === "Uncategorized") return;
    
    try {
      // Update in Firestore
      const transactionRef = doc(db, 'transactions', transactionId);
      await setDoc(transactionRef, {
        category,
        updatedAt: Timestamp.now(),
      }, { merge: true });
      
      setPendingCategories(prev => {
        const updated = { ...prev };
        delete updated[transactionId];
        return updated;
      });
      
      toast({
        title: category === "Exclude" ? "Transaction excluded" : "Transaction categorized",
        description: `Moved to ${category === "Exclude" ? "Excluded" : "Categorized"}`,
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to categorize transaction",
        variant: "destructive",
      });
    }
  };

  // Group transactions by account
  const groupedByAccount = filteredTransactions.reduce((groups, transaction) => {
    const accountId = transaction.accountId;
    if (!groups[accountId]) {
      groups[accountId] = [];
    }
    groups[accountId].push(transaction);
    return groups;
  }, {} as Record<string, any[]>);

  // Group transactions by date within each account
  const groupTransactionsByDate = (transactions: any[]) => {
    return transactions.reduce((groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, any[]>);
  };

  const toggleAccount = (accountId: string) => {
    setOpenAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Landmark className="h-5 w-5" />;
      case 'savings': return <Building2 className="h-5 w-5" />;
      case 'credit': return <CreditCard className="h-5 w-5" />;
      default: return <Landmark className="h-5 w-5" />;
    }
  };


  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to create categories",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Save to Firestore
      const categoryId = `user-${Date.now()}`;
      const categoryRef = doc(db, 'customCategories', categoryId);
      const now = Timestamp.now();
      
      await setDoc(categoryRef, {
        userId: user.uid,
        name: newCategory.name.trim(),
        icon: newCategory.icon,
        budgeted: parseFloat(newCategory.budgeted) || 0,
        spent: 0,
        group: newCategory.group,
        createdAt: now,
        updatedAt: now,
      });
      
      toast({
        title: "Category created",
        description: `"${newCategory.name}" has been added to your categories`,
      });
      setNewCategory({ name: "", icon: "🏠", budgeted: "", group: "needs" });
      setIsAddCategoryOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = allBudgetCategories.find(c => c.name === categoryName);
    return category?.icon || "💰";
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Transactions
            </h1>
            <p className="text-muted-foreground">
              See where your money goes
            </p>
          </div>
          <Button onClick={() => setIsAddCategoryOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* QuickBooks-style Status Tabs */}
        <div className="flex items-center gap-1 rounded-full bg-secondary/50 p-1 w-fit">
          <button
            onClick={() => setStatusFilter("for-review")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === "for-review"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            For review ({forReviewCount})
          </button>
          <button
            onClick={() => setStatusFilter("categorized")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === "categorized"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Categorized
          </button>
          <button
            onClick={() => setStatusFilter("excluded")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === "excluded"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Excluded
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {statusFilter === "categorized" && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Status-specific messages */}
        {statusFilter === "for-review" && forReviewCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {forReviewCount} {forReviewCount === 1 ? 'transaction needs' : 'transactions need'} categorizing
              </p>
              <p className="text-sm text-muted-foreground">
                Assign a category or exclude internal transfers
              </p>
            </div>
          </motion.div>
        )}

        {statusFilter === "for-review" && forReviewCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-xl border border-success/30 bg-success/5 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                All transactions have been categorized
              </p>
            </div>
          </motion.div>
        )}

        {/* Transactions List - Grouped by Account */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleAccountDragEnd}
        >
          <SortableContext items={accountOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {accountOrder.map((accountId) => {
                const account = accounts.find(a => a.id === accountId);
                if (!account) return null;
                
                const accountTransactions = groupedByAccount[account.id] || [];
                const transactionsByDate = groupTransactionsByDate(accountTransactions);
                const isOpen = openAccounts.includes(account.id);
                
                // Calculate account totals for this period
                const totalIn = accountTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const totalOut = accountTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

                if (selectedAccount !== "all" && selectedAccount !== account.id) return null;

                return (
                  <SortableAccount
                    key={account.id}
                    account={account}
                    isOpen={isOpen}
                    onToggle={() => toggleAccount(account.id)}
                    transactionCount={accountTransactions.length}
                  >
                    {accountTransactions.length > 0 ? (
                      <div className="border-t border-border">
                        {/* Account Summary Row */}
                        <div className="flex items-center justify-between bg-secondary/30 px-4 py-2 text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">This period:</span>
                            <span className="text-success">+{formatCurrency(totalIn)} in</span>
                            <span className="text-foreground">-{formatCurrency(totalOut)} out</span>
                          </div>
                        </div>

                        {/* Transactions by Date */}
                        {Object.entries(transactionsByDate)
                          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                          .map(([date, dateTransactions]) => (
                            <div key={date}>
                              <div className="bg-secondary/20 px-4 py-2 text-xs font-medium text-muted-foreground">
                                {formatDate(date)}
                              </div>
                              {dateTransactions.map((transaction, index) => {
                                const isIncome = transaction.type === "income";
                                const isUncategorized = !transaction.category || transaction.category === "Uncategorized";
                                const isExcluded = transaction.category === "Exclude";
                                const showSimpleView = statusFilter === "categorized" || statusFilter === "excluded";

                                return (
                                  <div
                                    key={transaction.id}
                                    className={cn(
                                      "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/30",
                                      index !== dateTransactions.length - 1 && "border-b border-border/50",
                                      isUncategorized && "bg-warning/5"
                                    )}
                                  >
                                    {/* Checkbox for simple view */}
                                    {showSimpleView && (
                                      <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-border"
                                      />
                                    )}

                                    {/* Icon - only show in for-review */}
                                    {!showSimpleView && (
                                      <div className={cn(
                                        "flex h-9 w-9 items-center justify-center rounded-lg",
                                        isExcluded ? "bg-muted" :
                                        isIncome ? "bg-success/10" : 
                                        isUncategorized ? "bg-warning/10" : "bg-secondary"
                                      )}>
                                        {isExcluded ? (
                                          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                                        ) : isIncome ? (
                                          <ArrowDownRight className="h-4 w-4 text-success" />
                                        ) : isUncategorized ? (
                                          <Tag className="h-4 w-4 text-warning" />
                                        ) : (
                                          <span className="text-base">{getCategoryIcon(transaction.category)}</span>
                                        )}
                                      </div>
                                    )}

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate text-sm text-foreground">
                                        {transaction.description}
                                      </p>
                                      {!showSimpleView && (
                                        <Select 
                                          value={pendingCategories[transaction.id] || transaction.category || "Uncategorized"}
                                          onValueChange={(value) => handleCategorySelect(transaction.id, value)}
                                        >
                                          <SelectTrigger className={cn(
                                            "h-6 w-auto border-0 bg-transparent p-0 text-xs hover:bg-secondary/50",
                                            (pendingCategories[transaction.id] && pendingCategories[transaction.id] !== "Uncategorized") 
                                              ? "text-primary font-medium" 
                                              : isUncategorized 
                                                ? "text-warning" 
                                                : "text-muted-foreground"
                                          )}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Uncategorized">
                                              <span className="flex items-center gap-2">
                                                <Tag className="h-3 w-3" />
                                                Uncategorized
                                              </span>
                                            </SelectItem>
                                            {allBudgetCategories.map((cat) => (
                                              <SelectItem key={cat.id} value={cat.name}>
                                                <span className="flex items-center gap-2">
                                                  <span>{cat.icon}</span>
                                                  {cat.name}
                                                </span>
                                              </SelectItem>
                                            ))}
                                            <SelectItem value="Exclude">
                                              <span className="flex items-center gap-2 text-muted-foreground">
                                                <Ban className="h-3 w-3" />
                                                Exclude (Transfer/Internal)
                                              </span>
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                      {showSimpleView && transaction.category && (
                                        <p className="text-xs text-muted-foreground">{transaction.category}</p>
                                      )}
                                    </div>

                                    {/* Amount and Add button */}
                                    <div className="flex items-center gap-2">
                                      <p className={cn(
                                        "font-semibold whitespace-nowrap",
                                        isIncome ? "text-success" : "text-foreground"
                                      )}>
                                        {isIncome ? "+" : "-"}{formatCurrency(Math.abs(transaction.amount))}
                                      </p>
                                      
                                      {/* Show Add button when a pending category is selected */}
                                      {pendingCategories[transaction.id] && pendingCategories[transaction.id] !== "Uncategorized" && (
                                        <Button
                                          size="sm"
                                          className="h-7 px-3"
                                          onClick={() => handleAddTransaction(transaction.id)}
                                        >
                                          Add
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="border-t border-border px-4 py-8 text-center text-muted-foreground">
                        No transactions found for this account
                      </div>
                    )}
                  </SortableAccount>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {isLoadingTransactions ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Loading transactions...
            </h3>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              No transactions found
            </h3>
            <p className="text-muted-foreground">
              {transactions.length === 0 ? 'Connect a bank account to see your transactions' : 'Try adjusting your filters or search query'}
            </p>
          </div>
        ) : null}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={(open) => {
        setIsAddCategoryOpen(open);
        if (!open) setEmojiSearch("");
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a budget category to organize your transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-1 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Groceries, Entertainment"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search emojis (e.g., food, gym, car)..."
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                />
                <div className="max-h-32 overflow-y-auto rounded-lg border border-border p-2">
                  <div className="flex flex-wrap gap-2">
                    {filteredEmojis.map((emoji, idx) => (
                      <button
                        key={`${emoji}-${idx}`}
                        type="button"
                        onClick={() => setNewCategory(prev => ({ ...prev, icon: emoji }))}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border-2 text-lg transition-colors",
                          newCategory.icon === emoji
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:border-primary/50 hover:bg-secondary"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                    {filteredEmojis.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No emojis found</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Selected: {newCategory.icon}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-group">Category Group</Label>
              {isAddingGroup ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="New group name..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleAddGroup}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsAddingGroup(false); setNewGroupName(""); }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select 
                  value={newCategory.group} 
                  onValueChange={(value) => {
                    if (value === "__add_new__") {
                      setIsAddingGroup(true);
                    } else {
                      setNewCategory(prev => ({ ...prev, group: value }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allGroups.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <div className="border-t border-border my-1" />
                    <SelectItem value="__add_new__" className="text-primary">
                      <span className="flex items-center gap-2">
                        <Plus className="h-3 w-3" /> Add new group...
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-budget">Monthly Budget (optional)</Label>
              <Input
                id="category-budget"
                type="number"
                placeholder="0.00"
                value={newCategory.budgeted}
                onChange={(e) => setNewCategory(prev => ({ ...prev, budgeted: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
