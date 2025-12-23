import crypto from "crypto";
import { ForecastInputs } from "./types";

/**
 * Generates a hash of forecast inputs for cache invalidation
 * If any input changes, the hash will change, invalidating the cache
 */
export function generateInputsHash(inputs: ForecastInputs): string {
  // Create a stable representation of inputs
  const stableInputs = {
    userId: inputs.userId,
    startDate: inputs.startDate.toISOString(),
    horizonDays: inputs.horizonDays,
    bufferFloor: inputs.bufferFloor,
    carryoverBalance: inputs.carryoverBalance,
    
    // Bill instances: ID, amount, dates, status
    billInstances: inputs.billInstances
      .map((b) => ({
        id: b.id,
        templateId: b.templateId,
        amount: b.amount,
        scheduledDate: b.scheduledDate.toMillis(),
        recommendedPayDate: b.recommendedPayDate.toMillis(),
        status: b.status,
        linkedTransactionId: b.linkedTransactionId,
      }))
      .sort((a, b) => (a.id || "").localeCompare(b.id || "")),
    
    // Planned spending: ID, amount, allocation
    plannedSpending: inputs.plannedSpending
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        allocation: serializeAllocation(p.allocation),
        isActive: p.isActive,
      }))
      .sort((a, b) => (a.id || "").localeCompare(b.id || "")),
    
    // Income events (if any)
    incomeEvents: (inputs.incomeEvents || [])
      .map((e) => ({
        id: e.id,
        date: e.date,
        amount: e.amount,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    
    // Scenario edits (if any)
    scenarioEdits: inputs.scenarioEdits || [],
  };

  // Serialize to JSON string
  const jsonString = JSON.stringify(stableInputs);
  
  // Generate SHA-256 hash
  const hash = crypto.createHash("sha256").update(jsonString).digest("hex");
  
  // Return first 16 characters for brevity
  return hash.substring(0, 16);
}

/**
 * Helper to serialize allocation for hashing
 */
function serializeAllocation(allocation: any): string {
  if (allocation.type === "singleDay") {
    return `${allocation.type}:${allocation.date.toMillis()}`;
  } else if (allocation.type === "week") {
    return `${allocation.type}:${allocation.weekStart.toMillis()}:${allocation.spread}`;
  } else if (allocation.type === "range") {
    return `${allocation.type}:${allocation.start.toMillis()}:${allocation.end.toMillis()}:${allocation.spread}`;
  }
  return allocation.type;
}

/**
 * Simple hash for quick comparison (non-cryptographic)
 */
export function quickHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}
