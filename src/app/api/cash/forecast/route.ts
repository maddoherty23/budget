import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getCashPlan,
  getBillInstances,
  getPlannedSpending,
  getCachedForecast,
  saveCachedForecast,
} from "@/lib/firebase/cash-runway";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  calculateCashRunway,
  generateInputsHash,
  ForecastInputs,
} from "@/lib/cash-runway";

/**
 * POST /api/cash/forecast
 * Generates a cash runway forecast for the authenticated user
 * 
 * Request body:
 * {
 *   horizonDays?: number (default 90)
 *   bufferFloor?: number (default from cashPlan or 200)
 *   scenarioEdits?: ScenarioEdit[] (for what-if scenarios)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      horizonDays = 90,
      bufferFloor: requestedBufferFloor,
      scenarioEdits,
    } = body;

    // Step 1: Load or create cash plan
    let cashPlan = await getCashPlan(user.uid);
    const bufferFloor = requestedBufferFloor ?? cashPlan?.bufferFloor ?? 200;
    const actualHorizonDays = horizonDays;

    // Step 2: Calculate carryover balance from connected accounts
    let carryoverBalance = 0;
    
    if (cashPlan?.primaryAccountMode === "single" && cashPlan.includedAccountIds?.[0]) {
      // Single account mode
      const accountRef = await getDocs(
        query(
          collection(db, "connectedAccounts"),
          where("userId", "==", user.uid),
          where("accountId", "==", cashPlan.includedAccountIds[0])
        )
      );
      
      if (!accountRef.empty) {
        const account = accountRef.docs[0].data();
        carryoverBalance = account.balanceCurrent || 0;
      }
    } else if (cashPlan?.primaryAccountMode === "multi" && cashPlan.includedAccountIds) {
      // Multiple accounts mode
      const accountsSnapshot = await getDocs(
        query(
          collection(db, "connectedAccounts"),
          where("userId", "==", user.uid)
        )
      );
      
      accountsSnapshot.docs
        .filter((doc) => cashPlan.includedAccountIds?.includes(doc.data().accountId))
        .forEach((doc) => {
          const account = doc.data();
          carryoverBalance += account.balanceCurrent || 0;
        });
    } else {
      // No configuration, sum all accounts
      const accountsSnapshot = await getDocs(
        query(
          collection(db, "connectedAccounts"),
          where("userId", "==", user.uid),
          where("status", "==", "active")
        )
      );
      
      accountsSnapshot.docs.forEach((doc) => {
        const account = doc.data();
        carryoverBalance += account.balanceCurrent || 0;
      });
    }

    // Step 3: Load bill instances
    const billInstances = await getBillInstances();

    // Step 4: Load planned spending
    const plannedSpending = await getPlannedSpending([
      where("isActive", "==", true)
    ]);

    // Step 5: Build forecast inputs
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today

    const inputs: ForecastInputs = {
      userId: user.uid,
      startDate,
      horizonDays: actualHorizonDays,
      bufferFloor,
      carryoverBalance,
      billInstances,
      plannedSpending,
      incomeEvents: [], // TODO: Add income event support
      scenarioEdits,
    };

    // Step 6: Check cache (only if no scenario edits)
    if (!scenarioEdits || scenarioEdits.length === 0) {
      const inputsHash = generateInputsHash(inputs);
      const cached = await getCachedForecast(user.uid, inputsHash);
      
      if (cached) {
        console.log("Returning cached forecast");
        return NextResponse.json({ forecast: cached, cached: true });
      }
    }

    // Step 7: Calculate forecast
    const forecast = calculateCashRunway(inputs);

    // Step 8: Save to cache (only if no scenario edits)
    if (!scenarioEdits || scenarioEdits.length === 0) {
      await saveCachedForecast(forecast);
    }

    // Step 9: Return forecast
    return NextResponse.json({
      forecast,
      cached: false,
      meta: {
        carryoverBalance,
        billInstancesCount: billInstances.length,
        plannedSpendingCount: plannedSpending.length,
        calculationTimeMs: Date.now() - startDate.getTime(),
      },
    });
  } catch (error: any) {
    console.error("Error generating forecast:", error);
    return NextResponse.json(
      {
        error: "Failed to generate forecast",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cash/forecast
 * Returns the most recent cached forecast for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // For GET, we'll trigger a POST to ensure fresh data
    // This is a convenience endpoint
    return POST(request);
  } catch (error: any) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch forecast",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
