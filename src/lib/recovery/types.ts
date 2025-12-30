import { Timestamp } from "firebase/firestore";

export type InsightType = 
  | "subscription" 
  | "duplicate" 
  | "price_creep" 
  | "fee_leak" 
  | "refund_credit";

export type InsightStatus = "active" | "done" | "snoozed" | "dismissed";

export type RedirectDestination = "safety_buffer" | "debt_plan" | "goal_bucket";

export interface RecoveryInsight {
  id?: string;
  userId: string;
  type: InsightType;
  title: string;
  summary: string;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  confidence: number; // 0-1
  effort: number; // 1-3
  safetyImpact: number; // 0-1
  recoveryScore: number;
  evidence: Evidence[];
  status: InsightStatus;
  snoozedUntil?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Evidence {
  transactionId: string;
  date: Date;
  merchant: string;
  amount: number;
  note?: string;
}

export interface RecoveryRedirect {
  id?: string;
  userId: string;
  insightId: string;
  destination: RedirectDestination;
  createdAt?: Timestamp;
}

export interface RecoveryInsightDraft extends Omit<RecoveryInsight, "id" | "userId" | "createdAt" | "updatedAt"> {}

export interface RecoveryMetrics {
  recoverableMonthly: number;
  recoverableAnnually: number;
  confidenceLevel: "high" | "medium" | "low";
  bestNextMove: string;
}

export interface ProjectedImpact {
  addedMonthlyMargin: number;
  daysOfRunwayChange: number;
  lowestCashDayImprovement: number;
}
