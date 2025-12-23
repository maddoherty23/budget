import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getAlert,
  updateAlert,
} from "@/lib/firebase/cash-runway";

/**
 * PATCH /api/alerts/[id]
 * Updates an alert (mainly for dismissing)
 * 
 * Request body:
 * {
 *   dismissed: boolean
 * }
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
    const existingAlert = await getAlert(id);
    if (!existingAlert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    if (body.dismissed === undefined || typeof body.dismissed !== "boolean") {
      return NextResponse.json(
        { error: "Dismissed field is required and must be a boolean" },
        { status: 400 }
      );
    }

    await updateAlert(id, { dismissed: body.dismissed });

    return NextResponse.json({
      success: true,
      message: `Alert ${body.dismissed ? "dismissed" : "restored"} successfully`,
    });
  } catch (error: any) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      {
        error: "Failed to update alert",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
