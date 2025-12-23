import { Timestamp } from "firebase/firestore";
import {
  BillTemplate,
  BillInstance,
  PlannedSpending,
  CashEvent,
  DayOfMonthRule,
  RRuleRule,
} from "./types";
import { format, addMonths, startOfMonth, endOfMonth, addDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from "date-fns";

// ============================================================================
// Date Utilities
// ============================================================================

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

// ============================================================================
// Bill Template Expansion
// ============================================================================

/**
 * Expands a bill template into bill instances for the given date range
 */
export function expandBillTemplate(
  template: BillTemplate,
  startDate: Date,
  endDate: Date
): Omit<BillInstance, "id" | "createdAt" | "updatedAt">[] {
  if (!template.isActive) {
    return [];
  }

  const instances: Omit<BillInstance, "id" | "createdAt" | "updatedAt">[] = [];

  if (template.dueRule.type === "dayOfMonth") {
    // Generate instances for each month in range
    const rule = template.dueRule as DayOfMonthRule;
    let currentMonth = startOfMonth(startDate);
    const lastMonth = endOfMonth(endDate);

    while (currentMonth <= lastMonth) {
      const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), rule.day);
      
      // Only include if within our date range
      if (dueDate >= startDate && dueDate <= endDate) {
        const cycleMonth = format(currentMonth, "yyyy-MM");
        
        instances.push({
          userId: template.userId,
          templateId: template.id || "",
          cycleMonth,
          scheduledDate: Timestamp.fromDate(dueDate),
          recommendedPayDate: Timestamp.fromDate(dueDate), // Can be adjusted by engine
          amount: template.defaultAmount,
          status: "planned",
          source: "template",
          linkedTransactionId: null,
        });
      }

      currentMonth = addMonths(currentMonth, 1);
    }
  } else if (template.dueRule.type === "rrule") {
    // TODO: Implement RRule parsing using rrule library if needed
    // For now, fall back to monthly on the 1st
    console.warn(`RRule expansion not yet implemented for template ${template.id}, using monthly on 1st as fallback`);
    
    let currentMonth = startOfMonth(startDate);
    const lastMonth = endOfMonth(endDate);

    while (currentMonth <= lastMonth) {
      const dueDate = currentMonth;
      
      if (dueDate >= startDate && dueDate <= endDate) {
        const cycleMonth = format(currentMonth, "yyyy-MM");
        
        instances.push({
          userId: template.userId,
          templateId: template.id || "",
          cycleMonth,
          scheduledDate: Timestamp.fromDate(dueDate),
          recommendedPayDate: Timestamp.fromDate(dueDate),
          amount: template.defaultAmount,
          status: "planned",
          source: "template",
          linkedTransactionId: null,
        });
      }

      currentMonth = addMonths(currentMonth, 1);
    }
  }

  return instances;
}

/**
 * Converts bill instances to cash events
 */
export function billInstancesToEvents(instances: BillInstance[]): CashEvent[] {
  return instances
    .filter((inst) => inst.status !== "skipped")
    .map((inst) => {
      const date = inst.status === "paid" && inst.actualPayDate
        ? timestampToDate(inst.actualPayDate)
        : timestampToDate(inst.recommendedPayDate);

      return {
        id: inst.id || `bill-${inst.templateId}-${inst.cycleMonth}`,
        date: formatDate(date),
        amount: -inst.amount, // Negative for outflow
        kind: "bill" as const,
        meta: {
          sourceId: inst.id,
          name: `Bill: ${inst.templateId}`,
        },
      };
    });
}

// ============================================================================
// Planned Spending Expansion
// ============================================================================

/**
 * Expands planned spending into cash events based on allocation rules
 */
export function expandPlannedSpending(spending: PlannedSpending): CashEvent[] {
  if (!spending.isActive) {
    return [];
  }

  const events: CashEvent[] = [];
  const allocation = spending.allocation;

  if (allocation.type === "singleDay") {
    // Simple: single event on specified date
    const date = timestampToDate(allocation.date);
    
    events.push({
      id: spending.id || `spending-${formatDate(date)}`,
      date: formatDate(date),
      amount: -spending.amount, // Negative for outflow
      kind: "planned" as const,
      meta: {
        sourceId: spending.id,
        name: spending.name,
      },
    });
  } else if (allocation.type === "week") {
    // Spread across week
    const weekStart = timestampToDate(allocation.weekStart);
    const weekEnd = endOfWeek(weekStart);
    
    if (allocation.spread === "even") {
      // Distribute evenly across 7 days
      const daysInWeek = 7;
      const amountPerDay = spending.amount / daysInWeek;
      
      for (let i = 0; i < daysInWeek; i++) {
        const date = addDays(weekStart, i);
        events.push({
          id: `${spending.id}-day${i}`,
          date: formatDate(date),
          amount: -amountPerDay,
          kind: "planned" as const,
          meta: {
            sourceId: spending.id,
            name: spending.name,
          },
        });
      }
    } else if (allocation.spread === "start") {
      // All on week start
      events.push({
        id: spending.id || `spending-${formatDate(weekStart)}`,
        date: formatDate(weekStart),
        amount: -spending.amount,
        kind: "planned" as const,
        meta: {
          sourceId: spending.id,
          name: spending.name,
        },
      });
    } else if (allocation.spread === "end") {
      // All on week end
      events.push({
        id: spending.id || `spending-${formatDate(weekEnd)}`,
        date: formatDate(weekEnd),
        amount: -spending.amount,
        kind: "planned" as const,
        meta: {
          sourceId: spending.id,
          name: spending.name,
        },
      });
    }
  } else if (allocation.type === "range") {
    // Spread across date range
    const start = timestampToDate(allocation.start);
    const end = timestampToDate(allocation.end);
    const days = eachDayOfInterval({ start, end });
    
    if (allocation.spread === "even") {
      // Distribute evenly across all days
      const amountPerDay = spending.amount / days.length;
      
      days.forEach((date, i) => {
        events.push({
          id: `${spending.id}-day${i}`,
          date: formatDate(date),
          amount: -amountPerDay,
          kind: "planned" as const,
          meta: {
            sourceId: spending.id,
            name: spending.name,
          },
        });
      });
    } else if (allocation.spread === "start") {
      // All on range start
      events.push({
        id: spending.id || `spending-${formatDate(start)}`,
        date: formatDate(start),
        amount: -spending.amount,
        kind: "planned" as const,
        meta: {
          sourceId: spending.id,
          name: spending.name,
        },
      });
    } else if (allocation.spread === "end") {
      // All on range end
      events.push({
        id: spending.id || `spending-${formatDate(end)}`,
        date: formatDate(end),
        amount: -spending.amount,
        kind: "planned" as const,
        meta: {
          sourceId: spending.id,
          name: spending.name,
        },
      });
    }
  }

  return events;
}

/**
 * Expands all planned spending items into events
 */
export function expandAllPlannedSpending(spending: PlannedSpending[]): CashEvent[] {
  return spending.flatMap(expandPlannedSpending);
}

// ============================================================================
// Event Aggregation
// ============================================================================

/**
 * Combines events from different sources and sorts by date
 */
export function aggregateAndSortEvents(eventGroups: CashEvent[][]): CashEvent[] {
  const allEvents = eventGroups.flat();
  
  // Sort by date, then by kind (income first, then everything else)
  return allEvents.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    
    // Income before outflows on same day
    if (a.amount > 0 && b.amount < 0) return -1;
    if (a.amount < 0 && b.amount > 0) return 1;
    
    // Then by kind
    const kindOrder = { income: 0, bill: 1, planned: 2, adjustment: 3 };
    return kindOrder[a.kind] - kindOrder[b.kind];
  });
}

// ============================================================================
// Date Range Utilities
// ============================================================================

/**
 * Generates an array of date strings for the forecast horizon
 */
export function generateDateRange(startDate: Date, days: number): string[] {
  const dates: string[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    dates.push(formatDate(date));
  }
  
  return dates;
}

/**
 * Groups dates by month
 */
export function groupDatesByMonth(dates: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  
  dates.forEach((date) => {
    const month = date.substring(0, 7); // YYYY-MM
    if (!groups.has(month)) {
      groups.set(month, []);
    }
    groups.get(month)!.push(date);
  });
  
  return groups;
}
