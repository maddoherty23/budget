import { Timestamp } from "firebase/firestore";
import {
  ForecastInputs,
  CashForecast,
  DailyBalance,
  MonthSummary,
  DangerPoint,
  CashEvent,
} from "./types";
import {
  generateDateRange,
  groupDatesByMonth,
  billInstancesToEvents,
  expandAllPlannedSpending,
  aggregateAndSortEvents,
  formatDate,
} from "./expanders";
import { generateInputsHash } from "./cache";

// ============================================================================
// Core Forecast Engine
// ============================================================================

/**
 * Calculates the cash runway forecast for the given inputs
 * This is a pure function that performs no I/O operations
 * 
 * @param inputs - Forecast inputs (balance, bills, spending, etc.)
 * @returns Complete cash forecast with daily balances and summaries
 */
export function calculateCashRunway(inputs: ForecastInputs): CashForecast {
  const startTime = Date.now();
  
  // Step 1: Generate all cash events
  const events = collectAllEvents(inputs);
  
  // Step 2: Generate date range for horizon
  const dateRange = generateDateRange(inputs.startDate, inputs.horizonDays);
  
  // Step 3: Group events by date
  const eventsByDate = groupEventsByDate(events);
  
  // Step 4: Calculate daily balances
  const daily = calculateDailyBalances(
    dateRange,
    eventsByDate,
    inputs.carryoverBalance,
    inputs.bufferFloor
  );
  
  // Step 5: Calculate month summaries
  const monthSummaries = calculateMonthSummaries(daily);
  
  // Step 6: Identify danger point (lowest balance)
  const dangerPoint = findDangerPoint(daily);
  
  // Step 7: Collect red days
  const redDays = daily
    .filter((d) => d.flags.includes("red"))
    .map((d) => d.date);
  
  // Step 8: Generate input hash for caching
  const inputsHash = generateInputsHash(inputs);
  
  const endTime = Date.now();
  console.log(`Forecast calculation took ${endTime - startTime}ms for ${inputs.horizonDays} days`);
  
  return {
    userId: inputs.userId,
    horizonStart: Timestamp.fromDate(inputs.startDate),
    horizonDays: inputs.horizonDays,
    inputsHash,
    daily,
    dangerPoint,
    monthSummaries,
    redDays,
    createdAt: Timestamp.now(),
  };
}

// ============================================================================
// Step 1: Collect All Events
// ============================================================================

function collectAllEvents(inputs: ForecastInputs): CashEvent[] {
  const eventGroups: CashEvent[][] = [];
  
  // Convert bill instances to events
  const billEvents = billInstancesToEvents(inputs.billInstances);
  eventGroups.push(billEvents);
  
  // Expand planned spending to events
  const spendingEvents = expandAllPlannedSpending(inputs.plannedSpending);
  eventGroups.push(spendingEvents);
  
  // Add income events if provided
  if (inputs.incomeEvents && inputs.incomeEvents.length > 0) {
    eventGroups.push(inputs.incomeEvents);
  }
  
  // Apply scenario edits if provided (in-memory modifications)
  let allEvents = aggregateAndSortEvents(eventGroups);
  
  if (inputs.scenarioEdits && inputs.scenarioEdits.length > 0) {
    allEvents = applyScenarioEdits(allEvents, inputs.scenarioEdits);
  }
  
  return allEvents;
}

function applyScenarioEdits(
  events: CashEvent[],
  edits: ForecastInputs["scenarioEdits"]
): CashEvent[] {
  if (!edits || edits.length === 0) return events;
  
  let modifiedEvents = [...events];
  
  edits.forEach((edit) => {
    if (edit.type === "addSpending" && edit.date && edit.amount) {
      // Add a new spending event
      modifiedEvents.push({
        id: `scenario-spending-${edit.date}`,
        date: edit.date,
        amount: -Math.abs(edit.amount),
        kind: "planned",
        meta: {
          name: "Scenario Spending",
        },
      });
    } else if (edit.type === "moveBill" && edit.targetId && edit.newDate) {
      // Move a bill to a new date
      modifiedEvents = modifiedEvents.map((event) =>
        event.id === edit.targetId
          ? { ...event, date: edit.newDate! }
          : event
      );
    } else if (edit.type === "adjustAmount" && edit.targetId && edit.amount) {
      // Adjust an event amount
      modifiedEvents = modifiedEvents.map((event) =>
        event.id === edit.targetId
          ? { ...event, amount: event.amount < 0 ? -Math.abs(edit.amount!) : Math.abs(edit.amount!) }
          : event
      );
    }
  });
  
  // Re-sort after modifications
  return aggregateAndSortEvents([modifiedEvents]);
}

// ============================================================================
// Step 2: Group Events by Date
// ============================================================================

function groupEventsByDate(events: CashEvent[]): Map<string, CashEvent[]> {
  const grouped = new Map<string, CashEvent[]>();
  
  events.forEach((event) => {
    if (!grouped.has(event.date)) {
      grouped.set(event.date, []);
    }
    grouped.get(event.date)!.push(event);
  });
  
  return grouped;
}

// ============================================================================
// Step 3: Calculate Daily Balances
// ============================================================================

function calculateDailyBalances(
  dateRange: string[],
  eventsByDate: Map<string, CashEvent[]>,
  startingBalance: number,
  bufferFloor: number
): DailyBalance[] {
  const dailyBalances: DailyBalance[] = [];
  let previousBalance = startingBalance;
  
  dateRange.forEach((date) => {
    const eventsToday = eventsByDate.get(date) || [];
    
    // Calculate inflows and outflows
    const inflows = eventsToday
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const outflows = eventsToday
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    
    // Calculate ending balance
    const endingBalance = previousBalance + inflows - outflows;
    
    // Determine flags
    const flags: string[] = [];
    if (endingBalance < 0) {
      flags.push("red");
    } else if (endingBalance < bufferFloor) {
      flags.push("buffer-low");
    }
    
    dailyBalances.push({
      date,
      startingBalance: previousBalance,
      inflows,
      outflows,
      endingBalance,
      flags,
      events: eventsToday,
    });
    
    // Carry over to next day
    previousBalance = endingBalance;
  });
  
  return dailyBalances;
}

// ============================================================================
// Step 4: Calculate Month Summaries
// ============================================================================

function calculateMonthSummaries(daily: DailyBalance[]): MonthSummary[] {
  // Group daily balances by month
  const months = groupDatesByMonth(daily.map((d) => d.date));
  
  const summaries: MonthSummary[] = [];
  
  months.forEach((dates, month) => {
    const daysInMonth = daily.filter((d) => dates.includes(d.date));
    
    // End of month balance (last day)
    const endBalance = daysInMonth[daysInMonth.length - 1]?.endingBalance || 0;
    
    // Find minimum balance in month
    const minBalance = Math.min(...daysInMonth.map((d) => d.endingBalance));
    const minBalanceDay = daysInMonth.find((d) => d.endingBalance === minBalance);
    const minBalanceDate = minBalanceDay?.date || dates[0];
    
    // Calculate shortfall
    // If minimum balance is negative, the month is short by that amount
    const shortBy = minBalance < 0 ? Math.abs(minBalance) : 0;
    
    summaries.push({
      month,
      endBalance,
      shortBy,
      minBalance,
      minBalanceDate,
    });
  });
  
  return summaries.sort((a, b) => a.month.localeCompare(b.month));
}

// ============================================================================
// Step 5: Find Danger Point
// ============================================================================

function findDangerPoint(daily: DailyBalance[]): DangerPoint | null {
  if (daily.length === 0) return null;
  
  // Find the day with the lowest balance
  const lowestDay = daily.reduce((lowest, current) =>
    current.endingBalance < lowest.endingBalance ? current : lowest
  );
  
  // Only return if it's concerning (below 0 or significantly low)
  if (lowestDay.endingBalance < 100) {
    return {
      date: lowestDay.date,
      balance: lowestDay.endingBalance,
    };
  }
  
  return null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculates the runway until the first red day or end of horizon
 */
export function calculateRunwayDays(forecast: CashForecast): number {
  if (forecast.redDays.length === 0) {
    return forecast.horizonDays; // Full runway
  }
  
  // Days until first red day
  const firstRedDay = forecast.redDays[0];
  const horizonStart = forecast.horizonStart.toDate();
  const redDate = new Date(firstRedDay);
  
  const daysDiff = Math.floor(
    (redDate.getTime() - horizonStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(0, daysDiff);
}

/**
 * Gets the first red day date or null
 */
export function getFirstRedDay(forecast: CashForecast): string | null {
  return forecast.redDays.length > 0 ? forecast.redDays[0] : null;
}

/**
 * Checks if a specific month has a shortfall
 */
export function hasMonthShortfall(forecast: CashForecast, month: string): boolean {
  const summary = forecast.monthSummaries.find((m) => m.month === month);
  return summary ? summary.shortBy > 0 : false;
}

/**
 * Gets the total shortfall amount across all months
 */
export function getTotalShortfall(forecast: CashForecast): number {
  return forecast.monthSummaries.reduce((sum, m) => sum + m.shortBy, 0);
}

/**
 * Calculates impact of changing a single event
 * Returns a new forecast with the change applied (for what-if scenarios)
 */
export function calculateImpact(
  originalInputs: ForecastInputs,
  modification: ForecastInputs["scenarioEdits"][0]
): CashForecast {
  const modifiedInputs: ForecastInputs = {
    ...originalInputs,
    scenarioEdits: [...(originalInputs.scenarioEdits || []), modification],
  };
  
  return calculateCashRunway(modifiedInputs);
}

/**
 * Compares two forecasts and returns the differences
 */
export function compareForecast(
  before: CashForecast,
  after: CashForecast
): {
  redDaysEliminated: number;
  redDaysCreated: number;
  balanceImprovement: number;
  daysImproved: number;
} {
  const redDaysEliminated = before.redDays.filter(
    (d) => !after.redDays.includes(d)
  ).length;
  
  const redDaysCreated = after.redDays.filter(
    (d) => !before.redDays.includes(d)
  ).length;
  
  // Calculate average balance improvement
  const beforeAvg =
    before.daily.reduce((sum, d) => sum + d.endingBalance, 0) / before.daily.length;
  const afterAvg =
    after.daily.reduce((sum, d) => sum + d.endingBalance, 0) / after.daily.length;
  const balanceImprovement = afterAvg - beforeAvg;
  
  // Count days where balance improved
  const daysImproved = before.daily.filter((beforeDay, i) => {
    const afterDay = after.daily[i];
    return afterDay && afterDay.endingBalance > beforeDay.endingBalance;
  }).length;
  
  return {
    redDaysEliminated,
    redDaysCreated,
    balanceImprovement,
    daysImproved,
  };
}

/**
 * Gets events for a specific date
 */
export function getEventsForDate(forecast: CashForecast, date: string): CashEvent[] {
  const day = forecast.daily.find((d) => d.date === date);
  return day?.events || [];
}

/**
 * Gets balance for a specific date
 */
export function getBalanceForDate(forecast: CashForecast, date: string): number | null {
  const day = forecast.daily.find((d) => d.date === date);
  return day ? day.endingBalance : null;
}
