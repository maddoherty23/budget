import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import { generateMockForecast } from "./mock-data";
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
    const user = getCurrentUser();
    if (!user) {
      // Return mock data for testing/development
      console.log("No authenticated user, returning mock forecast data");
      const mockForecast = generateMockForecast();
      return NextResponse.json({
        forecast: mockForecast,
        meta: {
          carryoverBalance: 3420.50,
          billCount: 0,
          spendingCount: 0,
          calculatedAt: new Date().toISOString(),
          cached: false,
          mock: true
        }
      });
    }

    // Parse request body
    const body = await request.json();
    const {
      horizonDays = 90,
      bufferFloor: requestedBufferFloor,
      scenarioEdits,
      forceRefresh = false,
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

    // Step 5: Build forecast inputs - set start date first
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today
    const endDate = new Date(startDate.getTime() + actualHorizonDays * 24 * 60 * 60 * 1000);
    
    // Step 6: Load transactions from hierarchical structure (both income and expense)
    const incomeEvents = [];
    const expenseEvents = [];
    
    // Generate list of months to query (from now through horizon)
    const monthsToQuery: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthsToQuery.includes(month)) {
        monthsToQuery.push(month);
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Fetch transactions from each month
    console.log(`[Cash Runway] Querying ${monthsToQuery.length} months for transactions:`, monthsToQuery);
    
    for (const month of monthsToQuery) {
      const monthPath = `transactions/${user.uid}/${month}`;
      const monthCollection = collection(db, monthPath);
      
      // Fetch income transactions
      const incomeQuery = query(
        monthCollection,
        where("type", "==", "income")
      );
      
      const incomeSnapshot = await getDocs(incomeQuery);
      incomeSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const txnDate = data.date?.toDate?.() || new Date();
        
        // Only include transactions within the forecast horizon
        // Skip excluded transactions (transfers)
        if (txnDate >= startDate && txnDate <= endDate && data.category !== "Exclude") {
          incomeEvents.push({
            id: doc.id,
            date: txnDate.toISOString().split('T')[0], // YYYY-MM-DD format
            amount: Math.abs(data.amount), // Ensure positive for income
            kind: "income" as const,
            meta: {
              name: data.description || "Income",
              category: data.category,
            },
          });
        }
      });
      
      // Fetch expense transactions
      const expenseQuery = query(
        monthCollection,
        where("type", "==", "expense")
      );
      
      const expenseSnapshot = await getDocs(expenseQuery);
      expenseSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const txnDate = data.date?.toDate?.() || new Date();
        
        // Only include transactions within the forecast horizon
        // Skip excluded transactions (transfers) and uncategorized
        if (txnDate >= startDate && txnDate <= endDate && 
            data.category !== "Exclude" && 
            data.category && 
            data.category !== "Uncategorized") {
          expenseEvents.push({
            id: doc.id,
            date: txnDate.toISOString().split('T')[0], // YYYY-MM-DD format
            amount: -Math.abs(data.amount), // Ensure negative for expense
            kind: "bill" as const, // Treat as bill for cash runway
            meta: {
              name: data.description || "Expense",
              category: data.category,
            },
          });
        }
      });
    }
    
    console.log(`[Cash Runway] Loaded transactions - Income: ${incomeEvents.length}, Expenses: ${expenseEvents.length}`);

    // Step 7: Build forecast inputs object
    // Combine income and expense events
    const allTransactionEvents = [...incomeEvents, ...expenseEvents];

    const inputs: ForecastInputs = {
      userId: user.uid,
      startDate,
      horizonDays: actualHorizonDays,
      bufferFloor,
      carryoverBalance,
      billInstances,
      plannedSpending,
      incomeEvents: allTransactionEvents, // Include both income and expenses
      scenarioEdits,
    };

    // Step 8: Check cache (only if no scenario edits and not forcing refresh)
    if (!forceRefresh && (!scenarioEdits || scenarioEdits.length === 0)) {
      const inputsHash = generateInputsHash(inputs);
      const cached = await getCachedForecast(user.uid, inputsHash);
      
      if (cached) {
        console.log("[Cash Runway] Returning cached forecast");
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
        incomeTransactionsCount: incomeEvents.length,
        expenseTransactionsCount: expenseEvents.length,
        totalTransactionsCount: allTransactionEvents.length,
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
