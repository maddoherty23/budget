import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getPlannedSpendingItem,
  updatePlannedSpending,
  deletePlannedSpending,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";
import { Timestamp } from "firebase/firestore";

/**
 * PATCH /api/planned-spending/[id]
 * Updates a planned spending item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify ownership
    const existingItem = await getPlannedSpendingItem(id);
    if (!existingItem) {
      return NextResponse.json(
        { error: "Planned spending not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "totalAmount",
      "categoryId",
      "allocationType",
      "date",
      "weekStart",
      "rangeStart",
      "rangeEnd",
      "spreadMode",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convert date strings to Timestamps
        if (["date", "weekStart", "rangeStart", "rangeEnd"].includes(field)) {
          if (body[field] === null) {
            updates[field] = null;
          } else {
            updates[field] = Timestamp.fromDate(new Date(body[field]));
          }
        } else if (field === "allocationType") {
          if (!["singleDay", "week", "range"].includes(body[field])) {
            return NextResponse.json(
              { error: "Invalid allocation type" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "totalAmount") {
          if (typeof body[field] !== "number" || body[field] <= 0) {
            return NextResponse.json(
              { error: "Total amount must be a positive number" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "spreadMode") {
          if (body[field] && !["even", "startHeavy", "endHeavy"].includes(body[field])) {
            return NextResponse.json(
              { error: "Invalid spread mode" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else {
          updates[field] = body[field];
        }
      }
    }

    // Validation for allocation type changes
    if (updates.allocationType) {
      const newType = updates.allocationType;
      if (newType === "singleDay" && !updates.date && !existingItem.date) {
        return NextResponse.json(
          { error: "Date is required for singleDay allocation" },
          { status: 400 }
        );
      } else if (newType === "week" && !updates.weekStart && !existingItem.weekStart) {
        return NextResponse.json(
          { error: "Week start is required for week allocation" },
          { status: 400 }
        );
      } else if (newType === "range" && (!updates.rangeStart && !existingItem.rangeStart)) {
        return NextResponse.json(
          { error: "Range start and end are required for range allocation" },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await updatePlannedSpending(id, updates);
    await invalidateForecastCache();

    return NextResponse.json({
      success: true,
      message: "Planned spending updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating planned spending:", error);
    return NextResponse.json(
      {
        error: "Failed to update planned spending",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/planned-spending/[id]
 * Deletes a planned spending item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify ownership
    const existingItem = await getPlannedSpendingItem(id);
    if (!existingItem) {
      return NextResponse.json(
        { error: "Planned spending not found" },
        { status: 404 }
      );
    }

    await deletePlannedSpending(id);
    await invalidateForecastCache();

    return NextResponse.json({
      success: true,
      message: "Planned spending deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting planned spending:", error);
    return NextResponse.json(
      {
        error: "Failed to delete planned spending",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
