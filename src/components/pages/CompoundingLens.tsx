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
  Download,
  Share2,
  Info,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Lens data model
interface Lens {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
  description: string;
  rules: string[];
  stats: {
    label: string;
    value: string;
    subtext?: string;
    trend?: "up" | "down" | "neutral";
  }[];
  bestFor: string;
  recommended?: boolean;
  benefits: string[];
  considerations: string[];
}

const lenses: Lens[] = [
  {
    id: "ramsey",
    name: "Ramsey Lens",
    icon: Target,
    tagline: "Snowball method for motivation",
    description: "Build a starter emergency fund, then attack your smallest debts first. Quick wins build momentum and keep you motivated through your debt-free journey.",
    rules: [
      "Build $1,000 starter emergency fund",
      "Attack smallest debt first",
      "Roll payments into next smallest debt",
      "Build 3-6 month emergency fund after debt-free",
    ],
    stats: [
      { label: "Debt-free date", value: "Nov 2027", subtext: "33 months", trend: "neutral" },
      { label: "Interest saved", value: "$3,240", subtext: "vs minimum payments", trend: "up" },
      { label: "Monthly margin", value: "+$185", subtext: "after debt", trend: "up" },
      { label: "Lowest cash day", value: "$42", subtext: "tight at first", trend: "down" },
      { label: "Days of runway", value: "9.8", subtext: "building slowly", trend: "neutral" },
      { label: "Motivation score", value: "High", subtext: "quick wins", trend: "up" },
    ],
    bestFor: "motivation",
    benefits: [
      "Quick psychological wins",
      "Simple to understand and follow",
      "Builds momentum and confidence",
      "Great for couples (shared victories)",
    ],
    considerations: [
      "May pay more interest overall",
      "Requires tight budget initially",
      "Not mathematically optimal",
    ],
    recommended: false,
  },
  {
    id: "avalanche",
    name: "Avalanche",
    icon: TrendingDown,
    tagline: "Mathematically optimal",
    description: "Target your highest interest rate debt first to minimize total interest paid. This is the most cost-efficient approach for becoming debt-free.",
    rules: [
      "Target highest APR debt first",
      "Make minimum payments on all others",
      "Roll payments to next highest APR",
      "Saves the most money long-term",
    ],
    stats: [
      { label: "Debt-free date", value: "Aug 2027", subtext: "30 months", trend: "up" },
      { label: "Interest saved", value: "$4,180", subtext: "vs minimum payments", trend: "up" },
      { label: "Monthly margin", value: "+$210", subtext: "after debt", trend: "up" },
      { label: "Lowest cash day", value: "$28", subtext: "tightest strategy", trend: "down" },
      { label: "Days of runway", value: "7.2", subtext: "low buffer", trend: "down" },
      { label: "Total savings", value: "$940 more", subtext: "vs Ramsey", trend: "up" },
    ],
    bestFor: "minimizing interest",
    benefits: [
      "Saves the most money overall",
      "Fastest debt payoff timeline",
      "Mathematically optimal",
      "Best for analytical minds",
    ],
    considerations: [
      "May take longer to see first win",
      "Requires strong discipline",
      "Lowest cash buffer during payoff",
    ],
    recommended: false,
  },
  {
    id: "fifty-thirty-twenty",
    name: "50/30/20",
    icon: PieChart,
    tagline: "Balanced lifestyle approach",
    description: "Split your after-tax income into three buckets: 50% for needs, 30% for wants, and 20% for savings and debt. Maintains quality of life while making progress.",
    rules: [
      "50% needs (rent, bills, groceries)",
      "30% wants (fun, dining, hobbies)",
      "20% savings and debt payoff",
      "Balance lifestyle with progress",
    ],
    stats: [
      { label: "Debt-free date", value: "Feb 2029", subtext: "50 months", trend: "neutral" },
      { label: "Interest saved", value: "$1,820", subtext: "vs minimum payments", trend: "neutral" },
      { label: "Monthly margin", value: "+$350", subtext: "comfortable", trend: "up" },
      { label: "Lowest cash day", value: "$180", subtext: "healthy buffer", trend: "up" },
      { label: "Days of runway", value: "18.5", subtext: "comfortable", trend: "up" },
      { label: "Quality of life", value: "High", subtext: "room to breathe", trend: "up" },
    ],
    bestFor: "balanced lifestyle",
    benefits: [
      "Room for fun and spontaneity",
      "Sustainable long-term",
      "Less restrictive",
      "Good for families",
    ],
    considerations: [
      "Slower debt payoff",
      "Pays more interest",
      "May not work if over-leveraged",
    ],
    recommended: false,
  },
  {
    id: "pay-yourself",
    name: "Pay Yourself First",
    icon: Wallet,
    tagline: "Security through savings",
    description: "Save 20% before anything else, then cover expenses and tackle debt. Builds a strong financial foundation before aggressive debt payoff.",
    rules: [
      "Save 20% of income first",
      "Build 6-month emergency fund",
      "Then tackle debt aggressively",
      "Maintain savings habit forever",
    ],
    stats: [
      { label: "Debt-free date", value: "Jan 2029", subtext: "49 months", trend: "neutral" },
      { label: "Interest saved", value: "$2,050", subtext: "vs minimum payments", trend: "neutral" },
      { label: "Monthly margin", value: "+$280", subtext: "solid", trend: "up" },
      { label: "Lowest cash day", value: "$420", subtext: "strong buffer", trend: "up" },
      { label: "Days of runway", value: "32.0", subtext: "very secure", trend: "up" },
      { label: "Emergency fund", value: "$8,200", subtext: "fully funded", trend: "up" },
    ],
    bestFor: "building security",
    benefits: [
      "Strong emergency fund early",
      "Less financial stress",
      "Builds wealth mindset",
      "Protects against setbacks",
    ],
    considerations: [
      "Slower debt payoff",
      "Higher interest costs",
      "May feel counterintuitive",
    ],
    recommended: false,
  },
  {
    id: "fire",
    name: "FIRE / Early Freedom",
    icon: Flame,
    tagline: "Aggressive path to freedom",
    description: "Save 50-70% of your income and invest aggressively. Minimize lifestyle costs to achieve financial independence and early retirement.",
    rules: [
      "Save 50-70% of income",
      "Minimize lifestyle expenses",
      "Invest aggressively",
      "Target financial independence in 10-15 years",
    ],
    stats: [
      { label: "Debt-free date", value: "Mar 2026", subtext: "15 months", trend: "up" },
      { label: "Interest saved", value: "$5,420", subtext: "vs minimum payments", trend: "up" },
      { label: "Monthly margin", value: "-$120", subtext: "very tight", trend: "down" },
      { label: "Lowest cash day", value: "$8", subtext: "risky buffer", trend: "down" },
      { label: "Days of runway", value: "3.1", subtext: "minimal", trend: "down" },
      { label: "Freedom date", value: "2035", subtext: "early retirement", trend: "up" },
    ],
    bestFor: "early retirement",
    benefits: [
      "Fastest path to freedom",
      "Maximum investment growth",
      "Early retirement potential",
      "Forces efficiency mindset",
    ],
    considerations: [
      "Extremely restrictive lifestyle",
      "High risk if income drops",
      "Not for everyone",
      "Requires unwavering discipline",
    ],
    recommended: false,
  },
  {
    id: "safety-first",
    name: "Safety-First Runway",
    icon: Shield,
    tagline: "Budget Buddy original",
    description: "Always maintain a 14-day cash runway while balancing debt payoff. Avoids overdrafts and late fees by keeping a healthy buffer at all times.",
    rules: [
      "Always maintain 14+ days of runway",
      "Balance debt payoff with buffer",
      "Never risk overdrafts",
      "Optimize for peace of mind",
    ],
    stats: [
      { label: "Debt-free date", value: "Oct 2027", subtext: "32 months", trend: "up" },
      { label: "Interest saved", value: "$3,580", subtext: "vs minimum payments", trend: "up" },
      { label: "Monthly margin", value: "+$220", subtext: "strong", trend: "up" },
      { label: "Lowest cash day", value: "$320", subtext: "safe buffer", trend: "up" },
      { label: "Days of runway", value: "14.0+", subtext: "always protected", trend: "up" },
      { label: "Overdraft risk", value: "Zero", subtext: "eliminated", trend: "up" },
    ],
    bestFor: "avoiding overdrafts",
    benefits: [
      "Zero overdraft fees",
      "Maximum peace of mind",
      "Handles unexpected expenses",
      "Balances speed with safety",
      "Budget Buddy helps you maintain this",
    ],
    considerations: [
      "Slightly slower than Avalanche",
      "Requires initial buffer build",
      "May feel conservative to some",
    ],
    recommended: true,
  },
];

export default function CompoundingLens() {
  const [activeLens, setActiveLens] = useState<string>("safety-first");
  const [compareMode, setCompareMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const currentLens = lenses.find((l) => l.id === activeLens) || lenses[5];
  const compareLenses = lenses.filter((l) =>
    ["ramsey", "avalanche", "safety-first"].includes(l.id)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          New Feature
        </div>
        <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
          Compounding Lens
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          See how different financial strategies would play out with your real
          cashflow. Switch between proven approaches and find the one that
          fits your life.
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Using placeholder data for now
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your accounts and add your debts to see personalized
              projections based on your actual finances. These examples use
              average household data.
            </p>
          </div>
        </div>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCompareMode(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              !compareMode
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Single View
          </button>
          <button
            onClick={() => setCompareMode(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              compareMode
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            Compare
          </button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Lens Picker */}
      {!compareMode && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3">
            {lenses.map((lens) => {
              const Icon = lens.icon;
              const isActive = activeLens === lens.id;

              return (
                <button
                  key={lens.id}
                  onClick={() => setActiveLens(lens.id)}
                  className={`group relative flex min-w-[180px] flex-col gap-3 rounded-xl border p-4 transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
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
                  </div>
                  {lens.recommended && (
                    <div className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground shadow-md">
                      Recommended
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Single View */}
      <AnimatePresence mode="wait">
        {!compareMode && (
          <motion.div
            key={activeLens}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Description Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="mb-2 text-2xl font-bold text-foreground">
                    {currentLens.name}
                  </h2>
                  <p className="mb-4 text-muted-foreground">
                    {currentLens.description}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Best for: {currentLens.bestFor}
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              {currentLens.stats.map((stat, index) => (
                <Card key={index} className="p-5">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  {stat.subtext && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.subtext}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Rules */}
              <Card className="p-6">
                <h3 className="mb-4 text-xl font-bold text-foreground">
                  How it works
                </h3>
                <ul className="space-y-3">
                  {currentLens.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {rule}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Benefits & Considerations */}
              <Card className="p-6">
                <h3 className="mb-4 text-xl font-bold text-foreground">
                  Pros & Cons
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-success">
                      Benefits
                    </p>
                    <ul className="space-y-2">
                      {currentLens.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-warning">
                      Considerations
                    </p>
                    <ul className="space-y-2">
                      {currentLens.considerations.map((consideration, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                          {consideration}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Card */}
            <Card className="border-primary/20 bg-primary/5 p-6">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <div className="text-center md:text-left">
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    Ready to try this strategy?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your accounts to see personalized projections with
                    your real data.
                  </p>
                </div>
                <Button size="lg" className="group">
                  Get Started
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Compare View */}
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
                <Card
                  key={lens.id}
                  className={`p-6 ${
                    lens.recommended
                      ? "border-primary shadow-lg"
                      : "border-border"
                  }`}
                >
                  {lens.recommended && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      <Sparkles className="h-3 w-3" />
                      Recommended
                    </div>
                  )}

                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{lens.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {lens.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {lens.stats.slice(0, 4).map((stat, index) => (
                      <div key={index}>
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="text-lg font-bold text-foreground">
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

                  <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Best for</p>
                    <p className="font-semibold text-foreground">
                      {lens.bestFor}
                    </p>
                  </div>

                  <Button
                    variant={lens.recommended ? "default" : "outline"}
                    className="mt-4 w-full"
                    size="sm"
                  >
                    View Details
                  </Button>
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
