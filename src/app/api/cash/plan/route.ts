import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getCashPlan,
  updateCashPlan,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";

/**
 * GET /api/cash/plan
 * Returns the user's cash plan settings
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

    const cashPlan = await getCashPlan();

    // If no plan exists, return default values
    if (!cashPlan) {
      return NextResponse.json({
        bufferFloor: 0,
        horizonDays: 90,
        accountMode: "all",
        selectedAccountIds: [],
      });
    }

    return NextResponse.json(cashPlan);
  } catch (error: any) {
    console.error("Error fetching cash plan:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch cash plan",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cash/plan
 * Updates the user's cash plan settings
 * 
 * Request body:
 * {
 *   bufferFloor?: number
 *   horizonDays?: number
 *   accountMode?: "single" | "multi" | "all"
 *   selectedAccountIds?: string[]
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare updates
    const allowedFields = ["bufferFloor", "horizonDays", "accountMode", "selectedAccountIds"];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "bufferFloor") {
          if (typeof body[field] !== "number" || body[field] < 0) {
            return NextResponse.json(
              { error: "Buffer floor must be a non-negative number" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "horizonDays") {
          if (typeof body[field] !== "number" || body[field] < 1 || body[field] > 365) {
            return NextResponse.json(
              { error: "Horizon days must be between 1 and 365" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "accountMode") {
          if (!["single", "multi", "all"].includes(body[field])) {
            return NextResponse.json(
              { error: "Invalid account mode" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "selectedAccountIds") {
          if (!Array.isArray(body[field])) {
            return NextResponse.json(
              { error: "Selected account IDs must be an array" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Check if cash plan exists
    const existingPlan = await getCashPlan();

    if (!existingPlan) {
      // If no plan exists, create one with defaults merged with updates
      const defaultPlan = {
        bufferFloor: 0,
        horizonDays: 90,
        accountMode: "all" as const,
        selectedAccountIds: [],
      };

      await updateCashPlan({ ...defaultPlan, ...updates });
    } else {
      // Update existing plan
      await updateCashPlan(updates);
    }

    // Invalidate forecast cache
    await invalidateForecastCache();

    return NextResponse.json({
      success: true,
      message: "Cash plan updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating cash plan:", error);
    return NextResponse.json(
      {
        error: "Failed to update cash plan",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
