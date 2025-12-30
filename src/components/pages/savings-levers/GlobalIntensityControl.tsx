"use client";
import { motion } from "framer-motion";
import type { GlobalIntensity } from "@/lib/savingsLevers";

interface GlobalIntensityControlProps {
  intensity: GlobalIntensity;
  onChange: (intensity: GlobalIntensity) => void;
}

export function GlobalIntensityControl({ intensity, onChange }: GlobalIntensityControlProps) {
  const options: { value: GlobalIntensity; label: string }[] = [
    { value: "low", label: "Low stress" },
    { value: "balanced", label: "Balanced" },
    { value: "fast", label: "Fast results" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Overall intensity</label>
        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                intensity === option.value
                  ? "border-chart-2 bg-chart-2/10 text-chart-2"
                  : "border-border bg-background text-muted-foreground hover:border-border/60"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
