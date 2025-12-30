"use client";
import { motion } from "framer-motion";
import { TrendingUp, Target, AlertCircle } from "lucide-react";

interface ImpactSummaryCardProps {
  projectedSavings: number;
  weeklyTarget: number;
  monthlyGoal: number;
  confidence: "High" | "Medium" | "Low";
}

export function ImpactSummaryCard({
  projectedSavings,
  weeklyTarget,
  monthlyGoal,
  confidence,
}: ImpactSummaryCardProps) {
  const progressPercent = Math.min(100, (projectedSavings / monthlyGoal) * 100);
  const remaining = Math.max(0, monthlyGoal - projectedSavings);

  const confidenceColors = {
    High: "text-success",
    Medium: "text-warning",
    Low: "text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Projected Impact
        </h3>
      </div>

      {/* Main metrics */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Projected savings
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${projectedSavings.toFixed(0)}
            <span className="text-base font-normal text-muted-foreground">/mo</span>
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Weekly target
          </div>
          <p className="text-lg font-semibold text-foreground">
            ${weeklyTarget.toFixed(0)}
            <span className="text-sm font-normal text-muted-foreground">/week</span>
          </p>
        </div>

        {remaining > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              Remaining this week
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              ${remaining.toFixed(0)}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Goal progress</span>
          <span className="font-semibold text-foreground">{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-chart-2 to-chart-2/80"
          />
        </div>
      </div>

      {/* Confidence badge */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <span className={`text-sm font-semibold ${confidenceColors[confidence]}`}>
            {confidence}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
