"use client";
import { useState, useMemo } from "react";
import { useDeletedCategories } from "@/hooks/useDeletedCategories";
import { useCustomCategories } from "@/hooks/useCustomCategories";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Archive,
  RotateCcw,
  Search,
  Tags
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMOJI_MAP: Record<string, string[]> = {
  // Home & Living
  "🏠": ["home", "house", "rent", "mortgage"],
  "🏡": ["home", "house", "garden", "property"],
  "🏢": ["office", "building", "work"],
  "🛋️": ["furniture", "couch", "sofa", "living"],
  "🛏️": ["bed", "bedroom", "sleep"],
  "🚿": ["shower", "bathroom"],
  "🧹": ["cleaning", "clean", "housekeeping"],
  "🧺": ["laundry", "clothes", "cleaning"],
  "🪴": ["plant", "garden"],
  "💡": ["electricity", "utilities", "power", "light", "bills"],
  "🔑": ["keys", "locksmith", "security"],
  "🪟": ["window", "home"],
  "🚪": ["door", "home"],
  // Transportation
  "🚗": ["car", "auto", "vehicle", "driving"],
  "🚙": ["suv", "car", "vehicle"],
  "🏎️": ["sports car", "racing"],
  "🚕": ["taxi", "uber", "lyft", "rideshare"],
  "🚌": ["bus", "transit", "public transport"],
  "🚇": ["subway", "metro", "train", "transit"],
  "🚂": ["train", "rail", "transit"],
  "✈️": ["plane", "flight", "travel", "airline", "vacation"],
  "🛫": ["departure", "flight", "travel"],
  "🛬": ["arrival", "flight", "travel"],
  "⛽": ["gas", "fuel", "petrol"],
  "🅿️": ["parking"],
  "🛞": ["tires", "wheels", "car maintenance"],
  "🚲": ["bike", "bicycle", "cycling"],
  "🛵": ["scooter", "moped"],
  "🏍️": ["motorcycle", "bike"],
  "🚁": ["helicopter", "travel"],
  "🚢": ["cruise", "ship", "travel", "boat"],
  "⛵": ["sailboat", "boat", "sailing"],
  // Food & Drink
  "🛒": ["grocery", "groceries", "shopping", "cart", "supermarket"],
  "🍔": ["food", "burger", "fast food", "dining", "restaurant"],
  "🍕": ["pizza", "food", "dining"],
  "🍝": ["pasta", "italian", "food"],
  "🍣": ["sushi", "japanese", "food"],
  "🥗": ["salad", "healthy", "food"],
  "🍜": ["noodles", "ramen", "asian", "food"],
  "🌮": ["taco", "mexican", "food"],
  "🍱": ["bento", "lunch", "food"],
  "🥪": ["sandwich", "lunch", "food"],
  "🍳": ["breakfast", "eggs", "cooking"],
  "🥐": ["bakery", "pastry", "breakfast"],
  "☕": ["coffee", "cafe", "drinks"],
  "🍵": ["tea", "drinks"],
  "🍺": ["beer", "drinks", "alcohol", "bar"],
  "🍷": ["wine", "drinks", "alcohol"],
  "🍸": ["cocktail", "drinks", "alcohol", "bar"],
  "🧁": ["dessert", "cupcake", "bakery", "sweets"],
  "🍰": ["cake", "dessert", "bakery"],
  "🍦": ["ice cream", "dessert", "treats"],
  "🍩": ["donut", "breakfast", "treats"],
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
  "🎲": ["games", "board games", "entertainment"],
  "🃏": ["cards", "games", "poker"],
  "🎯": ["darts", "games", "entertainment"],
  "🎳": ["bowling", "entertainment"],
  "🎰": ["casino", "gambling"],
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
  "🖨️": ["printer", "office"],
  "⌨️": ["keyboard", "computer"],
  "🖱️": ["mouse", "computer"],
  "📠": ["fax", "office"],
  // Health & Fitness
  "🏥": ["hospital", "medical", "doctor", "health"],
  "💊": ["medicine", "pharmacy", "health", "pills", "drugs"],
  "🏋️": ["gym", "fitness", "workout", "exercise"],
  "🧘": ["yoga", "meditation", "wellness"],
  "🚴": ["cycling", "bike", "exercise"],
  "🏃": ["running", "jogging", "exercise"],
  "🏊": ["swimming", "pool", "sports"],
  "⚽": ["soccer", "football", "sports"],
  "🏀": ["basketball", "sports"],
  "🎾": ["tennis", "sports"],
  "⛳": ["golf", "golfing", "sports"],
  "🥊": ["boxing", "martial arts", "sports"],
  "🧠": ["therapy", "mental health", "psychology"],
  "🦷": ["dentist", "dental", "health"],
  "👁️": ["optician", "eye", "vision", "health"],
  "💉": ["vaccine", "injection", "medical"],
  "🩺": ["doctor", "medical", "health"],
  "🩹": ["bandage", "first aid", "medical"],
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
  "👒": ["hat", "accessories", "fashion"],
  "🧥": ["coat", "jacket", "clothes"],
  "👕": ["tshirt", "clothes", "casual"],
  "👖": ["pants", "jeans", "clothes"],
  "🧦": ["socks", "clothes"],
  "👠": ["heels", "shoes", "fashion"],
  // Money & Business
  "💳": ["credit card", "payment", "card"],
  "💰": ["money", "savings", "cash", "income"],
  "💵": ["cash", "money", "dollar"],
  "💸": ["spending", "expenses", "money"],
  "📊": ["investing", "stocks", "finance", "chart"],
  "📈": ["investments", "stocks", "growth"],
  "📉": ["loss", "decline", "stocks"],
  "💼": ["work", "business", "job"],
  "🏦": ["bank", "banking", "finance"],
  "🧾": ["receipt", "bills", "expenses"],
  "📝": ["office", "supplies", "notes"],
  "💹": ["trading", "forex", "finance"],
  "🪙": ["coins", "crypto", "money"],
  // Family & Pets
  "👶": ["baby", "kids", "children", "family"],
  "👨‍👩‍👧": ["family", "kids", "children"],
  "👨‍👩‍👧‍👦": ["family", "kids", "children"],
  "🐕": ["dog", "pet", "pets"],
  "🐈": ["cat", "pet", "pets"],
  "🐾": ["pets", "animals"],
  "🐟": ["fish", "pet", "aquarium"],
  "🐦": ["bird", "pet"],
  "🐹": ["hamster", "pet"],
  "🧸": ["toys", "kids", "children"],
  "🍼": ["baby", "infant", "kids"],
  "🎒": ["school", "backpack", "kids"],
  "🎓": ["education", "college", "university", "school"],
  "👴": ["elderly", "parents", "family"],
  "👵": ["grandmother", "elderly", "family"],
  // Travel & Outdoors
  "🏖️": ["beach", "vacation", "travel"],
  "⛺": ["camping", "outdoors", "vacation"],
  "🏔️": ["mountain", "hiking", "outdoors"],
  "🎢": ["theme park", "amusement", "fun"],
  "🗺️": ["travel", "map", "vacation"],
  "🧳": ["luggage", "travel", "vacation"],
  "🏕️": ["camping", "outdoors"],
  "🎿": ["skiing", "winter", "sports"],
  "🏄": ["surfing", "beach", "sports"],
  "🏝️": ["island", "vacation", "tropical"],
  "🗼": ["landmark", "tourism", "travel"],
  "🗽": ["statue", "tourism", "travel"],
  "🏰": ["castle", "tourism", "travel"],
  "🎡": ["ferris wheel", "amusement", "fun"],
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
  "🔨": ["hammer", "tools", "repair", "construction"],
  "🪛": ["screwdriver", "tools", "repair"],
  "🪚": ["saw", "tools", "woodwork"],
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
  "🎈": ["balloon", "party", "celebration"],
  "🎀": ["ribbon", "gift", "present"],
  // Hobbies
  "🎣": ["fishing", "hobbies"],
  "🎸": ["guitar", "music", "instrument"],
  "🎹": ["piano", "music", "instrument"],
  "🎺": ["trumpet", "music", "instrument"],
  "🎻": ["violin", "music", "instrument"],
  "📸": ["photography", "camera", "hobby"],
  "🧵": ["sewing", "crafts", "hobby"],
  "🧶": ["knitting", "crafts", "hobby"],
  "🎠": ["carousel", "entertainment", "fun"],
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
  "🚫": ["exclude", "transfer", "ignore"],
  "❓": ["uncategorized", "unknown", "other"],
  "♻️": ["recycle", "environment", "eco"],
  "🌱": ["eco", "green", "sustainable"],
  "🌍": ["world", "global", "environment"],
  "☀️": ["solar", "energy", "sun"],
  "🌙": ["night", "moon"],
  "⚡": ["electric", "power", "energy"],
  "💤": ["sleep", "rest"],
  "🎖️": ["military", "veteran", "service"],
  "🏆": ["trophy", "award", "achievement"],
  "🥇": ["medal", "first", "winner"],
  "📰": ["news", "newspaper", "magazine"],
  "🗞️": ["newspaper", "subscription"],
};

const EMOJI_OPTIONS = Object.keys(EMOJI_MAP);

// Get default system categories
const getDefaultCategories = () => {
  return [
    { name: "Income", icon: "💰" },
    { name: "Exclude", icon: "🚫" },
    { name: "Uncategorized", icon: "❓" },
  ];
};

export default function Categories() {
  const { deletedCategories, deleteCategory, restoreCategory, isDeleted } = useDeletedCategories();
  const { customCategories, addCategory, hasCategory } = useCustomCategories();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; category: string | null }>({
    open: false,
    category: null,
  });
  
  // Add category dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📌");
  const [emojiSearch, setEmojiSearch] = useState("");

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch) return EMOJI_OPTIONS;
    const searchLower = emojiSearch.toLowerCase();
    return EMOJI_OPTIONS.filter((emoji) => {
      const keywords = EMOJI_MAP[emoji] || [];
      return keywords.some((kw) => kw.includes(searchLower));
    });
  }, [emojiSearch]);

  const allCategories = useMemo(() => {
    const defaults = getDefaultCategories();
    const customList = customCategories.map(c => ({ name: c.name, icon: c.icon }));
    return [...defaults, ...customList];
  }, [customCategories]);

  const activeCategories = useMemo(() => {
    return allCategories.filter(c => !isDeleted(c.name));
  }, [allCategories, isDeleted]);

  const archivedCategories = useMemo(() => {
    return allCategories.filter(c => isDeleted(c.name));
  }, [allCategories, isDeleted]);

  const filteredActiveCategories = useMemo(() => {
    if (!searchQuery) return activeCategories;
    return activeCategories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeCategories, searchQuery]);

  const filteredArchivedCategories = useMemo(() => {
    if (!searchQuery) return archivedCategories;
    return archivedCategories.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [archivedCategories, searchQuery]);

  const handleArchive = (categoryName: string) => {
    setConfirmDialog({ open: true, category: categoryName });
  };

  const confirmArchive = () => {
    if (confirmDialog.category) {
      deleteCategory(confirmDialog.category);
      toast.success(`"${confirmDialog.category}" archived`);
    }
    setConfirmDialog({ open: false, category: null });
  };

  const handleRestore = (categoryName: string) => {
    restoreCategory(categoryName);
    toast.success(`"${categoryName}" restored`);
  };

  const resetAddForm = () => {
    setNewCategoryName("");
    setNewCategoryIcon("📌");
    setEmojiSearch("");
  };

  const handleAddCategory = () => {
    const trimmedName = newCategoryName.trim();
    
    if (!trimmedName) {
      toast.error("Please enter a category name");
      return;
    }
    
    if (trimmedName.length > 50) {
      toast.error("Category name must be less than 50 characters");
      return;
    }

    // Check if category already exists
    const exists = allCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists || hasCategory(trimmedName)) {
      toast.error("A category with this name already exists");
      return;
    }

    addCategory({ name: trimmedName, icon: newCategoryIcon });
    toast.success(`"${trimmedName}" added`);
    setAddDialogOpen(false);
    resetAddForm();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-20 lg:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Tags className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Manage Categories</h1>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
        
        <p className="text-muted-foreground">
          Archive categories you don't want to see in dropdowns when categorizing transactions.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="active" className="flex-1">
              Active ({activeCategories.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">
              Archived ({archivedCategories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <div className="rounded-2xl border border-border bg-card">
              {filteredActiveCategories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery ? "No categories match your search" : "No active categories"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <AnimatePresence>
                    {filteredActiveCategories.map((category) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between px-5 py-4 hover:bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <span className="font-medium text-foreground">{category.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(category.name)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="mt-4">
            <div className="rounded-2xl border border-border bg-card">
              {filteredArchivedCategories.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery ? "No archived categories match your search" : "No archived categories"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <AnimatePresence>
                    {filteredArchivedCategories.map((category) => (
                      <motion.div
                        key={category.name}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between px-5 py-4 hover:bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl opacity-50">{category.icon}</span>
                          <span className="font-medium text-muted-foreground">{category.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(category.name)}
                          className="text-primary hover:text-primary"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info box */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Archived categories won't appear in the category dropdown when you're categorizing transactions. 
            You can restore them anytime from the "Archived" tab.
          </p>
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) resetAddForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a custom category for categorizing your transactions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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

            {/* Icon Picker */}
            <div className="space-y-2">
              <Label>Choose an Icon</Label>
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

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              setAddDialogOpen(false);
              resetAddForm();
            }}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAddCategory}>
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Archive Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, category: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive "{confirmDialog.category}"? It won't appear in category dropdowns anymore, but you can restore it later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog({ open: false, category: null })}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={confirmArchive}>
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
