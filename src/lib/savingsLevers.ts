/**
 * Types and utilities for the Savings Levers feature
 */

export type LeverType = 'percent' | 'frequency';
export type IntensityLevel = 'gentle' | 'balanced' | 'aggressive';
export type GlobalIntensity = 'low' | 'balanced' | 'fast';
export type GoalMode = 'reduce' | 'increase' | 'mix';
export type WeekStatus = 'on-track' | 'slightly-off' | 'off-track';

export interface CategoryBaseline {
  categoryId: string;
  name: string;
  monthlySpend: number;
  weeklySpend: number;
  tripsPerWeek?: number;
  avgCostPerTrip?: number;
}

export interface Lever {
  categoryId: string;
  type: LeverType;
  enabled: boolean;
  locked: boolean;
  // For percent levers
  reductionPercent?: number;
  // For frequency levers (coffee)
  targetTripsPerWeek?: number;
  baselineTripsPerWeek?: number;
  avgCostPerTrip?: number;
  // Intensity
  intensity: IntensityLevel;
}

export interface WeeklyResult {
  categoryId: string;
  targetValue: number; // $ amount or trip count
  actualValue: number;
  isSpendCap: boolean; // true = compare as spend, false = compare as frequency
  onTrack: boolean;
}

export interface SavingsGoal {
  monthlyTarget: number;
  mode: GoalMode;
  globalIntensity: GlobalIntensity;
}

// Mock baseline data
export const MOCK_BASELINES: CategoryBaseline[] = [
  {
    categoryId: 'groceries',
    name: 'Groceries',
    monthlySpend: 480,
    weeklySpend: 110,
  },
  {
    categoryId: 'coffee',
    name: 'Coffee Shops',
    monthlySpend: 120,
    weeklySpend: 28,
    tripsPerWeek: 7,
    avgCostPerTrip: 4,
  },
  {
    categoryId: 'dining',
    name: 'Dining Out',
    monthlySpend: 240,
    weeklySpend: 55,
  },
  {
    categoryId: 'subscriptions',
    name: 'Subscriptions',
    monthlySpend: 65,
    weeklySpend: 15,
  },
  {
    categoryId: 'shopping',
    name: 'Shopping',
    monthlySpend: 200,
    weeklySpend: 46,
  },
];

// Initial lever state based on baselines
export const createInitialLevers = (baselines: CategoryBaseline[]): Lever[] => {
  return baselines.map((baseline) => ({
    categoryId: baseline.categoryId,
    type: baseline.tripsPerWeek ? 'frequency' : 'percent',
    enabled: true,
    locked: false,
    reductionPercent: 15,
    targetTripsPerWeek: baseline.tripsPerWeek ? Math.max(1, baseline.tripsPerWeek - 2) : undefined,
    baselineTripsPerWeek: baseline.tripsPerWeek,
    avgCostPerTrip: baseline.avgCostPerTrip,
    intensity: 'balanced',
  }));
};

// Calculate projected savings for a single lever
export const calculateLeverSavings = (
  lever: Lever,
  baseline: CategoryBaseline
): number => {
  if (!lever.enabled || lever.locked) return 0;

  if (lever.type === 'frequency' && lever.targetTripsPerWeek !== undefined) {
    const baselineTrips = baseline.tripsPerWeek || 0;
    const avgCost = baseline.avgCostPerTrip || 0;
    const reduction = baselineTrips - lever.targetTripsPerWeek;
    return reduction * avgCost * 4.33; // weeks per month
  }

  // Percent reduction
  const percent = lever.reductionPercent || 0;
  return baseline.monthlySpend * (percent / 100);
};

// Calculate total projected savings
export const calculateTotalSavings = (
  levers: Lever[],
  baselines: CategoryBaseline[]
): number => {
  return levers.reduce((total, lever) => {
    const baseline = baselines.find((b) => b.categoryId === lever.categoryId);
    if (!baseline) return total;
    return total + calculateLeverSavings(lever, baseline);
  }, 0);
};

// Apply global intensity to all levers
export const applyGlobalIntensity = (
  levers: Lever[],
  intensity: GlobalIntensity
): Lever[] => {
  const intensityMap: Record<GlobalIntensity, IntensityLevel> = {
    low: 'gentle',
    balanced: 'balanced',
    fast: 'aggressive',
  };

  const targetIntensity = intensityMap[intensity];

  return levers.map((lever) => {
    if (lever.locked) return lever;

    let newPercent = lever.reductionPercent || 15;
    let newTrips = lever.targetTripsPerWeek;

    if (targetIntensity === 'gentle') {
      newPercent = 10;
      if (lever.baselineTripsPerWeek) {
        newTrips = Math.max(1, lever.baselineTripsPerWeek - 1);
      }
    } else if (targetIntensity === 'balanced') {
      newPercent = 15;
      if (lever.baselineTripsPerWeek) {
        newTrips = Math.max(1, lever.baselineTripsPerWeek - 2);
      }
    } else {
      newPercent = 25;
      if (lever.baselineTripsPerWeek) {
        newTrips = Math.max(1, lever.baselineTripsPerWeek - 3);
      }
    }

    return {
      ...lever,
      intensity: targetIntensity,
      reductionPercent: newPercent,
      targetTripsPerWeek: newTrips,
    };
  });
};

// Generate mock weekly results
export const generateDemoWeek = (
  levers: Lever[],
  baselines: CategoryBaseline[]
): WeeklyResult[] => {
  return levers
    .filter((lever) => lever.enabled && !lever.locked)
    .map((lever) => {
      const baseline = baselines.find((b) => b.categoryId === lever.categoryId);
      if (!baseline) return null;

      let targetValue: number;
      let actualValue: number;
      let isSpendCap = true;

      if (lever.type === 'frequency' && lever.targetTripsPerWeek !== undefined) {
        targetValue = lever.targetTripsPerWeek;
        // Randomize actual trips: 70% on track, 30% slightly over
        const random = Math.random();
        if (random > 0.7) {
          actualValue = targetValue + Math.floor(Math.random() * 2) + 1;
        } else {
          actualValue = Math.max(0, targetValue - Math.floor(Math.random() * 2));
        }
        isSpendCap = false;
      } else {
        // Spend cap
        const reductionPercent = lever.reductionPercent || 0;
        targetValue = baseline.weeklySpend * (1 - reductionPercent / 100);
        // Randomize actual spend: 60% under target, 30% at target, 10% over
        const random = Math.random();
        if (random > 0.9) {
          actualValue = targetValue * (1 + Math.random() * 0.15);
        } else if (random > 0.6) {
          actualValue = targetValue * (0.95 + Math.random() * 0.1);
        } else {
          actualValue = targetValue * (0.7 + Math.random() * 0.25);
        }
      }

      const onTrack = isSpendCap
        ? actualValue <= targetValue
        : actualValue <= targetValue;

      return {
        categoryId: lever.categoryId,
        targetValue,
        actualValue,
        isSpendCap,
        onTrack,
      };
    })
    .filter((r): r is WeeklyResult => r !== null);
};

// Determine week status
export const calculateWeekStatus = (results: WeeklyResult[]): WeekStatus => {
  const missCount = results.filter((r) => !r.onTrack).length;
  if (missCount === 0) return 'on-track';
  if (missCount === 1) return 'slightly-off';
  return 'off-track';
};

// Calculate how much over/under budget
export const calculateWeekVariance = (results: WeeklyResult[]): number => {
  return results.reduce((variance, result) => {
    if (result.isSpendCap) {
      return variance + (result.actualValue - result.targetValue);
    }
    return variance;
  }, 0);
};

// Get friendly status message
export const getStatusMessage = (status: WeekStatus, variance: number): string => {
  if (status === 'on-track') {
    return "You're on track. Want to keep the plan next week?";
  }
  if (status === 'slightly-off') {
    const amount = Math.abs(variance);
    return `You're close. You're $${amount.toFixed(0)} over. Want to adjust next week or make it up?`;
  }
  return 'This plan may be too tight. Want a lower-stress version?';
};

// Confidence level based on aggressiveness
export const getConfidenceLevel = (
  levers: Lever[],
  baselines: CategoryBaseline[]
): 'High' | 'Medium' | 'Low' => {
  const avgReduction =
    levers
      .filter((l) => l.enabled && !l.locked)
      .reduce((sum, l) => sum + (l.reductionPercent || 15), 0) / levers.length;

  if (avgReduction < 12) return 'High';
  if (avgReduction < 20) return 'Medium';
  return 'Low';
};
