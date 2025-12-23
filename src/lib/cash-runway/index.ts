// ============================================================================
// Cash Runway - Public API
// ============================================================================

// Types
export * from "./types";

// Core Engine
export {
  calculateCashRunway,
  calculateRunwayDays,
  getFirstRedDay,
  hasMonthShortfall,
  getTotalShortfall,
  calculateImpact,
  compareForecast,
  getEventsForDate,
  getBalanceForDate,
} from "./engine";

// Event Expanders
export {
  formatDate,
  parseDate,
  timestampToDate,
  expandBillTemplate,
  billInstancesToEvents,
  expandPlannedSpending,
  expandAllPlannedSpending,
  aggregateAndSortEvents,
  generateDateRange,
  groupDatesByMonth,
} from "./expanders";

// Cache Utilities
export { generateInputsHash, quickHash } from "./cache";
