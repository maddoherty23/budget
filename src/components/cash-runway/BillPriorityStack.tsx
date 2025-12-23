"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { CashForecast } from "@/lib/cash-runway/types";
import { BillInstance } from "@/lib/cash-runway/types";

interface BillPriorityStackProps {
  forecast: CashForecast;
  onRefresh: () => void;
}

export default function BillPriorityStack({ forecast, onRefresh }: BillPriorityStackProps) {
  const [bills, setBills] = useState<BillInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bills/instances");
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

  const handleSkip = async (billId: string) => {
    try {
      const response = await fetch(`/api/bills/instances/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "skipped" }),
      });

      if (!response.ok) throw new Error("Failed to skip bill");

      await loadBills();
      onRefresh();
    } catch (error) {
      console.error("Error skipping bill:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "flexible":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "delayable":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "skipped":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Sort bills by priority (critical first) and due date
  const sortedBills = [...bills].sort((a, b) => {
    const priorityOrder = { critical: 0, flexible: 1, delayable: 2 };
    const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    return a.dueDate.toMillis() - b.dueDate.toMillis();
  });

  const filteredBills = filter === "all" 
    ? sortedBills 
    : sortedBills.filter((bill) => bill.status === filter);

  // Group bills by priority
  const billsByPriority = filteredBills.reduce((acc, bill) => {
    if (!acc[bill.priority]) acc[bill.priority] = [];
    acc[bill.priority].push(bill);
    return acc;
  }, {} as Record<string, BillInstance[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bill Priority Stack</CardTitle>
            <CardDescription>
              Manage upcoming bills by priority and consequence weight
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "paid", "overdue"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f as any)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBills.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No bills found for the selected filter.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(billsByPriority).map(([priority, priorityBills]) => (
              <div key={priority}>
                <h3 className="font-semibold text-sm text-gray-700 mb-3 uppercase">
                  {priority} Priority ({priorityBills.length})
                </h3>
                <div className="space-y-2">
                  {priorityBills.map((bill) => (
                    <div
                      key={bill.id}
                      className={`p-4 rounded-lg border ${getPriorityColor(bill.priority)} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(bill.status)}
                            <h4 className="font-semibold">{bill.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {bill.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                            <div>
                              <span className="text-gray-500">Amount:</span>{" "}
                              <span className="font-semibold">${bill.amount.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Due:</span>{" "}
                              <span className="font-semibold">
                                {bill.dueDate.toDate().toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Window:</span>{" "}
                              <span className="text-xs">
                                -{bill.dueWindow.early}d / +{bill.dueWindow.late}d
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Consequence:</span>{" "}
                              <span className="text-xs">{bill.consequenceWeight}/100</span>
                            </div>
                          </div>
                          {bill.autopay && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Autopay
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          {bill.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(bill.id, bill.amount)}
                              >
                                Mark Paid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSkip(bill.id)}
                              >
                                Skip
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
