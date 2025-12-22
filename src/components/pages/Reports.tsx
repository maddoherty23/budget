"use client";
import { useState, useEffect, useMemo } from "react";
import { useDeletedCategories } from "@/hooks/useDeletedCategories";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  ChevronRight,
  Settings2,
  Mail,
  RotateCcw,
  Filter,
  Columns,
  MoreHorizontal,
  Calendar
} from "lucide-react";
import { 
  formatCurrency 
} from "@/lib/mockData";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Preset date ranges like QuickBooks
const dateRangePresets = [
  { id: "this-month", label: "This Month", description: "Dec 1 - Dec 31, 2024" },
  { id: "this-quarter", label: "This Quarter", description: "Oct 1 - Dec 31, 2024" },
  { id: "this-year", label: "This Year", description: "Jan 1 - Dec 31, 2024" },
  { id: "this-year-to-date", label: "This Year to Date", description: "Jan 1 - Dec 7, 2024" },
  { id: "last-month", label: "Last Month", description: "Nov 1 - Nov 30, 2024" },
  { id: "last-quarter", label: "Last Quarter", description: "Jul 1 - Sep 30, 2024" },
  { id: "last-year", label: "Last Year", description: "Jan 1 - Dec 31, 2023" },
  { id: "last-year-to-date", label: "Last Year to Date", description: "Jan 1 - Dec 7, 2023" },
  { id: "last-12-months", label: "Last 12 Months", description: "Dec 8, 2023 - Dec 7, 2024" },
  { id: "custom", label: "Custom", description: "Select custom dates" },
];

// Display options like QuickBooks
const displayOptions = [
  { id: "total", label: "Total Only" },
  { id: "months", label: "Months" },
  { id: "quarters", label: "Quarters" },
  { id: "years", label: "Years" },
];


// Accounting basis options
const accountingBasis = [
  { id: "accrual", label: "Accrual" },
  { id: "cash", label: "Cash" },
];

interface DrilldownData {
  category: string;
  type: 'income' | 'expense';
  amount: number;
}

export default function Reports() {
  const { user } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState("this-month");
  const [displayBy, setDisplayBy] = useState("total");
  const [basis, setBasis] = useState("accrual");
  const [showNonZero, setShowNonZero] = useState(true);
  const [customRangeDialogOpen, setCustomRangeDialogOpen] = useState(false);
  const [incomeExpanded, setIncomeExpanded] = useState(true);
  const [expensesExpanded, setExpensesExpanded] = useState(true);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  
  const { deletedCategories, deleteCategory, isDeleted } = useDeletedCategories();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

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
          group: data.group,
        };
      });
      setCategories(cats);
    });

    return () => unsubscribe();
  }, [user]);

  // Load transactions from Firebase
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
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
          date: data.date?.toDate?.() || new Date(),
        };
      });
      setTransactions(txns);
    });

    return () => unsubscribe();
  }, [user]);

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
        };
      });
      setAccounts(accts);
    });

    return () => unsubscribe();
  }, [user]);
  
  // Filter out deleted categories
  const activeCategories = useMemo(() => 
    categories.filter(cat => !isDeleted(cat.name)),
    [categories, deletedCategories]
  );

  // Get transactions for a specific category
  const getTransactionsForCategory = (categoryName: string, type: 'income' | 'expense') => {
    return transactions.filter(t => {
      if (type === 'income') {
        return t.type === 'income' && (t.category === categoryName || t.category === 'Income');
      } else {
        return t.category === categoryName && t.type === 'expense';
      }
    });
  };

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown';
  };

  const handleDrilldown = (category: string, type: 'income' | 'expense', amount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrilldownData({ category, type, amount });
    setDrilldownOpen(true);
  };

  const drilldownTransactions = drilldownData 
    ? getTransactionsForCategory(drilldownData.category, drilldownData.type)
    : [];

  const currentPreset = dateRangePresets.find(p => p.id === selectedPreset);

  // Calculate multiplier based on period (mock)
  const getMultiplier = () => {
    switch (selectedPreset) {
      case "this-year":
      case "last-year":
      case "this-year-to-date":
      case "last-year-to-date":
      case "last-12-months":
        return 12;
      case "this-quarter":
      case "last-quarter":
        return 3;
      default:
        return 1;
    }
  };

  const multiplier = getMultiplier();
  
  // Calculate real income from transactions grouped by category
  const incomeSources = useMemo(() => {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    
    // Group income by category
    const grouped = incomeTransactions.reduce((acc, t) => {
      const category = t.category || 'Other Income';
      if (!acc[category]) {
        acc[category] = { id: category.toLowerCase().replace(/\s+/g, '-'), name: category, amount: 0 };
      }
      acc[category].amount += Math.abs(t.amount);
      return acc;
    }, {} as Record<string, { id: string; name: string; amount: number }>);
    
    return Object.values(grouped);
  }, [transactions]);
  
  const totalIncome = incomeSources.reduce((sum, s) => sum + s.amount, 0) * multiplier;
  
  // Group expenses by category type (using filtered categories)
  const expensesByGroup = activeCategories
    .filter(c => c.group !== "savings" && c.spent > 0)
    .reduce((acc, cat) => {
      const groupName = cat.group === "needs" ? "Cost of Living" : 
                       cat.group === "wants" ? "Discretionary Spending" : 
                       cat.group === "debt" ? "Debt & Loans" : "Other Expenses";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(cat);
      return acc;
    }, {} as Record<string, any[]>);

  const totalExpenses = activeCategories
    .filter(c => c.group !== "savings")
    .reduce((sum, c) => sum + c.spent, 0) * multiplier;

  const netIncome = totalIncome - totalExpenses;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header - QuickBooks style
    doc.setFontSize(16);
    doc.setTextColor(51, 51, 51);
    doc.text("Budget Buddy", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Profit and Loss", pageWidth / 2, 30, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(102, 102, 102);
    doc.text(currentPreset?.description || "", pageWidth / 2, 38, { align: "center" });
    doc.text(`${basis === "accrual" ? "Accrual" : "Cash"} Basis`, pageWidth / 2, 44, { align: "center" });
    
    // Column headers
    let yPos = 60;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, "F");
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text("TOTAL", pageWidth - 35, yPos, { align: "right" });
    
    // Income section
    yPos += 15;
    doc.setFontSize(11);
    doc.setTextColor(51, 51, 51);
    doc.setFont("helvetica", "bold");
    doc.text("Income", 20, yPos);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    incomeSources.filter(s => !showNonZero || s.amount > 0).forEach((source) => {
      doc.text(source.name, 25, yPos);
      doc.text(formatCurrency(source.amount * multiplier), pageWidth - 35, yPos, { align: "right" });
      yPos += 7;
    });
    
    // Total Income
    yPos += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Total Income", 25, yPos);
    doc.setTextColor(0, 128, 0);
    doc.text(formatCurrency(totalIncome), pageWidth - 35, yPos, { align: "right" });
    
    // Gross Profit
    yPos += 12;
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 5, pageWidth - 30, 10, "F");
    doc.setTextColor(51, 51, 51);
    doc.text("Gross Profit", 20, yPos);
    doc.text(formatCurrency(totalIncome), pageWidth - 35, yPos, { align: "right" });
    
    // Expenses section
    yPos += 15;
    doc.setFontSize(11);
    doc.text("Expenses", 20, yPos);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    Object.entries(expensesByGroup).forEach(([groupName, categories]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(102, 102, 102);
      doc.text(groupName, 25, yPos);
      yPos += 7;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      
      categories.forEach((cat) => {
        doc.text(cat.name, 30, yPos);
        doc.text(formatCurrency(cat.spent * multiplier), pageWidth - 35, yPos, { align: "right" });
        yPos += 7;
      });
      
      const groupTotal = categories.reduce((sum, c) => sum + c.spent, 0) * multiplier;
      doc.setFont("helvetica", "italic");
      doc.text(`Total ${groupName}`, 30, yPos);
      doc.text(formatCurrency(groupTotal), pageWidth - 35, yPos, { align: "right" });
      yPos += 10;
    });
    
    // Total Expenses
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.text("Total Expenses", 25, yPos);
    doc.setTextColor(180, 0, 0);
    doc.text(formatCurrency(totalExpenses), pageWidth - 35, yPos, { align: "right" });
    
    // Net Income
    yPos += 15;
    doc.setFillColor(netIncome >= 0 ? 230 : 255, netIncome >= 0 ? 255 : 230, netIncome >= 0 ? 230 : 230);
    doc.rect(15, yPos - 5, pageWidth - 30, 12, "F");
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text("Net Income", 20, yPos + 2);
    doc.setTextColor(netIncome >= 0 ? 0 : 180, netIncome >= 0 ? 128 : 0, 0);
    doc.text(formatCurrency(netIncome), pageWidth - 35, yPos + 2, { align: "right" });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`${basis === "accrual" ? "Accrual" : "Cash"} Basis`, 20, 280);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth - 20, 280, { align: "right" });
    
    doc.save(`Profit-and-Loss-${currentPreset?.label.replace(/\s+/g, '-')}.pdf`);
    toast.success("PDF exported successfully");
  };

  const handleDownloadExcel = () => {
    const data: (string | number)[][] = [
      ["Budget Buddy"],
      ["Profit and Loss"],
      [currentPreset?.description || ""],
      [`${basis === "accrual" ? "Accrual" : "Cash"} Basis`],
      [""],
      ["", "TOTAL"],
      ["Income"],
    ];
    
    incomeSources.filter(s => !showNonZero || s.amount > 0).forEach((source) => {
      data.push([`    ${source.name}`, source.amount * multiplier]);
    });
    data.push(["Total Income", totalIncome]);
    data.push([""]);
    data.push(["Gross Profit", totalIncome]);
    data.push([""]);
    data.push(["Expenses"]);
    
    Object.entries(expensesByGroup).forEach(([groupName, categories]) => {
      data.push([`    ${groupName}`]);
      categories.forEach((cat) => {
        data.push([`        ${cat.name}`, cat.spent * multiplier]);
      });
      const groupTotal = categories.reduce((sum, c) => sum + c.spent, 0) * multiplier;
      data.push([`    Total ${groupName}`, groupTotal]);
    });
    
    data.push(["Total Expenses", totalExpenses]);
    data.push([""]);
    data.push(["Net Income", netIncome]);
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [{ wch: 40 }, { wch: 15 }];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Profit and Loss");
    
    XLSX.writeFile(workbook, `Profit-and-Loss-${currentPreset?.label.replace(/\s+/g, '-')}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    toast.info("Email feature coming soon");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl pb-20 lg:pb-6 print:max-w-none print:pb-0">
        {/* QuickBooks-style Header */}
        <div className="mb-4 print:mb-8">
          <div className="text-center mb-6 print:block hidden">
            <h2 className="text-lg font-semibold text-foreground">Budget Buddy</h2>
            <h1 className="text-xl font-bold text-foreground">Profit and Loss</h1>
            <p className="text-sm text-muted-foreground">{currentPreset?.description}</p>
            <p className="text-xs text-muted-foreground">{basis === "accrual" ? "Accrual" : "Cash"} Basis</p>
          </div>
          
          <div className="flex flex-col gap-4 print:hidden">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Profit and Loss</h1>
              
              {/* Action buttons - QuickBooks style */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleEmail} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePrint} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <Printer className="h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                      Export <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadExcel}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings2 className="h-4 w-4 mr-2" />
                      Customize
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setSelectedPreset("this-month");
                      setDisplayBy("total");
                      setBasis("accrual");
                    }}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Default
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Filters row - QuickBooks style */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              {/* Report Period */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Report period</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 min-w-[180px] justify-between font-normal">
                      <span>{currentPreset?.label}</span>
                      <Calendar className="h-3.5 w-3.5 ml-2 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="start">
                    <div className="p-2">
                      {dateRangePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            if (preset.id === "custom") {
                              setCustomRangeDialogOpen(true);
                            } else {
                              setSelectedPreset(preset.id);
                            }
                          }}
                          className={cn(
                            "w-full flex flex-col items-start px-3 py-2 rounded-md text-left transition-colors",
                            selectedPreset === preset.id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <span className="font-medium text-sm">{preset.label}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block" />

              {/* Display columns by */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Display columns by</span>
                <Select value={displayBy} onValueChange={setDisplayBy}>
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {displayOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block" />

              {/* Accounting method */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Accounting method</span>
                <Select value={basis} onValueChange={setBasis}>
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountingBasis.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-6 w-px bg-border hidden lg:block" />

              {/* More filters */}
              <Button variant="ghost" size="sm" className="h-8 text-primary">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                More
              </Button>
            </div>
          </div>
        </div>

        {/* Custom Range Dialog */}
        <Dialog open={customRangeDialogOpen} onOpenChange={setCustomRangeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Custom Date Range</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Select a custom date range for your report
              </p>
            </DialogHeader>
            <div className="py-4 text-center text-muted-foreground">
              Custom date picker coming soon
            </div>
            <Button onClick={() => setCustomRangeDialogOpen(false)}>
              Close
            </Button>
          </DialogContent>
        </Dialog>

        {/* QuickBooks-style Report Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden print:border-0 print:shadow-none">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px] bg-muted/50 border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide"></span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">
              TOTAL
            </span>
          </div>

          {/* Income Section */}
          <Collapsible open={incomeExpanded} onOpenChange={setIncomeExpanded}>
            <CollapsibleTrigger className="w-full">
              <div className="grid grid-cols-[1fr_140px] px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-1.5">
                  {incomeExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                  <span className="font-semibold text-foreground">Income</span>
                </div>
                <span className="font-semibold text-foreground text-right">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {incomeSources.filter(s => !showNonZero || s.amount > 0).map((source) => (
                <div
                  key={source.id}
                  className="grid grid-cols-[1fr_140px] px-4 py-2 border-b border-border/30 hover:bg-primary/5 transition-colors"
                >
                  <span className="text-sm text-foreground pl-6">{source.name}</span>
                  <button
                    onClick={(e) => handleDrilldown(source.name, 'income', source.amount * multiplier, e)}
                    className="text-sm text-foreground hover:underline text-right tabular-nums transition-colors cursor-pointer"
                  >
                    {formatCurrency(source.amount * multiplier)}
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-[1fr_140px] px-4 py-2 border-b border-border bg-muted/20">
                <span className="text-sm font-medium text-foreground pl-6">Total Income</span>
                <span className="text-sm font-semibold text-success text-right tabular-nums">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Gross Profit Row */}
          <div className="grid grid-cols-[1fr_140px] px-4 py-2.5 bg-muted/40 border-b border-border">
            <span className="font-semibold text-foreground">Gross Profit</span>
            <span className="font-semibold text-foreground text-right tabular-nums">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          {/* Expenses Section */}
          <Collapsible open={expensesExpanded} onOpenChange={setExpensesExpanded}>
            <CollapsibleTrigger className="w-full">
              <div className="grid grid-cols-[1fr_140px] px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-1.5">
                  {expensesExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                  <span className="font-semibold text-foreground">Expenses</span>
                </div>
                <span className="font-semibold text-foreground text-right tabular-nums">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {Object.entries(expensesByGroup).map(([groupName, categories]) => (
                <div key={groupName}>
                  {/* Group Header */}
                  <div className="grid grid-cols-[1fr_140px] px-4 py-1.5 bg-muted/20 border-b border-border/30">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-6">
                      {groupName}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground text-right tabular-nums">
                      {formatCurrency(categories.reduce((sum, c) => sum + c.spent, 0) * multiplier)}
                    </span>
                  </div>
                  
                  {/* Category Items */}
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="grid grid-cols-[1fr_140px] px-4 py-2 border-b border-border/30 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 pl-10">
                        <span className="text-sm">{category.icon}</span>
                        <span className="text-sm text-foreground">{category.name}</span>
                      </div>
                      <button
                        onClick={(e) => handleDrilldown(category.name, 'expense', category.spent * multiplier, e)}
                        className="text-sm text-foreground hover:underline text-right tabular-nums transition-colors cursor-pointer"
                      >
                        {formatCurrency(category.spent * multiplier)}
                      </button>
                    </div>
                  ))}
                  
                  {/* Group Total */}
                  <div className="grid grid-cols-[1fr_140px] px-4 py-1.5 border-b border-border/50 bg-muted/10">
                    <span className="text-xs italic text-muted-foreground pl-10">Total {groupName}</span>
                    <span className="text-xs text-muted-foreground text-right tabular-nums">
                      {formatCurrency(categories.reduce((sum, c) => sum + c.spent, 0) * multiplier)}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Total Expenses */}
              <div className="grid grid-cols-[1fr_140px] px-4 py-2 border-b border-border bg-muted/20">
                <span className="text-sm font-medium text-foreground pl-6">Total Expenses</span>
                <span className="text-sm font-semibold text-destructive text-right tabular-nums">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Net Income - Final row */}
          <div className={cn(
            "grid grid-cols-[1fr_140px] px-4 py-3",
            netIncome >= 0 ? "bg-success/10" : "bg-destructive/10"
          )}>
            <span className="font-bold text-foreground">Net Income</span>
            <span className={cn(
              "font-bold text-right tabular-nums",
              netIncome >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground print:mt-8">
          <span>{basis === "accrual" ? "Accrual" : "Cash"} Basis</span>
          <span>{currentPreset?.description}</span>
        </div>

        {/* Transaction Drilldown Dialog */}
        <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Transaction Drilldown Report</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {currentPreset?.description}
              </p>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto">
              {drilldownData && (
                <div className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="font-semibold text-foreground">
                      {drilldownData.category} ({drilldownTransactions.length})
                    </span>
                  </div>

                  {/* Transactions Table */}
                  {drilldownTransactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drilldownTransactions.map((transaction, index) => {
                          const runningBalance = drilldownTransactions
                            .slice(0, index + 1)
                            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="text-sm">
                                {new Date(transaction.date).toLocaleDateString('en-CA', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                })}
                              </TableCell>
                              <TableCell className="text-sm">{transaction.description}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {getAccountName(transaction.accountId)}
                              </TableCell>
                              <TableCell>
                                <Select 
                                  defaultValue={transaction.category}
                                  onValueChange={(value) => {
                                    toast.success(`Recategorized to ${value}`);
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-[140px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Income categories */}
                                    <SelectItem value="Income">Income</SelectItem>
                                    {/* Expense categories (filtered) */}
                                    {activeCategories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.name}>
                                        {cat.icon} {cat.name}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                                    <SelectItem value="Exclude">Exclude</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-sm text-right tabular-nums">
                                {formatCurrency(Math.abs(transaction.amount))}
                              </TableCell>
                              <TableCell className="text-sm text-right tabular-nums">
                                {formatCurrency(runningBalance)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No transactions found for this category in the selected period.
                    </div>
                  )}

                  {/* Total Row */}
                  {drilldownTransactions.length > 0 && (
                    <div className="flex items-center justify-between py-3 border-t border-border font-semibold">
                      <span>Total for {drilldownData.category}</span>
                      <span className="tabular-nums">
                        {formatCurrency(drilldownTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0))}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}