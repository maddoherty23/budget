"use client";

import { useState } from "react";
import {
  CreditCard,
  Repeat,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
  DollarSign,
  Check,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Clock,
  X,
} from "lucide-react";
import { RecoveryInsight } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRecoveryInsights } from "@/hooks/useRecoveryInsights";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RecoveryStackProps {
  insights: RecoveryInsight[];
}

const INSIGHT_ICONS = {
  subscription: CreditCard,
  duplicate: Repeat,
  price_creep: TrendingUpIcon,
  fee_leak: AlertCircle,
  refund_credit: DollarSign,
};

const INSIGHT_COLORS = {
  subscription: "text-blue-600 bg-blue-100",
  duplicate: "text-purple-600 bg-purple-100",
  price_creep: "text-orange-600 bg-orange-100",
  fee_leak: "text-red-600 bg-red-100",
  refund_credit: "text-green-600 bg-green-100",
};

export function RecoveryStack({ insights }: RecoveryStackProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { markAsDone, snooze, dismiss } = useRecoveryInsights();

  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <DollarSign className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No opportunities found</h3>
        <p className="text-gray-600">
          Scan your transactions to discover money you can recover.
        </p>
      </div>
    );
  }

  const handleMarkDone = async (id: string) => {
    try {
      await markAsDone(id);
      toast.success("Marked as done");
    } catch (error) {
      toast.error("Failed to mark as done");
    }
  };

  const handleSnooze = async (id: string, days: number) => {
    try {
      await snooze(id, days);
      toast.success(`Snoozed for ${days} days`);
    } catch (error) {
      toast.error("Failed to snooze");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await dismiss(id);
      toast.success("Dismissed");
    } catch (error) {
      toast.error("Failed to dismiss");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Recovery Stack</h2>
      <p className="text-sm text-gray-600">Ranked by impact and confidence</p>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = INSIGHT_ICONS[insight.type];
          const colorClass = INSIGHT_COLORS[insight.type];
          const isExpanded = expandedId === insight.id;

          return (
            <div
              key={insight.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="p-4">
                {/* Card Header */}
                <div className="flex items-start gap-4">
                  <div className={cn("rounded-lg p-2", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">{insight.summary}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-600">
                          ${insight.estimatedMonthlySavings.toFixed(2)}/mo
                        </p>
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          insight.confidence >= 0.75
                            ? "default"
                            : insight.confidence >= 0.6
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {insight.confidence >= 0.75
                          ? "High"
                          : insight.confidence >= 0.6
                          ? "Medium"
                          : "Low"}{" "}
                        confidence
                      </Badge>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: insight.effort }).map((_, i) => (
                          <div
                            key={i}
                            className="h-2 w-2 rounded-full bg-gray-400"
                          />
                        ))}
                        <span className="ml-1 text-xs text-gray-500">
                          {insight.effort === 1 ? "Easy" : insight.effort === 2 ? "Medium" : "Hard"}
                        </span>
                      </div>

                      {/* Impact Tags */}
                      {insight.safetyImpact >= 0.7 && (
                        <Badge variant="outline" className="text-xs">
                          Reduces risk
                        </Badge>
                      )}
                      {insight.estimatedMonthlySavings >= 20 && (
                        <Badge variant="outline" className="text-xs">
                          Frees cash
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : insight.id!)
                        }
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            View why
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleMarkDone(insight.id!)}
                        className="gap-1"
                      >
                        <Check className="h-4 w-4" />
                        Mark done
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleSnooze(insight.id!, 7)}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Snooze 7 days
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSnooze(insight.id!, 30)}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Snooze 30 days
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDismiss(insight.id!)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Not relevant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Expanded Evidence */}
                {isExpanded && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="mb-2 font-semibold text-gray-900">Why we flagged this</h4>
                    <p className="mb-3 text-sm text-gray-600">
                      {insight.type === "subscription" &&
                        "This appears to be a recurring charge. If you're not using this service, canceling could free up monthly cash."}
                      {insight.type === "duplicate" &&
                        "You have multiple subscriptions in the same category. Consolidating could save money without losing functionality."}
                      {insight.type === "price_creep" &&
                        "The price for this recurring charge has increased over time. Contact the provider to negotiate or consider alternatives."}
                      {insight.type === "fee_leak" &&
                        "Banking fees add up quickly. Switching to a no-fee account or adjusting your habits could eliminate these charges."}
                      {insight.type === "refund_credit" &&
                        "We found refund or credit transactions. Make sure you've claimed all available money."}
                    </p>

                    <h5 className="mb-2 text-sm font-semibold text-gray-700">Evidence</h5>
                    <div className="space-y-2">
                      {insight.evidence.slice(0, 5).map((ev, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
                        >
                          <div>
                            <span className="font-medium text-gray-900">
                              {ev.merchant}
                            </span>
                            {ev.note && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({ev.note})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">
                              ${ev.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(ev.date), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 text-sm text-gray-600">
                      <strong>What happens if you act:</strong>{" "}
                      {insight.type === "subscription" &&
                        "You'll stop being charged and can redirect this money toward your financial goals."}
                      {insight.type === "duplicate" &&
                        "You'll simplify your subscriptions and reduce monthly expenses."}
                      {insight.type === "price_creep" &&
                        "You may get a discounted rate or find a better alternative."}
                      {insight.type === "fee_leak" &&
                        "You'll save money each month and improve your cash flow."}
                      {insight.type === "refund_credit" &&
                        "You'll ensure no money is left on the table."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
