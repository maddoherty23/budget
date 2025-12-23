import { Timestamp } from "firebase/firestore";

// ============================================================================
// User Configuration
// ============================================================================

export type AccountMode = "single" | "multi";

export interface CashPlan {
  userId: string;
  primaryAccountMode: AccountMode;
  includedAccountIds?: string[];
  bufferFloor: number; // Minimum safe balance to maintain
  horizonDays: number; // Default 90
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Bill Templates & Instances
// ============================================================================

export type BillPriority = "critical" | "flexible" | "delayable";

export type DueRuleType = "dayOfMonth" | "rrule";

export interface DayOfMonthRule {
  type: "dayOfMonth";
  day: number; // 1-31
}

export interface RRuleRule {
  type: "rrule";
  rrule: string; // RRule string format
}

export type DueRule = DayOfMonthRule | RRuleRule;

export interface DueWindow {
  early: number; // Days before due date (e.g., -3)
  late: number; // Days after due date (e.g., +5)
}

export interface BillTemplate {
  id?: string;
  userId: string;
  name: string;
  defaultAmount: number;
  categoryId: string | null;
  priority: BillPriority;
  consequenceWeight: number; // 0-100
  dueRule: DueRule;
  dueWindow: DueWindow;
  autopay: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BillInstanceStatus = "planned" | "paid" | "delayed" | "skipped";
export type BillInstanceSource = "template" | "imported" | "manual";

export interface BillInstance {
  id?: string;
  userId: string;
  templateId: string;
  cycleMonth: string; // "YYYY-MM"
  scheduledDate: Timestamp;
  recommendedPayDate: Timestamp;
  amount: number;
  status: BillInstanceStatus;
  source: BillInstanceSource;
  linkedTransactionId: string | null;
  actualPayDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Planned Spending
// ============================================================================

export interface SingleDayAllocation {
  type: "singleDay";
  date: Timestamp;
}

export type SpreadMode = "even" | "start" | "end";

export interface WeekAllocation {
  type: "week";
  weekStart: Timestamp;
  spread: SpreadMode;
}

export interface RangeAllocation {
  type: "range";
  start: Timestamp;
  end: Timestamp;
  spread: SpreadMode;
}

export type SpendingAllocation =
  | SingleDayAllocation
  | WeekAllocation
  | RangeAllocation;

export interface PlannedSpending {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  allocation: SpendingAllocation;
  categoryId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Cash Forecast
// ============================================================================

export type CashEventKind = "income" | "bill" | "planned" | "adjustment";

export interface CashEvent {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Positive for income, negative for outflow
  kind: CashEventKind;
  meta: {
    priority?: BillPriority;
    consequenceWeight?: number;
    window?: DueWindow;
    sourceId?: string;
    name?: string;
  };
}

export interface DailyBalance {
  date: string; // YYYY-MM-DD
  startingBalance: number;
  inflows: number;
  outflows: number;
  endingBalance: number;
  flags: string[]; // ["red", "buffer-low"]
  events: CashEvent[];
}

export interface MonthSummary {
  month: string; // YYYY-MM
  endBalance: number;
  shortBy: number; // 0 if not short, else abs(min balance)
  minBalance: number;
  minBalanceDate: string;
}

export interface DangerPoint {
  date: string; // YYYY-MM-DD
  balance: number;
}

export interface CashForecast {
  userId: string;
  horizonStart: Timestamp;
  horizonDays: number;
  inputsHash: string;
  daily: DailyBalance[];
  dangerPoint: DangerPoint | null;
  monthSummaries: MonthSummary[];
  redDays: string[]; // Array of YYYY-MM-DD dates
  createdAt: Timestamp;
}

// ============================================================================
// Alerts
// ============================================================================

export type AlertType = "redDay" | "monthShortfall" | "billRisk";
export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id?: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  body: string;
  relatedDate: string; // YYYY-MM-DD
  relatedIds: string[]; // billInstanceIds, plannedSpendingIds
  isRead: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Recommendations
// ============================================================================

export type RecommendationActionKind =
  | "delayBill"
  | "splitPayment"
  | "moveSpending"
  | "reduceSpending"
  | "addIncome";

export interface RecommendationAction {
  kind: RecommendationActionKind;
  targetId: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  amount?: number;
  rationale: string;
  confidence: number; // 0-100
  impact: {
    redDaysEliminated: number;
    redDaysCreated: number;
    balanceImprovement: number;
    daysImproved: number;
  };
}

export interface Recommendation {
  id?: string;
  userId: string;
  forecastId: string;
  createdFrom: "runwayEngine";
  actions: RecommendationAction[];
  createdAt: Timestamp;
}

// ============================================================================
// Forecast Engine Inputs
// ============================================================================

export interface ForecastInputs {
  userId: string;
  startDate: Date;
  horizonDays: number;
  bufferFloor: number;
  carryoverBalance: number;
  billInstances: BillInstance[];
  plannedSpending: PlannedSpending[];
  incomeEvents?: CashEvent[];
  scenarioEdits?: ScenarioEdit[];
}

export interface ScenarioEdit {
  type: "addSpending" | "moveBill" | "adjustAmount";
  targetId?: string;
  date?: string;
  amount?: number;
  newDate?: string;
}

// ============================================================================
// Transaction Matching
// ============================================================================

export interface BillMatch {
  transactionId: string;
  billInstanceId: string;
  confidence: number; // 0-100
  amountDiff: number;
  dateDiff: number; // days
  merchantMatch: boolean;
  status: "pending" | "accepted" | "rejected";
  createdAt: Timestamp;
}
