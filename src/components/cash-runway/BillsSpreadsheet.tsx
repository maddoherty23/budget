"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CashForecast } from "@/lib/cash-runway/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";

interface BillsSpreadsheetProps {
  forecast: CashForecast;
  viewMode: "weekly" | "monthly";
}

// Mock data structure matching the Excel layout
interface SpreadsheetRow {
  label: string;
  amount?: number;
  type: "header" | "total" | "income" | "expense" | "savings" | "section";
  category?: string;
  vendorName?: string; // For tracking vendor spending
}

interface Vendor {
  id: string;
  name: string;
  totalSpent: number;
}

export default function BillsSpreadsheet({ forecast, viewMode }: BillsSpreadsheetProps) {
  const { user } = useAuth();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Fetch vendors from Firestore
  useEffect(() => {
    if (!user) {
      console.log('[BillsSpreadsheet] No user, skipping vendors fetch');
      return;
    }

    console.log('[BillsSpreadsheet] Fetching vendors for user:', user.uid);
    const q = query(
      collection(db, 'vendors'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vendorData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        totalSpent: doc.data().totalSpent,
      }));
      console.log('[BillsSpreadsheet] Vendors loaded:', vendorData.length, vendorData);
      setVendors(vendorData);
    }, (error) => {
      console.error('[BillsSpreadsheet] Error fetching vendors:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch transactions for the date range
  useEffect(() => {
    if (!user) {
      console.log('[BillsSpreadsheet] No user, skipping transactions fetch');
      return;
    }

    const now = new Date();
    const months: string[] = [];
    // Query past 6 months plus current month (for historical data)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(month);
    }

    console.log('[BillsSpreadsheet] Fetching transactions for months:', months);
    const unsubscribes: (() => void)[] = [];
    const allTxns: any[] = [];

    months.forEach(month => {
      const monthPath = `transactions/${user.uid}/${month}`;
      const monthCollection = collection(db, monthPath);
      const q = query(monthCollection);
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`[BillsSpreadsheet] Loaded ${snapshot.docs.length} transactions for ${month}`);
        const newTxns = snapshot.docs.map(doc => {
          const data = doc.data();
          const txnDate = data.date?.toDate?.() || new Date();
          return {
            id: doc.id,
            description: data.description,
            amount: data.amount,
            type: data.type,
            category: data.category,
            date: txnDate,
          };
        });
        
        // Merge transactions
        const otherMonthTxns = allTxns.filter(t => {
          const txnDate = new Date(t.date);
          const txnMonth = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
          return txnMonth !== month;
        });
        
        allTxns.length = 0;
        allTxns.push(...otherMonthTxns, ...newTxns);
        console.log('[BillsSpreadsheet] Total transactions loaded:', allTxns.length);
        setTransactions([...allTxns]);
      }, (error) => {
        console.error(`[BillsSpreadsheet] Error fetching transactions for ${month}:`, error);
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  // Get dates based on view mode
  const today = new Date();
  const numDays = viewMode === "weekly" ? 7 : 30;
  const dates = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date;
  });

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Build rows from real data
  const allRows: SpreadsheetRow[] = [
    { label: "RUNNING TOTAL", type: "total" },
    { label: "Total OUT", type: "total" },
    { label: "Total IN", type: "total" },
    { label: "", type: "section" },
  ];

  // Add income section with real income transactions
  const incomeTransactions = transactions.filter(t => t.type === 'income' && t.category !== 'Exclude');
  console.log('[BillsSpreadsheet] Income transactions:', incomeTransactions.length);
  if (incomeTransactions.length > 0) {
    allRows.push({ label: "INCOME", type: "header", category: "income" });
    
    // Group income by description
    const incomeByName = incomeTransactions.reduce((acc, t) => {
      const name = t.description || 'Unknown Income';
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(t);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Sort by name
    Object.entries(incomeByName)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([name]) => {
        allRows.push({ 
          label: name,
          type: "income", 
          category: "income",
          vendorName: name, // Track vendor name for matching transactions
        });
      });
    
    allRows.push({ label: "", type: "section" });
  }

  // Add ALL expense vendors (from transactions) - this is the default view
  // Include uncategorized expenses as well
  const expenseTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    t.category !== 'Exclude'
  );
  
  console.log('[BillsSpreadsheet] Expense transactions:', expenseTransactions.length);
  console.log('[BillsSpreadsheet] Total rows to render:', allRows.length);
  
  if (expenseTransactions.length > 0) {
    allRows.push({ label: "EXPENSES", type: "header", category: "expenses" });
    
    // Group ALL expenses by vendor/description (not by category)
    const expensesByVendor = expenseTransactions.reduce((acc, t) => {
      const vendorName = t.description || 'Unknown';
      if (!acc[vendorName]) {
        acc[vendorName] = [];
      }
      acc[vendorName].push(t);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Sort vendors by total spending (highest first)
    Object.entries(expensesByVendor)
      .sort(([, aTxns], [, bTxns]) => {
        const aTotal = aTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const bTotal = bTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return bTotal - aTotal;
      })
      .forEach(([vendorName]) => {
        allRows.push({
          label: vendorName,
          type: "expense",
          category: "expenses",
          vendorName: vendorName, // Track vendor name for matching transactions
        });
      });
    
    allRows.push({ label: "", type: "section" });
  }

  // Filter rows based on collapsed categories
  const rows = allRows.filter(row => {
    if (row.type === "header") return true;
    if (!row.category) return true;
    return !collapsedCategories.has(row.category);
  });

  // Calculate running totals for each date
  const getRunningTotal = (dateIndex: number): number => {
    const dayData = forecast.dailyBalances[dateIndex];
    return dayData?.balance || 0;
  };

  const getTotalOut = (dateIndex: number): number => {
    const dayData = forecast.dailyBalances[dateIndex];
    return dayData?.events?.filter(e => e.type === 'bill' || e.type === 'expense').reduce((sum, e) => sum + Math.abs(e.amount), 0) || 0;
  };

  const getTotalIn = (dateIndex: number): number => {
    const dayData = forecast.dailyBalances[dateIndex];
    return dayData?.events?.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0) || 0;
  };

  const getCellValue = (row: SpreadsheetRow, dateIndex: number): number | null => {
    const targetDate = dates[dateIndex];
    if (!targetDate) return null;
    
    // For rows with vendorName, find ALL transactions matching that vendor on this specific date
    if (row.vendorName) {
      const matchingTxns = transactions.filter(t => {
        const txnDate = new Date(t.date);
        const dateMatches = txnDate.getDate() === targetDate.getDate() &&
                           txnDate.getMonth() === targetDate.getMonth() &&
                           txnDate.getFullYear() === targetDate.getFullYear();
        const vendorMatches = t.description === row.vendorName;
        return dateMatches && vendorMatches;
      });
      
      if (matchingTxns.length > 0) {
        const total = matchingTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return row.type === "income" ? total : -total;
      }
    }
    
    return null;
  };

  const getRowClassName = (row: SpreadsheetRow): string => {
    if (row.type === "total") return "bg-gray-100 font-bold";
    if (row.type === "header") return "bg-orange-100 font-bold";
    if (row.type === "income") return "bg-green-50";
    if (row.type === "savings") return "bg-blue-50";
    if (row.type === "expense") return "bg-red-50";
    return "";
  };

  const getCellClassName = (value: number | null, row: SpreadsheetRow): string => {
    if (value === null) return "";
    if (row.label === "RUNNING TOTAL") {
      if (value < 0) return "bg-red-200 text-red-900 font-bold";
      if (value < 500) return "bg-yellow-100 text-yellow-900 font-bold";
      return "font-bold";
    }
    if (value < 0) return "text-red-600";
    if (value > 0 && row.type === "income") return "text-green-600";
    return "";
  };

  return (
    <div className="overflow-auto max-h-[calc(100vh-200px)]">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-bold min-w-[180px]">
              Category
            </th>
            {dates.map((date, i) => (
              <th key={i} className="border border-gray-300 bg-gray-100 px-3 py-2 text-center font-semibold min-w-[90px]">
                <div className="text-xs">
                  {date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            // Skip rendering empty section rows
            if (row.label === "" && row.type === "section") {
              return (
                <tr key={rowIndex}>
                  <td className="border border-gray-300 h-2" colSpan={dates.length + 1}></td>
                </tr>
              );
            }

            return (
              <tr key={rowIndex} className={getRowClassName(row)}>
                <td className="border border-gray-300 px-3 py-1.5 font-medium">
                  {row.type === "header" && row.category ? (
                    <button
                      onClick={() => toggleCategory(row.category!)}
                      className="flex items-center space-x-2 hover:text-gray-700 w-full text-left"
                    >
                      {collapsedCategories.has(row.category) ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span>{row.label}</span>
                    </button>
                  ) : (
                    row.label
                  )}
                </td>
                {dates.map((date, dateIndex) => {
                  let value: number | null = null;

                  // Special handling for total rows
                  if (row.label === "RUNNING TOTAL") {
                    value = getRunningTotal(dateIndex);
                  } else if (row.label === "Total OUT") {
                    value = -getTotalOut(dateIndex);
                  } else if (row.label === "Total IN") {
                    value = getTotalIn(dateIndex);
                  } else {
                    value = getCellValue(row, dateIndex);
                  }

                  return (
                    <td
                      key={dateIndex}
                      className={`border border-gray-300 px-3 py-1.5 text-center ${getCellClassName(value, row)}`}
                    >
                      {value !== null && value !== 0 && (
                        <span>
                          {value > 0 && row.type !== "total" && row.label !== "RUNNING TOTAL" ? "+" : ""}
                          ${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
