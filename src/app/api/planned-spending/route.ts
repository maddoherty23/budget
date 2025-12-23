import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  createPlannedSpending,
  getPlannedSpending,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";
import { where, Timestamp } from "firebase/firestore";

/**
 * GET /api/planned-spending
 * Returns planned spending for the authenticated user
 * 
 * Query params:
 * - startDate?: YYYY-MM-DD (filter by date >= start)
 * - endDate?: YYYY-MM-DD (filter by date <= end)
 * - categoryId?: string (filter by category)
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
    const categoryId = searchParams.get("categoryId");

    const constraints = [];

    // Note: Date filtering for planned spending is tricky because
    // it can be singleDay, week, or range. We'll filter client-side
    // or use a compound index for more complex queries.
    // For now, just fetch all and let client filter if needed.

    if (categoryId) {
      constraints.push(where("categoryId", "==", categoryId));
    }

    const spendingItems = await getPlannedSpending(constraints);

    // Optional: Filter by date range on client side
    let filteredItems = spendingItems;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      filteredItems = spendingItems.filter((item) => {
        if (item.allocationType === "singleDay") {
          const date = item.date!.toDate();
          if (start && date < start) return false;
          if (end && date > end) return false;
          return true;
        } else if (item.allocationType === "week") {
          const weekStart = item.weekStart!.toDate();
          if (start && weekStart < start) return false;
          if (end && weekStart > end) return false;
          return true;
        } else if (item.allocationType === "range") {
          const rangeStart = item.rangeStart!.toDate();
          const rangeEnd = item.rangeEnd!.toDate();
          // Check for overlap
          if (start && rangeEnd < start) return false;
          if (end && rangeStart > end) return false;
          return true;
        }
        return true;
      });
    }

    return NextResponse.json({
      items: filteredItems,
      count: filteredItems.length,
    });
  } catch (error: any) {
    console.error("Error fetching planned spending:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch planned spending",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/planned-spending
 * Creates a new planned spending item
 * 
 * Request body:
 * {
 *   name: string
 *   totalAmount: number
 *   categoryId?: string
 *   allocationType: "singleDay" | "week" | "range"
 *   
 *   // For singleDay:
 *   date?: string (ISO date)
 *   
 *   // For week:
 *   weekStart?: string (ISO date)
 *   spreadMode?: "even" | "startHeavy" | "endHeavy"
 *   
 *   // For range:
 *   rangeStart?: string (ISO date)
 *   rangeEnd?: string (ISO date)
 *   spreadMode?: "even" | "startHeavy" | "endHeavy"
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
      name,
      totalAmount,
      categoryId,
      allocationType,
      date,
      weekStart,
      rangeStart,
      rangeEnd,
      spreadMode,
    } = body;

    // Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!totalAmount || typeof totalAmount !== "number" || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Valid total amount is required" },
        { status: 400 }
      );
    }

    if (!["singleDay", "week", "range"].includes(allocationType)) {
      return NextResponse.json(
        { error: "Invalid allocation type" },
        { status: 400 }
      );
    }

    // Validate allocation-specific fields
    const data: any = {
      name,
      totalAmount,
      categoryId: categoryId || null,
      allocationType,
    };

    if (allocationType === "singleDay") {
      if (!date) {
        return NextResponse.json(
          { error: "Date is required for singleDay allocation" },
          { status: 400 }
        );
      }
      data.date = Timestamp.fromDate(new Date(date));
      data.weekStart = null;
      data.rangeStart = null;
      data.rangeEnd = null;
      data.spreadMode = null;
    } else if (allocationType === "week") {
      if (!weekStart) {
        return NextResponse.json(
          { error: "Week start is required for week allocation" },
          { status: 400 }
        );
      }
      data.weekStart = Timestamp.fromDate(new Date(weekStart));
      data.spreadMode = spreadMode || "even";
      data.date = null;
      data.rangeStart = null;
      data.rangeEnd = null;
    } else if (allocationType === "range") {
      if (!rangeStart || !rangeEnd) {
        return NextResponse.json(
          { error: "Range start and end are required for range allocation" },
          { status: 400 }
        );
      }
      const start = new Date(rangeStart);
      const end = new Date(rangeEnd);
      if (start > end) {
        return NextResponse.json(
          { error: "Range start must be before or equal to range end" },
          { status: 400 }
        );
      }
      data.rangeStart = Timestamp.fromDate(start);
      data.rangeEnd = Timestamp.fromDate(end);
      data.spreadMode = spreadMode || "even";
      data.date = null;
      data.weekStart = null;
    }

    // Create spending item
    const itemId = await createPlannedSpending(data);

    // Invalidate forecast cache
    await invalidateForecastCache();

    return NextResponse.json(
      {
        success: true,
        itemId,
        message: "Planned spending created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating planned spending:", error);
    return NextResponse.json(
      {
        error: "Failed to create planned spending",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
