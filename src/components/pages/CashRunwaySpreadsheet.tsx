"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, Lightbulb } from "lucide-react";
import type { CashForecast } from "@/lib/cash-runway/types";
import BillsSpreadsheet from "@/components/cash-runway/BillsSpreadsheet";

type ViewMode = "weekly" | "monthly";

interface Suggestion {
  category: string;
  action: string;
  potential_savings: number;
}

export default function CashRunwaySpreadsheet() {
  const [forecast, setForecast] = useState<CashForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cash/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lookAheadDays: 90 }),
      });
      const data = await response.json();
      setForecast(data.forecast);
      
      // Check if we have negative days and generate suggestions
      if (data.forecast) {
        const hasNegativeDays = data.forecast.dailyBalances.some((day: any) => day.balance < 0);
        if (hasNegativeDays) {
          generateSuggestions();
        } else {
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = () => {
    // Mock suggestions - in production, this would be AI-generated
    const mockSuggestions: Suggestion[] = [
      {
        category: "Groceries & Dining",
        action: "Reduce grocery spending by meal planning and cooking at home more often",
        potential_savings: 150,
      },
      {
        category: "Subscriptions",
        action: "Cancel unused streaming services (Netflix, Hulu) or downgrade to lower tiers",
        potential_savings: 30,
      },
      {
        category: "Savings",
        action: "Temporarily reduce or pause savings contributions until cash flow stabilizes",
        potential_savings: 200,
      },
      {
        category: "Entertainment",
        action: "Cut back on entertainment and discretionary spending for the next 2 weeks",
        potential_savings: 100,
      },
      {
        category: "Emergency Fund",
        action: "Pull $500 from emergency savings to cover immediate shortfall",
        potential_savings: 500,
      },
    ];
    setSuggestions(mockSuggestions);
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No forecast data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bills & Cashflow Spreadsheet</h1>
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className="rounded-r-none"
            >
              Weekly
            </Button>
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("monthly")}
              className="rounded-l-none"
            >
              Monthly
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchForecast}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Suggestions Alert */}
      {suggestions.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-yellow-900">
                ⚠️ Cash flow is projected to go negative. Here are some suggestions:
              </p>
              <div className="space-y-2">
                {suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start space-x-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-yellow-900">{suggestion.category}:</span>{" "}
                      <span className="text-yellow-800">{suggestion.action}</span>
                      <span className="text-green-700 font-semibold ml-1">
                        (Save ${suggestion.potential_savings})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                💡 Total potential savings: ${suggestions.reduce((sum, s) => sum + s.potential_savings, 0)}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Spreadsheet */}
      <div className="flex-1 min-h-0">
        <BillsSpreadsheet forecast={forecast} viewMode={viewMode} />
      </div>
    </div>
  );
}
