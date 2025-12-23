"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CashForecast } from "@/lib/cash-runway/types";

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
}

export default function BillsSpreadsheet({ forecast, viewMode }: BillsSpreadsheetProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

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

  // Mock data structure
  const allRows: SpreadsheetRow[] = [
    { label: "RUNNING TOTAL", type: "total" },
    { label: "Total OUT", type: "total" },
    { label: "Total IN", type: "total" },
    { label: "", type: "section" },
    { label: "INCOME", type: "header", category: "income" },
    { label: "CARRY OVER", amount: 1395.8, type: "income", category: "income" },
    { label: "EXTRA MONEY", type: "income", category: "income" },
    { label: "MOM PAY", amount: 1290, type: "income", category: "income" },
    { label: "MOM SSI", amount: 2113, type: "income", category: "income" },
    { label: "DAD RETIRE", type: "income", category: "income" },
    { label: "KPUMP", type: "income", category: "income" },
    { label: "DAD SSI", type: "income", category: "income" },
    { label: "", type: "section" },
    { label: "SAVINGS & ADJUSTMENTS", type: "header", category: "savings" },
    { label: "Adjust", type: "expense", category: "savings" },
    { label: "Savings", amount: 700, type: "savings", category: "savings" },
    { label: "Float", type: "savings", category: "savings" },
    { label: "", type: "section" },
    { label: "HOUSE BILLS", type: "header", category: "house" },
    { label: "House (1st)", amount: -2800, type: "expense", category: "house" },
    { label: "Co-Propane (31)", type: "expense", category: "house" },
    { label: "Pred (2nd)", amount: -297, type: "expense", category: "house" },
  ];

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
    // For demo purposes, return mock data on specific days
    if (row.label === "CARRY OVER" && dateIndex === 0) return 1395.8;
    if (row.label === "MOM PAY" && dateIndex === 5) return 1290;
    if (row.label === "MOM SSI" && dateIndex === 10) return 2113;
    if (row.label === "Savings" && dateIndex === 0) return -700;
    if (row.label === "House (1st)" && dateIndex === 0) return -2800;
    if (row.label === "Pred (2nd)" && dateIndex === 0) return -297;
    if (row.label === "Adjust" && [3, 6, 13].includes(dateIndex)) return dateIndex === 3 ? 400 : dateIndex === 6 ? -200 : -200;
    return null;
  };

  const getRowClassName = (row: SpreadsheetRow): string => {
    if (row.type === "total") return "bg-gray-100 font-bold";
    if (row.type === "header") return "bg-orange-100 font-bold";
    if (row.type === "income") return "bg-green-50";
    if (row.type === "savings") return "bg-blue-50";
    if (row.category === "house") return "bg-orange-50";
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
