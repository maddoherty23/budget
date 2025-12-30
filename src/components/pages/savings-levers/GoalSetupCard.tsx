"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, TrendingUp, Shuffle } from "lucide-react";
import type { GoalMode } from "@/lib/savingsLevers";

interface GoalSetupCardProps {
  onBuildPlan: (monthlyTarget: number, mode: GoalMode) => void;
  initialGoal?: number;
}

export function GoalSetupCard({ onBuildPlan, initialGoal = 100 }: GoalSetupCardProps) {
  const [monthlyTarget, setMonthlyTarget] = useState(initialGoal);
  const [mode, setMode] = useState<GoalMode>("reduce");

  const handleBuild = () => {
    if (monthlyTarget > 0) {
      onBuildPlan(monthlyTarget, mode);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Set Your Goal</h2>
        <p className="text-sm text-muted-foreground">
          Tell us how much you want to save each month.
        </p>
      </div>

      {/* Monthly Target Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Monthly savings goal</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="number"
            value={monthlyTarget}
            onChange={(e) => setMonthlyTarget(Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="100"
            min="0"
            step="10"
          />
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">How should I save it?</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setMode("reduce")}
            className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
              mode === "reduce"
                ? "border-chart-2 bg-chart-2/10 text-chart-2"
                : "border-border bg-background text-muted-foreground hover:border-border/60"
            }`}
          >
            <TrendingDown className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Reduce spending</span>
          </button>
          <button
            onClick={() => setMode("increase")}
            className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
              mode === "increase"
                ? "border-chart-2 bg-chart-2/10 text-chart-2"
                : "border-border bg-background text-muted-foreground hover:border-border/60"
            }`}
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Increase income</span>
          </button>
          <button
            onClick={() => setMode("mix")}
            className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
              mode === "mix"
                ? "border-chart-2 bg-chart-2/10 text-chart-2"
                : "border-border bg-background text-muted-foreground hover:border-border/60"
            }`}
          >
            <Shuffle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Mix of both</span>
          </button>
        </div>
      </div>

      <Button
        size="lg"
        onClick={handleBuild}
        className="w-full bg-chart-2 hover:bg-chart-2/90 text-white"
        disabled={monthlyTarget <= 0}
      >
        Build my plan
      </Button>
    </motion.div>
  );
}
