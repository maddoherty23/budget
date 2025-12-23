import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  createBillInstance,
  getBillInstances,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";
import { where, Timestamp } from "firebase/firestore";

/**
 * GET /api/bills/instances
 * Returns bill instances for the authenticated user
 * 
 * Query params:
 * - startDate?: YYYY-MM-DD (filter by due date >= start)
 * - endDate?: YYYY-MM-DD (filter by due date <= end)
 * - status?: "pending" | "paid" | "overdue" | "skipped"
 * - templateId?: string (filter by template)
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const templateId = searchParams.get("templateId");

    const constraints = [];

    if (startDate) {
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      constraints.push(where("dueDate", ">=", startTimestamp));
    }

    if (endDate) {
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      constraints.push(where("dueDate", "<=", endTimestamp));
    }

    if (status) {
      constraints.push(where("status", "==", status));
    }

    if (templateId) {
      constraints.push(where("templateId", "==", templateId));
    }

    const instances = await getBillInstances(constraints);

    return NextResponse.json({
      instances,
      count: instances.length,
    });
  } catch (error: any) {
    console.error("Error fetching bill instances:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bill instances",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bills/instances
 * Creates a new bill instance (manual/one-off bill)
 * 
 * Request body:
 * {
 *   templateId?: string
 *   name: string
 *   amount: number
 *   dueDate: string (ISO date)
 *   categoryId?: string
 *   priority: "critical" | "flexible" | "delayable"
 *   consequenceWeight: number (0-100)
 *   dueWindow: { early: number, late: number }
 *   autopay: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      templateId,
      name,
      amount,
      dueDate,
      categoryId,
      priority,
      consequenceWeight,
      dueWindow,
      autopay,
    } = body;

    // Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { error: "Due date is required" },
        { status: 400 }
      );
    }

    if (!["critical", "flexible", "delayable"].includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority value" },
        { status: 400 }
      );
    }

    if (
      typeof consequenceWeight !== "number" ||
      consequenceWeight < 0 ||
      consequenceWeight > 100
    ) {
      return NextResponse.json(
        { error: "Consequence weight must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Convert date string to Timestamp
    const dueDateTimestamp = Timestamp.fromDate(new Date(dueDate));

    // Create instance
    const instanceId = await createBillInstance({
      templateId: templateId || null,
      name,
      amount,
      dueDate: dueDateTimestamp,
      categoryId: categoryId || null,
      priority,
      consequenceWeight,
      dueWindow: dueWindow || { early: 0, late: 0 },
      autopay: autopay || false,
      status: "pending",
      paidDate: null,
      paidAmount: null,
    });

    // Invalidate forecast cache
    await invalidateForecastCache();

    return NextResponse.json(
      {
        success: true,
        instanceId,
        message: "Bill instance created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating bill instance:", error);
    return NextResponse.json(
      {
        error: "Failed to create bill instance",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
