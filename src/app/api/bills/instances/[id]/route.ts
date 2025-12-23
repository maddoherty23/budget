import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getBillInstance,
  updateBillInstance,
  invalidateForecastCache,
} from "@/lib/firebase/cash-runway";
import { Timestamp } from "firebase/firestore";

/**
 * PATCH /api/bills/instances/[id]
 * Updates a bill instance (e.g., mark as paid, change amount, reschedule)
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
    const existingInstance = await getBillInstance(id);
    if (!existingInstance) {
      return NextResponse.json(
        { error: "Bill instance not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Only allow updating specific fields
    const allowedFields = [
      "amount",
      "dueDate",
      "status",
      "paidDate",
      "paidAmount",
      "name",
      "categoryId",
      "priority",
      "consequenceWeight",
      "dueWindow",
      "autopay",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Convert date strings to Timestamps
        if (field === "dueDate" || field === "paidDate") {
          if (body[field] === null) {
            updates[field] = null;
          } else {
            updates[field] = Timestamp.fromDate(new Date(body[field]));
          }
        } else if (field === "status") {
          // Validate status
          if (!["pending", "paid", "overdue", "skipped"].includes(body[field])) {
            return NextResponse.json(
              { error: "Invalid status value" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "priority") {
          // Validate priority
          if (!["critical", "flexible", "delayable"].includes(body[field])) {
            return NextResponse.json(
              { error: "Invalid priority value" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "consequenceWeight") {
          const weight = body[field];
          if (typeof weight !== "number" || weight < 0 || weight > 100) {
            return NextResponse.json(
              { error: "Consequence weight must be between 0 and 100" },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else if (field === "amount" || field === "paidAmount") {
          if (body[field] !== null && (typeof body[field] !== "number" || body[field] <= 0)) {
            return NextResponse.json(
              { error: `${field} must be a positive number or null` },
              { status: 400 }
            );
          }
          updates[field] = body[field];
        } else {
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

    await updateBillInstance(id, updates);
    await invalidateForecastCache();

    return NextResponse.json({
      success: true,
      message: "Bill instance updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating bill instance:", error);
    return NextResponse.json(
      {
        error: "Failed to update bill instance",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
