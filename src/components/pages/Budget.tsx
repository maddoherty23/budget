"use client";
import { useState, useEffect, useMemo } from "react";
import { useDeletedCategories } from "@/hooks/useDeletedCategories";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Sparkles,
  Pencil,
  Trash2,
  Calendar,
  GripVertical
} from "lucide-react";
import { format, subMonths, addMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  formatCurrency,
  type BudgetCategory 
} from "@/lib/mockData";
import { collection, query, where, onSnapshot, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
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

const defaultCategoryGroups = {
  needs: { name: "Everyday Needs", icon: "🛒", description: "Essentials like groceries, gas, utilities" },
  wants: { name: "Fun & Lifestyle", icon: "🎉", description: "Entertainment, dining out, shopping" },
  bills: { name: "Monthly Bills", icon: "🏠", description: "Rent, utilities, subscriptions" },
  savings: { name: "Savings Goals", icon: "🎯", description: "Emergency fund, vacation, investments" },
  debt: { name: "Debt Payments", icon: "💳", description: "Credit cards, loans, mortgages" },
};

const EMOJI_MAP: Record<string, string[]> = {
  // Home & Living
  "🏠": ["home", "house", "rent", "mortgage"],
  "🏡": ["home", "house", "garden"],
  "🏢": ["office", "building", "work"],
  "🛋️": ["furniture", "couch", "sofa", "living"],
  "🛏️": ["bed", "bedroom", "sleep"],
  "🚿": ["shower", "bathroom"],
  "🧹": ["cleaning", "clean", "housekeeping"],
  "🧺": ["laundry", "clothes", "cleaning"],
  "🪴": ["plant", "garden"],
  "💡": ["electricity", "utilities", "power", "light", "bills"],
  // Transportation
  "🚗": ["car", "auto", "vehicle", "driving"],
  "🚙": ["suv", "car", "vehicle"],
  "🏎️": ["sports car", "racing"],
  "🚕": ["taxi", "uber", "lyft", "rideshare"],
  "🚌": ["bus", "transit", "public transport"],
  "🚇": ["subway", "metro", "train", "transit"],
  "✈️": ["plane", "flight", "travel", "airline", "vacation"],
  "⛽": ["gas", "fuel", "petrol"],
  "🅿️": ["parking"],
  "🛞": ["tires", "wheels", "car maintenance"],
  // Food & Drink
  "🛒": ["grocery", "groceries", "shopping", "cart", "supermarket"],
  "🍔": ["food", "burger", "fast food", "dining", "restaurant"],
  "🍕": ["pizza", "food", "dining"],
  "🍝": ["pasta", "italian", "food"],
  "🍣": ["sushi", "japanese", "food"],
  "🥗": ["salad", "healthy", "food"],
  "☕": ["coffee", "cafe", "drinks"],
  "🍺": ["beer", "drinks", "alcohol", "bar"],
  "🍷": ["wine", "drinks", "alcohol"],
  "🧁": ["dessert", "cupcake", "bakery", "sweets"],
  // Entertainment
  "🎬": ["movies", "film", "cinema", "entertainment", "netflix"],
  "🎮": ["gaming", "games", "video games"],
  "🎵": ["music", "spotify", "streaming"],
  "🎤": ["karaoke", "singing", "music"],
  "🎧": ["headphones", "music", "audio"],
  "📺": ["tv", "television", "streaming"],
  "🎭": ["theater", "shows", "entertainment"],
  "🎪": ["circus", "events", "entertainment"],
  "🎨": ["art", "crafts", "hobbies"],
  "📚": ["books", "education", "learning", "school"],
  // Technology
  "📱": ["phone", "mobile", "cell", "telecom"],
  "💻": ["computer", "laptop", "tech", "electronics"],
  "🖥️": ["desktop", "computer", "monitor"],
  "⌚": ["watch", "smartwatch", "apple watch"],
  "📷": ["camera", "photography"],
  "🔌": ["electronics", "charging", "power"],
  "📡": ["internet", "wifi", "cable"],
  "💾": ["storage", "backup", "tech"],
  "🎙️": ["podcast", "microphone", "audio"],
  "🔋": ["battery", "power", "charging"],
  // Health & Fitness
  "🏥": ["hospital", "medical", "doctor", "health"],
  "💊": ["medicine", "pharmacy", "health", "pills", "drugs"],
  "🏋️": ["gym", "fitness", "workout", "exercise"],
  "🧘": ["yoga", "meditation", "wellness"],
  "🚴": ["cycling", "bike", "exercise"],
  "⚽": ["soccer", "football", "sports"],
  "🎾": ["tennis", "sports"],
  "🏊": ["swimming", "pool", "sports"],
  "🥊": ["boxing", "martial arts", "sports"],
  "🧠": ["therapy", "mental health", "psychology"],
  // Shopping & Fashion
  "🛍️": ["shopping", "bags", "retail", "clothes"],
  "👗": ["dress", "clothes", "fashion"],
  "👔": ["shirt", "work clothes", "fashion"],
  "👟": ["shoes", "sneakers", "footwear"],
  "👜": ["purse", "handbag", "accessories"],
  "💄": ["makeup", "cosmetics", "beauty"],
  "💅": ["nails", "manicure", "beauty"],
  "💇": ["haircut", "salon", "barber"],
  "👓": ["glasses", "eyewear", "optician"],
  // Money & Business
  "💳": ["credit card", "payment", "card"],
  "💰": ["money", "savings", "cash", "income"],
  "💵": ["cash", "money", "dollar"],
  "💸": ["spending", "expenses", "money"],
  "📊": ["investing", "stocks", "finance", "chart"],
  "📈": ["investments", "stocks", "growth"],
  "💼": ["work", "business", "job"],
  "🏦": ["bank", "banking", "finance"],
  "🧾": ["receipt", "bills", "expenses"],
  "📝": ["office", "supplies", "notes"],
  // Family & Pets
  "👶": ["baby", "kids", "children", "family"],
  "👨‍👩‍👧": ["family", "kids", "children"],
  "🐕": ["dog", "pet", "pets"],
  "🐈": ["cat", "pet", "pets"],
  "🐾": ["pets", "animals"],
  "🧸": ["toys", "kids", "children"],
  "🍼": ["baby", "infant", "kids"],
  "🎒": ["school", "backpack", "kids"],
  "🎓": ["education", "college", "university", "school"],
  "👴": ["elderly", "parents", "family"],
  // Travel & Outdoors
  "🏖️": ["beach", "vacation", "travel"],
  "⛺": ["camping", "outdoors", "vacation"],
  "🏔️": ["mountain", "hiking", "outdoors"],
  "🚢": ["cruise", "ship", "travel"],
  "🎢": ["theme park", "amusement", "fun"],
  "🗺️": ["travel", "map", "vacation"],
  "🧳": ["luggage", "travel", "vacation"],
  "🏕️": ["camping", "outdoors"],
  "🎿": ["skiing", "winter", "sports"],
  "🏄": ["surfing", "beach", "sports"],
  // Utilities & Services
  "📧": ["email", "mail", "communication"],
  "📞": ["phone", "telephone", "calls"],
  "💧": ["water", "utilities", "bills"],
  "🔥": ["heating", "gas", "utilities"],
  "❄️": ["cooling", "ac", "utilities"],
  "📬": ["mail", "postage", "shipping"],
  "🔧": ["tools", "repair", "fix", "wrench"],
  "🛠️": ["tools", "repair", "maintenance"],
  "🧰": ["toolbox", "repair", "maintenance"],
  "🔑": ["keys", "locksmith", "security"],
  // Gifts & Special
  "🎁": ["gifts", "presents", "birthday"],
  "🎂": ["birthday", "cake", "celebration"],
  "💐": ["flowers", "bouquet", "gifts"],
  "💒": ["wedding", "marriage"],
  "🎄": ["christmas", "holiday", "gifts"],
  "🎃": ["halloween", "holiday"],
  "🎉": ["party", "celebration", "events"],
  "🎊": ["celebration", "party", "confetti"],
  "💝": ["valentine", "love", "gifts"],
  "✨": ["special", "luxury"],
  // Sports & Hobbies
  "⛳": ["golf", "golfing", "sports"],
  "🏌️": ["golf", "golfing", "sports"],
  "🎣": ["fishing", "hobbies"],
  "⛷️": ["skiing", "winter", "sports"],
  "🏀": ["basketball", "sports"],
  "🔨": ["hammer", "tools", "repair", "fix", "construction"],
  // Miscellaneous
  "📦": ["packages", "delivery", "amazon", "shipping"],
  "🛡️": ["insurance", "protection", "emergency"],
  "⚖️": ["legal", "lawyer", "law"],
  "🏛️": ["government", "taxes", "civic"],
  "💎": ["jewelry", "luxury"],
  "🔔": ["notifications", "alerts", "subscriptions"],
  "📌": ["misc", "other", "pin"],
  "🏷️": ["labels", "tags", "misc"],
  "⭐": ["star", "favorite", "goals"],
  "❤️": ["love", "heart", "charity", "donation"],
};

const EMOJI_OPTIONS = Object.keys(EMOJI_MAP);

// Sortable Group Component
interface SortableGroupProps {
  group: {
    key: string;
    name: string;
    icon: string;
    categories: BudgetCategory[];
  };
  isExpanded: boolean;
  onToggle: () => void;
  onAddCategory: () => void;
  onEditCategory: (category: BudgetCategory) => void;
  onDeleteCategory: (category: BudgetCategory) => void;
  onBudgetChange: (categoryId: string, newBudget: string) => void;
}

function SortableGroup({
  group,
  isExpanded,
  onToggle,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onBudgetChange,
}: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        isDragging && "shadow-lg opacity-90"
      )}
    >
      {/* Group Header */}
      <div className="flex w-full items-center justify-between px-5 py-4 hover:bg-secondary/50">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-2 hover:bg-secondary rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={onToggle} className="flex items-center gap-3">
            <span className="text-xl">{group.icon}</span>
            <span className="font-semibold text-foreground">{group.name}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {group.categories.length}
            </span>
          </button>
        </div>
        <button onClick={onToggle} className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(group.categories.reduce((sum, c) => sum + c.spent, 0))}
            </p>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(group.categories.reduce((sum, c) => sum + c.budgeted, 0))}
            </p>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Categories */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            {/* Table Header */}
            <div className="hidden grid-cols-12 gap-4 border-b border-border bg-secondary/30 px-5 py-2 text-xs font-medium uppercase text-muted-foreground sm:grid">
              <div className="col-span-5">Category</div>
              <div className="col-span-2 text-right">Budgeted</div>
              <div className="col-span-2 text-right">Spent</div>
              <div className="col-span-3 text-right">Remaining</div>
            </div>

            {group.categories.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground">
                <p className="mb-2">No categories yet</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onAddCategory}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first category
                </Button>
              </div>
            ) : (
              group.categories.map((category) => {
                const remaining = category.budgeted - category.spent;
                const percentage = category.budgeted > 0 
                  ? (category.spent / category.budgeted) * 100 
                  : 0;
                const isOver = remaining < 0;

                return (
                  <div
                    key={category.id}
                    className="border-b border-border last:border-0 group/row"
                  >
                    {/* Desktop View */}
                    <div className="hidden grid-cols-12 items-center gap-4 px-5 py-3 sm:grid">
                      <div className="col-span-5 flex items-center gap-3">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="relative inline-block w-24">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                          <Input
                            type="number"
                            value={category.budgeted}
                            onChange={(e) => onBudgetChange(category.id, e.target.value)}
                            className="h-8 pl-5 text-right text-sm"
                            min={0}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-foreground">
                        {formatCurrency(category.spent)}
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <span className={cn(
                          "font-medium",
                          isOver ? "text-destructive" : "text-foreground"
                        )}>
                          {formatCurrency(remaining)}
                        </span>
                        <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onEditCategory(category)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onDeleteCategory(category)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="sm:hidden px-5 py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium text-foreground">{category.name}</span>
                        </div>
                        <span className={cn(
                          "font-medium",
                          isOver ? "text-destructive" : "text-foreground"
                        )}>
                          {formatCurrency(remaining)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditCategory(category)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteCategory(category)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full transition-all",
                            isOver ? "bg-destructive" : percentage > 80 ? "bg-warning" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Spent: {formatCurrency(category.spent)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Budget:</span>
                          <div className="relative w-20">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={category.budgeted}
                              onChange={(e) => onBudgetChange(category.id, e.target.value)}
                              className="h-8 pl-5 text-right text-sm"
                              min={0}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Add Category Button */}
            <button 
              onClick={onAddCategory}
              className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add category to {group.name}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Budget() {
  const { user } = useAuth();
  const { deletedCategories, isDeleted } = useDeletedCategories();
  
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categoryGroups, setCategoryGroups] = useState(defaultCategoryGroups);
  const [groupOrder, setGroupOrder] = useState<string[]>(Object.keys(defaultCategoryGroups));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(Object.keys(defaultCategoryGroups))
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string | null>(null);
  
  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📦");
  const [newCategoryGroup, setNewCategoryGroup] = useState<string>("needs");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  
  // Filter out deleted categories for display
  const activeCategories = useMemo(() => 
    categories.filter(cat => !isDeleted(cat.name)),
    [categories, deletedCategories]
  );
  
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setGroupOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success("Group order updated");
    }
  };
  
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
    if (Object.keys(categoryGroups).includes(value)) {
      toast.error("Group already exists");
      return;
    }
    setCategoryGroups(prev => ({
      ...prev,
      [value]: { name: newGroupName.trim(), icon: "📁", description: "Custom category group" }
    }));
    setGroupOrder(prev => [...prev, value]);
    setNewCategoryGroup(value);
    setNewGroupName("");
    setIsAddingGroup(false);
    toast.success(`"${newGroupName.trim()}" group added`);
  };

  // Load categories from Firebase
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
          group: data.group as BudgetCategory['group'],
        };
      });
      setCategories(cats);
    });

    return () => unsubscribe();
  }, [user]);

  // Load transactions from Firebase (current month for budget calculations)
  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthPath = `transactions/${user.uid}/${currentMonth}`;
    const monthCollection = collection(db, monthPath);

    const unsubscribe = onSnapshot(monthCollection, (snapshot) => {
      const txns = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          type: data.type,
          date: data.date?.toDate?.() || new Date(),
        };
      });
      setTransactions(txns);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate monthly income from transactions
  const monthlyIncome = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(t => {
        const txnDate = t.date;
        return t.type === 'income' && 
               txnDate.getMonth() === currentMonth && 
               txnDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const unassigned = monthlyIncome - totalBudgeted;

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const handleBudgetChange = async (categoryId: string, newBudget: string) => {
    const amount = parseFloat(newBudget) || 0;
    
    // Update locally first for immediate UI feedback
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, budgeted: amount } : c))
    );

    // Save to Firebase
    try {
      const categoryRef = doc(db, 'customCategories', categoryId);
      await setDoc(categoryRef, {
        budgeted: amount,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const resetForm = () => {
    setNewCategoryName("");
    setNewCategoryIcon("📦");
    setNewCategoryGroup("needs");
    setNewCategoryBudget("");
    setEditingCategory(null);
    setSelectedGroupForAdd(null);
    setEmojiSearch("");
    setIsAddingGroup(false);
    setNewGroupName("");
  };

  const openAddDialog = (groupKey?: string) => {
    resetForm();
    if (groupKey) {
      setNewCategoryGroup(groupKey as BudgetCategory["group"]);
      setSelectedGroupForAdd(groupKey);
    }
    setAddDialogOpen(true);
  };

  const openEditDialog = (category: BudgetCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryIcon(category.icon);
    setNewCategoryGroup(category.group);
    setNewCategoryBudget(category.budgeted.toString());
    setAddDialogOpen(true);
  };

  const handleSaveCategory = () => {
    const trimmedName = newCategoryName.trim();
    
    if (!trimmedName) {
      toast.error("Please enter a category name");
      return;
    }
    
    if (trimmedName.length > 50) {
      toast.error("Category name must be less than 50 characters");
      return;
    }

    const budget = parseFloat(newCategoryBudget) || 0;
    if (budget < 0) {
      toast.error("Budget cannot be negative");
      return;
    }

    if (editingCategory) {
      // Update existing category
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? { ...c, name: trimmedName, icon: newCategoryIcon, group: newCategoryGroup as BudgetCategory["group"], budgeted: budget }
            : c
        )
      );
      toast.success(`"${trimmedName}" updated`);
    } else {
      // Add new category
      const newCategory: BudgetCategory = {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        icon: newCategoryIcon,
        budgeted: budget,
        spent: 0,
        group: newCategoryGroup as BudgetCategory["group"],
      };
      setCategories((prev) => [...prev, newCategory]);
      toast.success(`"${trimmedName}" added to your budget`);
    }

    setAddDialogOpen(false);
    resetForm();
  };

  const handleDeleteCategory = (category: BudgetCategory) => {
    // Remove from budget view only (not archived permanently)
    setCategories((prev) => prev.filter((c) => c.id !== category.id));
    toast.success(`"${category.name}" removed from budget`);
  };

  const groupedCategories = groupOrder
    .filter(key => categoryGroups[key as keyof typeof categoryGroups])
    .map((key) => {
      const group = categoryGroups[key as keyof typeof categoryGroups];
      return {
        key,
        ...group,
        categories: activeCategories.filter((c) => c.group === key),
      };
    });

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-20 lg:pb-6">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Monthly Budget</h1>
        
        {/* Month Selector & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Budget period</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-semibold text-foreground">
                {format(selectedMonth, "MMMM yyyy")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                disabled={isCurrentMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={() => openAddDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {/* Add/Edit Category Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? "Update your budget category details"
                  : "Create a new category like Office, Amazon, Gas, Property Tax, etc."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4 px-1 overflow-y-auto flex-1">
              {/* Category Name */}
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="e.g., Office Supplies, Amazon, Property Tax"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  maxLength={50}
                />
              </div>

              {/* Icon Picker with Search */}
              <div className="space-y-2">
                <Label>Choose an Icon</Label>
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
                          onClick={() => setNewCategoryIcon(emoji)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg border-2 text-lg transition-colors",
                            newCategoryIcon === emoji
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
                  <p className="text-xs text-muted-foreground">Selected: {newCategoryIcon}</p>
                </div>
              </div>

              {/* Category Group */}
              <div className="space-y-2">
                <Label htmlFor="category-group">Category Type</Label>
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
                    value={newCategoryGroup} 
                    onValueChange={(value) => {
                      if (value === "__add_new__") {
                        setIsAddingGroup(true);
                      } else {
                        setNewCategoryGroup(value);
                      }
                    }}
                  >
                    <SelectTrigger id="category-group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryGroups).map(([key, group]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span>{group.icon}</span>
                            <span className="font-medium">{group.name}</span>
                          </div>
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
                <p className="text-xs text-muted-foreground">
                  {(categoryGroups as Record<string, { name: string; icon: string; description: string }>)[newCategoryGroup]?.description || "Custom category group"}
                </p>
              </div>

              {/* Monthly Budget */}
              <div className="space-y-2">
                <Label htmlFor="category-budget">Monthly Budget (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="category-budget"
                    type="number"
                    placeholder="0.00"
                    value={newCategoryBudget}
                    onChange={(e) => setNewCategoryBudget(e.target.value)}
                    className="pl-7"
                    min={0}
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You can always adjust this later
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setAddDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSaveCategory}>
                {editingCategory ? "Save Changes" : "Add Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Budget Categories */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={groupOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {groupedCategories.map((group) => (
                <SortableGroup
                  key={group.key}
                  group={group}
                  isExpanded={expandedGroups.has(group.key)}
                  onToggle={() => toggleGroup(group.key)}
                  onAddCategory={() => openAddDialog(group.key)}
                  onEditCategory={openEditDialog}
                  onDeleteCategory={handleDeleteCategory}
                  onBudgetChange={handleBudgetChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Budget Summary */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Total Budgeted</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Total Remaining</p>
              <p className={cn(
                "text-xl font-bold",
                totalBudgeted - totalSpent >= 0 ? "text-emerald-500" : "text-destructive"
              )}>
                {formatCurrency(totalBudgeted - totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick add suggestions */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3">Popular Categories to Add</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Office Supplies", icon: "📎" },
              { name: "Amazon", icon: "📦" },
              { name: "Property Tax", icon: "🏡" },
              { name: "Home Repairs", icon: "🔧" },
              { name: "Pet Care", icon: "🐕" },
              { name: "Gym", icon: "🏋️" },
              { name: "Subscriptions", icon: "📱" },
              { name: "Medical", icon: "🏥" },
            ].map((suggestion) => (
              <Button
                key={suggestion.name}
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setNewCategoryName(suggestion.name);
                  setNewCategoryIcon(suggestion.icon);
                  setAddDialogOpen(true);
                }}
              >
                <span>{suggestion.icon}</span>
                {suggestion.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}