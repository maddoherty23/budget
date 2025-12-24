"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Maximize2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, X } from "lucide-react";
import { CashForecast } from "@/lib/cash-runway/types";
import ForecastChart from "@/components/cash-runway/ForecastChart";
import BillPriorityStack from "@/components/cash-runway/BillPriorityStack";
import CashCalendar from "@/components/cash-runway/CashCalendar";
import BillsSpreadsheet from "@/components/cash-runway/BillsSpreadsheet";
import PriorityDueReport from "@/components/cash-runway/PriorityDueReport";

type ModalView = "overview" | "spreadsheet" | "calendar" | "pdr" | null;

export default function CashRunwayDashboard() {
  const router = useRouter();
  const [forecast, setForecast] = useState<CashForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalView, setModalView] = useState<ModalView>(null);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/cash/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRefresh }),
      });

      if (!response.ok) {
        throw new Error("Failed to load forecast");
      }

      const data = await response.json();
      setForecast(data.forecast);
    } catch (err: any) {
      setError(err.message);
      console.error("Error loading forecast:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadForecast(true); // Force refresh to bypass cache
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cash runway forecast...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" className="ml-4" onClick={handleRefresh}>
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!forecast) {
    return (
      <Alert>
        <AlertDescription>
          No forecast data available. Please configure your cash plan settings.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate summary stats
  const redDaysCount = forecast.dailyBalances.filter((d) => d.isRedDay).length;
  const bufferLowDays = forecast.dailyBalances.filter((d) => d.isBufferLow && !d.isRedDay).length;
  const currentBalance = forecast.dailyBalances[0]?.balance || 0;
  const lowestBalance = forecast.dangerPoint?.balance || 0;
  const monthsWithShortfall = forecast.monthSummaries.filter((m) => m.hasShortfall).length;
  const bufferFloor = 500; // Default buffer floor value

  // Calculate danger date
  const dangerDate = forecast.dangerPoint?.date
    ? (forecast.dangerPoint.date instanceof Date 
        ? forecast.dangerPoint.date 
        : typeof forecast.dangerPoint.date.toDate === 'function'
        ? forecast.dangerPoint.date.toDate()
        : new Date(forecast.dangerPoint.date)
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  // Calculate month previews
  const monthPreviews = forecast.monthSummaries.slice(0, 3).map((month) => {
    const net = month.totalIncome - month.totalExpenses;
    let status: "safe" | "tight" | "risk" = "safe";
    if (month.hasShortfall) status = "risk";
    else if (net < bufferFloor) status = "tight";
    return { ...month, net, status };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cash Runway</h1>
        </div>
        <Button variant="outline" onClick={handleRefresh} size="sm">
          Refresh
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Runway & Insights Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setModalView("overview")}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cash Runway & Insights</CardTitle>
            </div>
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Runway Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Cash runway until</p>
              <p className="text-3xl font-bold mb-1">
                {new Date(Date.now() + forecast.runwayDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
              <p className="text-sm text-gray-600">You have {forecast.runwayDays} days of runway left.</p>
            </div>

            {/* Danger Day */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next danger day</p>
                <p className="text-xl font-bold">{dangerDate || "None"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Balance</p>
                <p className={`text-xl font-bold ${lowestBalance < 0 ? "text-red-600" : ""}`}>
                  ${lowestBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Month Previews */}
            <div className="flex gap-2">
              {monthPreviews.map((month) => (
                <div
                  key={month.month}
                  className={`flex-1 rounded px-3 py-2 text-center ${
                    month.status === "safe"
                      ? "bg-green-100 text-green-800"
                      : month.status === "tight"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {month.status === "safe" && "✓"}
                    {month.status === "tight" && "⚠"}
                    {month.status === "risk" && "⚠"}
                    <span className="text-xs font-medium">
                      {month.status === "safe" ? "Safe" : month.status === "tight" ? "Tight" : "Risk"}
                    </span>
                  </div>
                  <p className="text-xs">
                    {month.status === "safe" && `+$${month.net.toLocaleString()}`}
                    {month.status === "tight" && `+$${month.net.toLocaleString()}`}
                    {month.status === "risk" && `-$${Math.abs(month.shortfall).toLocaleString()}`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bills Spreadsheet Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/spreadsheet")}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bills & Cashflow Spreadsheet</CardTitle>
            </div>
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>View detailed bill timeline and projected balances</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Total Bills This Month</span>
                  <span className="font-semibold">
                    ${forecast.monthSummaries[0]?.totalExpenses.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span>Expected Income</span>
                  <span className="font-semibold text-green-600">
                    ${forecast.monthSummaries[0]?.totalIncome.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Net Cash Flow</span>
                  <span className={`font-semibold ${
                    (forecast.monthSummaries[0]?.totalIncome || 0) - (forecast.monthSummaries[0]?.totalExpenses || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    ${((forecast.monthSummaries[0]?.totalIncome || 0) - (forecast.monthSummaries[0]?.totalExpenses || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push("/calendar")}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Calendar View</CardTitle>
            </div>
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p className="mb-4">Visual month-by-month cashflow calendar</p>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-center font-semibold text-gray-500">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 28 }).map((_, i) => {
                  const dayData = forecast.dailyBalances[i];
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded flex items-center justify-center ${
                        dayData?.isRedDay
                          ? "bg-red-100"
                          : dayData?.isBufferLow
                          ? "bg-yellow-100"
                          : "bg-green-100"
                      }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Due Report Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setModalView("pdr")}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Priority Due Report (PDR)</CardTitle>
            </div>
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border-l-4 border-red-500 pl-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Critical - Pay Now</p>
                <p className="text-sm">Ranked by consequence weight</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Upcoming - Pay Soon</p>
                <p className="text-sm">Within payment window</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Can Delay</p>
                <p className="text-sm">Flexible payment timing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Screen Modals */}
      <Dialog open={modalView === "overview"} onOpenChange={() => setModalView(null)}>
        <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Cash Runway Overview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ForecastChart forecast={forecast} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalView === "spreadsheet"} onOpenChange={() => setModalView(null)}>
        <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Bills & Cashflow Spreadsheet</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <BillsSpreadsheet forecast={forecast} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalView === "calendar"} onOpenChange={() => setModalView(null)}>
        <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Calendar View</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <CashCalendar forecast={forecast} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalView === "pdr"} onOpenChange={() => setModalView(null)}>
        <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Priority Due Report</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <PriorityDueReport forecast={forecast} onRefresh={handleRefresh} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
