import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getBillTemplate,
  updateBillTemplate,
  deleteBillTemplate,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";

/**
 * PATCH /api/bills/templates/[id]
 * Updates a bill template
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
    const existingTemplate = await getBillTemplate(id);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Bill template not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Only allow updating specific fields
    const allowedFields = [
      "name",
      "defaultAmount",
      "categoryId",
      "priority",
      "consequenceWeight",
      "dueRule",
      "dueWindow",
      "autopay",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Validate certain fields
        if (field === "priority" && !["critical", "flexible", "delayable"].includes(body[field])) {
          return NextResponse.json(
            { error: "Invalid priority value" },
            { status: 400 }
          );
        }

        if (field === "consequenceWeight") {
          const weight = body[field];
          if (typeof weight !== "number" || weight < 0 || weight > 100) {
            return NextResponse.json(
              { error: "Consequence weight must be between 0 and 100" },
              { status: 400 }
            );
          }
        }

        if (field === "defaultAmount" && (typeof body[field] !== "number" || body[field] <= 0)) {
          return NextResponse.json(
            { error: "Default amount must be a positive number" },
            { status: 400 }
          );
        }

        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await updateBillTemplate(id, updates);
    await invalidateForecastCache();

    return NextResponse.json({
      success: true,
      message: "Bill template updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating bill template:", error);
    return NextResponse.json(
      {
        error: "Failed to update bill template",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bills/templates/[id]
 * Soft-deletes a bill template (sets isActive = false)
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
    const existingTemplate = await getBillTemplate(id);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Bill template not found" },
        { status: 404 }
      );
    }

    await deleteBillTemplate(id);
    await invalidateForecastCache();

    return NextResponse.json({
      success: true,
      message: "Bill template deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting bill template:", error);
    return NextResponse.json(
      {
        error: "Failed to delete bill template",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
