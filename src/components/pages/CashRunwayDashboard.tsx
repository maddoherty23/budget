"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, DollarSign, AlertTriangle, TrendingUp, Settings } from "lucide-react";
import { CashForecast } from "@/lib/cash-runway/types";
import ForecastChart from "@/components/cash-runway/ForecastChart";
import BillPriorityStack from "@/components/cash-runway/BillPriorityStack";
import CashCalendar from "@/components/cash-runway/CashCalendar";
import AlertsList from "@/components/cash-runway/AlertsList";
import RecommendationsList from "@/components/cash-runway/RecommendationsList";
import CashPlanSettings from "@/components/cash-runway/CashPlanSettings";

export default function CashRunwayDashboard() {
  const [forecast, setForecast] = useState<CashForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/cash/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
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
    loadForecast();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Runway</h1>
          <p className="text-gray-600 mt-1">
            {forecast.runwayDays} days of runway • {forecast.dailyBalances.length} days forecasted
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button onClick={() => setActiveTab("settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-2xl font-bold">
                ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lowest Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className={`h-4 w-4 mr-1 ${lowestBalance < 0 ? "text-red-500" : "text-gray-400"}`} />
              <span className={`text-2xl font-bold ${lowestBalance < 0 ? "text-red-600" : ""}`}>
                ${lowestBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {forecast.dangerPoint && (
              <p className="text-xs text-gray-500 mt-1">
                on {forecast.dangerPoint.date.toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Red Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className={`h-4 w-4 mr-1 ${redDaysCount > 0 ? "text-red-500" : "text-gray-400"}`} />
              <span className={`text-2xl font-bold ${redDaysCount > 0 ? "text-red-600" : ""}`}>
                {redDaysCount}
              </span>
            </div>
            {bufferLowDays > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                +{bufferLowDays} buffer-low days
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Months at Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className={`h-4 w-4 mr-1 ${monthsWithShortfall > 0 ? "text-yellow-500" : "text-gray-400"}`} />
              <span className={`text-2xl font-bold ${monthsWithShortfall > 0 ? "text-yellow-600" : ""}`}>
                {monthsWithShortfall}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              with shortfalls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ForecastChart forecast={forecast} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecommendationsList />
            <AlertsList showDismissed={false} limit={5} />
          </div>
        </TabsContent>

        <TabsContent value="bills">
          <BillPriorityStack forecast={forecast} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="calendar">
          <CashCalendar forecast={forecast} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsList showDismissed={true} />
        </TabsContent>

        <TabsContent value="settings">
          <CashPlanSettings onSave={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
