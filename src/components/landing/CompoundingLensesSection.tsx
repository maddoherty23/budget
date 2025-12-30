"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingDown,
  PieChart,
  Wallet,
  Flame,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Lens data model
export interface Lens {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  rules: string[];
  stats: {
    label: string;
    value: string;
    subtext?: string;
  }[];
  bestFor: string;
  recommended?: boolean;
}

const lenses: Lens[] = [
  {
    id: "ramsey",
    name: "Ramsey Lens",
    icon: Target,
    tagline: "Snowball",
    rules: [
      "Build starter emergency fund first",
      "Attack smallest debt first",
      "Quick wins to build momentum",
    ],
    stats: [
      { label: "Debt-free date", value: "Nov 2027", subtext: "33 months" },
      { label: "Interest saved", value: "$3,240" },
      { label: "Monthly margin", value: "+$185" },
      { label: "Lowest cash day", value: "$42" },
      { label: "Days of runway", value: "9.8" },
      { label: "Motivation score", value: "High" },
    ],
    bestFor: "motivation",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    icon: TrendingDown,
    tagline: "Highest APR first",
    rules: [
      "Target highest interest rate",
      "Minimize total interest paid",
      "Math-optimized approach",
    ],
    stats: [
      { label: "Debt-free date", value: "Aug 2027", subtext: "30 months" },
      { label: "Interest saved", value: "$4,180" },
      { label: "Monthly margin", value: "+$210" },
      { label: "Lowest cash day", value: "$28" },
      { label: "Days of runway", value: "7.2" },
      { label: "Total savings", value: "$940 more" },
    ],
    bestFor: "minimizing interest",
  },
  {
    id: "fifty-thirty-twenty",
    name: "50/30/20",
    icon: PieChart,
    tagline: "Balanced buckets",
    rules: [
      "50% needs (rent, bills, groceries)",
      "30% wants (fun, dining, hobbies)",
      "20% savings and debt payoff",
    ],
    stats: [
      { label: "Debt-free date", value: "Feb 2029", subtext: "50 months" },
      { label: "Interest saved", value: "$1,820" },
      { label: "Monthly margin", value: "+$350" },
      { label: "Lowest cash day", value: "$180" },
      { label: "Days of runway", value: "18.5" },
      { label: "Quality of life", value: "High" },
    ],
    bestFor: "balanced lifestyle",
  },
  {
    id: "pay-yourself",
    name: "Pay Yourself First",
    icon: Wallet,
    tagline: "Savings priority",
    rules: [
      "Save 20% before anything else",
      "Build emergency fund aggressively",
      "Then tackle expenses and debt",
    ],
    stats: [
      { label: "Debt-free date", value: "Jan 2029", subtext: "49 months" },
      { label: "Interest saved", value: "$2,050" },
      { label: "Monthly margin", value: "+$280" },
      { label: "Lowest cash day", value: "$420" },
      { label: "Days of runway", value: "32.0" },
      { label: "Emergency fund", value: "$8,200" },
    ],
    bestFor: "building security",
  },
  {
    id: "fire",
    name: "FIRE / Early Freedom",
    icon: Flame,
    tagline: "Aggressive saving",
    rules: [
      "Save 50-70% of income",
      "Minimize lifestyle costs",
      "Invest aggressively for freedom",
    ],
    stats: [
      { label: "Debt-free date", value: "Mar 2026", subtext: "15 months" },
      { label: "Interest saved", value: "$5,420" },
      { label: "Monthly margin", value: "-$120", subtext: "tight" },
      { label: "Lowest cash day", value: "$8" },
      { label: "Days of runway", value: "3.1" },
      { label: "Freedom date", value: "2035" },
    ],
    bestFor: "early retirement",
  },
  {
    id: "safety-first",
    name: "Safety-First Runway",
    icon: Shield,
    tagline: "Budget Buddy original",
    rules: [
      "Always maintain 14-day runway",
      "Balance debt vs. emergency buffer",
      "Avoid overdrafts at all costs",
    ],
    stats: [
      { label: "Debt-free date", value: "Oct 2027", subtext: "32 months" },
      { label: "Interest saved", value: "$3,580" },
      { label: "Monthly margin", value: "+$220" },
      { label: "Lowest cash day", value: "$320" },
      { label: "Days of runway", value: "14.0+", subtext: "always" },
      { label: "Overdraft risk", value: "Zero" },
    ],
    bestFor: "avoiding overdrafts",
    recommended: true,
  },
];

export default function CompoundingLensesSection() {
  const [activeLens, setActiveLens] = useState<string>("safety-first");
  const [compareMode, setCompareMode] = useState(false);

  const currentLens = lenses.find((l) => l.id === activeLens) || lenses[5];
  const compareLenses = lenses.filter((l) =>
    ["ramsey", "avalanche", "safety-first"].includes(l.id)
  );

  return (
    <section className="scroll-mt-20 border-t border-border bg-background py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            New: Compounding Lenses
          </div>

          <h2 className="mb-4 text-3xl font-bold leading-tight text-foreground md:text-4xl">
            See what small changes{" "}
            <span className="text-primary">become</span>
          </h2>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Switch between proven money strategies and instantly see how each
            one plays out using your real cashflow. No lectures, just clarity.
          </p>
        </div>

        {/* Compare Mode Toggle */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setCompareMode(false)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              !compareMode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              compareMode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Compare
          </button>
        </div>

        {/* Lens Picker */}
        {!compareMode && (
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex justify-center gap-2 px-4">
              {lenses.map((lens) => {
                const Icon = lens.icon;
                const isActive = activeLens === lens.id;

                return (
                  <button
                    key={lens.id}
                    onClick={() => setActiveLens(lens.id)}
                    className={`group relative flex min-w-[140px] flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? "text-foreground" : "text-foreground"
                        }`}
                      >
                        {lens.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lens.tagline}
                      </p>
                    </div>
                    {lens.recommended && (
                      <div className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        Recommended
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results Preview (Single Mode) */}
        <AnimatePresence mode="wait">
          {!compareMode && (
            <motion.div
              key={activeLens}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-lg"
            >
              <div className="grid gap-8 md:grid-cols-2">
                {/* Left: What this lens does */}
                <div>
                  <h3 className="mb-4 text-xl font-bold text-foreground">
                    What this lens does
                  </h3>
                  <ul className="space-y-3">
                    {currentLens.rules.map((rule, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-muted-foreground"
                      >
                        <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Subtle timeline bar */}
                  <div className="mt-6">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Your journey timeline
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="flex h-full">
                        <div className="w-[30%] bg-primary" />
                        <div className="w-[40%] bg-primary/60" />
                        <div className="w-[30%] bg-primary/30" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Your projected impact */}
                <div>
                  <h3 className="mb-4 text-xl font-bold text-foreground">
                    Your projected impact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {currentLens.stats.map((stat, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-secondary/30 p-4"
                      >
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-lg font-bold text-foreground">
                          {stat.value}
                        </p>
                        {stat.subtext && (
                          <p className="text-xs text-muted-foreground">
                            {stat.subtext}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">Best for:</span>{" "}
                      {currentLens.bestFor}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Compare Mode */}
          {compareMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid gap-6 md:grid-cols-3"
            >
              {compareLenses.map((lens) => {
                const Icon = lens.icon;

                return (
                  <div
                    key={lens.id}
                    className={`relative rounded-2xl border p-6 ${
                      lens.recommended
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card"
                    }`}
                  >
                    {lens.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        Recommended
                      </div>
                    )}

                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {lens.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {lens.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {lens.stats.slice(0, 3).map((stat, index) => (
                        <div key={index}>
                          <p className="text-xs text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="text-base font-bold text-foreground">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Best for
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {lens.bestFor}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA Row */}
        <div className="mt-12 rounded-2xl border border-border bg-secondary/30 p-8 text-center">
          <p className="mb-4 text-lg font-semibold text-foreground">
            Want the plan that fits your life?
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button variant="hero" className="group">
              Try the Lenses
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="hero-outline">See an Example</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
