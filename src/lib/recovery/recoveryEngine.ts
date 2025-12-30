import { Transaction } from "../firebase/firestore";
import { RecoveryInsightDraft, Evidence } from "./types";

// Merchant normalization keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  streaming: ["netflix", "hulu", "disney", "hbo", "paramount", "peacock", "apple tv", "youtube premium"],
  cloud_storage: ["icloud", "dropbox", "google one", "onedrive", "box"],
  music: ["spotify", "apple music", "tidal", "amazon music", "pandora"],
  fitness: ["gym", "planet fitness", "24 hour", "equinox", "ymca", "peloton"],
  software: ["adobe", "microsoft", "office", "zoom", "slack", "github", "notion"],
};

const FEE_KEYWORDS = [
  "overdraft",
  "late fee",
  "atm fee",
  "interest charge",
  "nsf",
  "insufficient funds",
  "penalty",
  "foreign transaction",
];

interface RecurringPattern {
  merchant: string;
  normalizedMerchant: string;
  transactions: Transaction[];
  averageAmount: number;
  cadenceDays: number;
  category?: string;
}

// Normalize merchant names for comparison
function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Infer category from merchant name using keywords
function inferCategory(merchant: string): string | undefined {
  const normalized = normalizeMerchant(merchant);
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }
  return undefined;
}

// Calculate average days between transactions
function calculateCadence(transactions: Transaction[]): number {
  if (transactions.length < 2) return 0;
  
  const sorted = [...transactions].sort((a, b) => {
    const dateA = a.date.toDate?.() ?? new Date(a.date);
    const dateB = b.date.toDate?.() ?? new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].date.toDate?.() ?? new Date(sorted[i - 1].date);
    const curr = sorted[i].date.toDate?.() ?? new Date(sorted[i].date);
    const days = Math.abs((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    intervals.push(days);
  }
  
  return intervals.reduce((a, b) => a + b, 0) / intervals.length;
}

// Detect recurring subscriptions
export function detectRecurringSubscriptions(transactions: Transaction[]): RecoveryInsightDraft[] {
  const insights: RecoveryInsightDraft[] = [];
  
  // Group by normalized merchant
  const merchantGroups = new Map<string, Transaction[]>();
  
  for (const txn of transactions) {
    if (txn.type === "expense" && txn.amount > 0) {
      const normalized = normalizeMerchant(txn.description || "");
      if (!merchantGroups.has(normalized)) {
        merchantGroups.set(normalized, []);
      }
      merchantGroups.get(normalized)!.push(txn);
    }
  }
  
  // Analyze each merchant group for recurring patterns
  for (const [normalizedMerchant, txns] of merchantGroups) {
    if (txns.length < 2) continue;
    
    const cadence = calculateCadence(txns);
    const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
    
    // Check if it's monthly (25-35 days), weekly (6-9 days), or annual (350-380 days)
    const isMonthly = cadence >= 25 && cadence <= 35;
    const isWeekly = cadence >= 6 && cadence <= 9;
    const isAnnual = cadence >= 350 && cadence <= 380;
    
    if (isMonthly || isWeekly || isAnnual) {
      // Check amount consistency (±15% tolerance)
      const amounts = txns.map((t) => t.amount);
      const minAmount = Math.min(...amounts);
      const maxAmount = Math.max(...amounts);
      const variance = (maxAmount - minAmount) / avgAmount;
      
      if (variance <= 0.15) {
        const confidence = txns.length >= 3 ? 0.8 : 0.6;
        const category = inferCategory(normalizedMerchant);
        
        const evidence: Evidence[] = txns.slice(0, 5).map((t) => ({
          transactionId: t.id || "",
          date: t.date.toDate?.() ?? new Date(t.date),
          merchant: t.description,
          amount: t.amount,
        }));
        
        insights.push({
          type: "subscription",
          title: `Recurring subscription: ${txns[0].description}`,
          summary: `Charged ${isMonthly ? "monthly" : isWeekly ? "weekly" : "annually"} for the past ${txns.length} occurrences`,
          estimatedMonthlySavings: isMonthly ? avgAmount : isWeekly ? avgAmount * 4.33 : avgAmount / 12,
          estimatedAnnualSavings: isMonthly ? avgAmount * 12 : isWeekly ? avgAmount * 52 : avgAmount,
          confidence,
          effort: 2,
          safetyImpact: 0.6,
          recoveryScore: 0,
          evidence,
          status: "active",
        });
      }
    }
  }
  
  return insights;
}

// Detect duplicate services in same category
export function detectDuplicateServices(transactions: Transaction[]): RecoveryInsightDraft[] {
  const insights: RecoveryInsightDraft[] = [];
  
  // First detect recurring patterns
  const recurring: RecurringPattern[] = [];
  const merchantGroups = new Map<string, Transaction[]>();
  
  for (const txn of transactions) {
    if (txn.type === "expense" && txn.amount > 0) {
      const normalized = normalizeMerchant(txn.description || "");
      if (!merchantGroups.has(normalized)) {
        merchantGroups.set(normalized, []);
      }
      merchantGroups.get(normalized)!.push(txn);
    }
  }
  
  for (const [normalizedMerchant, txns] of merchantGroups) {
    if (txns.length >= 2) {
      const cadence = calculateCadence(txns);
      if ((cadence >= 25 && cadence <= 35) || (cadence >= 6 && cadence <= 9)) {
        const category = txns[0].category || inferCategory(normalizedMerchant);
        recurring.push({
          merchant: txns[0].description,
          normalizedMerchant,
          transactions: txns,
          averageAmount: txns.reduce((sum, t) => sum + t.amount, 0) / txns.length,
          cadenceDays: cadence,
          category,
        });
      }
    }
  }
  
  // Group by category
  const categoryGroups = new Map<string, RecurringPattern[]>();
  for (const pattern of recurring) {
    if (pattern.category) {
      if (!categoryGroups.has(pattern.category)) {
        categoryGroups.set(pattern.category, []);
      }
      categoryGroups.get(pattern.category)!.push(pattern);
    }
  }
  
  // Find duplicates
  for (const [category, patterns] of categoryGroups) {
    if (patterns.length >= 2) {
      // Sort by amount to suggest canceling the cheaper one
      patterns.sort((a, b) => a.averageAmount - b.averageAmount);
      
      const lowestPattern = patterns[0];
      const evidence: Evidence[] = lowestPattern.transactions.slice(0, 3).map((t) => ({
        transactionId: t.id || "",
        date: t.date.toDate?.() ?? new Date(t.date),
        merchant: t.description,
        amount: t.amount,
      }));
      
      insights.push({
        type: "duplicate",
        title: `Multiple ${category} subscriptions detected`,
        summary: `You have ${patterns.length} active subscriptions in the same category`,
        estimatedMonthlySavings: lowestPattern.averageAmount,
        estimatedAnnualSavings: lowestPattern.averageAmount * 12,
        confidence: 0.65,
        effort: 2,
        safetyImpact: 0.6,
        recoveryScore: 0,
        evidence,
        status: "active",
      });
    }
  }
  
  return insights;
}

// Detect price creep (increases over time)
export function detectPriceCreep(transactions: Transaction[]): RecoveryInsightDraft[] {
  const insights: RecoveryInsightDraft[] = [];
  
  const merchantGroups = new Map<string, Transaction[]>();
  
  for (const txn of transactions) {
    if (txn.type === "expense" && txn.amount > 0) {
      const normalized = normalizeMerchant(txn.description || "");
      if (!merchantGroups.has(normalized)) {
        merchantGroups.set(normalized, []);
      }
      merchantGroups.get(normalized)!.push(txn);
    }
  }
  
  for (const [normalizedMerchant, txns] of merchantGroups) {
    if (txns.length < 5) continue;
    
    const cadence = calculateCadence(txns);
    const isRecurring = (cadence >= 25 && cadence <= 35) || (cadence >= 6 && cadence <= 9);
    
    if (isRecurring) {
      // Sort by date
      const sorted = [...txns].sort((a, b) => {
        const dateA = a.date.toDate?.() ?? new Date(a.date);
        const dateB = b.date.toDate?.() ?? new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Compare last 2 charges to previous 3-charge baseline
      const baseline = sorted.slice(0, 3);
      const recent = sorted.slice(-2);
      
      const baselineAvg = baseline.reduce((sum, t) => sum + t.amount, 0) / baseline.length;
      const recentAvg = recent.reduce((sum, t) => sum + t.amount, 0) / recent.length;
      
      const increase = (recentAvg - baselineAvg) / baselineAvg;
      
      if (increase > 0.15) {
        const evidence: Evidence[] = [...baseline, ...recent].map((t) => ({
          transactionId: t.id || "",
          date: t.date.toDate?.() ?? new Date(t.date),
          merchant: t.description,
          amount: t.amount,
          note: recent.includes(t) ? "Recent charge" : "Baseline",
        }));
        
        insights.push({
          type: "price_creep",
          title: `Price increase detected: ${txns[0].description}`,
          summary: `Price increased by ${(increase * 100).toFixed(0)}% over time`,
          estimatedMonthlySavings: recentAvg - baselineAvg,
          estimatedAnnualSavings: (recentAvg - baselineAvg) * 12,
          confidence: 0.7,
          effort: 3,
          safetyImpact: 0.5,
          recoveryScore: 0,
          evidence,
          status: "active",
        });
      }
    }
  }
  
  return insights;
}

// Detect fees and interest charges
export function detectFeeLeaks(transactions: Transaction[]): RecoveryInsightDraft[] {
  const insights: RecoveryInsightDraft[] = [];
  
  const feeTransactions: Transaction[] = [];
  
  for (const txn of transactions) {
    if (txn.type === "expense" && txn.amount > 0) {
      const description = (txn.description || "").toLowerCase();
      if (FEE_KEYWORDS.some((keyword) => description.includes(keyword))) {
        feeTransactions.push(txn);
      }
    }
  }
  
  if (feeTransactions.length > 0) {
    // Calculate last 90 days average
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const recentFees = feeTransactions.filter((t) => {
      const date = t.date.toDate?.() ?? new Date(t.date);
      return date >= ninetyDaysAgo;
    });
    
    if (recentFees.length > 0) {
      const totalFees = recentFees.reduce((sum, t) => sum + t.amount, 0);
      const avgMonthlyFees = totalFees / 3; // 90 days = 3 months
      
      const evidence: Evidence[] = recentFees.slice(0, 5).map((t) => ({
        transactionId: t.id || "",
        date: t.date.toDate?.() ?? new Date(t.date),
        merchant: t.description,
        amount: t.amount,
      }));
      
      insights.push({
        type: "fee_leak",
        title: "Banking fees and charges detected",
        summary: `${recentFees.length} fee charges in the last 90 days`,
        estimatedMonthlySavings: avgMonthlyFees,
        estimatedAnnualSavings: avgMonthlyFees * 12,
        confidence: 0.9,
        effort: 2,
        safetyImpact: 0.9,
        recoveryScore: 0,
        evidence,
        status: "active",
      });
    }
  }
  
  return insights;
}

// Detect refunds and credits
export function detectRefundCredits(transactions: Transaction[]): RecoveryInsightDraft[] {
  const insights: RecoveryInsightDraft[] = [];
  
  const refunds = transactions.filter((t) => t.type === "income" && t.amount > 20);
  
  if (refunds.length > 0) {
    const totalRefunds = refunds.reduce((sum, t) => sum + t.amount, 0);
    
    const evidence: Evidence[] = refunds.slice(0, 5).map((t) => ({
      transactionId: t.id || "",
      date: t.date.toDate?.() ?? new Date(t.date),
      merchant: t.description,
      amount: t.amount,
    }));
    
    insights.push({
      type: "refund_credit",
      title: "Refunds and credits received",
      summary: `${refunds.length} refund or credit transactions found`,
      estimatedMonthlySavings: 0,
      estimatedAnnualSavings: totalRefunds,
      confidence: 0.6,
      effort: 2,
      safetyImpact: 0.4,
      recoveryScore: 0,
      evidence,
      status: "active",
    });
  }
  
  return insights;
}

// Calculate recovery score
function calculateRecoveryScore(insight: RecoveryInsightDraft): number {
  return (
    insight.estimatedAnnualSavings *
    insight.confidence *
    ((4 - insight.effort) / 3) *
    insight.safetyImpact
  );
}

// Main scan function
export function runRecoveryScan(transactions: Transaction[]): RecoveryInsightDraft[] {
  const allInsights: RecoveryInsightDraft[] = [
    ...detectRecurringSubscriptions(transactions),
    ...detectDuplicateServices(transactions),
    ...detectPriceCreep(transactions),
    ...detectFeeLeaks(transactions),
    ...detectRefundCredits(transactions),
  ];
  
  // Calculate scores and sort
  allInsights.forEach((insight) => {
    insight.recoveryScore = calculateRecoveryScore(insight);
  });
  
  return allInsights.sort((a, b) => b.recoveryScore - a.recoveryScore);
}
