"use client";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Target, TrendingDown, Sparkles } from "lucide-react";
import {
  MOCK_BASELINES,
  createInitialLevers,
  calculateTotalSavings,
  applyGlobalIntensity,
  generateDemoWeek,
  calculateWeekStatus,
  calculateWeekVariance,
  getStatusMessage,
  getConfidenceLevel,
  type Lever,
  type CategoryBaseline,
  type SavingsGoal,
  type WeeklyResult,
  type GlobalIntensity,
  type GoalMode,
} from "@/lib/savingsLevers";
import { GoalSetupCard } from "./savings-levers/GoalSetupCard";
import { GlobalIntensityControl } from "./savings-levers/GlobalIntensityControl";
import { LeverCard } from "./savings-levers/LeverCard";
import { ImpactSummaryCard } from "./savings-levers/ImpactSummaryCard";
import { WeeklyScoreboard } from "./savings-levers/WeeklyScoreboard";

export default function SavingsLevers() {
  const [baselines] = useState<CategoryBaseline[]>(MOCK_BASELINES);
  const [goal, setGoal] = useState<SavingsGoal>({
    monthlyTarget: 100,
    mode: "reduce" as GoalMode,
    globalIntensity: "balanced" as GlobalIntensity,
  });
  const [levers, setLevers] = useState<Lever[]>([]);
  const [weeklyResults, setWeeklyResults] = useState<WeeklyResult[]>([]);
  const [planBuilt, setPlanBuilt] = useState(false);

  const handleBuildPlan = (monthlyTarget: number, mode: GoalMode) => {
    const initialLevers = createInitialLevers(baselines);
    setGoal({ ...goal, monthlyTarget, mode });
    setLevers(initialLevers);
    setPlanBuilt(true);
  };

  const handleGlobalIntensityChange = (intensity: GlobalIntensity) => {
    const updated = applyGlobalIntensity(levers, intensity);
    setLevers(updated);
    setGoal({ ...goal, globalIntensity: intensity });
  };

  const handleLeverChange = (categoryId: string, updates: Partial<Lever>) => {
    setLevers((prev) =>
      prev.map((lever) =>
        lever.categoryId === categoryId ? { ...lever, ...updates } : lever
      )
    );
  };

  const handleLoadDemoWeek = () => {
    const results = generateDemoWeek(levers, baselines);
    setWeeklyResults(results);
  };

  const handleAdjustPlan = () => {
    // Reset weekly results
    setWeeklyResults([]);
  };

  const handleKeepPlan = () => {
    // In real app, would persist plan. Here, just reset results.
    setWeeklyResults([]);
  };

  const handleLowerStress = () => {
    const updated = applyGlobalIntensity(levers, "low");
    setLevers(updated);
    setGoal({ ...goal, globalIntensity: "low" });
    setWeeklyResults([]);
  };

  const totalSavings = calculateTotalSavings(levers, baselines);
  const weeklyTarget = goal.monthlyTarget / 4.33;
  const shortfall = Math.max(0, goal.monthlyTarget - totalSavings);
  const confidence = levers.length > 0 ? getConfidenceLevel(levers, baselines) : "Medium";

  const weekStatus = weeklyResults.length > 0 ? calculateWeekStatus(weeklyResults) : null;
  const weekVariance = weeklyResults.length > 0 ? calculateWeekVariance(weeklyResults) : 0;
  const statusMessage = weekStatus ? getStatusMessage(weekStatus, weekVariance) : "";

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-8 pb-20 lg:pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            Habit Tracking
          </div>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Save <span className="text-chart-2">${goal.monthlyTarget}</span>/month, without
            guessing.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Pick a goal, adjust a few levers, and we'll track it automatically.
          </p>

          {!planBuilt && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => setPlanBuilt(true)}
                className="bg-chart-2 hover:bg-chart-2/90 text-white"
              >
                <Target className="h-5 w-5" />
                Start a Goal
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  handleBuildPlan(100, "reduce");
                  setTimeout(() => handleLoadDemoWeek(), 500);
                }}
              >
                <TrendingDown className="h-5 w-5" />
                Load Demo Week
              </Button>
            </div>
          )}
        </motion.div>

        {/* Goal Setup Card */}
        {planBuilt && levers.length === 0 && (
          <GoalSetupCard onBuildPlan={handleBuildPlan} initialGoal={goal.monthlyTarget} />
        )}

        {/* Plan Builder */}
        {planBuilt && levers.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column: Levers */}
            <div className="space-y-6 lg:col-span-2">
              {/* Global Intensity Control */}
              <GlobalIntensityControl
                intensity={goal.globalIntensity}
                onChange={handleGlobalIntensityChange}
              />

              {/* Shortfall warning */}
              {shortfall > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-warning/30 bg-warning/5 p-4"
                >
                  <p className="text-sm text-warning-foreground">
                    You're <span className="font-semibold">${shortfall.toFixed(0)}</span> short.
                    Increase intensity or add a lever.
                  </p>
                </motion.div>
              )}

              {/* Lever Cards */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Your Levers
                </h2>
                {levers.map((lever, idx) => {
                  const baseline = baselines.find((b) => b.categoryId === lever.categoryId);
                  if (!baseline) return null;
                  return (
                    <LeverCard
                      key={lever.categoryId}
                      lever={lever}
                      baseline={baseline}
                      onChange={(updates) => handleLeverChange(lever.categoryId, updates)}
                      delay={idx * 0.05}
                    />
                  );
                })}
              </div>
            </div>

            {/* Right Column: Impact + Scoreboard */}
            <div className="space-y-6">
              <ImpactSummaryCard
                projectedSavings={totalSavings}
                weeklyTarget={weeklyTarget}
                monthlyGoal={goal.monthlyTarget}
                confidence={confidence}
              />

              {weeklyResults.length > 0 && (
                <WeeklyScoreboard
                  results={weeklyResults}
                  baselines={baselines}
                  status={weekStatus || "on-track"}
                  statusMessage={statusMessage}
                  onAdjust={handleAdjustPlan}
                  onKeep={handleKeepPlan}
                  onLowerStress={handleLowerStress}
                />
              )}

              {weeklyResults.length === 0 && levers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl border border-border bg-card p-6 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">Ready to test it?</h3>
                  <Button
                    onClick={handleLoadDemoWeek}
                    variant="outline"
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4" />
                    Load Demo Week
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
