"use client";
import { motion } from "framer-motion";
import { Lock, Unlock, Coffee, ShoppingCart, UtensilsCrossed, CreditCard, ShoppingBag } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { calculateLeverSavings, type Lever, type CategoryBaseline, type IntensityLevel } from "@/lib/savingsLevers";

interface LeverCardProps {
  lever: Lever;
  baseline: CategoryBaseline;
  onChange: (updates: Partial<Lever>) => void;
  delay?: number;
}

const categoryIcons: Record<string, typeof Coffee> = {
  groceries: ShoppingCart,
  coffee: Coffee,
  dining: UtensilsCrossed,
  subscriptions: CreditCard,
  shopping: ShoppingBag,
};

export function LeverCard({ lever, baseline, onChange, delay = 0 }: LeverCardProps) {
  const savings = calculateLeverSavings(lever, baseline);
  const Icon = categoryIcons[lever.categoryId] || ShoppingBag;

  const intensityOptions: IntensityLevel[] = ["gentle", "balanced", "aggressive"];

  const handleSliderChange = (values: number[]) => {
    if (lever.type === "frequency") {
      onChange({ targetTripsPerWeek: values[0] });
    } else {
      onChange({ reductionPercent: values[0] });
    }
  };

  const handleIntensityClick = (intensity: IntensityLevel) => {
    onChange({ intensity });
    // Also update values based on intensity
    if (intensity === "gentle") {
      if (lever.type === "frequency" && lever.baselineTripsPerWeek) {
        onChange({ intensity, targetTripsPerWeek: Math.max(1, lever.baselineTripsPerWeek - 1) });
      } else {
        onChange({ intensity, reductionPercent: 10 });
      }
    } else if (intensity === "balanced") {
      if (lever.type === "frequency" && lever.baselineTripsPerWeek) {
        onChange({ intensity, targetTripsPerWeek: Math.max(1, lever.baselineTripsPerWeek - 2) });
      } else {
        onChange({ intensity, reductionPercent: 15 });
      }
    } else {
      if (lever.type === "frequency" && lever.baselineTripsPerWeek) {
        onChange({ intensity, targetTripsPerWeek: Math.max(1, lever.baselineTripsPerWeek - 3) });
      } else {
        onChange({ intensity, reductionPercent: 25 });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl border border-border bg-card p-5 shadow-sm transition-all ${
        lever.locked ? "opacity-60" : ""
      }`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2 shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{baseline.name}</h3>
              <p className="text-xs text-muted-foreground">
                Baseline: ${baseline.monthlySpend.toFixed(0)}/mo
              </p>
            </div>
          </div>
          <button
            onClick={() => onChange({ locked: !lever.locked })}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={lever.locked ? "Unlock" : "Lock"}
          >
            {lever.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
        </div>

        {!lever.locked && (
          <>
            {/* Slider */}
            <div className="space-y-2">
              {lever.type === "frequency" ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trips per week</span>
                    <span className="font-semibold text-foreground">
                      {lever.targetTripsPerWeek} trips
                    </span>
                  </div>
                  <Slider
                    value={[lever.targetTripsPerWeek || 1]}
                    onValueChange={handleSliderChange}
                    min={1}
                    max={lever.baselineTripsPerWeek || 10}
                    step={1}
                    className="py-2"
                    aria-label="Trips per week"
                  />
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reduction</span>
                    <span className="font-semibold text-foreground">
                      {lever.reductionPercent}%
                    </span>
                  </div>
                  <Slider
                    value={[lever.reductionPercent || 0]}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={30}
                    step={5}
                    className="py-2"
                    aria-label="Reduction percentage"
                  />
                </>
              )}
            </div>

            {/* Intensity buttons */}
            <div className="grid grid-cols-3 gap-2">
              {intensityOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleIntensityClick(option)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                    lever.intensity === option
                      ? "border-chart-2 bg-chart-2/10 text-chart-2"
                      : "border-border bg-background text-muted-foreground hover:border-border/60"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Target savings</span>
                <span className="font-semibold text-success">${savings.toFixed(0)}/mo</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-chart-2 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (savings / baseline.monthlySpend) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </>
        )}

        {lever.locked && (
          <p className="text-xs text-muted-foreground italic">
            This category is locked and won't contribute to savings.
          </p>
        )}
      </div>
    </motion.div>
  );
}
