"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function CashRunwayDebug() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkTransactions = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      // Generate months to query
      const monthsToQuery: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthsToQuery.includes(month)) {
          monthsToQuery.push(month);
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      let totalIncome = 0;
      let totalExpenses = 0;
      let incomeCount = 0;
      let expenseCount = 0;
      let excludedCount = 0;
      let uncategorizedCount = 0;
      
      const sampleTransactions: any[] = [];
      
      for (const month of monthsToQuery) {
        const monthPath = `transactions/${user.uid}/${month}`;
        const monthCollection = collection(db, monthPath);
        
        // Get all transactions for this month
        const allSnapshot = await getDocs(monthCollection);
        
        allSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const txnDate = data.date?.toDate?.() || new Date();
          
          if (txnDate >= startDate && txnDate <= endDate) {
            if (data.type === "income") {
              if (data.category !== "Exclude") {
                incomeCount++;
                totalIncome += Math.abs(data.amount || 0);
              } else {
                excludedCount++;
              }
            } else if (data.type === "expense") {
              if (data.category === "Exclude") {
                excludedCount++;
              } else if (!data.category || data.category === "Uncategorized") {
                uncategorizedCount++;
              } else {
                expenseCount++;
                totalExpenses += Math.abs(data.amount || 0);
              }
            }
            
            // Sample first 5 transactions
            if (sampleTransactions.length < 5) {
              sampleTransactions.push({
                date: txnDate.toISOString().split('T')[0],
                description: data.description,
                amount: data.amount,
                type: data.type,
                category: data.category,
                willInclude: (
                  (data.type === "income" && data.category !== "Exclude") ||
                  (data.type === "expense" && data.category !== "Exclude" && 
                   data.category && data.category !== "Uncategorized")
                )
              });
            }
          }
        });
      }
      
      setDebugInfo({
        monthsQueried: monthsToQuery,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        },
        counts: {
          income: incomeCount,
          expenses: expenseCount,
          excluded: excludedCount,
          uncategorized: uncategorizedCount,
          total: incomeCount + expenseCount,
        },
        totals: {
          income: totalIncome,
          expenses: totalExpenses,
          net: totalIncome - totalExpenses,
        },
        sampleTransactions,
      });
    } catch (error) {
      console.error("Error checking transactions:", error);
      setDebugInfo({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Cash Runway - Transaction Debug</h1>
        <p className="text-muted-foreground">
          Check what transactions will be included in your cash runway forecast
        </p>
      </div>
      
      <Button onClick={checkTransactions} disabled={loading || !user}>
        {loading ? "Checking..." : "Check Transactions"}
      </Button>
      
      {debugInfo && !debugInfo.error && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <strong>Date Range:</strong> {debugInfo.dateRange.start} to {debugInfo.dateRange.end}
              </div>
              <div>
                <strong>Months Queried:</strong> {debugInfo.monthsQueried.join(", ")}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction Counts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Income (included)</div>
                  <div className="text-2xl font-bold text-green-600">{debugInfo.counts.income}</div>
                  <div className="text-xs">${debugInfo.totals.income.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Expenses (included)</div>
                  <div className="text-2xl font-bold text-red-600">{debugInfo.counts.expenses}</div>
                  <div className="text-xs">${debugInfo.totals.expenses.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Excluded (transfers)</div>
                  <div className="text-2xl font-bold text-gray-600">{debugInfo.counts.excluded}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Uncategorized</div>
                  <div className="text-2xl font-bold text-yellow-600">{debugInfo.counts.uncategorized}</div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">Total Included</div>
                <div className="text-3xl font-bold">{debugInfo.counts.total}</div>
                <div className="text-sm">Net: ${debugInfo.totals.net.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
          
          {debugInfo.sampleTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sample Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.sampleTransactions.map((txn: any, idx: number) => (
                    <div key={idx} className={`p-2 rounded border ${txn.willInclude ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{txn.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {txn.date} • {txn.type} • {txn.category || "Uncategorized"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${Math.abs(txn.amount).toFixed(2)}</div>
                          <div className="text-xs">
                            {txn.willInclude ? "✓ Included" : "✗ Skipped"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {debugInfo?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-900">
              <strong>Error:</strong> {debugInfo.error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
