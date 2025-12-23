import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getAlerts,
} from "@/lib/firebase/cash-runway";
import { where, orderBy } from "firebase/firestore";

/**
 * GET /api/alerts
 * Returns alerts for the authenticated user
 * 
 * Query params:
 * - severity?: "low" | "medium" | "high" (filter by severity)
 * - dismissed?: boolean (filter by dismissed status, default false)
 * - limit?: number (max results, default 50)
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
    const severity = searchParams.get("severity");
    const dismissed = searchParams.get("dismissed") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const constraints = [];

    if (severity) {
      if (!["low", "medium", "high"].includes(severity)) {
        return NextResponse.json(
          { error: "Invalid severity value" },
          { status: 400 }
        );
      }
      constraints.push(where("severity", "==", severity));
    }

    constraints.push(where("dismissed", "==", dismissed));
    constraints.push(orderBy("createdAt", "desc"));

    const alerts = await getAlerts(constraints);

    // Apply limit
    const limitedAlerts = alerts.slice(0, limit);

    return NextResponse.json({
      alerts: limitedAlerts,
      count: limitedAlerts.length,
      total: alerts.length,
    });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch alerts",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
