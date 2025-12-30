"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, XCircle, Calendar } from "lucide-react";
import type { WeeklyResult, CategoryBaseline, WeekStatus } from "@/lib/savingsLevers";

interface WeeklyScoreboardProps {
  results: WeeklyResult[];
  baselines: CategoryBaseline[];
  status: WeekStatus;
  statusMessage: string;
  onAdjust: () => void;
  onKeep: () => void;
  onLowerStress: () => void;
}

export function WeeklyScoreboard({
  results,
  baselines,
  status,
  statusMessage,
  onAdjust,
  onKeep,
  onLowerStress,
}: WeeklyScoreboardProps) {
  const statusIcons = {
    "on-track": CheckCircle2,
    "slightly-off": AlertCircle,
    "off-track": XCircle,
  };

  const statusColors = {
    "on-track": "text-success",
    "slightly-off": "text-warning",
    "off-track": "text-destructive",
  };

  const StatusIcon = statusIcons[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5"
    >
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">This week's check-in</h3>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {results.map((result) => {
          const baseline = baselines.find((b) => b.categoryId === result.categoryId);
          if (!baseline) return null;

          return (
            <div
              key={result.categoryId}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{baseline.name}</p>
                <p className="text-xs text-muted-foreground">
                  {result.isSpendCap ? (
                    <>
                      Cap: ${result.targetValue.toFixed(0)} • Actual: $
                      {result.actualValue.toFixed(0)}
                    </>
                  ) : (
                    <>
                      Cap: {result.targetValue} trips • Actual: {Math.round(result.actualValue)}{" "}
                      trips
                    </>
                  )}
                </p>
              </div>
              <div>
                {result.onTrack ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status message */}
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
          status === "on-track"
            ? "border-success/30 bg-success/5"
            : status === "slightly-off"
            ? "border-warning/30 bg-warning/5"
            : "border-destructive/30 bg-destructive/5"
        }`}
      >
        <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${statusColors[status]}`} />
        <p className="text-sm text-foreground">{statusMessage}</p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-2 pt-2">
        {status === "on-track" && (
          <>
            <Button onClick={onKeep} className="w-full bg-chart-2 hover:bg-chart-2/90 text-white">
              Keep plan
            </Button>
            <Button onClick={onAdjust} variant="outline" className="w-full">
              Adjust plan
            </Button>
          </>
        )}

        {status === "slightly-off" && (
          <>
            <Button onClick={onAdjust} variant="outline" className="w-full">
              Adjust next week
            </Button>
            <Button onClick={onKeep} variant="ghost" className="w-full">
              Make it up
            </Button>
          </>
        )}

        {status === "off-track" && (
          <>
            <Button
              onClick={onLowerStress}
              className="w-full bg-chart-2 hover:bg-chart-2/90 text-white"
            >
              Lower stress plan
            </Button>
            <Button onClick={onAdjust} variant="outline" className="w-full">
              Adjust manually
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
