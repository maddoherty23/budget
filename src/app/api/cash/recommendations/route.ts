import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getCashPlan,
  getBillInstances,
  getPlannedSpending,
  createRecommendation,
} from "@/lib/firebase/cash-runway";
import { where, Timestamp } from "firebase/firestore";
import { calculateCashRunway } from "@/lib/cash-runway/engine";
import { billInstancesToEvents, plannedSpendingToEvents } from "@/lib/cash-runway/expanders";
import { getAccounts } from "@/lib/firebase";

/**
 * POST /api/cash/recommendations
 * Generates AI recommendations based on the current forecast
 * 
 * Request body:
 * {
 *   forecastId?: string (optional, for context)
 *   includeGenerated?: boolean (generate new recommendations, default true)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { includeGenerated = true } = body;

    // Load cash plan
    const cashPlan = await getCashPlan();
    const bufferFloor = cashPlan?.bufferFloor || 0;
    const horizonDays = cashPlan?.horizonDays || 90;
    const accountMode = cashPlan?.accountMode || "all";
    const selectedAccountIds = cashPlan?.selectedAccountIds || [];

    // Calculate forecast period
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + horizonDays);

    // Calculate carryover balance from accounts
    const accounts = await getAccounts([]);
    let carryoverBalance = 0;

    if (accountMode === "single" && selectedAccountIds.length > 0) {
      const account = accounts.find((a) => a.id === selectedAccountIds[0]);
      carryoverBalance = account?.currentBalance || 0;
    } else if (accountMode === "multi" && selectedAccountIds.length > 0) {
      carryoverBalance = accounts
        .filter((a) => selectedAccountIds.includes(a.id))
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    } else {
      // "all" mode
      carryoverBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    }

    // Load bill instances and planned spending
    const billInstances = await getBillInstances([
      where("dueDate", ">=", Timestamp.fromDate(today)),
      where("dueDate", "<=", Timestamp.fromDate(endDate)),
    ]);

    const plannedSpending = await getPlannedSpending([]);

    // Convert to events
    const billEvents = billInstancesToEvents(billInstances);
    const spendingEvents = plannedSpendingToEvents(plannedSpending, today, endDate);
    const allEvents = [...billEvents, ...spendingEvents];

    // Calculate forecast
    const forecast = calculateCashRunway(allEvents, carryoverBalance, bufferFloor, horizonDays, today);

    // Generate recommendations based on forecast analysis
    const recommendations: Array<{
      type: "delay_bill" | "cut_spending" | "increase_income" | "budget_adjustment" | "general";
      priority: "critical" | "high" | "medium" | "low";
      title: string;
      description: string;
      impact?: string;
      targetId?: string;
    }> = [];

    // Check for danger points and red days
    if (forecast.dangerPoint) {
      const dangerDay = forecast.dangerPoint;
      const redDaysCount = forecast.dailyBalances.filter((d) => d.isRedDay).length;

      if (redDaysCount > 0) {
        recommendations.push({
          type: "general",
          priority: "critical",
          title: "Negative balance detected",
          description: `Your forecast shows ${redDaysCount} day(s) with negative balance. The lowest balance (${dangerDay.balance.toFixed(2)}) occurs on ${dangerDay.date.toISOString().split("T")[0]}.`,
          impact: "Critical cash flow issue requiring immediate attention",
        });
      }
    }

    // Check for buffer violations
    const bufferViolations = forecast.dailyBalances.filter((d) => d.isBufferLow && !d.isRedDay);
    if (bufferViolations.length > 0) {
      recommendations.push({
        type: "budget_adjustment",
        priority: "high",
        title: "Buffer floor at risk",
        description: `Your balance will fall below your buffer floor ($${bufferFloor.toFixed(2)}) on ${bufferViolations.length} day(s) during the forecast period.`,
        impact: "Consider reducing discretionary spending or delaying flexible bills",
      });
    }

    // Check for months with shortfalls
    const monthsWithShortfall = forecast.monthSummaries.filter((m) => m.hasShortfall);
    if (monthsWithShortfall.length > 0) {
      for (const month of monthsWithShortfall) {
        recommendations.push({
          type: "cut_spending",
          priority: "high",
          title: `Shortfall in ${month.month}`,
          description: `Expenses exceed income by $${Math.abs(month.shortfall).toFixed(2)} in ${month.month}.`,
          impact: `Consider reducing planned spending by at least $${Math.abs(month.shortfall).toFixed(2)}`,
        });
      }
    }

    // Check for delayable bills during danger periods
    if (forecast.dangerPoint) {
      const dangerDate = forecast.dangerPoint.date;
      const delayableBills = billInstances.filter(
        (bill) =>
          bill.priority === "delayable" &&
          bill.dueDate.toDate() <= dangerDate &&
          bill.status === "pending"
      );

      if (delayableBills.length > 0) {
        for (const bill of delayableBills.slice(0, 3)) {
          recommendations.push({
            type: "delay_bill",
            priority: "medium",
            title: `Consider delaying: ${bill.name}`,
            description: `This bill ($${bill.amount.toFixed(2)}) is marked as delayable and could help improve your cash position.`,
            impact: `Delaying would improve balance by $${bill.amount.toFixed(2)}`,
            targetId: bill.id,
          });
        }
      }
    }

    // General advice based on forecast health
    if (forecast.dailyBalances.every((d) => !d.isRedDay && !d.isBufferLow)) {
      recommendations.push({
        type: "general",
        priority: "low",
        title: "Cash flow looks healthy",
        description: "Your forecast shows positive cash flow throughout the period with adequate buffers.",
        impact: "No immediate action needed",
      });
    }

    // Save recommendations to Firestore if requested
    let savedCount = 0;
    if (includeGenerated) {
      for (const rec of recommendations) {
        await createRecommendation({
          type: rec.type,
          priority: rec.priority,
          title: rec.title,
          description: rec.description,
          impact: rec.impact || null,
          targetId: rec.targetId || null,
          status: "pending",
        });
        savedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      recommendations,
      savedCount,
      forecastSummary: {
        totalDays: forecast.dailyBalances.length,
        redDays: forecast.dailyBalances.filter((d) => d.isRedDay).length,
        bufferLowDays: forecast.dailyBalances.filter((d) => d.isBufferLow).length,
        monthsWithShortfall: monthsWithShortfall.length,
        dangerPointBalance: forecast.dangerPoint?.balance || null,
      },
    });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
