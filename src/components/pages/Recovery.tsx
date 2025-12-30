"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Shield, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecoveryInsights } from "@/hooks/useRecoveryInsights";
import { useAuth } from "@/hooks/useAuth";
import { getTransactions } from "@/lib/firebase/firestore";
import { seedDemoTransactions } from "@/lib/recovery/seedDemoData";
import { RecoveryStack } from "@/components/recovery/RecoveryStack";
import { ProjectedImpact } from "@/components/recovery/ProjectedImpact";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Recovery() {
  const { user } = useAuth();
  const { insights, loading, scanning, scanTransactions } = useRecoveryInsights();
  const [transactionCount, setTransactionCount] = useState(0);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<"safety_buffer" | "debt_plan" | "goal_bucket">("safety_buffer");

  // Load transaction count
  useEffect(() => {
    async function loadCount() {
      if (!user) return;
      try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const txns = await getTransactions([], {
          startDate: twelveMonthsAgo,
          endDate: new Date(),
        });
        setTransactionCount(txns.length);
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setLoadingTransactions(false);
      }
    }
    loadCount();
  }, [user]);

  const activeInsights = insights.filter((i) => i.status === "active");
  
  // Calculate metrics
  const recoverableMonthly = activeInsights.reduce(
    (sum, i) => sum + i.estimatedMonthlySavings,
    0
  );
  const recoverableAnnually = activeInsights.reduce(
    (sum, i) => sum + i.estimatedAnnualSavings,
    0
  );
  
  // Calculate confidence level
  const avgConfidence = activeInsights.length > 0
    ? activeInsights.reduce((sum, i) => sum + i.confidence, 0) / activeInsights.length
    : 0;
  const confidenceLevel = avgConfidence >= 0.75 ? "High" : avgConfidence >= 0.6 ? "Medium" : "Low";
  
  // Get best next move
  const bestNextMove = activeInsights.length > 0
    ? activeInsights[0].type === "subscription"
      ? "Cancel subscription"
      : activeInsights[0].type === "fee_leak"
      ? "Switch bank account"
      : activeInsights[0].type === "duplicate"
      ? "Remove duplicate"
      : activeInsights[0].type === "price_creep"
      ? "Negotiate price"
      : "Review credits"
    : "No actions needed";

  const handleScan = async () => {
    try {
      await scanTransactions();
      toast.success(`Scan complete: found ${activeInsights.length} opportunities`);
    } catch (error) {
      toast.error("Failed to scan transactions");
    }
  };

  const handleLoadSampleData = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedDemoTransactions(user.uid);
      toast.success("Sample data loaded! Click 'Scan my transactions' to analyze.");
      setTransactionCount(100);
    } catch (error) {
      toast.error("Failed to load sample data");
    } finally {
      setSeeding(false);
    }
  };

  if (loading || loadingTransactions) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const needsSampleData = transactionCount < 30;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
            <Sparkles className="h-4 w-4" />
            AI Money Recovery
          </div>
          
          <h1 className="mb-3 text-4xl font-bold text-gray-900">
            Find money you forgot{" "}
            <span className="text-teal-600">you had</span>
          </h1>
          
          <p className="mb-6 max-w-2xl text-lg text-gray-600">
            We look for subscriptions, fees, and silent price hikes, then show the simplest way to get it back.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleScan}
              disabled={scanning || needsSampleData}
              size="lg"
              className="gap-2"
            >
              {scanning && <Loader2 className="h-4 w-4 animate-spin" />}
              Scan my transactions
            </Button>
            
            {needsSampleData && (
              <Button
                onClick={handleLoadSampleData}
                disabled={seeding}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                {seeding && <Loader2 className="h-4 w-4 animate-spin" />}
                Load sample data
              </Button>
            )}
          </div>

          {needsSampleData && (
            <p className="mt-3 text-sm text-amber-600">
              You have fewer than 30 transactions. Load sample data to see how the recovery engine works.
            </p>
          )}
        </div>

        {/* Metrics Row */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recoverable this month</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  ${recoverableMonthly.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-teal-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recoverable annually</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  ${recoverableAnnually.toFixed(2)}
                </p>
              </div>
              <Sparkles className="h-10 w-10 text-purple-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confidence</p>
                <p className={cn(
                  "mt-2 text-3xl font-bold",
                  confidenceLevel === "High" ? "text-green-600" :
                  confidenceLevel === "Medium" ? "text-yellow-600" : "text-gray-600"
                )}>
                  {confidenceLevel}
                </p>
              </div>
              <Shield className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best next move</p>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  {bestNextMove}
                </p>
              </div>
              <Zap className="h-10 w-10 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Recovery Stack */}
          <div className="lg:col-span-2">
            <RecoveryStack insights={activeInsights} />
          </div>

          {/* Right: Projected Impact */}
          <div className="lg:col-span-1">
            <ProjectedImpact
              insights={activeInsights}
              selectedDestination={selectedDestination}
              onDestinationChange={setSelectedDestination}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
