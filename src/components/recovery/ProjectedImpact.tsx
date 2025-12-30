"use client";

import { Shield, Target, PiggyBank, ArrowRight } from "lucide-react";
import { RecoveryInsight } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ProjectedImpactProps {
  insights: RecoveryInsight[];
  selectedDestination: "safety_buffer" | "debt_plan" | "goal_bucket";
  onDestinationChange: (destination: "safety_buffer" | "debt_plan" | "goal_bucket") => void;
}

export function ProjectedImpact({
  insights,
  selectedDestination,
  onDestinationChange,
}: ProjectedImpactProps) {
  // Calculate impact from top 3 actions
  const topThree = insights.slice(0, 3);
  const addedMonthlyMargin = topThree.reduce(
    (sum, i) => sum + i.estimatedMonthlySavings,
    0
  );
  
  // Estimate runway improvement (rough calculation)
  // Assume current runway is ~2 months, and savings improve it proportionally
  const daysOfRunwayChange = Math.floor((addedMonthlyMargin / 500) * 30); // $500/mo baseline
  const lowestCashDayImprovement = Math.floor(addedMonthlyMargin * 0.6); // 60% of monthly savings

  const handleApplyPreview = () => {
    toast.success(
      `Preview updated! Redirecting $${addedMonthlyMargin.toFixed(2)}/mo to ${
        selectedDestination === "safety_buffer"
          ? "Safety Buffer"
          : selectedDestination === "debt_plan"
          ? "Debt Plan"
          : "Goal Bucket"
      }`
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Projected Impact</h2>
        
        {insights.length === 0 ? (
          <p className="text-sm text-gray-600">
            Complete a scan to see projected impact.
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-600">
              If you complete the top 3 actions…
            </p>

            {/* Impact Metrics */}
            <div className="space-y-4">
              <div className="rounded-lg bg-teal-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Added monthly margin
                  </span>
                  <span className="text-2xl font-bold text-teal-600">
                    +${addedMonthlyMargin.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Days of runway change
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    +{daysOfRunwayChange} days
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Lowest cash day improvement
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    +${lowestCashDayImprovement.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Visualization */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Recovery Progress</span>
                <span className="text-gray-600">
                  {topThree.length} of {insights.length} actions
                </span>
              </div>
              <Progress
                value={(topThree.length / Math.max(insights.length, 1)) * 100}
                className="h-2"
              />
            </div>
          </>
        )}
      </div>

      {/* Redirect Module */}
      {insights.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">
            Redirect recovered money
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Choose where to allocate your recovered funds
          </p>

          <RadioGroup
            value={selectedDestination}
            onValueChange={(value) =>
              onDestinationChange(
                value as "safety_buffer" | "debt_plan" | "goal_bucket"
              )
            }
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
              <RadioGroupItem value="safety_buffer" id="safety_buffer" />
              <div className="flex-1">
                <Label
                  htmlFor="safety_buffer"
                  className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer"
                >
                  <Shield className="h-5 w-5 text-green-600" />
                  Safety Buffer
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Build emergency savings for unexpected expenses
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
              <RadioGroupItem value="debt_plan" id="debt_plan" />
              <div className="flex-1">
                <Label
                  htmlFor="debt_plan"
                  className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer"
                >
                  <Target className="h-5 w-5 text-blue-600" />
                  Debt Plan
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Accelerate debt payoff and reduce interest costs
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
              <RadioGroupItem value="goal_bucket" id="goal_bucket" />
              <div className="flex-1">
                <Label
                  htmlFor="goal_bucket"
                  className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer"
                >
                  <PiggyBank className="h-5 w-5 text-purple-600" />
                  Goal Bucket
                </Label>
                <p className="mt-1 text-sm text-gray-600">
                  Save for a specific goal like vacation or down payment
                </p>
              </div>
            </div>
          </RadioGroup>

          <Button
            onClick={handleApplyPreview}
            className="mt-4 w-full gap-2"
            size="lg"
          >
            Apply preview
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-3 text-xs text-gray-500">
            This only updates the preview. No money will be moved automatically.
          </p>
        </div>
      )}
    </div>
  );
}
