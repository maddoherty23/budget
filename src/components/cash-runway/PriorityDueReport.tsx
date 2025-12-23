"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Zap, Film } from "lucide-react";
import { CashForecast } from "@/lib/cash-runway/types";
import { BillInstance } from "@/lib/cash-runway/types";

interface PriorityDueReportProps {
  forecast: CashForecast;
  onRefresh: () => void;
}

export default function PriorityDueReport({ forecast, onRefresh }: PriorityDueReportProps) {
  const [bills, setBills] = useState<BillInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const response = await fetch("/api/bills/instances?status=pending");
      if (!response.ok) throw new Error("Failed to load bills");
      const data = await response.json();
      setBills(data.instances);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (billId: string, amount: number) => {
    try {
      const response = await fetch(`/api/bills/instances/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paidDate: new Date().toISOString(),
          paidAmount: amount,
        }),
      });

      if (!response.ok) throw new Error("Failed to mark bill as paid");

      await loadBills();
      onRefresh();
    } catch (error) {
      console.error("Error marking bill as paid:", error);
    }
  };

  // Sort and group bills
  const criticalBills = bills
    .filter((b) => b.priority === "critical")
    .sort((a, b) => b.consequenceWeight - a.consequenceWeight);

  const upcomingBills = bills
    .filter((b) => b.priority === "flexible")
    .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());

  const delayableBills = bills
    .filter((b) => b.priority === "delayable")
    .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());

  const getBillIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("rent") || lowerName.includes("mortgage")) {
      return <Home className="h-5 w-5" />;
    } else if (lowerName.includes("electric") || lowerName.includes("power") || lowerName.includes("utility")) {
      return <Zap className="h-5 w-5" />;
    } else if (lowerName.includes("netflix") || lowerName.includes("streaming")) {
      return <Film className="h-5 w-5" />;
    }
    return <div className="h-5 w-5 rounded bg-gray-300"></div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical - Pay Now */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Critical - Pay Now</h3>
          <span className="text-sm text-gray-500">Ranked</span>
        </div>
        <div className="space-y-3">
          {criticalBills.length === 0 ? (
            <p className="text-gray-500 text-sm">No critical bills pending</p>
          ) : (
            criticalBills.map((bill, index) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl font-bold text-gray-400">{index + 1}</span>
                  <div className="flex items-center gap-3">
                    {getBillIcon(bill.name)}
                    <div>
                      <p className="font-semibold">{bill.name}</p>
                      <p className="text-sm text-gray-600">
                        ${bill.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Rec. Date:</p>
                    <p className="font-semibold">
                      {bill.dueDate.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Consequence:</p>
                    <p className="text-sm font-medium text-red-600">
                      {bill.consequenceWeight >= 80
                        ? "Late fee & risk of eviction"
                        : "Service interruption"}
                    </p>
                  </div>
                  <Button onClick={() => handleMarkPaid(bill.id, bill.amount)} size="sm">
                    Pay
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming - Pay Soon */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Upcoming - Pay Soon</h3>
        </div>
        <div className="space-y-3">
          {upcomingBills.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming bills</p>
          ) : (
            upcomingBills.map((bill, index) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl font-bold text-gray-400">{index + 1}</span>
                  <div className="flex items-center gap-3">
                    {getBillIcon(bill.name)}
                    <div>
                      <p className="font-semibold">{bill.name}</p>
                      <p className="text-sm text-gray-600">
                        ${bill.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Rec. Date:</p>
                    <p className="font-semibold">
                      {bill.dueDate.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Consequence:</p>
                    <p className="text-sm font-medium">Service interruption</p>
                  </div>
                  <Button 
                    onClick={() => handleMarkPaid(bill.id, bill.amount)} 
                    variant="outline"
                    size="sm"
                  >
                    Pay
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Can Delay */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Can Delay</h3>
        </div>
        <div className="space-y-3">
          {delayableBills.length === 0 ? (
            <p className="text-gray-500 text-sm">No delayable bills</p>
          ) : (
            delayableBills.map((bill, index) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-2xl font-bold text-gray-400">{index + 1}</span>
                  <div className="flex items-center gap-3">
                    {getBillIcon(bill.name)}
                    <div>
                      <p className="font-semibold">{bill.name}</p>
                      <p className="text-sm text-gray-600">
                        ${bill.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Rec. Date:</p>
                    <p className="font-semibold">
                      {bill.dueDate.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Consequence:</p>
                    <p className="text-sm font-medium">Service suspension</p>
                  </div>
                  <Button 
                    onClick={() => handleMarkPaid(bill.id, bill.amount)} 
                    variant="ghost"
                    size="sm"
                  >
                    Pay
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
